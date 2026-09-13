import { useEffect, useState } from 'react';
import { useExperiments } from '../context/ExperimentsContext';
import type { Decision, Experiment } from '../api/types';
import { DECISION_META, DECISION_OPTIONS } from '../utils/decisions';

interface Props {
  experiment: Experiment;
  onClose: () => void;
  onCheckinSaved?: () => void;
}

export function DetailDrawer({ experiment, onClose, onCheckinSaved }: Props) {
  const { logCheckin, submitRetro, toggleShare, moveExperiment, updateExperiment, deleteExperiment } =
    useExperiments();

  const [checkinValue, setCheckinValue] = useState(experiment.checkinType === 'rating' ? '3' : 'done');
  const [checkinNote, setCheckinNote] = useState('');
  const [retroWorked, setRetroWorked] = useState('');
  const [retroNotWorked, setRetroNotWorked] = useState('');
  const [retroDecision, setRetroDecision] = useState<Decision | null>(null);

  useEffect(() => {
    setCheckinValue(experiment.checkinType === 'rating' ? '3' : 'done');
    setCheckinNote('');
    setRetroWorked('');
    setRetroNotWorked('');
    setRetroDecision(null);
  }, [experiment.id, experiment.checkinType]);

  const canArchive = retroWorked.trim() && retroNotWorked.trim() && retroDecision;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', padding: 6, margin: '-6px -6px 10px auto', display: 'block', color: 'var(--ink-muted)' }}
        >
          <CloseIcon />
        </button>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>{experiment.title}</div>
        <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.5 }}>
          {experiment.hypothesis}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 12, color: 'var(--ink-faint)' }}>
          <span>{experiment.cadence}</span>
          <span>·</span>
          <span>
            {experiment.durationValue} {experiment.durationUnit}
          </span>
        </div>

        {experiment.column !== 'archived' && (
          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>Public sharing</div>
            <button
              onClick={() => toggleShare(experiment.id)}
              style={{
                width: 42,
                height: 24,
                borderRadius: 999,
                border: 'none',
                background: experiment.shared ? 'var(--accent)' : 'var(--border-strong)',
                position: 'relative',
                padding: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: experiment.shared ? 21 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.15s',
                  boxShadow: '0 1px 2px oklch(24% 0.02 55 / 0.3)',
                }}
              />
            </button>
          </div>
        )}
        {experiment.shared && experiment.shareToken && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: 'var(--accent-dark)',
              background: 'var(--accent-soft)',
              padding: '8px 12px',
              borderRadius: 8,
              wordBreak: 'break-all',
            }}
          >
            {window.location.origin}/s/{experiment.shareToken}
          </div>
        )}

        {experiment.column === 'backlog' && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 14 }}>
              Move this experiment to <strong>Active</strong> to start logging check-ins.
            </div>
            <button className="btn btn-primary btn-block" onClick={() => moveExperiment(experiment.id, 'active')}>
              Start experiment
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  const title = window.prompt('Title', experiment.title);
                  if (title) updateExperiment(experiment.id, { title });
                }}
              >
                Edit
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, color: 'var(--red-dark)' }}
                onClick={() => {
                  deleteExperiment(experiment.id);
                  onClose();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {experiment.column === 'active' && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Log a check-in</div>
            {experiment.checkinType === 'rating' ? (
              <div style={{ display: 'flex', gap: 6 }}>
                {['1', '2', '3', '4', '5'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setCheckinValue(r)}
                    className="btn-sm"
                    style={{
                      flex: 1,
                      background: checkinValue === r ? 'var(--accent-soft)' : 'var(--field)',
                      color: checkinValue === r ? 'var(--accent-dark)' : 'var(--ink-muted)',
                      borderColor: checkinValue === r ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setCheckinValue('done')}
                  className="btn-sm"
                  style={{
                    flex: 1,
                    background: checkinValue === 'done' ? 'var(--accent-soft)' : 'var(--field)',
                    color: checkinValue === 'done' ? 'var(--accent-dark)' : 'var(--ink-muted)',
                    borderColor: checkinValue === 'done' ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  Done
                </button>
                <button
                  onClick={() => setCheckinValue('skip')}
                  className="btn-sm"
                  style={{
                    flex: 1,
                    background: checkinValue === 'skip' ? 'var(--amber-soft)' : 'var(--field)',
                    color: checkinValue === 'skip' ? 'var(--amber-dark)' : 'var(--ink-muted)',
                    borderColor: checkinValue === 'skip' ? 'var(--amber)' : 'var(--border)',
                  }}
                >
                  Skip
                </button>
              </div>
            )}
            <textarea
              className="field"
              placeholder="Notes (optional)"
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              style={{ marginTop: 10 }}
            />
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 10 }}
              onClick={async () => {
                await logCheckin(experiment.id, checkinValue, checkinNote);
                setCheckinNote('');
                onCheckinSaved?.();
              }}
            >
              Save check-in
            </button>
          </div>
        )}

        {experiment.column === 'reflect' && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Retro — before you archive</div>
            <label className="field-label">What worked?</label>
            <textarea className="field" value={retroWorked} onChange={(e) => setRetroWorked(e.target.value)} />
            <label className="field-label" style={{ marginTop: 10 }}>
              What didn't?
            </label>
            <textarea className="field" value={retroNotWorked} onChange={(e) => setRetroNotWorked(e.target.value)} />
            <label className="field-label" style={{ marginTop: 12 }}>
              Decision
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {DECISION_OPTIONS.map((d) => {
                const meta = DECISION_META[d];
                const active = retroDecision === d;
                return (
                  <button
                    key={d}
                    onClick={() => setRetroDecision(d)}
                    className="btn-sm"
                    style={{
                      background: active ? meta.bg : 'var(--field)',
                      color: active ? meta.color : 'var(--ink-muted)',
                      borderColor: active ? meta.color : 'var(--border)',
                    }}
                  >
                    {meta.text}
                  </button>
                );
              })}
            </div>
            <button
              className="btn btn-block"
              disabled={!canArchive}
              style={{
                marginTop: 14,
                background: canArchive ? 'var(--accent)' : 'var(--border)',
                color: canArchive ? 'white' : 'var(--ink-faint)',
                border: 'none',
              }}
              onClick={() =>
                retroDecision &&
                submitRetro(experiment.id, { worked: retroWorked, notWorked: retroNotWorked, decision: retroDecision })
              }
            >
              Archive experiment
            </button>
          </div>
        )}

        {experiment.column === 'archived' && experiment.retro && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Retro</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>What worked</div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>{experiment.retro.worked}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>What didn't</div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>{experiment.retro.notWorked}</div>
            <span
              className="badge"
              style={{
                background: DECISION_META[experiment.retro.decision].bg,
                color: DECISION_META[experiment.retro.decision].color,
              }}
            >
              {DECISION_META[experiment.retro.decision].text}
            </span>
          </div>
        )}

        {experiment.checkins.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>History</div>
            {[...experiment.checkins].reverse().map((ci) => (
              <div key={ci.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid oklch(93% 0.012 80)' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    marginTop: 5,
                    flexShrink: 0,
                    background: ci.value === 'skip' ? 'var(--amber)' : 'var(--accent)',
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {ci.value === 'done' ? 'Done' : ci.value === 'skip' ? 'Skipped' : `${ci.value}/5`} —{' '}
                    {new Date(ci.createdAt).toLocaleDateString()}
                  </div>
                  {ci.note && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{ci.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
