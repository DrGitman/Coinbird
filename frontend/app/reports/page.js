'use client';
import { Sprout, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { api, formatCurrency } from '../../lib/api';
import CategoryIcon from '../../components/ui/CategoryIcon';
import { useAuth } from '../../lib/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#22c55e','#16a34a','#15803d','#166534','#4ade80','#86efac','#bbf7d0','#dcfce7'];

export default function ReportsPage() {
  const { user } = useAuth();
  const cur = user?.currency || 'USD';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTransactionSummary({ month, year })
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year]);

  const income = parseFloat(summary?.total_income || 0);
  const expenses = parseFloat(summary?.total_expenses || 0);
  const cats = (summary?.by_category || []).filter(c => parseFloat(c.total) > 0);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const barData = [
    { name: 'Income', amount: income, fill: '#22c55e' },
    { name: 'Expenses', amount: expenses, fill: '#dc2626' },
    { name: 'Net', amount: income - expenses, fill: income >= expenses ? '#22c55e' : '#dc2626' },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{payload[0].name || payload[0].payload.name}</p>
        <p style={{ color: 'var(--accent)' }}>{formatCurrency(payload[0].value, cur)}</p>
      </div>
    );
  };

  return (
    <AppShell title="Reports">
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, flex: 1 }}>Financial Reports</h2>
        <select className="input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>
          {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><Sprout size={24}/> Growing your reports…</div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Expenditure', value: expenses, color: 'var(--expense-color)' },
              { label: 'Total Income', value: income, color: 'var(--income-color)' },
              { label: 'Net Savings', value: income - expenses, color: income >= expenses ? 'var(--income-color)' : 'var(--danger)' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: s.color }}>{formatCurrency(s.value, cur)}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Income vs Expenses bar chart */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, marginBottom: 20 }}>Income vs Expenses</h3>
              {income === 0 && expenses === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><BarChart2 size={28}/></p>
                  <p>No data for this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-light)' }} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Spending by category pie */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, marginBottom: 20 }}>Spending Habitat</h3>
              {cats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><PieChartIcon size={28}/></p>
                  <p>No expense data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={cats} dataKey="total" nameKey="name" cx="50%" cy="50%"
                      innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v, cur)} contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          {cats.length > 0 && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, marginBottom: 20 }}>Category Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cats.map((c, i) => {
                  const pct = expenses > 0 ? (parseFloat(c.total) / expenses) * 100 : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 32, display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}><CategoryIcon name={c.icon} size={22} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name || 'Other'}</span>
                          <span style={{ fontSize: 13, color: 'var(--expense-color)', fontWeight: 600 }}>{formatCurrency(c.total, cur)}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

