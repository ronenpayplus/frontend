import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createLocation,
  deleteLocation,
  listLocations,
  updateLocation,
} from '../api/locations';
import { listCompanies } from '../api/companies';
import type { Company } from '../types/company';
import type { Location, CreateLocationRequest, UpdateLocationRequest } from '../types/location';
import {
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  LOCATION_STATUSES,
} from '../types/location';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type LocationFormState = {
  location_type: string;
  name: string;
  status: string;
  phone: string;
  address_country_code: string;
  address_city: string;
  address_line1: string;
  address_postal_code: string;
};

const defaultForm: LocationFormState = {
  location_type: 'BRANCH',
  name: '',
  status: 'ACTIVE',
  phone: '',
  address_country_code: 'IL',
  address_city: '',
  address_line1: '',
  address_postal_code: '',
};

export default function LocationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState<LocationFormState>(defaultForm);

  useEffect(() => {
    listCompanies({ page: 1, page_size: 300 })
      .then((data) => setCompanies(data.companies || []))
      .catch(() => setCompanies([]));
  }, []);

  const fetchItems = useCallback(async () => {
    if (!selectedCompanyUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listLocations({
        company_uuid: selectedCompanyUUID,
        location_type: typeFilter || undefined,
        search: search || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(data.locations || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load locations', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyUUID, typeFilter, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedCompanyName = useMemo(() => {
    const c = companies.find((co) => co.uuid === selectedCompanyUUID);
    return c?.name || '';
  }, [companies, selectedCompanyUUID]);

  const resetForm = () => setForm(defaultForm);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      location_type: 'BRANCH',
      name: `Location ${rand}`,
      status: 'ACTIVE',
      phone: `+972-3-${rand}-000`,
      address_country_code: 'IL',
      address_city: `Tel Aviv`,
      address_line1: `${rand} Rothschild Blvd`,
      address_postal_code: `${rand}`,
    });
  };

  const startEdit = (item: Location) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      location_type: item.location_type,
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
    if (!selectedCompanyUUID || !form.name || !form.location_type) {
      addToast('Select a company and fill required fields', 'error');
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
        const payload: UpdateLocationRequest = {
          location_type: form.location_type,
          name: form.name.trim(),
          status: form.status,
          phone: form.phone.trim() || undefined,
          address: addressPayload,
        };
        await updateLocation(editing.uuid, payload);
        addToast('Location updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateLocationRequest = {
          company_uuid: selectedCompanyUUID,
          location_type: form.location_type,
          name: form.name.trim(),
          status: form.status || undefined,
          phone: form.phone.trim() || undefined,
          address: addressPayload,
        };
        await createLocation(payload);
        addToast('Location created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addToast(`Failed to save location: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteLocation(deleteTarget.uuid);
      addToast('Location deleted', 'success');
      setDeleteTarget(null);
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete location', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">
            {selectedCompanyName ? `Company: ${selectedCompanyName}` : 'Select a company to manage locations'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedCompanyUUID}
          onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}
        >
          {showCreate ? 'Close Form' : 'New Location'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>Quick Fill</button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Location' : 'Create Location'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Type *</label><select className="input" value={form.location_type} onChange={(e) => setForm((p) => ({ ...p, location_type: e.target.value }))}>{LOCATION_TYPES.map((t) => <option key={t} value={t}>{LOCATION_TYPE_LABELS[t] || t}</option>)}</select></div>
            <div className="form-field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{LOCATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
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
          <div className="filter-group">
            <select className="input" value={selectedCompanyUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('company_uuid', e.target.value); else params.delete('company_uuid');
              setSearchParams(params);
            }}>
              <option value="">Select Company</option>
              {companies.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Type (All)</option>
              {LOCATION_TYPES.map((t) => <option key={t} value={t}>{LOCATION_TYPE_LABELS[t] || t}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" /></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading locations...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No locations found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
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
                    <td>{LOCATION_TYPE_LABELS[item.location_type] || item.location_type}</td>
                    <td>{item.status}</td>
                    <td className="cell-mono">{item.phone || '—'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(item)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(item)}>🗑</button>
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
        title="Delete Location"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
