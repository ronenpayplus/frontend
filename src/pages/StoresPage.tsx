import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createStore, deleteStore, listStores, updateStore } from '../api/stores';
import { listMerchantAccounts } from '../api/merchantAccounts';
import type { MerchantAccount } from '../types/merchantAccount';
import type { CreateStoreRequest, Store, UpdateStoreRequest } from '../types/store';
import { STORE_CHANNEL_TYPES, STORE_STATUSES, STORE_TYPES } from '../types/store';
import { MOCK_TIMEZONES } from '../types/company';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function StoresPage() {
  const navigate = useNavigate();
  const { uuid: routeMerchantAccountUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedMerchantAccountUUID = routeMerchantAccountUUID || searchParams.get('merchant_account_uuid') || '';
  const [merchantAccounts, setMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [items, setItems] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [form, setForm] = useState({
    store_code: '',
    store_type: 'physical',
    name: '',
    timezone: 'Asia/Jerusalem',
    channel_type: 'POS',
    status: 'ACTIVE',
    phone: '',
    email: '',
  });

  useEffect(() => {
    listMerchantAccounts({ page: 1, page_size: 300 })
      .then((data) => setMerchantAccounts(data.merchant_accounts || []))
      .catch(() => setMerchantAccounts([]));
  }, []);

  useEffect(() => {
    if (routeMerchantAccountUUID || selectedMerchantAccountUUID || merchantAccounts.length === 0) return;
    const params = new URLSearchParams(searchParams);
    params.set('merchant_account_uuid', merchantAccounts[0].uuid);
    setSearchParams(params);
  }, [routeMerchantAccountUUID, selectedMerchantAccountUUID, merchantAccounts, searchParams, setSearchParams]);

  const fetchStores = useCallback(async () => {
    if (!selectedMerchantAccountUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listStores({
        merchant_account_uuid: selectedMerchantAccountUUID,
        search: search || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.stores || []);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת חנויות', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMerchantAccountUUID, search, addToast]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const selectedAccountName = useMemo(
    () => merchantAccounts.find((x) => x.uuid === selectedMerchantAccountUUID)?.name || '',
    [merchantAccounts, selectedMerchantAccountUUID],
  );

  const resetForm = () => setForm({
    store_code: '',
    store_type: 'physical',
    name: '',
    timezone: 'Asia/Jerusalem',
    channel_type: 'POS',
    status: 'ACTIVE',
    phone: '',
    email: '',
  });

  const startEdit = (s: Store) => {
    setEditing(s);
    setShowCreate(false);
    setForm({
      store_code: s.store_code,
      store_type: s.store_type,
      name: s.name,
      timezone: s.timezone,
      channel_type: s.channel_type,
      status: s.status,
      phone: s.phone || '',
      email: s.email || '',
    });
  };

  const autoFillStoreForm = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      store_code: `STORE-${rand}`,
      store_type: 'physical',
      name: `Store ${rand}`,
      timezone: 'Asia/Jerusalem',
      channel_type: 'POS',
      status: 'ACTIVE',
      phone: `+972-50-${rand}-000`,
      email: `store-${rand}@example.com`,
    });
  };

  const save = async () => {
    if (!selectedMerchantAccountUUID || !form.name || !form.store_code) {
      addToast('חובה לבחור חשבון סוחר ולמלא שדות חובה', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateStoreRequest = { ...form };
        await updateStore(editing.uuid, payload);
        addToast('חנות עודכנה', 'success');
        setEditing(null);
      } else {
        const payload: CreateStoreRequest = { ...form, merchant_account_uuid: selectedMerchantAccountUUID };
        await createStore(payload);
        addToast('חנות נוצרה', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchStores();
    } catch (error) {
      console.error(error);
      addToast('שמירת חנות נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStore(deleteTarget.uuid);
      setDeleteTarget(null);
      addToast('חנות נמחקה', 'success');
      await fetchStores();
    } catch {
      addToast('מחיקת חנות נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/merchant-accounts')}>חשבונות סוחר</button>
        <span className="breadcrumb-sep">/</span>
        <span>חנויות</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">חנויות</h1>
          <p className="page-subtitle">{selectedAccountName ? `חשבון נבחר: ${selectedAccountName}` : 'בחר חשבון סוחר'}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedMerchantAccountUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'סגור טופס' : 'חנות חדשה'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillStoreForm}>
              מילוי מהיר
            </button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת חנות' : 'יצירת חנות'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">שם *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Store Code *</label><input className="input ltr-input" dir="ltr" value={form.store_code} onChange={(e) => setForm((p) => ({ ...p, store_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">סוג חנות</label><select className="input" value={form.store_type} onChange={(e) => setForm((p) => ({ ...p, store_type: e.target.value }))}>{STORE_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Channel</label><select className="input" value={form.channel_type} onChange={(e) => setForm((p) => ({ ...p, channel_type: e.target.value }))}>{STORE_CHANNEL_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">סטטוס</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{STORE_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">אזור זמן</label><select className="input" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{MOCK_TIMEZONES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">טלפון</label><input className="input ltr-input" dir="ltr" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Email</label><input className="input ltr-input" dir="ltr" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>ביטול</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchStores(); }}>
          <div className="filter-group">
            <select className="input" value={selectedMerchantAccountUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_account_uuid', e.target.value); else params.delete('merchant_account_uuid');
              setSearchParams(params);
            }} disabled={!!routeMerchantAccountUUID}>
              <option value="">בחר חשבון סוחר</option>
              {merchantAccounts.map((a) => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש" /></div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>טוען חנויות...</span></div> : items.length === 0 ? <div className="empty-state"><p>לא נמצאו חנויות</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>שם</th><th>קוד</th><th>סוג</th><th>Channel</th><th>סטטוס</th><th>פעולות</th></tr></thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.uuid}>
                    <td className="cell-name">{s.name}</td>
                    <td className="cell-mono">{s.store_code}</td>
                    <td>{s.store_type}</td>
                    <td>{s.channel_type}</td>
                    <td>{s.status}</td>
                    <td className="cell-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/stores/${s.uuid}/terminal-groups?merchant_account_uuid=${selectedMerchantAccountUUID}`)}>קבוצות טרמינל</button>
                      <button className="action-btn edit" onClick={() => startEdit(s)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(s)}>🗑</button>
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
        title="מחיקת חנות"
        message={`למחוק את "${deleteTarget?.name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
