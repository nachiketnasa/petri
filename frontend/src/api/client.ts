/**
 * Mock backend. Every call the UI makes to "the backend" goes through this
 * module and nowhere else. Swapping to the real FastAPI service later means
 * rewriting the bodies of these functions to `fetch()` the OpenAPI contract
 * — call sites in components/pages never change.
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
import { seedExperiments } from './mockData';

const LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---- in-memory "database" ----------------------------------------------

let currentUser: User | null = null;
let experiments: Experiment[] = seedExperiments();

// ---- auth ----------------------------------------------------------------

export async function login(email: string, _password: string): Promise<User> {
  currentUser = {
    id: 'u1',
    name: email.split('@')[0] || 'Explorer',
    email,
    bio: '',
    avatarUrl: null,
    avatarColor: 'green',
  };
  return delay(clone(currentUser));
}

export async function signup(name: string, email: string, _password: string): Promise<User> {
  currentUser = { id: 'u1', name, email, bio: '', avatarUrl: null, avatarColor: 'green' };
  return delay(clone(currentUser));
}

export function logout(): void {
  currentUser = null;
}

export async function updateProfile(patch: ProfilePatch): Promise<User> {
  if (!currentUser) throw new ApiError('Not logged in.');
  if (patch.name !== undefined && !patch.name.trim()) {
    throw new ApiError('Display name can’t be empty.');
  }
  currentUser = { ...currentUser, ...patch };
  return delay(clone(currentUser));
}

export async function deleteAccount(): Promise<void> {
  currentUser = null;
  experiments = [];
  return delay(undefined);
}

export function getCurrentUser(): User | null {
  return currentUser ? clone(currentUser) : null;
}

// ---- experiments -----------------------------------------------------

export async function listExperiments(): Promise<Experiment[]> {
  return delay(clone(experiments));
}

function findOrThrow(id: string): Experiment {
  const exp = experiments.find((e) => e.id === id);
  if (!exp) throw new ApiError(`Experiment ${id} not found`);
  return exp;
}

export async function createExperiment(input: NewExperimentInput): Promise<Experiment> {
  if (!input.title.trim() || !input.hypothesis.trim()) {
    throw new ApiError('Title and hypothesis are required.');
  }
  const exp: Experiment = {
    id: 'e' + Date.now(),
    title: input.title.trim(),
    hypothesis: input.hypothesis.trim(),
    cadence: input.cadence,
    checkinType: input.checkinType,
    durationValue: input.durationValue,
    durationUnit: input.durationUnit,
    column: 'backlog',
    checkins: [],
    retro: null,
    shared: false,
    shareToken: null,
    createdAt: new Date().toISOString(),
  };
  experiments = [...experiments, exp];
  return delay(clone(exp));
}

export async function updateExperiment(
  id: string,
  patch: Partial<Pick<Experiment, 'title' | 'hypothesis'>>,
): Promise<Experiment> {
  const exp = findOrThrow(id);
  if (exp.column !== 'backlog' && exp.column !== 'active') {
    throw new ApiError('Only Backlog or Active experiments can be edited.');
  }
  Object.assign(exp, patch);
  return delay(clone(exp));
}

export async function deleteExperiment(id: string): Promise<void> {
  const exp = findOrThrow(id);
  if (exp.column !== 'backlog' && exp.column !== 'active') {
    throw new ApiError('Only Backlog or Active experiments can be deleted.');
  }
  experiments = experiments.filter((e) => e.id !== id);
  return delay(undefined);
}

/** Moves a card between columns. Throws if the move violates a spec rule. */
export async function moveExperiment(id: string, column: Experiment['column']): Promise<Experiment> {
  const exp = findOrThrow(id);
  if (column === 'archived' && !exp.retro) {
    throw new ApiError('Complete a retro before archiving this experiment.');
  }
  exp.column = column;
  return delay(clone(exp));
}

export async function logCheckin(id: string, value: string, note: string): Promise<Experiment> {
  const exp = findOrThrow(id);
  if (exp.column !== 'active') {
    throw new ApiError('Check-ins can only be logged while an experiment is Active.');
  }
  exp.checkins = [
    ...exp.checkins,
    { id: 'c' + Date.now(), value, note, createdAt: new Date().toISOString() },
  ];
  return delay(clone(exp));
}

export async function submitRetro(id: string, retro: Retro): Promise<Experiment> {
  const exp = findOrThrow(id);
  if (!retro.worked.trim() || !retro.notWorked.trim() || !retro.decision) {
    throw new ApiError('A retro needs what worked, what didn’t, and a decision.');
  }
  exp.retro = retro;
  exp.column = 'archived';
  return delay(clone(exp));
}

export async function toggleShare(id: string): Promise<Experiment> {
  const exp = findOrThrow(id);
  exp.shared = !exp.shared;
  exp.shareToken = exp.shared ? randomToken() : null;
  return delay(clone(exp));
}

/** Public, unauthenticated read used by the /s/:token share page. */
export async function getSharedExperiment(token: string): Promise<PublicExperiment | null> {
  const exp = experiments.find((e) => e.shared && e.shareToken === token);
  if (!exp) return delay(null);
  return delay({
    title: exp.title,
    hypothesis: exp.hypothesis,
    cadence: exp.cadence,
    column: exp.column,
    checkinCount: exp.checkins.length,
  });
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
