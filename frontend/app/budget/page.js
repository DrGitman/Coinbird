'use client';
import { useState, useEffect, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api, formatCurrency } from '../../lib/api';
import CategoryIcon from '../../components/ui/CategoryIcon';
import { useAuth } from '../../lib/AuthContext';
import { Sprout, LayoutGrid, X } from 'lucide-react';

export default function BudgetPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category_id: '', monthly_limit: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([api.getBudgets({ month, year }), api.getCategories()]);
      setBudgets(b);
      setCategories(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category_id || !form.monthly_limit) return setError('Fill all fields');
    setSaving(true);
    try {
      await api.createBudget({
        category_id: parseInt(form.category_id),
        monthly_limit: parseFloat(form.monthly_limit),
        month, year,
      });
      setForm({ category_id: '', monthly_limit: '' });
      setShowAdd(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return;
    try { await api.deleteBudget(id); load(); } catch (e) { alert(e.message); }
  };

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.monthly_limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + parseFloat(b.spent), 0);
  const usedCats = new Set(budgets.map(b => b.category_id));
  const availableCats = categories.filter(c => !usedCats.has(c.id));

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <AppShell title="Budget">
      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Period</p>
        <select className="input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>
          {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Plant New Category</button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24, background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Total Monthly Budget</p>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: 'var(--text-primary)' }}>{formatCurrency(totalBudget, cur)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Spent So Far</p>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: 'var(--expense-color)' }}>{formatCurrency(totalSpent, cur)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Remaining</p>
              <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: totalBudget - totalSpent >= 0 ? 'var(--income-color)' : 'var(--danger)' }}>
                {formatCurrency(totalBudget - totalSpent, cur)}
              </p>
            </div>
            <div style={{ alignSelf: 'center', flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                You've cultivated {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of your monthly financial growth.
              </p>
              <div className="progress-track" style={{ height: 8 }}>
                <div className={`progress-fill ${totalSpent > totalBudget ? 'over' : ''}`}
                  style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add budget modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20 }}>Plant New Category</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</label>
                <select className="input" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))} required>
                  <option value="">— Select —</option>
                  {availableCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Limit ({cur})</label>
                <input className="input" type="number" min="1" step="0.01" placeholder="e.g. 500"
                  value={form.monthly_limit} onChange={e => setForm(p => ({ ...p, monthly_limit: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Planting…' : 'Plant Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Sprout size={32} className="animate-pulse" />
          <span>Growing your nurseries…</span>
        </div>
      ) : budgets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <LayoutGrid size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>No budget nurseries planted yet for this period.</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Plant First Budget</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {budgets.map(b => {
            const spent = parseFloat(b.spent);
            const limit = parseFloat(b.monthly_limit);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            const remaining = limit - spent;
            return (
              <div key={b.id} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="cat-icon" style={{ width: 48, height: 48, borderRadius: 14, color: 'var(--text-muted)' }}>
                    <CategoryIcon name={b.category_icon} size={24} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {over ? (
                      <>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Over Budget</p>
                        <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--danger)' }}>–{formatCurrency(Math.abs(remaining), cur)}</p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remaining</p>
                        <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--income-color)' }}>{formatCurrency(remaining, cur)}</p>
                      </>
                    )}
                  </div>
                </div>
                <h4 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)', marginBottom: 4 }}>{b.category_name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(spent, cur)} spent</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(limit, cur)} limit</span>
                </div>
                <div className="progress-track">
                  <div className={`progress-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
                </div>
                <button onClick={() => handleDelete(b.id)}
                  style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Remove budget
                </button>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

