import { from, of } from 'rxjs';
import { LlmService } from './llm.service';
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

const userService = (user: Record<string, unknown>) => ({
  findOneById: jest.fn().mockResolvedValue({
    openRouterApiKey: null,
    selectedModels: [AVAILABLE_MODELS[0]],
    ...user,
  }),
});

describe('LlmService.sendLlmQueries', () => {
  it('falls back to the shared server key when the user has none', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: userService({ openRouterApiKey: null }),
    });

    await expect(service.sendLlmQueries(1)).resolves.toHaveLength(1);
    expect(mocks.httpService.post).toHaveBeenCalledTimes(1);
  });

  it('uses the personal key when the user has one', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1)),
      },
      usersService: userService({ openRouterApiKey: 'byo-key' }),
    });

    await service.sendLlmQueries(1);

    expect(mocks.httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer byo-key',
          'Content-Type': 'application/json',
        },
      }),
    );
  });

  it('clamps prompts and models even when the DB returns far more', async () => {
    const { service, mocks } = build({
      promptRepository: {
        getActivePrompts: jest.fn().mockResolvedValue(prompts(1000)),
      },
      usersService: userService({ selectedModels: AVAILABLE_MODELS }),
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
      usersService: userService({ selectedModels: AVAILABLE_MODELS }),
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
      usersService: userService({ openRouterApiKey: 'byo-key' }),
    });

    await service.sendLlmQueries(1);

    expect(mocks.httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ timeout: LLM_LIMITS.upstreamTimeoutMs }),
    );
  });
});
