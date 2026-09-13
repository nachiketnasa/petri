import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button className="avatar-button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <UserAvatar user={user} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 190,
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: '0 8px 24px oklch(24% 0.02 55 / 0.12)',
            padding: 6,
            zIndex: 30,
          }}
        >
          <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{user?.email}</div>
          </div>
          <MenuItem
            label="Edit profile"
            onClick={() => {
              setOpen(false);
              navigate('/profile');
            }}
          />
          <MenuItem
            label="Settings"
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 2px' }} />
          <MenuItem
            label="Log out"
            danger
            onClick={() => {
              setOpen(false);
              logout();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        background: 'none',
        border: 'none',
        borderRadius: 8,
        fontSize: 13.5,
        fontWeight: 500,
        color: danger ? 'var(--red-dark)' : 'var(--ink)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(95% 0.01 80)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      {label}
    </button>
  );
}
