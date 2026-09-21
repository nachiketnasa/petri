import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Business rules (the retro gate, active-only check-ins, ownership
 * isolation, ...) now live server-side and are covered by the backend's own
 * pytest suite (backend/tests/). This module is a thin fetch() wrapper, so
 * what's worth testing here is the wrapper itself: does it attach the auth
 * token, store it on login, parse both of FastAPI's error shapes, and
 * translate a 404 on the public share lookup into `null` instead of a
 * thrown error.
 */

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api client (fetch wrapper)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('stores the token on login and attaches it as a bearer header on later calls', async () => {
    const { login, listExperiments } = await import('./client');

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ user: { id: 'u1', name: 'Ada', email: 'ada@example.com' }, token: 'tok_123' }),
    );
    await login('ada@example.com', 'hunter22', 'captcha-tok');

    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await listExperiments();

    const [, options] = fetchMock.mock.calls[1];
    const headers = new Headers(options.headers);
    expect(headers.get('Authorization')).toBe('Bearer tok_123');
  });

  it('surfaces a plain-string FastAPI error detail as the ApiError message', async () => {
    const { login } = await import('./client');
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'Incorrect email or password.' }, { status: 401 }));

    await expect(login('ada@example.com', 'wrong', 'captcha-tok')).rejects.toThrow('Incorrect email or password.');
  });

  it('formats a Pydantic-style array error detail into a readable message', async () => {
    const { createExperiment } = await import('./client');
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { detail: [{ loc: ['body', 'title'], msg: 'String should have at least 1 character' }] },
        { status: 422 },
      ),
    );

    await expect(
      createExperiment({
        title: '',
        hypothesis: 'h',
        cadence: 'Daily',
        checkinType: 'done',
        durationValue: 1,
        durationUnit: 'weeks',
      }),
    ).rejects.toThrow(/at least 1 character/);
  });

  it('treats a 404 on the public share lookup as "not shared", not an error', async () => {
    const { getSharedExperiment } = await import('./client');
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'Not found.' }, { status: 404 }));

    await expect(getSharedExperiment('nope')).resolves.toBeNull();
  });

  it('lets a non-ApiError from a share lookup propagate (e.g. a network failure)', async () => {
    const { getSharedExperiment } = await import('./client');
    fetchMock.mockRejectedValueOnce(new TypeError('network down'));

    await expect(getSharedExperiment('any-token')).rejects.toThrow('network down');
  });

  it('getCurrentUser resolves null without calling the network when there is no stored token', async () => {
    const { getCurrentUser } = await import('./client');
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getDueStatus', () => {
  it('flags an active experiment as overdue once the cadence has clearly lapsed', async () => {
    const { getDueStatus } = await import('./client');
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    const experiment = {
      id: 'e1',
      title: 't',
      hypothesis: 'h',
      cadence: 'Daily' as const,
      checkinType: 'done' as const,
      durationValue: 1,
      durationUnit: 'weeks' as const,
      column: 'active' as const,
      checkins: [{ id: 'c1', value: 'done', note: '', createdAt: daysAgo(3) }],
      retro: null,
      shared: false,
      shareToken: null,
      createdAt: daysAgo(10),
    };
    expect(getDueStatus(experiment)).toBe('overdue');
  });

  it('is null for a non-active experiment regardless of check-in history', async () => {
    const { getDueStatus } = await import('./client');
    const experiment = {
      id: 'e2',
      title: 't',
      hypothesis: 'h',
      cadence: 'Daily' as const,
      checkinType: 'done' as const,
      durationValue: 1,
      durationUnit: 'weeks' as const,
      column: 'backlog' as const,
      checkins: [],
      retro: null,
      shared: false,
      shareToken: null,
      createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    };
    expect(getDueStatus(experiment)).toBeNull();
  });
});
