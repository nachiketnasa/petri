import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/types';

export function LoginPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(name || 'Explorer', email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '36px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 26 }}>
          <Logo size={30} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 500 }}>Petri</div>
        </div>

        <div style={{ display: 'flex', background: 'oklch(95% 0.01 80)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setIsSignup(false)}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              background: isSignup ? 'transparent' : 'white',
              color: isSignup ? 'var(--ink-faint)' : 'var(--ink)',
              boxShadow: isSignup ? 'none' : '0 1px 3px oklch(24% 0.02 55 / 0.12)',
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setIsSignup(true)}
            style={{
              flex: 1,
              padding: '9px 0',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              background: isSignup ? 'white' : 'transparent',
              color: isSignup ? 'var(--ink)' : 'var(--ink-faint)',
              boxShadow: isSignup ? '0 1px 3px oklch(24% 0.02 55 / 0.12)' : 'none',
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label className="field-label">Name</label>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" style={{ marginBottom: 14 }} />
            </>
          )}
          <label className="field-label">Email</label>
          <input
            className="field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ marginBottom: 14 }}
          />
          <label className="field-label">Password</label>
          <input
            className="field"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ marginBottom: 22 }}
          />
          {error && <div style={{ marginBottom: 14, fontSize: 12.5, color: 'var(--red-dark)' }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 18 }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsSignup(!isSignup);
            }}
            style={{ fontWeight: 600, textDecoration: 'none' }}
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </a>
        </div>
      </div>
    </div>
  );
}
