import type { DragEvent } from 'react';
import { getDueStatus } from '../api/client';
import type { Experiment } from '../api/types';
import { DECISION_META } from '../utils/decisions';

interface Props {
  experiment: Experiment;
  onOpen: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onToggleShare: (id: string) => void;
}

export function ExperimentCard({ experiment, onOpen, onDragStart, onToggleShare }: Props) {
  const due = getDueStatus(experiment);
  const isArchived = experiment.column === 'archived';

  return (
    <div
      className="card"
      draggable={!isArchived}
      onDragStart={(e) => onDragStart(e, experiment.id)}
      onClick={() => onOpen(experiment.id)}
      style={{ cursor: 'pointer', opacity: isArchived ? 0.85 : 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>
          {experiment.title}
        </div>
        {experiment.column !== 'archived' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleShare(experiment.id);
            }}
            title={experiment.shared ? 'Sharing on — click to stop' : 'Not shared — click to share'}
            style={{
              background: 'none',
              border: 'none',
              padding: 2,
              flexShrink: 0,
              color: experiment.shared ? 'var(--accent)' : 'var(--ink-faint)',
            }}
          >
            <ShareIcon filled={experiment.shared} />
          </button>
        )}
      </div>

      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-muted)',
          marginTop: 6,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {experiment.hypothesis}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {experiment.column === 'backlog' && (
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            {experiment.cadence} · {experiment.durationValue} {experiment.durationUnit}
          </span>
        )}

        {experiment.column === 'active' && (
          <>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-faint)' }}>
              <LeafIcon />
              {experiment.checkins.length} check-in{experiment.checkins.length === 1 ? '' : 's'}
            </span>
            {due && (
              <span
                className="badge"
                style={{
                  background: due === 'overdue' ? 'var(--red-soft)' : 'var(--amber-soft)',
                  color: due === 'overdue' ? 'var(--red-dark)' : 'var(--amber-dark)',
                }}
              >
                {due === 'overdue' ? 'Overdue' : 'Due today'}
              </span>
            )}
          </>
        )}

        {experiment.column === 'reflect' && (
          <span className="badge" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}>
            Retro needed
          </span>
        )}

        {experiment.column === 'archived' && experiment.retro && (
          <span
            className="badge"
            style={{ background: DECISION_META[experiment.retro.decision].bg, color: DECISION_META[experiment.retro.decision].color }}
          >
            {DECISION_META[experiment.retro.decision].text}
          </span>
        )}
      </div>
    </div>
  );
}

function ShareIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M11.5 5.5a2 2 0 1 0-1.9-2.65L5.9 5.2a2 2 0 1 0 0 2.6l3.7 2.35a2 2 0 1 0 .55-.9L6.45 6.9a2 2 0 0 0 0-1.8l3.7-2.35c.34.4.82.65 1.35.65Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 2c0 3-3.5 4-3.5 7.5a3.5 3.5 0 1 0 7 0C11.5 6 8 5 8 2Z" stroke="var(--accent)" strokeWidth="1.3" />
    </svg>
  );
}
