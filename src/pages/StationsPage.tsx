import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  createStation,
  deleteStation,
  listStations,
  updateStation,
} from '../api/stations';
import { listStores } from '../api/stores';
import type { Store } from '../types/store';
import type { Station, CreateStationRequest, UpdateStationRequest } from '../types/station';
import {
  STATION_TYPES,
  STATION_TYPE_LABELS,
  STATION_STATUSES,
} from '../types/station';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type StationFormState = {
  station_code: string;
  station_type: string;
  name: string;
  status: string;
  phone: string;
  address_country_code: string;
  address_city: string;
  address_line1: string;
  address_postal_code: string;
};

const defaultForm: StationFormState = {
  station_code: '',
  station_type: 'CHECKOUT',
  name: '',
  status: 'ACTIVE',
  phone: '',
  address_country_code: 'IL',
  address_city: '',
  address_line1: '',
  address_postal_code: '',
};

export default function StationsPage() {
  const { uuid: routeStoreUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedStoreUUID = routeStoreUUID || searchParams.get('store_uuid') || '';
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState<StationFormState>(defaultForm);

  useEffect(() => {
    listStores({ page: 1, page_size: 300 })
      .then((data) => setStores(data.stores || []))
      .catch(() => setStores([]));
  }, []);

  const fetchItems = useCallback(async () => {
    if (!selectedStoreUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listStations({
        store_uuid: selectedStoreUUID,
        station_type: typeFilter || undefined,
        search: search || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(data.stations || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load stations', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreUUID, typeFilter, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedStoreName = useMemo(() => {
    const s = stores.find((st) => st.uuid === selectedStoreUUID);
    return s?.name || '';
  }, [stores, selectedStoreUUID]);

  const resetForm = () => setForm(defaultForm);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      station_code: `STN-${rand}`,
      station_type: 'CHECKOUT',
      name: `Station ${rand}`,
      status: 'ACTIVE',
      phone: `+972-3-${rand}-000`,
      address_country_code: 'IL',
      address_city: 'Tel Aviv',
      address_line1: `${rand} Rothschild Blvd`,
      address_postal_code: `${rand}`,
    });
  };

  const startEdit = (item: Station) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      station_code: item.station_code,
      station_type: item.station_type,
      name: item.name,
      status: item.status,
      phone: item.phone || '',
      address_country_code: 'IL',
      address_city: '',
      address_line1: '',
      address_postal_code: '',
    });
  };

  const save = async () => {
    if (!selectedStoreUUID || !form.name || !form.station_code || !form.station_type) {
      addToast('Select a store and fill required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const addressPayload = form.address_line1.trim() && form.address_city.trim()
        ? {
          address_type: 'operating' as const,
          country_code: form.address_country_code,
          city: form.address_city.trim(),
          line1: form.address_line1.trim(),
          postal_code: form.address_postal_code.trim() || undefined,
        }
        : undefined;

      if (editing) {
        const payload: UpdateStationRequest = {
          station_code: form.station_code.trim(),
          station_type: form.station_type,
          name: form.name.trim(),
          status: form.status,
          phone: form.phone.trim() || undefined,
          address: addressPayload,
        };
        await updateStation(editing.uuid, payload);
        addToast('Station updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateStationRequest = {
          store_uuid: selectedStoreUUID,
          station_code: form.station_code.trim(),
          station_type: form.station_type,
          name: form.name.trim(),
          status: form.status || undefined,
          phone: form.phone.trim() || undefined,
          address: addressPayload,
        };
        await createStation(payload);
        addToast('Station created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addToast(`Failed to save station: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteStation(deleteTarget.uuid);
      addToast('Station deleted', 'success');
      setDeleteTarget(null);
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete station', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stations</h1>
          <p className="page-subtitle">
            {selectedStoreName ? `Store: ${selectedStoreName}` : 'Select a store to manage stations'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedStoreUUID}
          onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}
        >
          {showCreate ? 'Close Form' : 'New Station'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>Quick Fill</button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Station' : 'Create Station'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Station Code *</label><input className="input ltr-input" dir="ltr" value={form.station_code} onChange={(e) => setForm((p) => ({ ...p, station_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Type *</label><select className="input" value={form.station_type} onChange={(e) => setForm((p) => ({ ...p, station_type: e.target.value }))}>{STATION_TYPES.map((t) => <option key={t} value={t}>{STATION_TYPE_LABELS[t] || t}</option>)}</select></div>
            <div className="form-field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{STATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="form-field"><label className="label">Phone</label><input className="input ltr-input" dir="ltr" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Country</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.address_country_code} onChange={(e) => setForm((p) => ({ ...p, address_country_code: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">Address City</label><input className="input" value={form.address_city} onChange={(e) => setForm((p) => ({ ...p, address_city: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Line 1</label><input className="input" value={form.address_line1} onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Postal Code</label><input className="input ltr-input" dir="ltr" value={form.address_postal_code} onChange={(e) => setForm((p) => ({ ...p, address_postal_code: e.target.value }))} /></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          {!routeStoreUUID && (
            <div className="filter-group">
              <select className="input" value={selectedStoreUUID} onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('store_uuid', e.target.value); else params.delete('store_uuid');
                setSearchParams(params);
              }}>
                <option value="">Select Store</option>
                {stores.map((s) => <option key={s.uuid} value={s.uuid}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="filter-group">
            <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Type (All)</option>
              {STATION_TYPES.map((t) => <option key={t} value={t}>{STATION_TYPE_LABELS[t] || t}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" /></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading stations...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No stations found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.name}</td>
                    <td className="cell-mono">{item.station_code}</td>
                    <td>{STATION_TYPE_LABELS[item.station_type] || item.station_type}</td>
                    <td>{item.status}</td>
                    <td className="cell-mono">{item.phone || '\u2014'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(item)}>&#x270E;</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(item)}>&#x1F5D1;</button>
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
        title="Delete Station"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
