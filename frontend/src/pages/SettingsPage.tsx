import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch {
      setDeleteError('Could not delete your account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppNav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 32px 60px' }}>
        <Link to="/dashboard" style={{ fontSize: 13, color: 'var(--ink-muted)', textDecoration: 'none' }}>
          ‹ Back to Dashboard
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, marginTop: 12 }}>Settings</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 4 }}>
          Signed in as {user?.email}
        </div>

        <SectionCard title="Notifications">
          <PlaceholderToggle label="Email reminders" hint="A daily nudge for check-ins due today. Coming in a later release." />
          <PlaceholderToggle label="Weekly summary email" hint="A recap of the week's check-ins and streaks. Coming in a later release." />
        </SectionCard>

        <SectionCard title="Appearance">
          <div style={{ display: 'flex', gap: 8 }}>
            <ThemeOption label="Light" active />
            <ThemeOption label="System" />
            <ThemeOption label="Dark" />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 10 }}>
            System and Dark are coming in a later release.
          </div>
        </SectionCard>

        <SectionCard title="Account">
          <Row label="Signed in as" value={user?.email ?? ''} />
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </SectionCard>

        <div className="card" style={{ marginTop: 20, padding: 24, borderColor: 'var(--red-soft)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red-dark)' }}>Danger zone</div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 6, lineHeight: 1.5 }}>
            Deleting your account permanently removes all your experiments, check-ins, and retros. This can't be
            undone.
          </div>

          {!confirmingDelete ? (
            <button
              className="btn"
              style={{ marginTop: 14, background: 'var(--red-soft)', color: 'var(--red-dark)', border: 'none' }}
              onClick={() => setConfirmingDelete(true)}
            >
              Delete account
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Are you sure?</span>
              <button
                className="btn"
                disabled={deleting}
                style={{ background: 'var(--red)', color: 'white', border: 'none' }}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancel
              </button>
            </div>
          )}
          {deleteError && <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--red-dark)' }}>{deleteError}</div>}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card" style={{ marginTop: 20, padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
      <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function PlaceholderToggle({ label, hint }: { label: string; hint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2, maxWidth: 380 }}>{hint}</div>
      </div>
      <span
        style={{
          width: 42,
          height: 24,
          borderRadius: 999,
          background: 'var(--border)',
          display: 'inline-block',
          position: 'relative',
          opacity: 0.6,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'white',
          }}
        />
      </span>
    </div>
  );
}

function ThemeOption({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className="btn-sm"
      disabled={!active}
      style={{
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        color: active ? 'var(--accent-dark)' : 'var(--ink-faint)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        cursor: active ? 'pointer' : 'not-allowed',
      }}
    >
      {label}
    </button>
  );
}
