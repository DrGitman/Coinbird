'use client';
import { useMemo, useState, useEffect } from 'react';
import { api, formatDate } from '../../lib/api';
import * as Icons from 'lucide-react';

export default function MilestonesSection() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    api.getMilestones()
      .then(setMilestones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featuredMilestones = useMemo(() => {
    const active = milestones.filter((m) => m.earned_at || m.progress > 0);
    if (active.length === 0) return [];
    const earned = active
      .filter((m) => m.earned_at)
      .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at));
    const inProgress = active
      .filter((m) => !m.earned_at)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));
    return [...earned.slice(0, 2), ...inProgress.slice(0, 1)].slice(0, 3);
  }, [milestones]);

  const allMilestones = useMemo(() => milestones.slice().sort((a, b) => {
    if (a.earned_at && !b.earned_at) return -1;
    if (!a.earned_at && b.earned_at) return 1;
    if (a.earned_at && b.earned_at) return new Date(b.earned_at) - new Date(a.earned_at);
    return (b.progress || 0) - (a.progress || 0);
  }), [milestones]);

  if (loading) return null;

  const emptyState = milestones.filter((m) => m.earned_at || m.progress > 0).length === 0;
  const earnedCount = allMilestones.filter((m) => m.earned_at).length;

  return (
    <>
      <div style={{ marginTop: 40 }}>
        {/* Section wrapper — light mint tint, large radius matching design */}
        <div style={{
          background: '#f5fbef',
          borderRadius: 24,
          padding: '28px 24px 24px',
          border: '1px solid rgba(65,102,61,0.09)',
        }}>
          {/* Header row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 22,
          }}>
            <h2 style={{
              fontFamily: 'DM Serif Display, serif',
              fontWeight: 700,
              fontSize: 22,
              color: '#16311f',
              margin: 0,
            }}>
              Recent Milestones
            </h2>
            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3d6b35',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.01em',
              }}
            >
              View All Badges
            </button>
          </div>

          {/* Cards grid */}
          {emptyState ? (
            <div style={{
              background: '#fff',
              borderRadius: 20,
              border: '1px solid rgba(65,102,61,0.09)',
              padding: '52px 40px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#edf8e4', color: '#41663d',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Icons.Target size={24} />
              </div>
              <p style={{ fontWeight: 700, color: '#16311f', marginBottom: 6 }}>No milestones yet</p>
              <p style={{ fontSize: 13, color: '#667085' }}>
                Start tracking expenses and budgets to unlock your first badge.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}>
              {featuredMilestones.map((milestone) => (
                <MilestoneCard key={milestone.badge_key} milestone={milestone} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Badges Modal */}
      {showAllModal && (
        <AllBadgesModal
          milestones={allMilestones}
          earnedCount={earnedCount}
          onClose={() => setShowAllModal(false)}
        />
      )}
    </>
  );
}

/* ─── Single milestone card ─────────────────────────────────────────────── */
function MilestoneCard({ milestone, compact = false }) {
  const Icon = Icons[milestone.icon] || Icons.Award;
  const isCompleted = Boolean(milestone.earned_at);

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      padding: compact ? '20px 18px 18px' : '24px 20px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      border: '1px solid rgba(65,102,61,0.09)',
      boxShadow: '0 4px 16px rgba(22,49,31,0.05)',
      transition: 'box-shadow 0.2s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(22,49,31,0.10)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,49,31,0.05)'}
    >
      {/* Icon circle */}
      <div style={{
        width: compact ? 60 : 76,
        height: compact ? 60 : 76,
        borderRadius: '50%',
        background: '#edf8e4',
        color: '#41663d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        flexShrink: 0,
      }}>
        <Icon size={compact ? 26 : 32} strokeWidth={1.6} />
      </div>

      {/* Title */}
      <h3 style={{
        fontWeight: 700,
        fontSize: compact ? 14 : 15,
        color: '#16311f',
        marginBottom: 8,
        lineHeight: 1.35,
      }}>
        {milestone.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 13,
        color: '#667085',
        lineHeight: 1.55,
        marginBottom: 20,
        flex: 1,
      }}>
        {milestone.description}
      </p>

      {/* Footer: status + date OR progress bar */}
      <div style={{ width: '100%', marginTop: 'auto' }}>
        {isCompleted ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 14,
            borderTop: '1px solid #eef5e8',
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#516f41',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}>
              {milestone.progress === 100 ? 'Achieved' : 'Completed'}
            </span>
            <span style={{ fontSize: 11, color: '#8a9f7f' }}>
              {formatDate(milestone.earned_at)}
            </span>
          </div>
        ) : (
          <div style={{ paddingTop: 14, borderTop: '1px solid #eef5e8' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#516f41',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}>
                Progress
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16311f' }}>
                {milestone.progress ?? 0}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: '#e3f0db',
              borderRadius: 999,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${milestone.progress ?? 0}%`,
                height: '100%',
                background: '#3d6b35',
                borderRadius: 999,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── All Badges Modal ───────────────────────────────────────────────────── */
function AllBadgesModal({ milestones, earnedCount, onClose }) {
  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,17,10,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 28,
        width: '100%',
        maxWidth: 780,
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(10,17,10,0.22)',
        animation: 'scaleIn 0.22s ease',
        border: '1px solid var(--border)',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '26px 32px 22px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontSize: 10, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
            }}>
              Progress Ledger
            </p>
            <h2 style={{
              fontFamily: 'DM Serif Display, serif',
              fontSize: 26,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              All Badges
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              background: 'var(--accent-light)',
              padding: '6px 14px',
              borderRadius: 99,
              fontWeight: 600,
            }}>
              {earnedCount} / {milestones.length} earned
            </span>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '24px 32px 32px', flex: 1 }}>
          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🏅</p>
              <p>No badges to show yet. Keep growing!</p>
            </div>
          ) : (
            <>
              {/* Earned section */}
              {milestones.filter(m => m.earned_at).length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 16,
                  }}>
                    ✦ Earned
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 14,
                  }}>
                    {milestones.filter(m => m.earned_at).map(m => (
                      <MilestoneCard key={m.badge_key} milestone={m} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* In-progress section */}
              {milestones.filter(m => !m.earned_at && (m.progress || 0) > 0).length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 16,
                  }}>
                    ◎ In Progress
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 14,
                  }}>
                    {milestones.filter(m => !m.earned_at && (m.progress || 0) > 0).map(m => (
                      <MilestoneCard key={m.badge_key} milestone={m} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Locked section */}
              {milestones.filter(m => !m.earned_at && !(m.progress > 0)).length > 0 && (
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: 16,
                  }}>
                    ○ Locked
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 14,
                  }}>
                    {milestones.filter(m => !m.earned_at && !(m.progress > 0)).map(m => (
                      <LockedCard key={m.badge_key} milestone={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Locked (not started) badge card ───────────────────────────────────── */
function LockedCard({ milestone }) {
  const Icon = Icons[milestone.icon] || Icons.Award;
  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: 20,
      padding: '20px 18px 18px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      border: '1px solid var(--border)',
      opacity: 0.55,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'var(--border)',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon size={24} strokeWidth={1.4} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
        {milestone.title}
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {milestone.description}
      </p>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', width: '100%' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🔒 Locked
        </span>
      </div>
    </div>
  );
}
