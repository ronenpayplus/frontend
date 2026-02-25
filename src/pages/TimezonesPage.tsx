import { useCallback, useEffect, useState } from 'react';
import { createTimezone, deleteTimezone, listTimezones, updateTimezone } from '../api/timezonesRef';
import type { CreateTimezoneRequest, TimezoneRef, UpdateTimezoneRequest } from '../types/timezoneRef';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type TimezoneFormState = {
  tz_name: string;
  utc_offset: string;
  utc_offset_minutes: number;
  region: string;
  country_alpha2: string;
  is_active: boolean;
};

const defaultForm: TimezoneFormState = {
  tz_name: '',
  utc_offset: '+00:00',
  utc_offset_minutes: 0,
  region: '',
  country_alpha2: '',
  is_active: true,
};

export default function TimezonesPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [items, setItems] = useState<TimezoneRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TimezoneRef | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimezoneRef | null>(null);
  const [form, setForm] = useState<TimezoneFormState>(defaultForm);

  const fetchTimezones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTimezones({
        search: search || undefined,
        region: regionFilter || undefined,
        country_alpha2: countryFilter || undefined,
        is_active: isActiveFilter || undefined,
        page: 1,
        page_size: 150,
      });
      setItems(data.timezones || []);
    } catch (error) {
      console.error(error);
      addToast('טעינת אזורי זמן נכשלה', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, regionFilter, countryFilter, isActiveFilter, addToast]);

  useEffect(() => {
    fetchTimezones();
  }, [fetchTimezones]);

  const resetForm = () => setForm(defaultForm);

  const autoFillForm = () => {
    const sample = [
      { tz_name: 'Europe/Paris', utc_offset: '+01:00', utc_offset_minutes: 60, region: 'Europe', country_alpha2: 'FR' },
      { tz_name: 'Asia/Tokyo', utc_offset: '+09:00', utc_offset_minutes: 540, region: 'Asia', country_alpha2: 'JP' },
      { tz_name: 'America/New_York', utc_offset: '-05:00', utc_offset_minutes: -300, region: 'Americas', country_alpha2: 'US' },
    ];
    const pick = sample[Math.floor(Math.random() * sample.length)];
    setForm({
      ...pick,
      is_active: true,
    });
  };

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setShowCreate(true);
  };

  const startEdit = (timezone: TimezoneRef) => {
    setShowCreate(false);
    setEditing(timezone);
    setForm({
      tz_name: timezone.tz_name || '',
      utc_offset: timezone.utc_offset || '+00:00',
      utc_offset_minutes: timezone.utc_offset_minutes ?? 0,
      region: timezone.region || '',
      country_alpha2: timezone.country_alpha2 || '',
      is_active: timezone.is_active,
    });
  };

  const buildPayload = (): CreateTimezoneRequest | UpdateTimezoneRequest => ({
    tz_name: form.tz_name.trim(),
    utc_offset: form.utc_offset.trim(),
    utc_offset_minutes: Number(form.utc_offset_minutes),
    region: form.region.trim(),
    country_alpha2: form.country_alpha2.trim().toUpperCase() || undefined,
    is_active: form.is_active,
  });

  const save = async () => {
    if (!form.tz_name || !form.utc_offset || !form.region) {
      addToast('יש למלא שם אזור זמן, UTC Offset ו-Region', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updateTimezone(editing.id, payload);
        addToast('אזור הזמן עודכן', 'success');
        setEditing(null);
      } else {
        await createTimezone(payload);
        addToast('אזור הזמן נוצר', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchTimezones();
    } catch (error) {
      console.error(error);
      addToast('שמירת אזור זמן נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteTimezone(deleteTarget.id);
      addToast('אזור הזמן נמחק', 'success');
      setDeleteTarget(null);
      await fetchTimezones();
    } catch (error) {
      console.error(error);
      addToast('מחיקת אזור זמן נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">אזורי זמן</h1>
          <p className="page-subtitle">טבלת עזר - Timezones</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showCreate ? setShowCreate(false) : startCreate())}>
          {showCreate ? 'סגור טופס' : 'אזור זמן חדש'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillForm}>
              מילוי מהיר
            </button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת אזור זמן' : 'יצירת אזור זמן'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">TZ Name *</label><input className="input ltr-input" dir="ltr" value={form.tz_name} onChange={(e) => setForm((p) => ({ ...p, tz_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">UTC Offset *</label><input className="input ltr-input" dir="ltr" value={form.utc_offset} onChange={(e) => setForm((p) => ({ ...p, utc_offset: e.target.value }))} /></div>
            <div className="form-field"><label className="label">UTC Offset Minutes *</label><input type="number" className="input ltr-input" dir="ltr" value={form.utc_offset_minutes} onChange={(e) => setForm((p) => ({ ...p, utc_offset_minutes: Number(e.target.value) }))} /></div>
            <div className="form-field"><label className="label">Region *</label><input className="input ltr-input" dir="ltr" value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Country Alpha2</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.country_alpha2} onChange={(e) => setForm((p) => ({ ...p, country_alpha2: e.target.value }))} /></div>
            <div className="form-field"><label className="label">פעיל</label><select className="input" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}><option value="true">כן</option><option value="false">לא</option></select></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>ביטול</button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchTimezones(); }}>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי TZ / Region" /></div>
          <div className="filter-group"><input className="input ltr-input" dir="ltr" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} placeholder="Region" /></div>
          <div className="filter-group"><input className="input ltr-input" dir="ltr" maxLength={2} value={countryFilter} onChange={(e) => setCountryFilter(e.target.value.toUpperCase())} placeholder="Country Alpha2" /></div>
          <div className="filter-group">
            <select className="input" value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)}>
              <option value="">פעיל (הכל)</option>
              <option value="true">כן</option>
              <option value="false">לא</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>טוען אזורי זמן...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>לא נמצאו אזורי זמן</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TZ Name</th>
                  <th>Offset</th>
                  <th>Minutes</th>
                  <th>Region</th>
                  <th>Country</th>
                  <th>פעיל</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((timezone) => (
                  <tr key={timezone.id}>
                    <td className="cell-mono">{timezone.tz_name}</td>
                    <td className="cell-mono">{timezone.utc_offset}</td>
                    <td>{timezone.utc_offset_minutes}</td>
                    <td>{timezone.region}</td>
                    <td className="cell-mono">{timezone.country_alpha2 || '-'}</td>
                    <td>{timezone.is_active ? 'כן' : 'לא'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(timezone)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(timezone)}>🗑</button>
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
        title="מחיקת אזור זמן"
        message={`למחוק את "${deleteTarget?.tz_name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
