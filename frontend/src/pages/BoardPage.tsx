import { useEffect, useMemo, useState } from 'react';
import type { DragEvent } from 'react';
import { AppNav } from '../components/AppNav';
import { ExperimentCard } from '../components/ExperimentCard';
import { DetailDrawer } from '../components/DetailDrawer';
import { NewExperimentModal } from '../components/NewExperimentModal';
import { useExperiments } from '../context/ExperimentsContext';
import type { Column } from '../api/types';

const COLUMNS: { key: Column; label: string; dot: string }[] = [
  { key: 'backlog', label: 'Backlog', dot: 'oklch(70% 0.02 70)' },
  { key: 'active', label: 'Active', dot: 'var(--accent)' },
  { key: 'reflect', label: 'Reflect', dot: 'var(--amber)' },
  { key: 'archived', label: 'Archived', dot: 'oklch(65% 0.02 60)' },
];

export function BoardPage() {
  const { experiments, loading, moveExperiment, toggleShare, error, clearError } = useExperiments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  const byColumn = useMemo(() => {
    const map: Record<Column, typeof experiments> = { backlog: [], active: [], reflect: [], archived: [] };
    for (const exp of experiments) map[exp.column].push(exp);
    return map;
  }, [experiments]);

  const selected = experiments.find((e) => e.id === selectedId) ?? null;

  function handleDragStart(e: DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData('text/plain', id);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, column: Column) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) moveExperiment(id, column);
  }

  return (
    <div style={{ minHeight: '100vh' }} className="paper-bg">
      <AppNav />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '16px 32px 0',
        }}
      >
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <PlusIcon /> New experiment
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, color: 'var(--ink-muted)' }}>Loading experiments…</div>
      ) : (
        <div
          style={{
            padding: '20px 32px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
            gap: 22,
            alignItems: 'start',
          }}
        >
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.key)}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 200 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, display: 'inline-block' }} />
                <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                  {col.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)', background: 'oklch(93% 0.01 75)', padding: '1px 8px', borderRadius: 999 }}>
                  {byColumn[col.key].length}
                </span>
              </div>
              {byColumn[col.key].map((exp) => (
                <ExperimentCard
                  key={exp.id}
                  experiment={exp}
                  onOpen={setSelectedId}
                  onDragStart={handleDragStart}
                  onToggleShare={toggleShare}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {selected && <DetailDrawer experiment={selected} onClose={() => setSelectedId(null)} />}
      {showNew && <NewExperimentModal onClose={() => setShowNew(false)} />}
      {error && <div className="toast">{error}</div>}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
