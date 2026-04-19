'use client';
import { Sprout } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api, formatCurrency, formatDate, getCategoryEmoji } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import TransactionModal from '../../components/ui/TransactionModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const load = async () => {
    setLoading(true);
    try {
      const [s, t, b] = await Promise.all([
        api.getTransactionSummary({ month, year }),
        api.getTransactions({ month, year, limit: 5 }),
        api.getBudgets({ month, year }),
      ]);
      setSummary(s);
      setTransactions(t.transactions || []);
      setBudgets(b || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const income = parseFloat(summary?.total_income || 0);
  const expenses = parseFloat(summary?.total_expenses || 0);
  const balance = parseFloat(summary?.balance || 0);
  const cur = user?.currency || 'USD';

  const statCard = (label, value, sub, color) => (
    <div className="stat-card" style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, color: color || 'var(--text-primary)', lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );

  return (
    <AppShell title="Overview">
      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}

      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Period</p>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--text-primary)' }}>{monthName}</h2>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Transaction
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><Sprout size={24}/> Loading your ledger…</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCard('Total Balance', formatCurrency(balance, cur), 'All-time net worth')}
            {statCard('Monthly Income', formatCurrency(income, cur), `${month}/${year}`, 'var(--income-color)')}
            {statCard('Monthly Expenses', formatCurrency(expenses, cur), `${month}/${year}`, 'var(--expense-color)')}
            {statCard('Net Flow', formatCurrency(income - expenses, cur), income - expenses >= 0 ? '↑ Positive' : '↓ Negative',
              income - expenses >= 0 ? 'var(--income-color)' : 'var(--expense-color)')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Recent transactions */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)' }}>Recent Ledger Entries</h3>
                <a href="/transactions" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>See All History →</a>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Sprout size={32}/></p>
                  <p>No transactions yet. Start planting some entries!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {transactions.map(t => (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '12px 14px', borderRadius: 12,
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <div className="cat-icon" style={{ width: 40, height: 40 }}>
                        <span style={{ fontSize: 18 }}>{getCategoryEmoji(t.category_icon)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.merchant || t.description || 'Transaction'}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {t.category_name || 'Uncategorized'} • {formatDate(t.date)}
                        </p>
                      </div>
                      <span className={t.type === 'income' ? 'amount-income' : 'amount-expense'}>
                        {t.type === 'income' ? '+' : '–'}{formatCurrency(t.amount, cur)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active budgets */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)' }}>Active Budgets</h3>
                <a href="/budget" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Adjust →</a>
              </div>

              {budgets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>🪴</p>
                  <p>No budgets set yet.</p>
                  <a href="/budget" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Set a budget →</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {budgets.slice(0, 4).map(b => {
                    const pct = Math.min((b.spent / b.monthly_limit) * 100, 100);
                    const over = parseFloat(b.spent) > parseFloat(b.monthly_limit);
                    return (
                      <div key={b.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{b.category_name}</span>
                          <span style={{ fontSize: 13, color: over ? 'var(--danger)' : 'var(--text-muted)', fontWeight: over ? 700 : 400 }}>
                            {formatCurrency(b.spent, cur)} / {formatCurrency(b.monthly_limit, cur)}
                          </span>
                        </div>
                        <div className="progress-track">
                          <div className={`progress-fill ${over ? 'over' : ''}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Spending by category */}
          {summary?.by_category?.length > 0 && (
            <div className="card" style={{ padding: 24, marginTop: 20 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>
                Financial Habitats — Top Spending
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {summary.by_category.slice(0, 6).map(cat => (
                  <div key={cat.name} style={{
                    flex: '1 1 140px', padding: '14px 16px', borderRadius: 12,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{getCategoryEmoji(cat.icon)}</div>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{cat.name || 'Other'}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--expense-color)', marginTop: 2 }}>{formatCurrency(cat.total, cur)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

