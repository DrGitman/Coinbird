'use client';
import { useState, useEffect } from 'react';
import { api, formatDate } from '../../lib/api';
import * as Icons from 'lucide-react';

export default function MilestonesSection() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMilestones()
      .then(setMilestones)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
         <h2 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 24, color: '#1a2e1a' }}>Recent Milestones</h2>
         <button style={{ background: 'none', border: 'none', color: '#3d5a3d', fontWeight: 600, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
           View All Badges
         </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {milestones.filter(m => m.earned_at || m.progress > 0).length > 0 ? (
          milestones.filter(m => m.earned_at || m.progress > 0).slice(0, 3).map((m) => (
            <MilestoneCard key={m.badge_key} milestone={m} />
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            background: 'rgba(0,0,0,0.01)',
            border: '2px dashed var(--border)',
            borderRadius: 24,
            padding: '60px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Icons.Target size={20} />
            </div>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No Milestones Yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start tracking your expenses to earn your first financial badges!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }) {
  const Icon = Icons[milestone.icon] || Icons.Award;
  const isCompleted = !!milestone.earned_at;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 24,
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      border: '1px solid #f0f4f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: '#f0fcf0', color: '#166534',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20
      }}>
        <Icon size={32} />
      </div>

      <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, color: '#1a2e1a', marginBottom: 8 }}>
        {milestone.title}
      </h3>
      
      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 24, minHeight: 40 }}>
        {milestone.description}
      </p>

      <div style={{ width: '100%', marginTop: 'auto' }}>
        {isCompleted ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(milestone.earned_at)}</span>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2e1a' }}>{milestone.progress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${milestone.progress}%`, height: '100%', background: '#166534', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
