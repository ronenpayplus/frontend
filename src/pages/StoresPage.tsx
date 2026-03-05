import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createStoreWithLocalizations,
  deleteStore,
  listStores,
  updateStore,
  updateStoreWithLocalizations,
} from '../api/stores';
import { listMerchantAccounts } from '../api/merchantAccounts';
import { getSubMerchantAccount } from '../api/subMerchantAccounts';
import { listCompanies } from '../api/companies';
import { listLegalEntities } from '../api/legalEntities';
import { listMerchants } from '../api/merchants';
import { listOrgEntityLocalizations } from '../api/orgEntityLocalizations';
import type { MerchantAccount } from '../types/merchantAccount';
import type { Company } from '../types/company';
import type { LegalEntity } from '../types/legalEntity';
import type { Merchant } from '../types/merchant';
import type { CreateStoreRequest, Store, UpdateStoreRequest } from '../types/store';
import type { LocalizationInput } from '../types/orgEntityLocalization';
import { STORE_CHANNEL_TYPES, STORE_STATUSES, STORE_TYPES } from '../types/store';
import { MOCK_TIMEZONES } from '../types/company';
import ConfirmDialog from '../components/ConfirmDialog';
import LocalizationsEditor, { ensureAtLeastOneLocalization } from '../components/LocalizationsEditor';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function StoresPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uuid: routeMerchantAccountUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const isSubMerchantRoute = location.pathname.startsWith('/sub-merchants/');
  const routeSubMerchantUUID = isSubMerchantRoute ? routeMerchantAccountUUID : '';
  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const selectedLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const selectedMerchantUUID = searchParams.get('merchant_uuid') || '';
  const selectedSubMerchantUUID = routeSubMerchantUUID || searchParams.get('sub_merchant_uuid') || '';
  const selectedMerchantAccountUUID = (!isSubMerchantRoute ? routeMerchantAccountUUID : '') || searchParams.get('merchant_account_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [allMerchantAccounts, setAllMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [subMerchantName, setSubMerchantName] = useState('');
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
  const [localizations, setLocalizations] = useState<LocalizationInput[]>([
    {
      lang_code: 'en',
      display_name: '',
      brand_name: '',
      description: '',
      support_email: '',
      support_phone: '',
      is_default: true,
    },
  ]);
  const merchantAccounts = useMemo(
    () =>
      allMerchantAccounts.filter((account) => {
        if (selectedCompanyUUID && account.company_uuid !== selectedCompanyUUID) return false;
        if (selectedLegalEntityUUID && account.legal_entity_uuid !== selectedLegalEntityUUID) return false;
        if (selectedMerchantUUID && account.merchant_uuid !== selectedMerchantUUID) return false;
        return true;
      }),
    [allMerchantAccounts, selectedCompanyUUID, selectedLegalEntityUUID, selectedMerchantUUID],
  );
  const selectedMerchantAccount =
    allMerchantAccounts.find((a) => a.uuid === selectedMerchantAccountUUID) || null;

  useEffect(() => {
    listCompanies({ page: 1, page_size: 300 })
      .then((data) => setCompanies(data.companies || []))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    if (!selectedCompanyUUID) {
      setLegalEntities([]);
      return;
    }
    listLegalEntities({ company_uuid: selectedCompanyUUID, page: 1, page_size: 300 })
      .then((data) => setLegalEntities(data.legal_entities || []))
      .catch(() => setLegalEntities([]));
  }, [selectedCompanyUUID]);

  useEffect(() => {
    if (!selectedLegalEntityUUID) {
      setMerchants([]);
      return;
    }
    listMerchants({ legal_entity_uuid: selectedLegalEntityUUID, page: 1, page_size: 300 })
      .then((data) => setMerchants(data.merchants || []))
      .catch(() => setMerchants([]));
  }, [selectedLegalEntityUUID]);

  useEffect(() => {
    listMerchantAccounts({ page: 1, page_size: 500 })
      .then((data) => setAllMerchantAccounts(data.merchant_accounts || []))
      .catch(() => setAllMerchantAccounts([]));
  }, []);

  useEffect(() => {
    if (!selectedSubMerchantUUID) {
      setSubMerchantName('');
      return;
    }
    getSubMerchantAccount(selectedSubMerchantUUID)
      .then((data) => {
        setSubMerchantName(data.sub_merchant_account.name);
        const accountUUID = data.sub_merchant_account.merchant_account_uuid;
        const current = searchParams.get('merchant_account_uuid') || '';
        if (!current || current !== accountUUID) {
          const account = allMerchantAccounts.find((a) => a.uuid === accountUUID) || null;
          const params = new URLSearchParams(searchParams);
          params.set('merchant_account_uuid', accountUUID);
          params.set('sub_merchant_uuid', selectedSubMerchantUUID);
          if (account?.company_uuid) params.set('company_uuid', account.company_uuid);
          if (account?.legal_entity_uuid) params.set('legal_entity_uuid', account.legal_entity_uuid);
          if (account?.merchant_uuid) params.set('merchant_uuid', account.merchant_uuid);
          if (params.toString() !== searchParams.toString()) {
            setSearchParams(params);
          }
        }
      })
      .catch(() => setSubMerchantName(''));
  }, [selectedSubMerchantUUID, searchParams, setSearchParams, allMerchantAccounts]);

  useEffect(() => {
    if (!selectedMerchantAccount) return;
    const params = new URLSearchParams(searchParams);
    if (selectedMerchantAccount.company_uuid) params.set('company_uuid', selectedMerchantAccount.company_uuid);
    if (selectedMerchantAccount.legal_entity_uuid) params.set('legal_entity_uuid', selectedMerchantAccount.legal_entity_uuid);
    if (selectedMerchantAccount.merchant_uuid) params.set('merchant_uuid', selectedMerchantAccount.merchant_uuid);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [selectedMerchantAccount, searchParams, setSearchParams]);

  useEffect(() => {
    if ((!isSubMerchantRoute && routeMerchantAccountUUID) || selectedMerchantAccountUUID || merchantAccounts.length === 0) return;
    const params = new URLSearchParams(searchParams);
    params.set('merchant_account_uuid', merchantAccounts[0].uuid);
    if (selectedSubMerchantUUID) params.set('sub_merchant_uuid', selectedSubMerchantUUID);
    setSearchParams(params);
  }, [routeMerchantAccountUUID, selectedMerchantAccountUUID, merchantAccounts, searchParams, setSearchParams, selectedSubMerchantUUID, isSubMerchantRoute]);

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
      addToast('Failed to load stores', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMerchantAccountUUID, search, addToast]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const selectedAccountName = useMemo(
    () => selectedMerchantAccount?.name || '',
    [selectedMerchantAccount],
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
  const resetLocalizations = () =>
    setLocalizations([
      {
        lang_code: 'en',
        display_name: '',
        brand_name: '',
        description: '',
        support_email: '',
        support_phone: '',
        is_default: true,
      },
    ]);

  const startEdit = async (s: Store) => {
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
    try {
      const rows = await listOrgEntityLocalizations('store', s.uuid);
      setLocalizations(rows);
    } catch {
      resetLocalizations();
    }
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
    setLocalizations([
      {
        lang_code: 'en',
        display_name: `Store ${rand}`,
        brand_name: `Store ${rand}`,
        description: 'English localization',
        support_email: `store-${rand}@example.com`,
        support_phone: `+1-202-555-${String(rand).slice(-4)}`,
        is_default: true,
      },
      {
        lang_code: 'fr',
        display_name: `Magasin ${rand}`,
        brand_name: `Magasin ${rand}`,
        description: 'French localization',
        support_email: `assistance-${rand}@example.com`,
        support_phone: `+33-1-${String(rand).slice(-4)}-1000`,
        is_default: false,
      },
    ]);
  };

  const save = async () => {
    if (!selectedMerchantAccountUUID || !form.name || !form.store_code) {
      addToast('Merchant account selection and required fields are mandatory', 'error');
      return;
    }
    setSaving(true);
    try {
      const resolvedLocalizations = ensureAtLeastOneLocalization(localizations, form.name);
      if (editing) {
        const payload: UpdateStoreRequest = { ...form, localizations: resolvedLocalizations };
        await updateStore(editing.uuid, payload);
        await updateStoreWithLocalizations({ uuid: editing.uuid, localizations: resolvedLocalizations });
        addToast('Store updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateStoreRequest = {
          ...form,
          merchant_account_uuid: selectedMerchantAccountUUID,
          localizations: resolvedLocalizations,
        };
        await createStoreWithLocalizations({
          ...payload,
          localizations: resolvedLocalizations,
        });
        addToast('Store created', 'success');
        setShowCreate(false);
      }
      resetForm();
      resetLocalizations();
      await fetchStores();
    } catch (error) {
      console.error(error);
      addToast('Failed to save store', 'error');
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
      addToast('Store deleted', 'success');
      await fetchStores();
    } catch {
      addToast('Failed to delete store', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        {selectedSubMerchantUUID ? (
          <>
            <button className="breadcrumb-link" onClick={() => navigate('/sub-merchants')}>Sub Merchants</button>
            <span className="breadcrumb-sep">/</span>
          </>
        ) : (
          <>
            <button className="breadcrumb-link" onClick={() => navigate('/merchant-accounts')}>Merchant Accounts</button>
            <span className="breadcrumb-sep">/</span>
          </>
        )}
        <span>Stores</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Stores</h1>
          <p className="page-subtitle">
            {selectedSubMerchantUUID
              ? `Sub merchant: ${subMerchantName || selectedSubMerchantUUID} | Account: ${selectedAccountName || selectedMerchantAccountUUID}`
              : selectedAccountName
                ? `Selected account: ${selectedAccountName}`
                : 'Select Merchant Account'}
          </p>
        </div>
        <button className="btn btn-primary" disabled={!selectedMerchantAccountUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'Close Form' : 'New Store'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillStoreForm}>
              Quick Fill
            </button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Store' : 'Create Store'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Store Code *</label><input className="input ltr-input" dir="ltr" value={form.store_code} onChange={(e) => setForm((p) => ({ ...p, store_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Store Type</label><select className="input" value={form.store_type} onChange={(e) => setForm((p) => ({ ...p, store_type: e.target.value }))}>{STORE_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Channel</label><select className="input" value={form.channel_type} onChange={(e) => setForm((p) => ({ ...p, channel_type: e.target.value }))}>{STORE_CHANNEL_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{STORE_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Timezone</label><select className="input" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{MOCK_TIMEZONES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Phone</label><input className="input ltr-input" dir="ltr" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Email</label><input className="input ltr-input" dir="ltr" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <LocalizationsEditor localizations={localizations} onChange={setLocalizations} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreate(false);
                setEditing(null);
                resetLocalizations();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchStores(); }}>
          <div className="filter-group">
            <select
              className="input"
              value={selectedCompanyUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('company_uuid', e.target.value); else params.delete('company_uuid');
                params.delete('legal_entity_uuid');
                params.delete('merchant_uuid');
                params.delete('merchant_account_uuid');
                setSearchParams(params);
              }}
              disabled={!!selectedSubMerchantUUID}
            >
              <option value="">Select Company</option>
              {companies.map((company) => <option key={company.uuid} value={company.uuid}>{company.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={selectedLegalEntityUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('legal_entity_uuid', e.target.value); else params.delete('legal_entity_uuid');
                params.delete('merchant_uuid');
                params.delete('merchant_account_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedCompanyUUID || !!selectedSubMerchantUUID}
            >
              <option value="">Select Legal Entity</option>
              {legalEntities.map((entity) => <option key={entity.uuid} value={entity.uuid}>{entity.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={selectedMerchantUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('merchant_uuid', e.target.value); else params.delete('merchant_uuid');
                params.delete('merchant_account_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedLegalEntityUUID || !!selectedSubMerchantUUID}
            >
              <option value="">Select Merchant</option>
              {merchants.map((merchant) => <option key={merchant.uuid} value={merchant.uuid}>{merchant.name || merchant.uuid}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedMerchantAccountUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_account_uuid', e.target.value); else params.delete('merchant_account_uuid');
              if (e.target.value) {
                const account = allMerchantAccounts.find((a) => a.uuid === e.target.value) || null;
                if (account?.company_uuid) params.set('company_uuid', account.company_uuid);
                if (account?.legal_entity_uuid) params.set('legal_entity_uuid', account.legal_entity_uuid);
                if (account?.merchant_uuid) params.set('merchant_uuid', account.merchant_uuid);
              }
              setSearchParams(params);
            }} disabled={!!routeMerchantAccountUUID || !!selectedSubMerchantUUID}>
              <option value="">Select Merchant Account</option>
              {merchantAccounts.map((a) => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" /></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>Loading stores...</span></div> : items.length === 0 ? <div className="empty-state"><p>No stores found</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Channel</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.uuid}>
                    <td className="cell-name">{s.name}</td>
                    <td className="cell-mono">{s.store_code}</td>
                    <td>{s.store_type}</td>
                    <td>{s.channel_type}</td>
                    <td>{s.status}</td>
                    <td className="cell-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/stores/${s.uuid}/terminal-groups?merchant_account_uuid=${selectedMerchantAccountUUID}`)}>Terminal Groups</button>
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
        title="Delete Store"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
