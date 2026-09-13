import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import type { AvatarColor } from '../api/types';
import { ApiError } from '../api/types';
import { AVATAR_COLORS, AVATAR_COLOR_TOKENS } from '../utils/avatarColors';

const MAX_PHOTO_BYTES = 1_500_000;

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarColor, setAvatarColor] = useState<AvatarColor>(user?.avatarColor ?? 'green');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const previewUser = user ? { ...user, name, bio, avatarUrl, avatarColor } : null;

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('That image is too large — try one under 1.5 MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Display name can’t be empty.');
      return;
    }
    try {
      await updateProfile({ name: name.trim(), bio, avatarUrl, avatarColor });
      setError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppNav />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 32px 60px' }}>
        <Link to="/dashboard" style={{ fontSize: 13, color: 'var(--ink-muted)', textDecoration: 'none' }}>
          ‹ Back to Dashboard
        </Link>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, marginTop: 12 }}>
          Edit profile
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 4 }}>
          How you show up across Petri.
        </div>

        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Profile picture</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <UserAvatar user={previewUser} size={72} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                  Upload photo
                </button>
                {avatarUrl && (
                  <button type="button" className="btn btn-ghost" onClick={() => setAvatarUrl(null)}>
                    Remove
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>PNG or JPG, up to 1.5 MB.</div>
            </div>
          </div>

          {!avatarUrl && (
            <div style={{ marginTop: 16 }}>
              <div className="field-label">Or pick a color</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => setAvatarColor(c)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: AVATAR_COLOR_TOKENS[c].bg,
                      border: avatarColor === c ? `2px solid ${AVATAR_COLOR_TOKENS[c].fg}` : '2px solid transparent',
                      boxShadow: avatarColor === c ? `0 0 0 2px var(--paper), 0 0 0 3px ${AVATAR_COLOR_TOKENS[c].fg}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 20, padding: 24 }}>
          <label className="field-label">Display name</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />

          <label className="field-label" style={{ marginTop: 16 }}>
            Email
          </label>
          <input className="field" value={user?.email ?? ''} disabled style={{ opacity: 0.6 }} />

          <label className="field-label" style={{ marginTop: 16 }}>
            Bio
          </label>
          <textarea
            className="field"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="What are you experimenting on these days?"
            style={{ minHeight: 80 }}
          />

          {error && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red-dark)' }}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={handleSave}>
              Save changes
            </button>
            {saved && <span style={{ fontSize: 12.5, color: 'var(--accent-dark)' }}>Saved</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
