import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-ctr';
const IV_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const hexKey = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = Buffer.from(hexKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encryptedText = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    return Buffer.concat([iv, encryptedText]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, 'base64');
    const iv = buf.subarray(0, IV_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }
}
