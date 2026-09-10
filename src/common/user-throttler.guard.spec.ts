import { JwtService } from '@nestjs/jwt';
import { UserThrottlerGuard } from './user-throttler.guard';

const SECRET = 'test-secret';
const signer = new JwtService({ secret: SECRET });

const guard = new UserThrottlerGuard(
  { throttlers: [] },
  {} as never,
  {} as never,
  new JwtService({ secret: SECRET }),
);
const track = (req: Record<string, unknown>): Promise<string> =>
  (
    guard as unknown as { getTracker: (r: unknown) => Promise<string> }
  ).getTracker(req);

const bearer = (token: string) => ({
  headers: { authorization: `Bearer ${token}` },
});

describe('UserThrottlerGuard.getTracker (cyber-review.md B1)', () => {
  it('keys by user for a validly signed token', async () => {
    const token = signer.sign({ sub: 42, email: 'a@b.c' });
    await expect(track({ ...bearer(token), ip: '1.1.1.1' })).resolves.toBe(
      'user-42',
    );
  });

  it('ignores a token signed with the wrong secret and falls back to IP', async () => {
    const forged = new JwtService({ secret: 'attacker' }).sign({ sub: 999 });
    await expect(track({ ...bearer(forged), ip: '9.9.9.9' })).resolves.toBe(
      '9.9.9.9',
    );
  });

  it('ignores a hand-crafted unsigned token', async () => {
    const payload = Buffer.from(JSON.stringify({ sub: 7 })).toString(
      'base64url',
    );
    await expect(
      track({ ...bearer(`h.${payload}.sig`), ip: '3.3.3.3' }),
    ).resolves.toBe('3.3.3.3');
  });

  it('falls back to IP when there is no token', async () => {
    await expect(track({ headers: {}, ip: '2.2.2.2' })).resolves.toBe(
      '2.2.2.2',
    );
  });

  it('a forged Bearer does not mint a fresh bucket (auth-route bypass blocked)', async () => {
    const a = new JwtService({ secret: 'x' }).sign({ sub: 1 });
    const b = new JwtService({ secret: 'y' }).sign({ sub: 2 });
    const t1 = await track({ ...bearer(a), ip: '5.5.5.5' });
    const t2 = await track({ ...bearer(b), ip: '5.5.5.5' });
    expect(t1).toBe('5.5.5.5');
    expect(t2).toBe('5.5.5.5');
  });
});
