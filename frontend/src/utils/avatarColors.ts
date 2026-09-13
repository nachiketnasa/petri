import type { AvatarColor } from '../api/types';
import { AVATAR_COLORS } from '../api/types';

export const AVATAR_COLOR_TOKENS: Record<AvatarColor, { bg: string; fg: string }> = {
  green: { bg: 'var(--accent-soft)', fg: 'var(--accent-dark)' },
  amber: { bg: 'var(--amber-soft)', fg: 'var(--amber-dark)' },
  blue: { bg: 'var(--blue-soft)', fg: 'var(--blue-dark)' },
  rose: { bg: 'var(--rose-soft)', fg: 'var(--rose-dark)' },
  violet: { bg: 'var(--violet-soft)', fg: 'var(--violet-dark)' },
  slate: { bg: 'var(--slate-soft)', fg: 'var(--slate-dark)' },
};

export { AVATAR_COLORS };
