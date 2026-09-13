import { useMemo } from 'react';
import { AppNav } from '../components/AppNav';
import { useAuth } from '../context/AuthContext';
import { useExperiments } from '../context/ExperimentsContext';
import { getDueStatus } from '../api/client';

export function DashboardPage() {
  const { user } = useAuth();
  const { experiments, logCheckin } = useExperiments();

  const stats = useMemo(() => {
    const active = experiments.filter((e) => e.column === 'active');
    const weekAgo = Date.now() - 7 * 86_400_000;
    const checkinsThisWeek = experiments
      .flatMap((e) => e.checkins)
      .filter((c) => new Date(c.createdAt).getTime() >= weekAgo).length;
    const longestStreak = active.reduce((max, e) => Math.max(max, e.checkins.length), 0);
    const completed = experiments.filter((e) => e.column === 'archived').length;
    return { activeCount: active.length, checkinsThisWeek, longestStreak, completed };
  }, [experiments]);

  const dueToday = useMemo(
    () => experiments.filter((e) => e.column === 'active' && getDueStatus(e) !== null),
    [experiments],
  );

  const recentActivity = useMemo(() => {
    return experiments
      .flatMap((e) => e.checkins.map((c) => ({ experiment: e, checkin: c })))
      .sort((a, b) => new Date(b.checkin.createdAt).getTime() - new Date(a.checkin.createdAt).getTime())
      .slice(0, 6);
  }, [experiments]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <AppNav />
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 32px 60px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500 }}>
          Good to see you, {user?.name}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 4 }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, marginTop: 26 }}>
          <StatCard value={stats.activeCount} label="Active experiments" />
          <StatCard value={stats.checkinsThisWeek} label="Check-ins this week" />
          <StatCard value={`${stats.longestStreak}`} label="Longest current streak" accent />
          <StatCard value={stats.completed} label="Experiments completed" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, marginTop: 32, alignItems: 'start' }}>
          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 14 }}>Due today</div>
            {dueToday.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Nothing due right now — nice.</div>
            )}
            {dueToday.map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid oklch(93% 0.012 80)',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{exp.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {exp.cadence} · {getDueStatus(exp) === 'overdue' ? 'overdue' : 'due today'}
                  </div>
                </div>
                <button
                  className="btn-sm"
                  style={{ color: 'var(--accent-dark)', borderColor: 'var(--accent)' }}
                  onClick={() => logCheckin(exp.id, exp.checkinType === 'rating' ? '3' : 'done', '')}
                >
                  Quick log
                </button>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 14 }}>Recent activity</div>
            {recentActivity.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No check-ins logged yet.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {recentActivity.map(({ experiment, checkin }) => (
                <div key={checkin.id} style={{ display: 'flex', gap: 10 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      marginTop: 6,
                      flexShrink: 0,
                      background: checkin.value === 'skip' ? 'var(--amber)' : 'var(--accent)',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{experiment.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                      {checkin.value === 'done' ? 'Done' : checkin.value === 'skip' ? 'Skipped' : `Rated ${checkin.value}/5`} ·{' '}
                      {new Date(checkin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="card">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: accent ? 'var(--accent-dark)' : 'var(--ink)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>{label}</div>
    </div>
  );
}
