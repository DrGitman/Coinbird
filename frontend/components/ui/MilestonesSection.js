'use client';
import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  /* Show the 2 most recently earned + 1 highest-progress in-progress badge */
  const featuredMilestones = useMemo(() => {
    const earned = milestones
      .filter((m) => m.earned_at)
      .sort((a, b) => new Date(b.earned_at) - new Date(a.earned_at));
    const inProgress = milestones
      .filter((m) => !m.earned_at && (m.progress || 0) > 0)
      .sort((a, b) => (b.progress || 0) - (a.progress || 0));
    return [...earned.slice(0, 2), ...inProgress.slice(0, 1)].slice(0, 3);
  }, [milestones]);

  const allMilestones = useMemo(() =>
    milestones.slice().sort((a, b) => {
      if (a.earned_at && !b.earned_at) return -1;
      if (!a.earned_at && b.earned_at) return 1;
      if (a.earned_at && b.earned_at) return new Date(b.earned_at) - new Date(a.earned_at);
      return (b.progress || 0) - (a.progress || 0);
    }), [milestones]);

  if (loading) return null;

  const hasActivity = featuredMilestones.length > 0;
  const earnedCount = allMilestones.filter((m) => m.earned_at).length;

  return (
    <>
      <div style={{ marginTop: 32 }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* ── Header ────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 28px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}>
                <Icons.Trophy size={18} strokeWidth={1.8} />
              </div>
              <div>
                <h2 style={{
                  fontFamily: 'DM Serif Display, serif',
                  fontSize: 20,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.15,
                }}>
                  Achievements
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, margin: 0 }}>
                  {earnedCount} of {milestones.length} badges earned
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              style={{
                background: 'var(--accent-light)',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'filter 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
              View All <Icons.ChevronRight size={14} />
            </button>
          </div>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <div style={{ padding: '24px 28px' }}>
            {!hasActivity ? (
              /* Empty state */
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 62, height: 62, borderRadius: '50%',
                  background: 'var(--accent-light)', color: 'var(--accent)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Icons.Target size={26} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 6 }}>
                  No milestones yet
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
                  Start adding transactions and budgets to unlock your first badge.
                </p>
              </div>
            ) : (
              /* Featured cards */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}>
                {featuredMilestones.map((m) => (
                  <MilestoneCard key={m.badge_key} milestone={m} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
  const iconSize   = compact ? 24 : 30;
  const circleSize = compact ? 56 : 70;

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: 16,
        padding: compact ? '18px 16px 16px' : '22px 18px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        border: isCompleted ? '1.5px solid var(--accent)' : '1px solid var(--border)',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Checkmark badge for earned */}
      {isCompleted && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <Icons.Check size={11} strokeWidth={3} />
        </div>
      )}

      {/* Icon circle */}
      <div style={{
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        background: isCompleted ? 'var(--accent)' : 'var(--accent-light)',
        color: isCompleted ? 'white' : 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        flexShrink: 0,
        transition: 'background 0.2s',
      }}>
        <Icon size={iconSize} strokeWidth={1.6} />
      </div>

      {/* Title */}
      <h3 style={{
        fontWeight: 700,
        fontSize: compact ? 13 : 14,
        color: 'var(--text-primary)',
        marginBottom: 6,
        lineHeight: 1.35,
      }}>
        {milestone.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        lineHeight: 1.55,
        marginBottom: 16,
        flex: 1,
      }}>
        {milestone.description}
      </p>

      {/* Footer: earned date OR progress bar */}
      <div style={{ width: '100%', marginTop: 'auto' }}>
        {isCompleted ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <Icons.CalendarCheck size={13} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatDate(milestone.earned_at)}
            </span>
          </div>
        ) : (
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Progress
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                {milestone.progress ?? 0}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 5,
              background: 'var(--border)',
              borderRadius: 999,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${milestone.progress ?? 0}%`,
                height: '100%',
                background: 'var(--accent)',
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const earnedBadges     = milestones.filter(m => m.earned_at);
  const inProgressBadges = milestones.filter(m => !m.earned_at && (m.progress || 0) > 0);
  const lockedBadges     = milestones.filter(m => !m.earned_at && !((m.progress || 0) > 0));

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.52)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 24,
        width: '100%',
        maxWidth: 820,
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
        animation: 'scaleIn 0.22s ease',
        border: '1px solid var(--border)',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 28px',
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
              fontSize: 24,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              All Badges
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              fontSize: 13,
              color: 'var(--accent)',
              background: 'var(--accent-light)',
              padding: '6px 14px',
              borderRadius: 99,
              fontWeight: 700,
            }}>
              {earnedCount} / {milestones.length} earned
            </span>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Icons.X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '24px 28px 32px', flex: 1 }}>
          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>🏅</p>
              <p>No badges to show yet. Keep growing!</p>
            </div>
          ) : (
            <>
              {earnedBadges.length > 0 && (
                <BadgeGroup label="✦ Earned" badges={earnedBadges} />
              )}
              {inProgressBadges.length > 0 && (
                <BadgeGroup label="◎ In Progress" badges={inProgressBadges} />
              )}
              {lockedBadges.length > 0 && (
                <BadgeGroup label="○ Locked" badges={lockedBadges} locked />
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Badge group helper (used inside modal) ─────────────────────────────── */
function BadgeGroup({ label, badges, locked = false }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{
        fontSize: 11, fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 14,
      }}>
        {label}
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 12,
      }}>
        {badges.map(m =>
          locked
            ? <LockedCard key={m.badge_key} milestone={m} />
            : <MilestoneCard key={m.badge_key} milestone={m} compact />
        )}
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
      borderRadius: 16,
      padding: '18px 16px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      border: '1px solid var(--border)',
      opacity: 0.5,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--border)',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <Icon size={22} strokeWidth={1.4} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>
        {milestone.title}
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {milestone.description}
      </p>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', width: '100%' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🔒 Locked
        </span>
      </div>
    </div>
  );
}
