'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '../../components/layout/AppShell';
import TransactionModal from '../../components/ui/TransactionModal';
import { api, formatCurrency, formatDate, getCategoryEmoji } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export default function TransactionsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ type: '', category_id: '' });
  const [summary, setSummary] = useState(null);
  const cur = user?.currency || 'USD';

  const now = new Date();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      const [t, s] = await Promise.all([
        api.getTransactions({ ...params, limit: 100 }),
        api.getTransactionSummary({ month: now.getMonth() + 1, year: now.getFullYear() }),
      ]);
      setTransactions(t.transactions || []);
      setTotal(t.total || 0);
      setSummary(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); api.getCategories().then(setCategories); }, [load]);

  // Auto-open add modal from query param
  useEffect(() => {
    if (searchParams.get('add') === '1') setShowModal(true);
  }, [searchParams]);

  const handleDelete = async (id) => {
    try {
      await api.deleteTransaction(id);
      setDeleteId(null);
      load();
    } catch (e) { alert(e.message); }
  };

  const groupByDate = () => {
    const groups = {};
    transactions.forEach(t => {
      const key = formatDate(t.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  };

  const groups = groupByDate();

  return (
    <AppShell title="Transactions">
      {(showModal || editItem) && (
        <TransactionModal
          editData={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={() => { setShowModal(false); setEditItem(null); load(); }}
        />
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 360 }}>
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, marginBottom: 12 }}>Remove Entry?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Monthly Outflow', val: summary?.total_expenses, color: 'var(--expense-color)' },
          { label: 'Monthly Inflow', val: summary?.total_income, color: 'var(--income-color)' },
          { label: 'Net Balance', val: (summary?.total_income || 0) - (summary?.total_expenses || 0), color: 'var(--text-primary)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ flex: 1, minWidth: 140 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: s.color }}>{formatCurrency(parseFloat(s.val || 0), cur)}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-primary)', flex: 1 }}>
          All Movements
        </h2>
        <select className="input" style={{ width: 'auto', minWidth: 130 }}
          value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">All Types</option>
          <option value="expense">Expenses</option>
          <option value="income">Income</option>
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 150 }}
          value={filters.category_id} onChange={e => setFilters(p => ({ ...p, category_id: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Entry</button>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>🌱 Loading…</div>
      ) : transactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🌱</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No transactions found. Start tracking your spending!</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add First Entry</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                {date}
              </p>
              <div className="card" style={{ overflow: 'hidden' }}>
                {items.map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px',
                    borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div className="cat-icon">
                      <span style={{ fontSize: 18 }}>{getCategoryEmoji(t.category_icon)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                        {t.merchant || t.description || 'Transaction'}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t.type === 'expense' ? 'Expense' : 'Income'} • {t.category_name || 'Uncategorized'}
                        {t.payment_method ? ` • ${t.payment_method}` : ''}
                      </p>
                    </div>
                    <span className={t.type === 'income' ? 'amount-income' : 'amount-expense'} style={{ fontSize: 15 }}>
                      {t.type === 'income' ? '+' : '–'}{formatCurrency(t.amount, cur)}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditItem(t)}
                        style={{ background: 'var(--accent-light)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: 'var(--accent)' }}>
                        Edit
                      </button>
                      <button onClick={() => setDeleteId(t.id)}
                        style={{ background: 'var(--danger-light)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

