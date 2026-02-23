import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createTerminal, deleteTerminal, listTerminals, updateTerminal } from '../api/terminals';
import { listTerminalGroups } from '../api/terminalGroups';
import type { TerminalGroup } from '../types/terminalGroup';
import type { CreateTerminalRequest, Terminal, UpdateTerminalRequest } from '../types/terminal';
import {
  TERMINAL_INTEGRATION_TYPES,
  TERMINAL_PLATFORMS,
  TERMINAL_STATUSES,
  TERMINAL_TYPES,
} from '../types/terminal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function TerminalsPage() {
  const navigate = useNavigate();
  const { uuid: routeTerminalGroupUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedTerminalGroupUUID = routeTerminalGroupUUID || searchParams.get('terminal_group_uuid') || '';
  const [terminalGroups, setTerminalGroups] = useState<TerminalGroup[]>([]);
  const [items, setItems] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Terminal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Terminal | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [form, setForm] = useState({
    terminal_code: '',
    terminal_type: 'physical',
    status: 'ACTIVE',
    device_model: '',
    serial_number: '',
    firmware_version: '',
    integration_type: 'SDK',
    platform: 'ANDROID',
    assigned_user: '',
  });

  useEffect(() => {
    listTerminalGroups({ page: 1, page_size: 300 })
      .then((data) => setTerminalGroups(data.terminal_groups || []))
      .catch(() => setTerminalGroups([]));
  }, []);

  useEffect(() => {
    if (routeTerminalGroupUUID || selectedTerminalGroupUUID || terminalGroups.length === 0) return;
    const params = new URLSearchParams(searchParams);
    params.set('terminal_group_uuid', terminalGroups[0].uuid);
    setSearchParams(params);
  }, [routeTerminalGroupUUID, selectedTerminalGroupUUID, terminalGroups, searchParams, setSearchParams]);

  const fetchItems = useCallback(async () => {
    if (!selectedTerminalGroupUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listTerminals({
        terminal_group_uuid: selectedTerminalGroupUUID,
        search: search || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.terminals || []);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת טרמינלים', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTerminalGroupUUID, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedGroupName = useMemo(
    () => terminalGroups.find((x) => x.uuid === selectedTerminalGroupUUID)?.name || '',
    [terminalGroups, selectedTerminalGroupUUID],
  );

  const resetForm = () => setForm({
    terminal_code: '',
    terminal_type: 'physical',
    status: 'ACTIVE',
    device_model: '',
    serial_number: '',
    firmware_version: '',
    integration_type: 'SDK',
    platform: 'ANDROID',
    assigned_user: '',
  });

  const autoFillTerminalForm = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      terminal_code: `TERM-${rand}`,
      terminal_type: 'physical',
      status: 'ACTIVE',
      device_model: 'PAX A920',
      serial_number: `SN${rand}000`,
      firmware_version: '1.2.4',
      integration_type: 'SDK',
      platform: 'ANDROID',
      assigned_user: `cashier-${rand}`,
    });
  };

  const startEdit = (item: Terminal) => {
    setEditing(item);
    setShowCreate(false);
    setForm({
      terminal_code: item.terminal_code,
      terminal_type: item.terminal_type || 'physical',
      status: item.status || 'ACTIVE',
      device_model: item.device_model || '',
      serial_number: item.serial_number || '',
      firmware_version: item.firmware_version || '',
      integration_type: item.integration_type || 'SDK',
      platform: item.platform || 'ANDROID',
      assigned_user: item.assigned_user || '',
    });
  };

  const save = async () => {
    if (!selectedTerminalGroupUUID || !form.terminal_code) {
      addToast('חובה לבחור קבוצת טרמינל ולהזין קוד טרמינל', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateTerminalRequest = { ...form };
        await updateTerminal(editing.uuid, payload);
        addToast('טרמינל עודכן', 'success');
        setEditing(null);
      } else {
        const payload: CreateTerminalRequest = { ...form, terminal_group_uuid: selectedTerminalGroupUUID };
        await createTerminal(payload);
        addToast('טרמינל נוצר', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('שמירת טרמינל נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteTerminal(deleteTarget.uuid);
      setDeleteTarget(null);
      addToast('טרמינל נמחק', 'success');
      await fetchItems();
    } catch {
      addToast('מחיקת טרמינל נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/terminal-groups')}>קבוצות טרמינל</button>
        <span className="breadcrumb-sep">/</span>
        <span>טרמינלים</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">טרמינלים</h1>
          <p className="page-subtitle">{selectedGroupName ? `קבוצה נבחרת: ${selectedGroupName}` : 'בחר קבוצת טרמינל'}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedTerminalGroupUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'סגור טופס' : 'טרמינל חדש'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillTerminalForm}>
              מילוי מהיר
            </button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת טרמינל' : 'יצירת טרמינל'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Terminal Code *</label><input className="input ltr-input" dir="ltr" value={form.terminal_code} onChange={(e) => setForm((p) => ({ ...p, terminal_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Terminal Type</label><select className="input" value={form.terminal_type} onChange={(e) => setForm((p) => ({ ...p, terminal_type: e.target.value }))}>{TERMINAL_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{TERMINAL_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Device Model</label><input className="input" value={form.device_model} onChange={(e) => setForm((p) => ({ ...p, device_model: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Serial Number</label><input className="input ltr-input" dir="ltr" value={form.serial_number} onChange={(e) => setForm((p) => ({ ...p, serial_number: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Firmware Version</label><input className="input ltr-input" dir="ltr" value={form.firmware_version} onChange={(e) => setForm((p) => ({ ...p, firmware_version: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Integration Type</label><select className="input" value={form.integration_type} onChange={(e) => setForm((p) => ({ ...p, integration_type: e.target.value }))}>{TERMINAL_INTEGRATION_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Platform</label><select className="input" value={form.platform} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}>{TERMINAL_PLATFORMS.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Assigned User</label><input className="input" value={form.assigned_user} onChange={(e) => setForm((p) => ({ ...p, assigned_user: e.target.value }))} /></div>
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
            <select className="input" value={selectedTerminalGroupUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('terminal_group_uuid', e.target.value); else params.delete('terminal_group_uuid');
              setSearchParams(params);
            }} disabled={!!routeTerminalGroupUUID}>
              <option value="">בחר קבוצת טרמינל</option>
              {terminalGroups.map((g) => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש" /></div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>טוען טרמינלים...</span></div> : items.length === 0 ? <div className="empty-state"><p>לא נמצאו טרמינלים</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>קוד</th><th>סוג</th><th>סטטוס</th><th>Device</th><th>User</th><th>פעולות</th></tr></thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.uuid}>
                    <td className="cell-mono">{t.terminal_code}</td>
                    <td>{t.terminal_type}</td>
                    <td>{t.status}</td>
                    <td>{t.device_model || '—'}</td>
                    <td>{t.assigned_user || '—'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(t)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(t)}>🗑</button>
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
        title="מחיקת טרמינל"
        message={`למחוק את "${deleteTarget?.terminal_code}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
