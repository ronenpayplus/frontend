import { useCallback, useEffect, useState } from 'react';
import { createCurrency, deleteCurrency, listCurrencies, updateCurrency } from '../api/currencies';
import type { CreateCurrencyRequest, Currency, UpdateCurrencyRequest } from '../types/currency';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type CurrencyFormState = {
  alpha3: string;
  numeric_code: string;
  name: string;
  symbol: string;
  decimals: number;
  minor_unit: number;
  country_alpha2: string;
  is_active: boolean;
  is_crypto: boolean;
};

const defaultForm: CurrencyFormState = {
  alpha3: '',
  numeric_code: '',
  name: '',
  symbol: '',
  decimals: 2,
  minor_unit: 100,
  country_alpha2: '',
  is_active: true,
  is_crypto: false,
};

export default function CurrenciesPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [items, setItems] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [isCryptoFilter, setIsCryptoFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Currency | null>(null);
  const [form, setForm] = useState<CurrencyFormState>(defaultForm);

  const fetchCurrencies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCurrencies({
        search: search || undefined,
        is_active: isActiveFilter || undefined,
        is_crypto: isCryptoFilter || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(data.currencies || []);
    } catch (error) {
      console.error(error);
      addToast('טעינת מטבעות נכשלה', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, isActiveFilter, isCryptoFilter, addToast]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const resetForm = () => setForm(defaultForm);

  const autoFillForm = () => {
    const sample = [
      { alpha3: 'EUR', numeric_code: '978', name: 'Euro', symbol: 'EUR', decimals: 2, minor_unit: 100, country_alpha2: 'FR' },
      { alpha3: 'GBP', numeric_code: '826', name: 'Pound Sterling', symbol: 'GBP', decimals: 2, minor_unit: 100, country_alpha2: 'GB' },
      { alpha3: 'JPY', numeric_code: '392', name: 'Yen', symbol: 'JPY', decimals: 0, minor_unit: 1, country_alpha2: 'JP' },
    ];
    const pick = sample[Math.floor(Math.random() * sample.length)];
    setForm({
      ...pick,
      is_active: true,
      is_crypto: false,
    });
  };

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setShowCreate(true);
  };

  const startEdit = (currency: Currency) => {
    setShowCreate(false);
    setEditing(currency);
    setForm({
      alpha3: currency.alpha3 || '',
      numeric_code: currency.numeric_code || '',
      name: currency.name || '',
      symbol: currency.symbol || '',
      decimals: currency.decimals ?? 2,
      minor_unit: currency.minor_unit ?? 100,
      country_alpha2: currency.country_alpha2 || '',
      is_active: currency.is_active,
      is_crypto: currency.is_crypto,
    });
  };

  const buildPayload = (): CreateCurrencyRequest | UpdateCurrencyRequest => ({
    alpha3: form.alpha3.trim().toUpperCase(),
    numeric_code: form.numeric_code.trim(),
    name: form.name.trim(),
    symbol: form.symbol.trim() || undefined,
    decimals: Number(form.decimals),
    minor_unit: Number(form.minor_unit),
    country_alpha2: form.country_alpha2.trim().toUpperCase() || undefined,
    is_active: form.is_active,
    is_crypto: form.is_crypto,
  });

  const save = async () => {
    if (!form.alpha3 || !form.numeric_code || !form.name) {
      addToast('יש למלא Alpha3, Numeric Code ושם', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updateCurrency(editing.id, payload);
        addToast('המטבע עודכן', 'success');
        setEditing(null);
      } else {
        await createCurrency(payload);
        addToast('המטבע נוצר', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchCurrencies();
    } catch (error) {
      console.error(error);
      addToast('שמירת מטבע נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteCurrency(deleteTarget.id);
      addToast('המטבע נמחק', 'success');
      setDeleteTarget(null);
      await fetchCurrencies();
    } catch (error) {
      console.error(error);
      addToast('מחיקת מטבע נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">מטבעות</h1>
          <p className="page-subtitle">טבלת עזר - Currencies</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showCreate ? setShowCreate(false) : startCreate())}>
          {showCreate ? 'סגור טופס' : 'מטבע חדש'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillForm}>
              מילוי מהיר
            </button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת מטבע' : 'יצירת מטבע'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Alpha3 *</label><input className="input ltr-input" dir="ltr" maxLength={3} value={form.alpha3} onChange={(e) => setForm((p) => ({ ...p, alpha3: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Numeric Code *</label><input className="input ltr-input" dir="ltr" maxLength={3} value={form.numeric_code} onChange={(e) => setForm((p) => ({ ...p, numeric_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">שם *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">סימול</label><input className="input ltr-input" dir="ltr" value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Decimals</label><input type="number" className="input ltr-input" dir="ltr" value={form.decimals} onChange={(e) => setForm((p) => ({ ...p, decimals: Number(e.target.value) }))} /></div>
            <div className="form-field"><label className="label">Minor Unit</label><input type="number" className="input ltr-input" dir="ltr" value={form.minor_unit} onChange={(e) => setForm((p) => ({ ...p, minor_unit: Number(e.target.value) }))} /></div>
            <div className="form-field"><label className="label">Country Alpha2</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.country_alpha2} onChange={(e) => setForm((p) => ({ ...p, country_alpha2: e.target.value }))} /></div>
            <div className="form-field"><label className="label">פעיל</label><select className="input" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}><option value="true">כן</option><option value="false">לא</option></select></div>
            <div className="form-field"><label className="label">Crypto</label><select className="input" value={form.is_crypto ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_crypto: e.target.value === 'true' }))}><option value="false">לא</option><option value="true">כן</option></select></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>ביטול</button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchCurrencies(); }}>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם / קוד" /></div>
          <div className="filter-group">
            <select className="input" value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)}>
              <option value="">פעיל (הכל)</option>
              <option value="true">כן</option>
              <option value="false">לא</option>
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={isCryptoFilter} onChange={(e) => setIsCryptoFilter(e.target.value)}>
              <option value="">Crypto (הכל)</option>
              <option value="true">כן</option>
              <option value="false">לא</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>טוען מטבעות...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>לא נמצאו מטבעות</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>Alpha3</th>
                  <th>Numeric</th>
                  <th>Symbol</th>
                  <th>Decimals</th>
                  <th>פעיל</th>
                  <th>Crypto</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((currency) => (
                  <tr key={currency.id}>
                    <td className="cell-name">{currency.name}</td>
                    <td className="cell-mono">{currency.alpha3}</td>
                    <td className="cell-mono">{currency.numeric_code}</td>
                    <td className="cell-mono">{currency.symbol || '-'}</td>
                    <td>{currency.decimals}</td>
                    <td>{currency.is_active ? 'כן' : 'לא'}</td>
                    <td>{currency.is_crypto ? 'כן' : 'לא'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(currency)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(currency)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="מחיקת מטבע"
        message={`למחוק את "${deleteTarget?.name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
