import { useCallback, useEffect, useState } from 'react';
import { createCountry, deleteCountry, getCountry, listCountries, updateCountry } from '../api/countries';
import type { Country, CreateCountryRequest, UpdateCountryRequest } from '../types/country';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type CountryFormState = {
  alpha2: string;
  alpha3: string;
  numeric_code: string;
  name: string;
  official_name: string;
  region: string;
  sub_region: string;
  phone_prefix: string;
  is_active: boolean;
  is_sanctioned: boolean;
};

const defaultForm: CountryFormState = {
  alpha2: '',
  alpha3: '',
  numeric_code: '',
  name: '',
  official_name: '',
  region: '',
  sub_region: '',
  phone_prefix: '',
  is_active: true,
  is_sanctioned: false,
};

export default function CountriesPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [items, setItems] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [isSanctionedFilter, setIsSanctionedFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);
  const [form, setForm] = useState<CountryFormState>(defaultForm);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCountries({
        search: search || undefined,
        region: regionFilter || undefined,
        is_active: isActiveFilter || undefined,
        is_sanctioned: isSanctionedFilter || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(data.countries || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load countries', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, regionFilter, isActiveFilter, isSanctionedFilter, addToast]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const resetForm = () => setForm(defaultForm);

  const autoFillForm = () => {
    const sample = [
      { alpha2: 'FR', alpha3: 'FRA', numeric_code: '250', name: 'France', official_name: 'French Republic', region: 'Europe', sub_region: 'Western Europe', phone_prefix: '+33' },
      { alpha2: 'DE', alpha3: 'DEU', numeric_code: '276', name: 'Germany', official_name: 'Federal Republic of Germany', region: 'Europe', sub_region: 'Western Europe', phone_prefix: '+49' },
      { alpha2: 'ES', alpha3: 'ESP', numeric_code: '724', name: 'Spain', official_name: 'Kingdom of Spain', region: 'Europe', sub_region: 'Southern Europe', phone_prefix: '+34' },
    ];
    const pick = sample[Math.floor(Math.random() * sample.length)];
    setForm({
      ...pick,
      is_active: true,
      is_sanctioned: false,
    });
  };

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setShowCreate(true);
  };

  const startEdit = (country: Country) => {
    setShowCreate(false);
    setEditing(country);
    setForm({
      alpha2: country.alpha2 || '',
      alpha3: country.alpha3 || '',
      numeric_code: country.numeric_code || '',
      name: country.name || '',
      official_name: country.official_name || '',
      region: country.region || '',
      sub_region: country.sub_region || '',
      phone_prefix: country.phone_prefix || '',
      is_active: country.is_active,
      is_sanctioned: country.is_sanctioned,
    });
  };

  const buildPayload = (): CreateCountryRequest | UpdateCountryRequest => ({
    alpha2: form.alpha2.trim().toUpperCase(),
    alpha3: form.alpha3.trim().toUpperCase(),
    numeric_code: form.numeric_code.trim(),
    name: form.name.trim(),
    official_name: form.official_name.trim() || undefined,
    region: form.region.trim() || undefined,
    sub_region: form.sub_region.trim() || undefined,
    phone_prefix: form.phone_prefix.trim() || undefined,
    is_active: form.is_active,
    is_sanctioned: form.is_sanctioned,
  });

  const save = async () => {
    if (!form.alpha2 || !form.alpha3 || !form.numeric_code || !form.name) {
      addToast('Alpha2, Alpha3, Numeric Code, and Name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await updateCountry(editing.id, payload);
        addToast('Country updated', 'success');
        setEditing(null);
      } else {
        try {
          await createCountry(payload);
          addToast('Country created', 'success');
          setShowCreate(false);
        } catch (createError) {
          // Country delete is soft-delete in backend (is_active=false), so recreate may fail on unique keys.
          // If country exists by alpha2, we reactivate/update it instead of failing the flow.
          const existing = await getCountry(payload.alpha2);
          if (!existing?.country?.id) {
            throw createError;
          }
          await updateCountry(existing.country.id, {
            ...payload,
            is_active: true,
          });
          addToast('Country already existed, reactivated and updated', 'success');
          setShowCreate(false);
        }
      }
      resetForm();
      await fetchCountries();
    } catch (error) {
      console.error(error);
      addToast('Failed to save country', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteCountry(deleteTarget.id);
      addToast('Country marked as inactive', 'success');
      setDeleteTarget(null);
      setIsActiveFilter('true');
      await fetchCountries();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete country', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Countries</h1>
          <p className="page-subtitle">Reference Table - Countries</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showCreate ? setShowCreate(false) : startCreate())}>
          {showCreate ? 'Close Form' : 'New Country'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillForm}>
              Quick Fill
            </button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Country' : 'Create Country'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Alpha2 *</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.alpha2} onChange={(e) => setForm((p) => ({ ...p, alpha2: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Alpha3 *</label><input className="input ltr-input" dir="ltr" maxLength={3} value={form.alpha3} onChange={(e) => setForm((p) => ({ ...p, alpha3: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Numeric Code *</label><input className="input ltr-input" dir="ltr" maxLength={3} value={form.numeric_code} onChange={(e) => setForm((p) => ({ ...p, numeric_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Official Name</label><input className="input" value={form.official_name} onChange={(e) => setForm((p) => ({ ...p, official_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Region</label><input className="input ltr-input" dir="ltr" value={form.region} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Sub Region</label><input className="input ltr-input" dir="ltr" value={form.sub_region} onChange={(e) => setForm((p) => ({ ...p, sub_region: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Phone Prefix</label><input className="input ltr-input" dir="ltr" value={form.phone_prefix} onChange={(e) => setForm((p) => ({ ...p, phone_prefix: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Active</label><select className="input" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}><option value="true">Yes</option><option value="false">No</option></select></div>
            <div className="form-field"><label className="label">Sanctioned</label><select className="input" value={form.is_sanctioned ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_sanctioned: e.target.value === 'true' }))}><option value="false">No</option><option value="true">Yes</option></select></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchCountries(); }}>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name / codes" /></div>
          <div className="filter-group"><input className="input ltr-input" dir="ltr" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} placeholder="Region" /></div>
          <div className="filter-group">
            <select className="input" value={isActiveFilter} onChange={(e) => setIsActiveFilter(e.target.value)}>
              <option value="">Active Status (All)</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={isSanctionedFilter} onChange={(e) => setIsSanctionedFilter(e.target.value)}>
              <option value="">Sanctioned (All)</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading countries...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No countries found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Alpha2</th>
                  <th>Alpha3</th>
                  <th>Numeric</th>
                  <th>Region</th>
                  <th>Active</th>
                  <th>Sanctioned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((country) => (
                  <tr key={country.id}>
                    <td className="cell-name">{country.name}</td>
                    <td className="cell-mono">{country.alpha2}</td>
                    <td className="cell-mono">{country.alpha3}</td>
                    <td className="cell-mono">{country.numeric_code}</td>
                    <td>{country.region || '-'}</td>
                    <td>{country.is_active ? 'Yes' : 'No'}</td>
                    <td>{country.is_sanctioned ? 'Yes' : 'No'}</td>
                    <td className="cell-actions">
                      <button className="action-btn edit" onClick={() => startEdit(country)}>✎</button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(country)}>🗑</button>
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
        title="Delete Country"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
