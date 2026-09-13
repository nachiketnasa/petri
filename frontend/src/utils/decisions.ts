import type { Decision } from '../api/types';

export const DECISION_META: Record<Decision, { text: string; bg: string; color: string }> = {
  continue: { text: 'Continue', bg: 'var(--accent-soft)', color: 'var(--accent-dark)' },
  stop: { text: 'Stop', bg: 'var(--red-soft)', color: 'var(--red-dark)' },
  pivot: { text: 'Pivot', bg: 'var(--amber-soft)', color: 'var(--amber-dark)' },
  iterate: { text: 'Iterate', bg: 'var(--blue-soft)', color: 'var(--blue-dark)' },
};

export const DECISION_OPTIONS: Decision[] = ['continue', 'iterate', 'pivot', 'stop'];
