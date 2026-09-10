import { BadRequestException } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { LLM_LIMITS } from 'src/llm/constants/limits';

describe('PromptService input caps (security report 3.1)', () => {
  let repo: {
    addPrompt: jest.Mock;
    updatePrompt: jest.Mock;
    countActiveByUser: jest.Mock;
  };
  let service: PromptService;

  beforeEach(() => {
    repo = {
      addPrompt: jest.fn().mockResolvedValue(undefined),
      updatePrompt: jest.fn().mockResolvedValue(undefined),
      countActiveByUser: jest.fn().mockResolvedValue(0),
    };
    service = new PromptService(repo as never);
  });

  describe('addPrompt', () => {
    it('accepts text exactly at the length limit', async () => {
      await expect(
        service.addPrompt(1, 'a'.repeat(LLM_LIMITS.maxPromptLen)),
      ).resolves.toBeUndefined();
      expect(repo.addPrompt).toHaveBeenCalled();
    });

    it('rejects text over the length limit', async () => {
      await expect(
        service.addPrompt(1, 'a'.repeat(LLM_LIMITS.maxPromptLen + 1)),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.addPrompt).not.toHaveBeenCalled();
    });

    it('accepts when one below the active-prompt limit', async () => {
      repo.countActiveByUser.mockResolvedValue(LLM_LIMITS.maxActivePrompts - 1);
      await expect(service.addPrompt(1, 'ok')).resolves.toBeUndefined();
    });

    it('rejects when already at the active-prompt limit', async () => {
      repo.countActiveByUser.mockResolvedValue(LLM_LIMITS.maxActivePrompts);
      await expect(service.addPrompt(1, 'ok')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.addPrompt).not.toHaveBeenCalled();
    });
  });

  describe('updatePrompt', () => {
    it('rejects activating a prompt when already at the active limit', async () => {
      repo.countActiveByUser.mockResolvedValue(LLM_LIMITS.maxActivePrompts);
      await expect(
        service.updatePrompt(5, { isActive: true }, 1),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.updatePrompt).not.toHaveBeenCalled();
    });

    it('allows activating when one below the active limit', async () => {
      repo.countActiveByUser.mockResolvedValue(LLM_LIMITS.maxActivePrompts - 1);
      await expect(
        service.updatePrompt(5, { isActive: true }, 1),
      ).resolves.toBeUndefined();
      expect(repo.updatePrompt).toHaveBeenCalled();
    });

    it('rejects text over the length limit', async () => {
      await expect(
        service.updatePrompt(
          5,
          { text: 'a'.repeat(LLM_LIMITS.maxPromptLen + 1) },
          1,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('does not check the active limit when only editing text', async () => {
      await service.updatePrompt(5, { text: 'hello' }, 1);
      expect(repo.countActiveByUser).not.toHaveBeenCalled();
    });

    it('excludes the current prompt from the active count (no-op re-activate at cap)', async () => {
      // repo returns the count WITHOUT prompt 5 → still under the cap
      repo.countActiveByUser.mockResolvedValue(LLM_LIMITS.maxActivePrompts - 1);
      await expect(
        service.updatePrompt(5, { text: 'x', isActive: true }, 1),
      ).resolves.toBeUndefined();
      expect(repo.countActiveByUser).toHaveBeenCalledWith(1, 5);
    });
  });
});
