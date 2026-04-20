'use client';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Sprout, X, TrendingUp, TrendingDown, Check } from 'lucide-react';

export default function TransactionModal({ onClose, onSave, editData }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    description: '',
    merchant: '',
    payment_method: '',
    date: today,
    ...editData,
    amount: editData?.amount ? String(editData.amount) : '',
    category_id: editData?.category_id ? String(editData.category_id) : '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filteredCats = categories.filter(c => {
    if (form.type === 'income') return c.icon === 'briefcase' || c.name.toLowerCase().includes('income');
    return c.icon !== 'briefcase';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || isNaN(parseFloat(form.amount))) return setError('Enter a valid amount');
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        category_id: form.category_id ? parseInt(form.category_id) : null,
      };
      if (editData?.id) {
        await api.updateTransaction(editData.id, payload);
      } else {
        await api.createTransaction(payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' };
  const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--text-primary)' }}>
            {editData ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--bg-primary)', borderRadius: 12, padding: 4 }}>
          {['expense', 'income'].map(t => (
            <button key={t} onClick={() => set('type', t)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                background: form.type === t ? (t === 'expense' ? 'var(--danger)' : 'var(--accent)') : 'transparent',
                color: form.type === t ? 'white' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
              {t === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Amount *</label>
              <input className="input" type="number" step="0.01" min="0.01" placeholder="0.00"
                value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Date *</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select className="input" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Select Category —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Merchant / Description</label>
            <input className="input" type="text" placeholder="e.g. Whole Foods Market"
              value={form.merchant} onChange={e => set('merchant', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <input className="input" type="text" placeholder="Optional note"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Payment Method</label>
            <select className="input" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
              <option value="">— Select —</option>
              {['Cash', 'Visa', 'Mastercard', 'Amex', 'Direct Deposit', 'Bank Transfer', 'PayPal', 'Other'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', gap: 6 }} disabled={loading}>
              {loading ? <Sprout size={16} className="animate-pulse" /> : editData ? <Check size={16} /> : null}
              {loading ? 'Saving…' : editData ? 'Update' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

