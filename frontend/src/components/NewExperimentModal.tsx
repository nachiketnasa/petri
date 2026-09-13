import { useState } from 'react';
import type { FormEvent } from 'react';
import { useExperiments } from '../context/ExperimentsContext';
import type { Cadence, CheckinType, DurationUnit } from '../api/types';
import { ApiError } from '../api/types';

export function NewExperimentModal({ onClose }: { onClose: () => void }) {
  const { createExperiment } = useExperiments();
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [cadence, setCadence] = useState<Cadence>('Daily');
  const [checkinType, setCheckinType] = useState<CheckinType>('done');
  const [durationValue, setDurationValue] = useState(4);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('weeks');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await createExperiment({ title, hypothesis, cadence, checkinType, durationValue, durationUnit });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create experiment.');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, marginBottom: 18 }}>
          New experiment
        </div>

        <label className="field-label">Title</label>
        <input
          className="field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Cold showers every morning"
        />

        <label className="field-label" style={{ marginTop: 14 }}>
          Hypothesis
        </label>
        <textarea
          className="field"
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          placeholder="If I ... then ... because ..."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div>
            <label className="field-label">Cadence</label>
            <select className="field" value={cadence} onChange={(e) => setCadence(e.target.value as Cadence)}>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="field-label">Check-in type</label>
            <select
              className="field"
              value={checkinType}
              onChange={(e) => setCheckinType(e.target.value as CheckinType)}
            >
              <option value="done">Done / Skip</option>
              <option value="rating">1–5 rating</option>
            </select>
          </div>
        </div>

        <label className="field-label" style={{ marginTop: 14 }}>
          Target duration
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="field"
            type="number"
            min={1}
            value={durationValue}
            onChange={(e) => setDurationValue(Number(e.target.value))}
            style={{ width: 90 }}
          />
          <select
            className="field"
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
            style={{ flex: 1 }}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
          </select>
        </div>

        {error && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red-dark)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
            Add to Backlog
          </button>
        </div>
      </form>
    </div>
  );
}
