import { Injectable } from '@nestjs/common';
import { LlmRepository } from '../llm.repository';
import { type StoredLlmResponse } from '../llm.types';

@Injectable()
export class FindResponsesByDateService {
  constructor(private readonly llmRepository: LlmRepository) {}

  async execute(date: Date, userId: number): Promise<StoredLlmResponse[]> {
    return this.llmRepository.findResponsesByDate(date, userId);
  }
}
