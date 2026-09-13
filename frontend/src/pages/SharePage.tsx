import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedExperiment } from '../api/client';
import type { PublicExperiment } from '../api/types';
import { Logo } from '../components/Logo';

export function SharePage() {
  const { token = '' } = useParams();
  const [experiment, setExperiment] = useState<PublicExperiment | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getSharedExperiment(token).then(setExperiment);
  }, [token]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // clipboard access may be unavailable; the link is still visible on screen
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '34px 30px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22 }}>
          <Logo size={20} />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-muted)' }}>Petri</div>
        </div>

        {experiment === undefined && <div style={{ color: 'var(--ink-muted)' }}>Loading…</div>}

        {experiment === null && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500 }}>This experiment isn't shared</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 8 }}>
              The owner may have turned sharing off, or the link is incorrect.
            </div>
          </div>
        )}

        {experiment && (
          <>
            <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)', marginBottom: 14 }}>
              {experiment.column[0].toUpperCase() + experiment.column.slice(1)}
            </span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, lineHeight: 1.3 }}>{experiment.title}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 10, lineHeight: 1.5 }}>{experiment.hypothesis}</div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 26, paddingTop: 22, borderTop: '1px solid oklch(91% 0.012 80)' }}>
              <Stat value={experiment.checkinCount} label="check-ins" accent />
              <Stat value={experiment.cadence} label="cadence" />
            </div>

            <button className="btn btn-ghost btn-block" style={{ marginTop: 26 }} onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </>
        )}

        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 20 }}>
          Tracking a personal experiment on <Link to="/">Petri</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: accent ? 'var(--accent-dark)' : 'var(--ink)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
