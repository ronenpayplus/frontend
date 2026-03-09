import { useCallback, useEffect, useState } from 'react';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from '../api/addresses';
import type {
  AddressEntity,
  CreateAddressRequest,
  UpdateAddressRequest,
} from '../types/addressEntity';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type AddressFormState = {
  address_type: string;
  country_code: string;
  state: string;
  city: string;
  district: string;
  postal_code: string;
  line1: string;
  line2: string;
  line3: string;
  company_name: string;
  contact_name: string;
  phone: string;
  latitude: string;
  longitude: string;
  validation_source: string;
  validated: boolean;
};

const defaultForm: AddressFormState = {
  address_type: 'operating',
  country_code: 'IL',
  state: '',
  city: '',
  district: '',
  postal_code: '',
  line1: '',
  line2: '',
  line3: '',
  company_name: '',
  contact_name: '',
  phone: '',
  latitude: '',
  longitude: '',
  validation_source: '',
  validated: false,
};

export default function AddressesPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [items, setItems] = useState<AddressEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [addressTypeFilter, setAddressTypeFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [validatedFilter, setValidatedFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AddressEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AddressEntity | null>(null);
  const [form, setForm] = useState<AddressFormState>(defaultForm);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAddresses({
        search: search || undefined,
        address_type: addressTypeFilter || undefined,
        country_code: countryFilter || undefined,
        city: cityFilter || undefined,
        validated: validatedFilter || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(data.addresses || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load addresses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, addressTypeFilter, countryFilter, cityFilter, validatedFilter, addToast]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const resetForm = () => setForm(defaultForm);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      address_type: 'operating',
      country_code: 'IL',
      state: '',
      city: `Tel Aviv ${rand}`,
      district: '',
      postal_code: `${rand}`,
      line1: `${rand} Main St`,
      line2: '',
      line3: '',
      company_name: `Company ${rand}`,
      contact_name: `Contact ${rand}`,
      phone: `+972-3-${rand}-000`,
      latitude: '',
      longitude: '',
      validation_source: 'MANUAL',
      validated: false,
    });
  };

  const startEdit = (item: AddressEntity) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      address_type: item.address_type || 'operating',
      country_code: item.country_code || 'IL',
      state: item.state || '',
      city: item.city || '',
      district: item.district || '',
      postal_code: item.postal_code || '',
      line1: item.line1 || '',
      line2: item.line2 || '',
      line3: item.line3 || '',
      company_name: item.company_name || '',
      contact_name: item.contact_name || '',
      phone: item.phone || '',
      latitude: item.latitude != null ? String(item.latitude) : '',
      longitude: item.longitude != null ? String(item.longitude) : '',
      validation_source: item.validation_source || '',
      validated: item.validated,
    });
  };

  const buildCreatePayload = (): CreateAddressRequest => ({
    address_type: form.address_type || undefined,
    country_code: form.country_code.trim().toUpperCase(),
    state: form.state.trim() || undefined,
    city: form.city.trim(),
    district: form.district.trim() || undefined,
    postal_code: form.postal_code.trim() || undefined,
    line1: form.line1.trim(),
    line2: form.line2.trim() || undefined,
    line3: form.line3.trim() || undefined,
    company_name: form.company_name.trim() || undefined,
    contact_name: form.contact_name.trim() || undefined,
    phone: form.phone.trim() || undefined,
    latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
    longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
    validation_source: form.validation_source.trim() || undefined,
  });

  const buildUpdatePayload = (): UpdateAddressRequest => ({
    ...buildCreatePayload(),
    validated: form.validated,
  });

  const save = async () => {
    if (!form.country_code.trim() || !form.city.trim() || !form.line1.trim()) {
      addToast('Country code, city, and line1 are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAddress(editing.uuid, buildUpdatePayload());
        addToast('Address updated', 'success');
        setEditing(null);
      } else {
        await createAddress(buildCreatePayload());
        addToast('Address created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchAddresses();
    } catch (error) {
      console.error(error);
      addToast('Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteAddress(deleteTarget.uuid);
      addToast('Address deleted', 'success');
      setDeleteTarget(null);
      await fetchAddresses();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete address', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Addresses</h1>
          <p className="page-subtitle">Address Entity Management</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showCreate ? setShowCreate(false) : (setEditing(null), resetForm(), setShowCreate(true)))}>
          {showCreate ? 'Close Form' : 'New Address'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>Quick Fill</button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Address' : 'Create Address'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Address Type</label><input className="input ltr-input" dir="ltr" value={form.address_type} onChange={(e) => setForm((p) => ({ ...p, address_type: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Country Code *</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.country_code} onChange={(e) => setForm((p) => ({ ...p, country_code: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">State</label><input className="input" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} /></div>
            <div className="form-field"><label className="label">City *</label><input className="input" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
            <div className="form-field"><label className="label">District</label><input className="input" value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Postal Code</label><input className="input ltr-input" dir="ltr" value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Line 1 *</label><input className="input" value={form.line1} onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Line 2</label><input className="input" value={form.line2} onChange={(e) => setForm((p) => ({ ...p, line2: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Line 3</label><input className="input" value={form.line3} onChange={(e) => setForm((p) => ({ ...p, line3: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Company Name</label><input className="input" value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Contact Name</label><input className="input" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Phone</label><input className="input ltr-input" dir="ltr" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Latitude</label><input className="input ltr-input" dir="ltr" value={form.latitude} onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Longitude</label><input className="input ltr-input" dir="ltr" value={form.longitude} onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Validation Source</label><input className="input ltr-input" dir="ltr" value={form.validation_source} onChange={(e) => setForm((p) => ({ ...p, validation_source: e.target.value }))} /></div>
            {editing ? (
              <div className="form-field"><label className="label">Validated</label><select className="input" value={form.validated ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, validated: e.target.value === 'true' }))}><option value="false">No</option><option value="true">Yes</option></select></div>
            ) : null}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>Cancel</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchAddresses(); }}>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" /></div>
          <div className="filter-group"><input className="input ltr-input" dir="ltr" value={addressTypeFilter} onChange={(e) => setAddressTypeFilter(e.target.value)} placeholder="Address Type" /></div>
          <div className="filter-group"><input className="input ltr-input" dir="ltr" maxLength={2} value={countryFilter} onChange={(e) => setCountryFilter(e.target.value.toUpperCase())} placeholder="Country Code" /></div>
          <div className="filter-group"><input className="input" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="City" /></div>
          <div className="filter-group">
            <select className="input" value={validatedFilter} onChange={(e) => setValidatedFilter(e.target.value)}>
              <option value="">Validated (All)</option>
              <option value="true">Validated only</option>
              <option value="false">Not validated only</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading addresses...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No addresses found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>Line 1</th>
                  <th>Postal</th>
                  <th>Validated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td>{item.address_type || '-'}</td>
                    <td className="cell-mono">{item.country_code}</td>
                    <td>{item.city}</td>
                    <td className="cell-name">{item.line1}</td>
                    <td className="cell-mono">{item.postal_code || '-'}</td>
                    <td>{item.validated ? 'Yes' : 'No'}</td>
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
        title="Delete Address"
        message={`Delete address "${deleteTarget?.line1 || deleteTarget?.uuid}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
