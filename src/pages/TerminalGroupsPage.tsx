import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createTerminalGroup, deleteTerminalGroup, listTerminalGroups, updateTerminalGroup } from '../api/terminalGroups';
import { listStores } from '../api/stores';
import type { Store } from '../types/store';
import type { CreateTerminalGroupRequest, TerminalGroup, UpdateTerminalGroupRequest } from '../types/terminalGroup';
import { TERMINAL_GROUP_STATUSES } from '../types/terminalGroup';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function TerminalGroupsPage() {
  const navigate = useNavigate();
  const { uuid: routeStoreUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedStoreUUID = routeStoreUUID || searchParams.get('store_uuid') || '';
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<TerminalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TerminalGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TerminalGroup | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [form, setForm] = useState({ name: '', description: '', status: 'ACTIVE' });

  useEffect(() => {
    listStores({ page: 1, page_size: 300 })
      .then((data) => setStores(data.stores || []))
      .catch(() => setStores([]));
  }, []);

  useEffect(() => {
    if (routeStoreUUID || selectedStoreUUID || stores.length === 0) return;
    const params = new URLSearchParams(searchParams);
    params.set('store_uuid', stores[0].uuid);
    setSearchParams(params);
  }, [routeStoreUUID, selectedStoreUUID, stores, searchParams, setSearchParams]);

  const fetchItems = useCallback(async () => {
    if (!selectedStoreUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listTerminalGroups({
        store_uuid: selectedStoreUUID,
        search: search || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.terminal_groups || []);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת קבוצות טרמינל', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreUUID, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedStoreName = useMemo(
    () => stores.find((x) => x.uuid === selectedStoreUUID)?.name || '',
    [stores, selectedStoreUUID],
  );

  const resetForm = () => setForm({ name: '', description: '', status: 'ACTIVE' });

  const autoFillTerminalGroupForm = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      name: `Terminal Group ${rand}`,
      description: `Auto-filled terminal group ${rand}`,
      status: 'ACTIVE',
    });
  };

  const startEdit = (item: TerminalGroup) => {
    setEditing(item);
    setShowCreate(false);
    setForm({
      name: item.name,
      description: item.description || '',
      status: item.status,
    });
  };

  const save = async () => {
    if (!selectedStoreUUID || !form.name) {
      addToast('חובה לבחור חנות ולהזין שם', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateTerminalGroupRequest = { ...form };
        await updateTerminalGroup(editing.uuid, payload);
        addToast('קבוצת טרמינל עודכנה', 'success');
        setEditing(null);
      } else {
        const payload: CreateTerminalGroupRequest = { ...form, store_uuid: selectedStoreUUID };
        await createTerminalGroup(payload);
        addToast('קבוצת טרמינל נוצרה', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('שמירת קבוצת טרמינל נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteTerminalGroup(deleteTarget.uuid);
      setDeleteTarget(null);
      addToast('קבוצת טרמינל נמחקה', 'success');
      await fetchItems();
    } catch {
      addToast('מחיקת קבוצת טרמינל נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/stores')}>חנויות</button>
        <span className="breadcrumb-sep">/</span>
        <span>קבוצות טרמינל</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">קבוצות טרמינל</h1>
          <p className="page-subtitle">{selectedStoreName ? `חנות נבחרת: ${selectedStoreName}` : 'בחר חנות'}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedStoreUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'סגור טופס' : 'קבוצה חדשה'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillTerminalGroupForm}>
              מילוי מהיר
            </button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת קבוצת טרמינל' : 'יצירת קבוצת טרמינל'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">שם *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">סטטוס</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{TERMINAL_GROUP_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field span-full"><label className="label">תיאור</label><textarea className="input textarea" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>ביטול</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select className="input" value={selectedStoreUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('store_uuid', e.target.value); else params.delete('store_uuid');
              setSearchParams(params);
            }} disabled={!!routeStoreUUID}>
              <option value="">בחר חנות</option>
              {stores.map((s) => <option key={s.uuid} value={s.uuid}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש" /></div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>טוען קבוצות טרמינל...</span></div> : items.length === 0 ? <div className="empty-state"><p>לא נמצאו קבוצות טרמינל</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>שם</th><th>תיאור</th><th>סטטוס</th><th>פעולות</th></tr></thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.uuid}>
                    <td className="cell-name">{g.name}</td>
                    <td>{g.description || '—'}</td>
                    <td>{g.status}</td>
                    <td className="cell-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/terminal-groups/${g.uuid}/terminals?store_uuid=${selectedStoreUUID}`)}
                      >
                        טרמינלים
                      </button>
                      <button className="action-btn edit" onClick={() => startEdit(g)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(g)}>🗑</button>
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
        title="מחיקת קבוצת טרמינל"
        message={`למחוק את "${deleteTarget?.name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
