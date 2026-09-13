import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { JournalFlip } from '../components/JournalFlip';

export function LandingPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 21, fontWeight: 500 }}>Petri</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-muted)', textDecoration: 'none' }}>
            Log in
          </Link>
          <Link
            to="/login"
            style={{ fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: 'white', padding: '10px 20px', borderRadius: 999, textDecoration: 'none' }}
          >
            Sign up free
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '48px auto 0', textAlign: 'center', padding: '0 24px' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--accent-dark)',
            background: 'var(--accent-soft)',
            padding: '5px 14px',
            borderRadius: 999,
            marginBottom: 22,
          }}
        >
          Inspired by Tiny Experiments
        </span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 500, lineHeight: 1.15, margin: 0 }}>
          Turn &ldquo;I should really&hellip;&rdquo; into a tiny experiment
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-muted)', lineHeight: 1.6, margin: '22px 0 0' }}>
          Petri is a kanban board for running small, purposeful experiments on your own habits — so you learn what
          actually works for you, not just what you managed to finish.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <Link
            to="/login"
            style={{ fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: 'white', padding: '13px 26px', borderRadius: 999, textDecoration: 'none' }}
          >
            Start your first experiment
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '72px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, textAlign: 'center', margin: '0 0 12px' }}>
          Every experiment follows PACT
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-faint)', margin: '0 0 32px' }}>
          Flip through it — click a page, or drag it sideways.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <JournalFlip />
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: '88px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500, textAlign: 'center', margin: '0 0 40px' }}>
          Backlog it. Run it. Reflect on it.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 28 }}>
          <Step title="Write your hypothesis" body="If I do X, then Y will happen — and set how often you'll check in." />
          <Step title="Log what happens" body="A quick check-in each cycle — done or not, plus a note if you want." />
          <Step title="Decide what's next" body="When it's done, a short retro: continue, stop, pivot, or iterate." />
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '96px auto 0', textAlign: 'center', padding: '56px 24px 0' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, margin: 0 }}>
          Ready to run your first experiment?
        </h2>
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            marginTop: 22,
            fontSize: 14,
            fontWeight: 600,
            background: 'var(--accent)',
            color: 'white',
            padding: '13px 28px',
            borderRadius: 999,
            textDecoration: 'none',
          }}
        >
          Sign up free
        </Link>
      </div>

      <div style={{ textAlign: 'center', padding: '48px 24px', marginTop: 48, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--ink-faint)' }}>
        Petri — a personal experiments tracker, inspired by <em>Tiny Experiments</em>.
      </div>
    </div>
  );
}

function Step({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
