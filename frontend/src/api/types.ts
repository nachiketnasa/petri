export type Cadence = 'Daily' | 'Weekly' | 'Custom';
export type CheckinType = 'done' | 'rating';
export type Column = 'backlog' | 'active' | 'reflect' | 'archived';
export type Decision = 'continue' | 'stop' | 'pivot' | 'iterate';
export type DurationUnit = 'days' | 'weeks';

export interface CheckIn {
  id: string;
  value: string; // 'done' | 'skip' | '1'..'5'
  note: string;
  createdAt: string; // ISO timestamp
}

export interface Retro {
  worked: string;
  notWorked: string;
  decision: Decision;
}

export interface Experiment {
  id: string;
  title: string;
  hypothesis: string;
  cadence: Cadence;
  checkinType: CheckinType;
  durationValue: number;
  durationUnit: DurationUnit;
  column: Column;
  checkins: CheckIn[];
  retro: Retro | null;
  shared: boolean;
  shareToken: string | null;
  createdAt: string;
}

export interface NewExperimentInput {
  title: string;
  hypothesis: string;
  cadence: Cadence;
  checkinType: CheckinType;
  durationValue: number;
  durationUnit: DurationUnit;
}

export const AVATAR_COLORS = ['green', 'amber', 'blue', 'rose', 'violet', 'slate'] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  avatarColor: AvatarColor;
}

export interface ProfilePatch {
  name?: string;
  bio?: string;
  avatarUrl?: string | null;
  avatarColor?: AvatarColor;
}

/** What a public, unauthenticated viewer of a shared experiment sees. */
export interface PublicExperiment {
  title: string;
  hypothesis: string;
  cadence: Cadence;
  column: Column;
  checkinCount: number;
}

export class ApiError extends Error {}
