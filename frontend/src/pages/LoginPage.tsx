import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Turnstile } from '../components/Turnstile';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/types';

export function LoginPage() {
  const { user, login, signup, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resent, setResent] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      if (isSignup) {
        const signedUpEmail = await signup(name || 'Explorer', email, password, captchaToken);
        setPendingVerificationEmail(signedUpEmail);
      } else {
        await login(email, password, captchaToken);
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      if (message.toLowerCase().includes('verify your email')) {
        setNeedsVerification(true);
        setPendingVerificationEmail(email);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResent(false);
    await resendVerification(pendingVerificationEmail);
    setResent(true);
  }

  if (pendingVerificationEmail && !needsVerification) {
    return (
      <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ width: '100%', maxWidth: 380, padding: '36px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
            <Logo size={30} />
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 500 }}>Petri</div>
          </div>
          <p style={{ fontSize: 14, marginBottom: 6 }}>Check your email</p>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 18 }}>
            We sent a verification link to <strong>{pendingVerificationEmail}</strong>. Click it to activate your account.
          </p>
          {resent ? (
            <p style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Sent again — check your inbox.</p>
          ) : (
            <button type="button" className="btn btn-block" onClick={handleResend} style={{ marginBottom: 10 }}>
              Resend email
            </button>
          )}
        </div>
      </div>
    );
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
          <Turnstile onVerify={setCaptchaToken} />
          {error && <div style={{ marginBottom: 8, fontSize: 12.5, color: 'var(--red-dark)' }}>{error}</div>}
          {needsVerification &&
            (resent ? (
              <div style={{ marginBottom: 14, fontSize: 12.5, color: 'var(--ink-faint)' }}>Sent again — check your inbox.</div>
            ) : (
              <button type="button" className="btn" onClick={handleResend} style={{ marginBottom: 14, width: '100%' }}>
                Resend verification email
              </button>
            ))}
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
