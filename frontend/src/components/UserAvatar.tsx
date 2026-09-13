import type { User } from '../api/types';
import { AVATAR_COLOR_TOKENS } from '../utils/avatarColors';

export function UserAvatar({ user, size = 32 }: { user: User | null; size?: number }) {
  const tokens = AVATAR_COLOR_TOKENS[user?.avatarColor ?? 'green'];

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: tokens.bg,
        color: tokens.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.42,
        flexShrink: 0,
      }}
    >
      {(user?.name ?? '?').slice(0, 1).toUpperCase()}
    </div>
  );
}
