import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Page not found</div>
      <Link to="/">Back to Petri</Link>
    </div>
  );
}
