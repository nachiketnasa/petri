import { useMemo, useState } from 'react';
import { AppNav } from '../components/AppNav';
import { useExperiments } from '../context/ExperimentsContext';
import type { Decision } from '../api/types';
import { DECISION_META, DECISION_OPTIONS } from '../utils/decisions';

export function ArchivePage() {
  const { experiments } = useExperiments();
  const [filter, setFilter] = useState<Decision | 'all'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const archived = useMemo(() => experiments.filter((e) => e.column === 'archived' && e.retro), [experiments]);
  const filtered = filter === 'all' ? archived : archived.filter((e) => e.retro!.decision === filter);

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppNav />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 32px 60px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500 }}>Archive</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 4 }}>
          Every experiment you've run, and what you decided.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
          <button
            className="btn-sm"
            style={{
              background: filter === 'all' ? 'oklch(38% 0.02 55)' : 'transparent',
              color: filter === 'all' ? 'white' : 'var(--ink-muted)',
              borderColor: filter === 'all' ? 'oklch(38% 0.02 55)' : 'var(--border-strong)',
            }}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {DECISION_OPTIONS.map((d) => {
            const active = filter === d;
            return (
              <button
                key={d}
                className="btn-sm"
                style={{
                  background: active ? 'oklch(38% 0.02 55)' : 'transparent',
                  color: active ? 'white' : 'var(--ink-muted)',
                  borderColor: active ? 'oklch(38% 0.02 55)' : 'var(--border-strong)',
                }}
                onClick={() => setFilter(d)}
              >
                {DECISION_META[d].text}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
          {filtered.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No experiments here yet.</div>}
          {filtered.map((exp) => {
            const isOpen = !!expanded[exp.id];
            const meta = DECISION_META[exp.retro!.decision];
            return (
              <div key={exp.id} className="card">
                <div
                  onClick={() => setExpanded((prev) => ({ ...prev, [exp.id]: !prev[exp.id] }))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>{exp.title}</div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--ink-muted)',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {exp.hypothesis}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span className="badge" style={{ background: meta.bg, color: meta.color }}>
                      {meta.text}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{ transform: `rotate(${isOpen ? 180 : 0}deg)`, transition: 'transform 0.15s' }}
                    >
                      <path d="M4 6l4 4 4-4" stroke="var(--ink-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid oklch(93% 0.012 80)' }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>What worked</div>
                    <div style={{ fontSize: 13.5, marginTop: 2, marginBottom: 10 }}>{exp.retro!.worked}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>What didn't</div>
                    <div style={{ fontSize: 13.5, marginTop: 2 }}>{exp.retro!.notWorked}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 10 }}>
                      {exp.cadence} · {exp.durationValue} {exp.durationUnit}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
