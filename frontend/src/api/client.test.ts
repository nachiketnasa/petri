import { describe, expect, it } from 'vitest';
import {
  createExperiment,
  deleteAccount,
  getDueStatus,
  listExperiments,
  login,
  logCheckin,
  moveExperiment,
  submitRetro,
  updateProfile,
} from './client';

describe('mock backend business rules', () => {
  it('rejects moving a card to archived without a saved retro', async () => {
    const exp = await createExperiment({
      title: 'Test',
      hypothesis: 'H',
      cadence: 'Daily',
      checkinType: 'done',
      durationValue: 1,
      durationUnit: 'weeks',
    });
    await moveExperiment(exp.id, 'active');
    await expect(moveExperiment(exp.id, 'archived')).rejects.toThrow(/retro/i);
  });

  it('allows archiving once a retro is submitted', async () => {
    const exp = await createExperiment({
      title: 'Test 2',
      hypothesis: 'H',
      cadence: 'Daily',
      checkinType: 'done',
      durationValue: 1,
      durationUnit: 'weeks',
    });
    await moveExperiment(exp.id, 'active');
    await moveExperiment(exp.id, 'reflect');
    const archived = await submitRetro(exp.id, {
      worked: 'w',
      notWorked: 'n',
      decision: 'continue',
    });
    expect(archived.column).toBe('archived');
  });

  it('rejects logging a check-in on a non-active experiment', async () => {
    const exp = await createExperiment({
      title: 'Test 3',
      hypothesis: 'H',
      cadence: 'Daily',
      checkinType: 'done',
      durationValue: 1,
      durationUnit: 'weeks',
    });
    await expect(logCheckin(exp.id, 'done', '')).rejects.toThrow(/active/i);
  });

  it('flags an active experiment as overdue once the cadence has clearly lapsed', async () => {
    const experiments = await listExperiments();
    const overdueCandidate = experiments.find((e) => e.id === 'e4')!;
    expect(getDueStatus(overdueCandidate)).toBe('overdue');
  });

  it('rejects an empty display name on profile update', async () => {
    await login('a@example.com', 'x');
    await expect(updateProfile({ name: '  ' })).rejects.toThrow(/name/i);
  });

  it('clears the account and its experiments on delete', async () => {
    await login('b@example.com', 'x');
    await deleteAccount();
    await expect(listExperiments()).resolves.toEqual([]);
  });
});
