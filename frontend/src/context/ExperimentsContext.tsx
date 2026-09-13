import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../api/client';
import { useAuth } from './AuthContext';
import type { Column, Experiment, NewExperimentInput, Retro } from '../api/types';

interface ExperimentsContextValue {
  experiments: Experiment[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  createExperiment: (input: NewExperimentInput) => Promise<Experiment>;
  moveExperiment: (id: string, column: Column) => Promise<void>;
  logCheckin: (id: string, value: string, note: string) => Promise<void>;
  submitRetro: (id: string, retro: Retro) => Promise<void>;
  toggleShare: (id: string) => Promise<void>;
  updateExperiment: (id: string, patch: { title?: string; hypothesis?: string }) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
}

const ExperimentsContext = createContext<ExperimentsContextValue | null>(null);

export function ExperimentsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No signed-in user (still restoring the session, or logged out): there's
    // nothing to fetch — GET /experiments requires auth.
    if (!user) {
      setExperiments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.listExperiments().then((exps) => {
      setExperiments(exps);
      setLoading(false);
    });
  }, [user]);

  const upsert = useCallback((exp: Experiment) => {
    setExperiments((prev) => prev.map((e) => (e.id === exp.id ? exp : e)));
  }, []);

  const runOrFlagError = useCallback(async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }, []);

  const createExperimentFn = useCallback(async (input: NewExperimentInput) => {
    const exp = await api.createExperiment(input);
    setExperiments((prev) => [...prev, exp]);
    return exp;
  }, []);

  const moveExperimentFn = useCallback(
    (id: string, column: Column) => runOrFlagError(async () => upsert(await api.moveExperiment(id, column))),
    [runOrFlagError, upsert],
  );

  const logCheckinFn = useCallback(
    (id: string, value: string, note: string) =>
      runOrFlagError(async () => upsert(await api.logCheckin(id, value, note))),
    [runOrFlagError, upsert],
  );

  const submitRetroFn = useCallback(
    (id: string, retro: Retro) => runOrFlagError(async () => upsert(await api.submitRetro(id, retro))),
    [runOrFlagError, upsert],
  );

  const toggleShareFn = useCallback(
    (id: string) => runOrFlagError(async () => upsert(await api.toggleShare(id))),
    [runOrFlagError, upsert],
  );

  const updateExperimentFn = useCallback(
    (id: string, patch: { title?: string; hypothesis?: string }) =>
      runOrFlagError(async () => upsert(await api.updateExperiment(id, patch))),
    [runOrFlagError, upsert],
  );

  const deleteExperimentFn = useCallback(
    (id: string) =>
      runOrFlagError(async () => {
        await api.deleteExperiment(id);
        setExperiments((prev) => prev.filter((e) => e.id !== id));
      }),
    [runOrFlagError],
  );

  const value = useMemo(
    () => ({
      experiments,
      loading,
      error,
      clearError: () => setError(null),
      createExperiment: createExperimentFn,
      moveExperiment: moveExperimentFn,
      logCheckin: logCheckinFn,
      submitRetro: submitRetroFn,
      toggleShare: toggleShareFn,
      updateExperiment: updateExperimentFn,
      deleteExperiment: deleteExperimentFn,
    }),
    [
      experiments,
      loading,
      error,
      createExperimentFn,
      moveExperimentFn,
      logCheckinFn,
      submitRetroFn,
      toggleShareFn,
      updateExperimentFn,
      deleteExperimentFn,
    ],
  );

  return <ExperimentsContext.Provider value={value}>{children}</ExperimentsContext.Provider>;
}

export function useExperiments(): ExperimentsContextValue {
  const ctx = useContext(ExperimentsContext);
  if (!ctx) throw new Error('useExperiments must be used within ExperimentsProvider');
  return ctx;
}
