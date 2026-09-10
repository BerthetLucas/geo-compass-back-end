import { ForbiddenException } from '@nestjs/common';
import { from, of } from 'rxjs';
import { LlmService, __resetServerKeyGuard } from './llm.service';
import { AVAILABLE_MODELS } from './constants/models';
import { LLM_LIMITS } from './constants/limits';

type Mocks = {
  configService: { get: jest.Mock };
  httpService: { post: jest.Mock };
  llmRepository: { insertResponses: jest.Mock };
  promptRepository: { getActivePrompts: jest.Mock };
  usersService: { findOneById: jest.Mock };
};

const okResponse = of({
  data: { choices: [{ message: { content: 'answer' } }] },
});

function build(overrides: Partial<Mocks> = {}) {
  const mocks: Mocks = {
    configService: { get: jest.fn().mockReturnValue('server-key') },
    httpService: { post: jest.fn().mockReturnValue(okResponse) },
    llmRepository: { insertResponses: jest.fn().mockResolvedValue(undefined) },
    promptRepository: { getActivePrompts: jest.fn().mockResolvedValue([]) },
    usersService: { findOneById: jest.fn().mockResolvedValue(undefined) },
    ...overrides,
  };
  const service = new LlmService(
    mocks.configService as never,
    mocks.httpService as never,
    mocks.llmRepository as never,
    mocks.promptRepository as never,
    mocks.usersService as never,
  );
  return { service, mocks };
}

const prompts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    text: `p${i}`,
    isActive: true,
  }));

const withUser = (over: Record<string, unknown>) =>
  jest.fn().mockResolvedValue({
    openRouterApiKey: null,
    selectedModels: [AVAILABLE_MODELS[0]],
    ...over,
  });

beforeEach(() => __resetServerKeyGuard());

describe('LlmService.sendLlmQueries — shared server key (cyber-verdict-v2 §3)', () => {
  it('runs a keyless interactive caller on the shared server key and counts it in the guard', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: { findOneById: withUser({ openRouterApiKey: null }) },
    });

    // controller passes allowServerKey:true
    await expect(
      service.sendLlmQueries(1, { allowServerKey: true }),
    ).resolves.toHaveLength(1);
    expect(mocks.httpService.post).toHaveBeenCalledTimes(1);
  });

  it('still 403s a caller that explicitly opts out of the server key (safety net)', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: { findOneById: withUser({ openRouterApiKey: null }) },
    });

    await expect(
      service.sendLlmQueries(1, { allowServerKey: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mocks.httpService.post).not.toHaveBeenCalled();
  });

  it('lets an interactive caller with a personal key through', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: { findOneById: withUser({ openRouterApiKey: 'byo-key' }) },
    });

    await expect(service.sendLlmQueries(1)).resolves.toHaveLength(1);
    expect(mocks.httpService.post).toHaveBeenCalledTimes(1);
  });

  it('lets the cron path use the server key', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: { findOneById: withUser({ openRouterApiKey: null }) },
    });

    await expect(
      service.sendLlmQueries(1, { allowServerKey: true }),
    ).resolves.toHaveLength(1);
    expect(mocks.httpService.post).toHaveBeenCalledTimes(1);
  });
});

describe('LlmService.sendLlmQueries — clamps & concurrency (report 3.1)', () => {
  it('clamps prompts and models even when the DB returns far more', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1000)),
      },
      usersService: withUserService({
        openRouterApiKey: 'byo-key',
        selectedModels: AVAILABLE_MODELS,
      }),
    });

    await service.sendLlmQueries(1);

    expect(mocks.httpService.post).toHaveBeenCalledTimes(
      LLM_LIMITS.maxActivePrompts * AVAILABLE_MODELS.length,
    );
  });

  it('never exceeds LLM_LIMITS.fanoutConcurrency in-flight upstream calls', async () => {
    let inFlight = 0;
    let peak = 0;
    const post = jest.fn().mockImplementation(() =>
      from(
        (async () => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await new Promise((r) => setTimeout(r, 5));
          inFlight -= 1;
          return { data: { choices: [{ message: { content: 'x' } }] } };
        })(),
      ),
    );

    const { service } = build({
      httpService: { post },
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(10)),
      },
      usersService: withUserService({
        openRouterApiKey: 'byo-key',
        selectedModels: AVAILABLE_MODELS,
      }),
    });

    await service.sendLlmQueries(1);

    expect(post.mock.calls.length).toBeGreaterThan(
      LLM_LIMITS.fanoutConcurrency,
    );
    expect(peak).toBeLessThanOrEqual(LLM_LIMITS.fanoutConcurrency);
  });

  it('passes the upstream timeout to axios', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: { findOneById: withUser({ openRouterApiKey: 'byo-key' }) },
    });

    await service.sendLlmQueries(1);

    expect(mocks.httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ timeout: LLM_LIMITS.upstreamTimeoutMs }),
    );
  });
});

describe('LlmService.sendLlmQueries — in-memory server-key guard (cyber-verdict-nodb §3.2)', () => {
  const KEY = 'LLM_MAX_SERVERKEY_CALLS_PER_DAY';

  afterEach(() => delete process.env[KEY]);

  it('throws once the per-instance daily server-key ceiling is exceeded', async () => {
    process.env[KEY] = '5';
    const { service } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: withUserService({
        openRouterApiKey: null,
        selectedModels: AVAILABLE_MODELS, // 5 models -> 5 calls per run
      }),
    });

    await expect(
      service.sendLlmQueries(1, { allowServerKey: true }),
    ).resolves.toHaveLength(5);
    await expect(
      service.sendLlmQueries(1, { allowServerKey: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws once the GLOBAL per-instance server-key ceiling is exceeded', async () => {
    process.env.LLM_MAX_SERVERKEY_CALLS_PER_DAY_GLOBAL = '5';
    const users = withUserService({
      openRouterApiKey: null,
      selectedModels: AVAILABLE_MODELS, // 5 calls per run
    });
    const { service } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: users,
    });

    // user 1 fills the global counter (5), user 2 tips it over
    await expect(
      service.sendLlmQueries(1, { allowServerKey: true }),
    ).resolves.toHaveLength(5);
    await expect(
      service.sendLlmQueries(2, { allowServerKey: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    delete process.env.LLM_MAX_SERVERKEY_CALLS_PER_DAY_GLOBAL;
  });

  it('cron (bypassGlobalCap) still runs when the global cap is full (AC-1)', async () => {
    process.env.LLM_MAX_SERVERKEY_CALLS_PER_DAY_GLOBAL = '5';
    const users = withUserService({
      openRouterApiKey: null,
      selectedModels: AVAILABLE_MODELS, // 5 calls per run
    });
    const { service } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: users,
    });

    await service.sendLlmQueries(1, { allowServerKey: true }); // fills global (5)
    await expect(
      service.sendLlmQueries(2, { allowServerKey: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.sendLlmQueries(3, {
        allowServerKey: true,
        bypassGlobalCap: true,
      }),
    ).resolves.toHaveLength(5);

    delete process.env.LLM_MAX_SERVERKEY_CALLS_PER_DAY_GLOBAL;
  });

  it('does not apply the server-key guard to BYO-key users', async () => {
    process.env[KEY] = '1';
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(2)),
      },
      usersService: withUserService({
        openRouterApiKey: 'byo-key',
        selectedModels: AVAILABLE_MODELS,
      }),
    });

    await service.sendLlmQueries(1, { allowServerKey: true });
    await service.sendLlmQueries(1, { allowServerKey: true });
    expect(mocks.httpService.post).toHaveBeenCalledTimes(20);
  });
});

function withUserService(user: Record<string, unknown>) {
  return { findOneById: jest.fn().mockResolvedValue(user) };
}
