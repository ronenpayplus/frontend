import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createBeneficialOwner,
  deleteBeneficialOwner,
  listBeneficialOwners,
  updateBeneficialOwner,
} from '../api/beneficialOwners';
import { listAccounts } from '../api/accounts';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import type { Account } from '../types/account';
import type { LegalEntity } from '../types/legalEntity';
import type {
  BeneficialOwner,
  CreateBeneficialOwnerRequest,
  UpdateBeneficialOwnerRequest,
} from '../types/beneficialOwner';
import {
  BENEFICIAL_OWNER_NATIONAL_ID_TYPES,
  BENEFICIAL_OWNER_ROLES,
  BENEFICIAL_OWNER_ROLE_LABELS,
  BENEFICIAL_OWNER_VERIFICATION_STATUSES,
  OWNER_ENTITY_TYPES,
  OWNER_ENTITY_TYPE_LABELS,
} from '../types/beneficialOwner';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountsList.css';
import './AccountCreate.css';

type BeneficialOwnerFormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  national_id_type: string;
  email: string;
  job_title: string;
  owner_entity_type: string;
  account_name: string;
  account_type: string;
  account_country: string;
  account_registration_number: string;
  account_tax_id: string;
  account_website: string;
  ownership_percentage: number;
  role: string;
  address_id: string;
  address_country_code: string;
  address_city: string;
  address_line1: string;
  address_postal_code: string;
  pep_status: boolean;
  sanctions_clear: boolean;
  verification_status: string;
};

const defaultForm: BeneficialOwnerFormState = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  nationality: 'IL',
  national_id: '',
  national_id_type: 'national_id',
  email: '',
  job_title: '',
  owner_entity_type: 'individual',
  account_name: '',
  account_type: '',
  account_country: '',
  account_registration_number: '',
  account_tax_id: '',
  account_website: '',
  ownership_percentage: 50,
  role: 'owner',
  address_id: '',
  address_country_code: 'IL',
  address_city: '',
  address_line1: '',
  address_postal_code: '',
  pep_status: false,
  sanctions_clear: true,
  verification_status: 'pending',
};

export default function BeneficialOwnersPage() {
  const navigate = useNavigate();
  const { uuid: routeLegalEntityUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedAccountUUID = searchParams.get('account_uuid') || '';
  const selectedLegalEntityUUID = routeLegalEntityUUID || searchParams.get('legal_entity_uuid') || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
  const [items, setItems] = useState<BeneficialOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<BeneficialOwner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BeneficialOwner | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [verificationFilter, setVerificationFilter] = useState(searchParams.get('verification_status') || '');
  const [form, setForm] = useState<BeneficialOwnerFormState>(defaultForm);

  useEffect(() => {
    listAccounts({ page: 1, page_size: 300 })
      .then((data) => setAccounts(data.accounts || []))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    if (!selectedAccountUUID) {
      setLegalEntities([]);
      return;
    }
    listLegalEntities({ account_uuid: selectedAccountUUID, page: 1, page_size: 300 })
      .then((data) => setLegalEntities(data.legal_entities || []))
      .catch(() => setLegalEntities([]));
  }, [selectedAccountUUID]);

  useEffect(() => {
    if (!selectedLegalEntityUUID) {
      setSelectedLegalEntity(null);
      return;
    }
    getLegalEntity(selectedLegalEntityUUID)
      .then((data) => setSelectedLegalEntity(data.legal_entity))
      .catch(() => setSelectedLegalEntity(null));
  }, [selectedLegalEntityUUID]);

  useEffect(() => {
    if (!selectedLegalEntity) return;
    const params = new URLSearchParams(searchParams);
    if (selectedLegalEntity.account_uuid && selectedLegalEntity.account_uuid !== selectedAccountUUID) {
      params.set('account_uuid', selectedLegalEntity.account_uuid);
    }
    if (!params.get('legal_entity_uuid') && selectedLegalEntity.uuid) {
      params.set('legal_entity_uuid', selectedLegalEntity.uuid);
    }
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
    setLegalEntities((prev) => {
      if (prev.some((x) => x.uuid === selectedLegalEntity.uuid)) return prev;
      return [selectedLegalEntity, ...prev];
    });
  }, [selectedLegalEntity, selectedAccountUUID, searchParams, setSearchParams]);

  const fetchItems = useCallback(async () => {
    if (!selectedLegalEntityUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listBeneficialOwners({
        legal_entity_uuid: selectedLegalEntityUUID,
        search: search || undefined,
        role: roleFilter || undefined,
        verification_status: verificationFilter || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.beneficial_owners || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load beneficial owners', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedLegalEntityUUID, search, roleFilter, verificationFilter, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedLegalEntityName = useMemo(
    () => selectedLegalEntity?.legal_name || '',
    [selectedLegalEntity],
  );

  const resetForm = () => setForm(defaultForm);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      first_name: `John${rand}`,
      last_name: 'Doe',
      date_of_birth: '1985-06-15',
      nationality: 'IL',
      national_id: `ID-${rand}`,
      national_id_type: 'national_id',
      email: `john${rand}@example.com`,
      job_title: 'CEO',
      owner_entity_type: 'individual',
      account_name: '',
      account_type: '',
      account_country: '',
      account_registration_number: '',
      account_tax_id: '',
      account_website: '',
      ownership_percentage: 55,
      role: 'owner',
      address_id: '',
      address_country_code: 'IL',
      address_city: `Tel Aviv ${rand}`,
      address_line1: `${rand} Main St`,
      address_postal_code: `${rand}`,
      pep_status: false,
      sanctions_clear: true,
      verification_status: 'pending',
    });
  };

  const startEdit = (item: BeneficialOwner) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      first_name: item.first_name,
      last_name: item.last_name,
      date_of_birth: item.date_of_birth,
      nationality: item.nationality,
      national_id: item.national_id || '',
      national_id_type: item.national_id_type || 'national_id',
      email: item.email || '',
      job_title: item.job_title || '',
      owner_entity_type: item.owner_entity_type || 'individual',
      account_name: item.account_name || '',
      account_type: item.account_type || '',
      account_country: item.account_country || '',
      account_registration_number: item.account_registration_number || '',
      account_tax_id: item.account_tax_id || '',
      account_website: item.account_website || '',
      ownership_percentage: item.ownership_percentage,
      role: item.role,
      address_id: item.address_id ? String(item.address_id) : '',
      address_country_code: 'IL',
      address_city: '',
      address_line1: '',
      address_postal_code: '',
      pep_status: item.pep_status,
      sanctions_clear: item.sanctions_clear ?? true,
      verification_status: item.verification_status || 'pending',
    });
  };

  const buildCreatePayload = (): CreateBeneficialOwnerRequest => ({
    legal_entity_uuid: selectedLegalEntityUUID,
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    date_of_birth: form.date_of_birth,
    nationality: form.nationality.trim().toUpperCase(),
    national_id: form.national_id.trim() || undefined,
    national_id_type: form.national_id_type || undefined,
    email: form.email.trim() || undefined,
    job_title: form.job_title.trim() || undefined,
    owner_entity_type: form.owner_entity_type || 'individual',
    ...(form.owner_entity_type === 'corporate' ? {
      account_name: form.account_name.trim() || undefined,
      account_type: form.account_type.trim() || undefined,
      account_country: form.account_country.trim().toUpperCase() || undefined,
      account_registration_number: form.account_registration_number.trim() || undefined,
      account_tax_id: form.account_tax_id.trim() || undefined,
      account_website: form.account_website.trim() || undefined,
    } : {}),
    ownership_percentage: Number(form.ownership_percentage),
    role: form.role,
    address_id: form.address_id ? Number(form.address_id) : undefined,
    address: form.address_line1.trim() && form.address_city.trim()
      ? {
        address_type: 'operating',
        country_code: form.address_country_code,
        city: form.address_city.trim(),
        line1: form.address_line1.trim(),
        postal_code: form.address_postal_code.trim() || undefined,
      }
      : undefined,
    pep_status: form.pep_status,
    sanctions_clear: form.sanctions_clear,
  });

  const buildUpdatePayload = (): UpdateBeneficialOwnerRequest => ({
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    date_of_birth: form.date_of_birth,
    nationality: form.nationality.trim().toUpperCase(),
    national_id: form.national_id.trim() || undefined,
    national_id_type: form.national_id_type || undefined,
    email: form.email.trim() || undefined,
    job_title: form.job_title.trim() || undefined,
    owner_entity_type: form.owner_entity_type || 'individual',
    ...(form.owner_entity_type === 'corporate' ? {
      account_name: form.account_name.trim() || undefined,
      account_type: form.account_type.trim() || undefined,
      account_country: form.account_country.trim().toUpperCase() || undefined,
      account_registration_number: form.account_registration_number.trim() || undefined,
      account_tax_id: form.account_tax_id.trim() || undefined,
      account_website: form.account_website.trim() || undefined,
    } : {}),
    ownership_percentage: Number(form.ownership_percentage),
    role: form.role,
    address_id: form.address_id ? Number(form.address_id) : undefined,
    address: form.address_line1.trim() && form.address_city.trim()
      ? {
        address_type: 'operating',
        country_code: form.address_country_code,
        city: form.address_city.trim(),
        line1: form.address_line1.trim(),
        postal_code: form.address_postal_code.trim() || undefined,
      }
      : undefined,
    pep_status: form.pep_status,
    sanctions_clear: form.sanctions_clear,
    verification_status: form.verification_status,
  });

  const save = async () => {
    if (!selectedLegalEntityUUID || !form.first_name || !form.last_name || !form.date_of_birth) {
      addToast('Select a legal entity and fill required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateBeneficialOwner(editing.uuid, buildUpdatePayload());
        addToast('Beneficial owner updated', 'success');
        setEditing(null);
      } else {
        await createBeneficialOwner(buildCreatePayload());
        addToast('Beneficial owner created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteBeneficialOwner(deleteTarget.uuid);
      addToast('Beneficial owner deleted', 'success');
      setDeleteTarget(null);
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="accounts-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/legal-entities')}>Legal Entities</button>
        <span className="breadcrumb-sep">/</span>
        <span>Beneficial Owners</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Beneficial Owners</h1>
          <p className="page-subtitle">
            {selectedLegalEntityName ? `Selected legal entity: ${selectedLegalEntityName}` : 'Select a legal entity to manage beneficial owners'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedLegalEntityUUID}
          onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}
        >
          {showCreate ? 'Close Form' : 'New Beneficial Owner'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>Quick Fill</button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Beneficial Owner' : 'Create Beneficial Owner'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">First Name *</label><input className="input" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Last Name *</label><input className="input" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Date of Birth *</label><input type="date" className="input ltr-input" dir="ltr" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Nationality *</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">Role *</label><select className="input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>{BENEFICIAL_OWNER_ROLES.map((role) => <option key={role} value={role}>{BENEFICIAL_OWNER_ROLE_LABELS[role] || role}</option>)}</select></div>
            <div className="form-field"><label className="label">Ownership % *</label><input type="number" min={0} max={100} step="0.01" className="input ltr-input" dir="ltr" value={form.ownership_percentage} onChange={(e) => setForm((p) => ({ ...p, ownership_percentage: Number(e.target.value) }))} /></div>
            <div className="form-field"><label className="label">National ID</label><input className="input ltr-input" dir="ltr" value={form.national_id} onChange={(e) => setForm((p) => ({ ...p, national_id: e.target.value }))} /></div>
            <div className="form-field"><label className="label">National ID Type</label><select className="input" value={form.national_id_type} onChange={(e) => setForm((p) => ({ ...p, national_id_type: e.target.value }))}>{BENEFICIAL_OWNER_NATIONAL_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">Email</label><input type="email" className="input ltr-input" dir="ltr" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" /></div>
            <div className="form-field"><label className="label">Job Title</label><input className="input" value={form.job_title} onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))} placeholder="e.g. CEO, CFO" /></div>
            <div className="form-field"><label className="label">Entity Type</label><select className="input" value={form.owner_entity_type} onChange={(e) => setForm((p) => ({ ...p, owner_entity_type: e.target.value }))}>{OWNER_ENTITY_TYPES.map((t) => <option key={t} value={t}>{OWNER_ENTITY_TYPE_LABELS[t] || t}</option>)}</select></div>
          </div>
          {form.owner_entity_type === 'corporate' && (
            <>
              <h4 className="section-title" style={{ marginTop: '16px', marginBottom: '12px' }}>Corporate Details</h4>
              <div className="form-grid">
                <div className="form-field"><label className="label">Account Name</label><input className="input" value={form.account_name} onChange={(e) => setForm((p) => ({ ...p, account_name: e.target.value }))} /></div>
                <div className="form-field"><label className="label">Account Type</label><input className="input" value={form.account_type} onChange={(e) => setForm((p) => ({ ...p, account_type: e.target.value }))} placeholder="e.g. LLC, Corporation" /></div>
                <div className="form-field"><label className="label">Account Country</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.account_country} onChange={(e) => setForm((p) => ({ ...p, account_country: e.target.value.toUpperCase() }))} placeholder="ISO 2-letter (e.g. US)" /></div>
                <div className="form-field"><label className="label">Registration Number</label><input className="input ltr-input" dir="ltr" value={form.account_registration_number} onChange={(e) => setForm((p) => ({ ...p, account_registration_number: e.target.value }))} /></div>
                <div className="form-field"><label className="label">Tax ID</label><input className="input ltr-input" dir="ltr" value={form.account_tax_id} onChange={(e) => setForm((p) => ({ ...p, account_tax_id: e.target.value }))} /></div>
                <div className="form-field"><label className="label">Website</label><input className="input ltr-input" dir="ltr" value={form.account_website} onChange={(e) => setForm((p) => ({ ...p, account_website: e.target.value }))} placeholder="https://example.com" /></div>
              </div>
            </>
          )}
          <h4 className="section-title" style={{ marginTop: '16px', marginBottom: '12px' }}>Address & Compliance</h4>
          <div className="form-grid">
            <div className="form-field"><label className="label">Address ID</label><input type="number" className="input ltr-input" dir="ltr" value={form.address_id} onChange={(e) => setForm((p) => ({ ...p, address_id: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Country</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.address_country_code} onChange={(e) => setForm((p) => ({ ...p, address_country_code: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">Address City</label><input className="input" value={form.address_city} onChange={(e) => setForm((p) => ({ ...p, address_city: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Line 1</label><input className="input" value={form.address_line1} onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Postal Code</label><input className="input ltr-input" dir="ltr" value={form.address_postal_code} onChange={(e) => setForm((p) => ({ ...p, address_postal_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">PEP</label><select className="input" value={form.pep_status ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, pep_status: e.target.value === 'true' }))}><option value="false">No</option><option value="true">Yes</option></select></div>
            <div className="form-field"><label className="label">Sanctions Clear</label><select className="input" value={form.sanctions_clear ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, sanctions_clear: e.target.value === 'true' }))}><option value="true">Yes</option><option value="false">No</option></select></div>
            {editing ? (
              <div className="form-field"><label className="label">Verification</label><select className="input" value={form.verification_status} onChange={(e) => setForm((p) => ({ ...p, verification_status: e.target.value }))}>{BENEFICIAL_OWNER_VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            ) : null}
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
            <select
              className="input"
              value={selectedAccountUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('account_uuid', e.target.value);
                else params.delete('account_uuid');
                if (!routeLegalEntityUUID) params.delete('legal_entity_uuid');
                setSearchParams(params);
              }}
            >
              <option value="">Select Account</option>
              {accounts.map((account) => <option key={account.uuid} value={account.uuid}>{account.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={selectedLegalEntityUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('legal_entity_uuid', e.target.value);
                else params.delete('legal_entity_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedAccountUUID || !!routeLegalEntityUUID}
            >
              <option value="">Select Legal Entity</option>
              {legalEntities.map((le) => <option key={le.uuid} value={le.uuid}>{le.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name" /></div>
          <div className="filter-group"><select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="">Role (All)</option>{BENEFICIAL_OWNER_ROLES.map((role) => <option key={role} value={role}>{BENEFICIAL_OWNER_ROLE_LABELS[role] || role}</option>)}</select></div>
          <div className="filter-group"><select className="input" value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}><option value="">Verification (All)</option>{BENEFICIAL_OWNER_VERIFICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading beneficial owners...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>No beneficial owners found</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Role</th>
                  <th>Ownership %</th>
                  <th>Email</th>
                  <th>Nationality</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.first_name} {item.last_name}</td>
                    <td>{OWNER_ENTITY_TYPE_LABELS[item.owner_entity_type || 'individual'] || 'Individual'}</td>
                    <td>{BENEFICIAL_OWNER_ROLE_LABELS[item.role] || item.role}</td>
                    <td>{item.ownership_percentage}</td>
                    <td className="cell-mono">{item.email || '—'}</td>
                    <td className="cell-mono">{item.nationality}</td>
                    <td>{item.verification_status}</td>
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
        title="Delete Beneficial Owner"
        message={`Delete "${deleteTarget?.first_name} ${deleteTarget?.last_name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
