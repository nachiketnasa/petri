import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/types';

export function VerifyEmailPage() {
  const { user, verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This verification link is missing its token.');
      return;
    }
    verifyEmail(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err) => {
        setStatus('error');
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '36px 32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 26 }}>
          <Logo size={30} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, fontWeight: 500 }}>Petri</div>
        </div>
        {status === 'verifying' ? (
          <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>Verifying your email…</p>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--red-dark)', marginBottom: 18 }}>{error}</p>
            <a href="/login" style={{ fontWeight: 600, fontSize: 13.5, textDecoration: 'none' }}>
              Back to log in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
