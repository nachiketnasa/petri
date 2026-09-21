/**
 * The real backend client. Every call the UI makes to "the backend" goes
 * through this module and nowhere else — it's a mechanical translation of
 * openapi.yaml into fetch() calls. Function signatures match what this
 * module looked like when it was a mock, so nothing above it (contexts,
 * pages, components) needed to change for this swap.
 */
import type {
  Experiment,
  NewExperimentInput,
  ProfilePatch,
  PublicExperiment,
  Retro,
  User,
} from './types';
import { ApiError } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8091';
const TOKEN_KEY = 'petri:token';

// ---- token storage --------------------------------------------------

function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore — session just won't survive a reload in this browser
  }
}

function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ---- fetch wrapper ----------------------------------------------------

/** FastAPI's error body is `{"detail": "message"}` for our own checks, or
 * `{"detail": [{"msg": "...", ...}, ...]}` for automatic Pydantic validation
 * errors — normalize both into one readable string. */
function extractErrorMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
      .join('; ');
  }
  return 'Something went wrong.';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiError(extractErrorMessage(body?.detail));
  }
  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ---- auth ----------------------------------------------------------------

interface AuthResponse {
  user: User;
  token: string;
}

export async function login(email: string, password: string, captchaToken: string): Promise<User> {
  const { user, token } = await post<AuthResponse>('/auth/login', { email, password, captchaToken });
  setToken(token);
  return user;
}

/** Signup no longer logs the account in — it must be verified first (see
 * verifyEmail). Returns the email so the UI can show "check your inbox". */
export async function signup(name: string, email: string, password: string, captchaToken: string): Promise<string> {
  const { email: confirmedEmail } = await post<{ email: string }>('/auth/signup', {
    name,
    email,
    password,
    captchaToken,
  });
  return confirmedEmail;
}

/** Consumes the token from the emailed verification link and logs the user in. */
export async function verifyEmail(token: string): Promise<User> {
  const { user, token: authToken } = await post<AuthResponse>('/auth/verify', { token });
  setToken(authToken);
  return user;
}

export async function resendVerification(email: string): Promise<void> {
  await post<void>('/auth/resend-verification', { email });
}

export async function logout(): Promise<void> {
  try {
    await post<void>('/auth/logout');
  } finally {
    clearToken();
  }
}

export async function updateProfile(patchBody: ProfilePatch): Promise<User> {
  return patch<User>('/me', patchBody);
}

export async function deleteAccount(): Promise<void> {
  await del<void>('/me');
  clearToken();
}

/** Restores a session from a stored token, if any. Resolves null if there
 * isn't one, or if it's no longer valid. */
export async function getCurrentUser(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    return await get<User>('/me');
  } catch {
    clearToken();
    return null;
  }
}

// ---- experiments -----------------------------------------------------

export async function listExperiments(): Promise<Experiment[]> {
  return get<Experiment[]>('/experiments');
}

export async function createExperiment(input: NewExperimentInput): Promise<Experiment> {
  return post<Experiment>('/experiments', input);
}

export async function updateExperiment(
  id: string,
  patchBody: Partial<Pick<Experiment, 'title' | 'hypothesis'>>,
): Promise<Experiment> {
  return patch<Experiment>(`/experiments/${id}`, patchBody);
}

export async function deleteExperiment(id: string): Promise<void> {
  await del<void>(`/experiments/${id}`);
}

/** Moves a card between columns. Throws if the move violates a spec rule
 * (the server enforces the retro gate, not just the UI). */
export async function moveExperiment(id: string, column: Experiment['column']): Promise<Experiment> {
  return post<Experiment>(`/experiments/${id}/move`, { column });
}

export async function logCheckin(id: string, value: string, note: string): Promise<Experiment> {
  return post<Experiment>(`/experiments/${id}/checkins`, { value, note });
}

export async function submitRetro(id: string, retro: Retro): Promise<Experiment> {
  return post<Experiment>(`/experiments/${id}/retro`, retro);
}

export async function toggleShare(id: string): Promise<Experiment> {
  return post<Experiment>(`/experiments/${id}/share`);
}

/** Public, unauthenticated read used by the /s/:token share page. */
export async function getSharedExperiment(token: string): Promise<PublicExperiment | null> {
  try {
    return await get<PublicExperiment>(`/shared/${token}`);
  } catch (err) {
    if (err instanceof ApiError) return null;
    throw err;
  }
}

/** Derived, read-only "due" state for a card — never persisted (see specs.md non-goals). */
export function getDueStatus(exp: Experiment): 'due' | 'overdue' | null {
  if (exp.column !== 'active') return null;
  const cadenceDays = exp.cadence === 'Weekly' ? 7 : 1;
  const last = exp.checkins.at(-1)?.createdAt ?? exp.createdAt;
  const diffDays = (Date.now() - new Date(last).getTime()) / 86_400_000;
  if (diffDays >= cadenceDays * 1.5) return 'overdue';
  if (diffDays >= cadenceDays) return 'due';
  return null;
}
