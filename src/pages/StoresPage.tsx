import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createStoreWithLocalizations,
  deleteStore,
  listStores,
  updateStoreWithLocalizations,
} from '../api/stores';
import { listMerchantAccounts } from '../api/merchantAccounts';
import { getSubMerchantAccount } from '../api/subMerchantAccounts';
import { listAccounts } from '../api/accounts';
import { listLegalEntities } from '../api/legalEntities';
import { listMerchants } from '../api/merchants';
import { listOrgEntityLocalizations } from '../api/orgEntityLocalizations';
import { listLocations } from '../api/locations';
import {
  listStoreLocationLinks,
  createStoreLocationLink,
  deleteStoreLocationLink,
} from '../api/storeLocationLinks';
import type { MerchantAccount } from '../types/merchantAccount';
import type { Account } from '../types/account';
import type { LegalEntity } from '../types/legalEntity';
import type { Merchant } from '../types/merchant';
import type { CreateStoreRequest, Store, UpdateStoreRequest } from '../types/store';
import type { LocalizationInput } from '../types/orgEntityLocalization';
import type { Location as AccountLocation } from '../types/location';
import type { StoreLocationLink } from '../types/storeLocationLink';
import { STORE_CHANNEL_TYPES, STORE_STATUSES, STORE_TYPES } from '../types/store';
import { LOCATION_TYPE_LABELS } from '../types/location';
import { STORE_LOCATION_ROLES, STORE_LOCATION_ROLE_LABELS } from '../types/storeLocationLink';
import { MOCK_TIMEZONES } from '../types/account';
import ConfirmDialog from '../components/ConfirmDialog';
import LocalizationsEditor, { ensureAtLeastOneLocalization } from '../components/LocalizationsEditor';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountsList.css';
import './AccountCreate.css';

export default function StoresPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { uuid: routeMerchantAccountUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const isSubMerchantRoute = location.pathname.startsWith('/sub-merchants/');
  const routeSubMerchantUUID = isSubMerchantRoute ? routeMerchantAccountUUID : '';
  const selectedAccountUUID = searchParams.get('account_uuid') || '';
  const selectedLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const selectedMerchantUUID = searchParams.get('merchant_uuid') || '';
  const selectedSubMerchantUUID = routeSubMerchantUUID || searchParams.get('sub_merchant_uuid') || '';
  const selectedMerchantAccountUUID = (!isSubMerchantRoute ? routeMerchantAccountUUID : '') || searchParams.get('merchant_account_uuid') || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
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
    address_id: '',
    address_country_code: 'IL',
    address_city: '',
    address_line1: '',
    address_postal_code: '',
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
  const [availableLocations, setAvailableLocations] = useState<AccountLocation[]>([]);
  const [storeLinks, setStoreLinks] = useState<StoreLocationLink[]>([]);
  const [linkForm, setLinkForm] = useState({ location_uuid: '', role: 'SALES', priority: 1 });
  const [linkSaving, setLinkSaving] = useState(false);
  const merchantAccounts = useMemo(
    () =>
      allMerchantAccounts.filter((account) => {
        if (selectedAccountUUID && account.account_uuid !== selectedAccountUUID) return false;
        if (selectedLegalEntityUUID && account.legal_entity_uuid !== selectedLegalEntityUUID) return false;
        if (selectedMerchantUUID && account.merchant_uuid !== selectedMerchantUUID) return false;
        return true;
      }),
    [allMerchantAccounts, selectedAccountUUID, selectedLegalEntityUUID, selectedMerchantUUID],
  );
  const selectedMerchantAccount =
    allMerchantAccounts.find((a) => a.uuid === selectedMerchantAccountUUID) || null;

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
          if (account?.account_uuid) params.set('account_uuid', account.account_uuid);
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
    if (selectedMerchantAccount.account_uuid) params.set('account_uuid', selectedMerchantAccount.account_uuid);
    if (selectedMerchantAccount.legal_entity_uuid) params.set('legal_entity_uuid', selectedMerchantAccount.legal_entity_uuid);
    if (selectedMerchantAccount.merchant_uuid) params.set('merchant_uuid', selectedMerchantAccount.merchant_uuid);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [selectedMerchantAccount, searchParams, setSearchParams]);

  const resolvedAccountUUID = selectedAccountUUID || selectedMerchantAccount?.account_uuid || '';
  useEffect(() => {
    if (!resolvedAccountUUID) {
      setAvailableLocations([]);
      return;
    }
    listLocations({ account_uuid: resolvedAccountUUID, status: 'ACTIVE', page: 1, page_size: 500 })
      .then((data) => setAvailableLocations(data.locations || []))
      .catch(() => setAvailableLocations([]));
  }, [resolvedAccountUUID]);

  const loadStoreLinks = useCallback(async (storeUUID: string) => {
    try {
      const data = await listStoreLocationLinks(storeUUID);
      setStoreLinks(data.store_location_links || []);
    } catch {
      setStoreLinks([]);
    }
  }, []);

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
    address_id: '',
    address_country_code: 'IL',
    address_city: '',
    address_line1: '',
    address_postal_code: '',
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
      address_id: s.address_id ? String(s.address_id) : '',
      address_country_code: 'IL',
      address_city: '',
      address_line1: '',
      address_postal_code: '',
      phone: s.phone || '',
      email: s.email || '',
    });
    try {
      const rows = await listOrgEntityLocalizations('store', s.uuid);
      setLocalizations(rows);
    } catch {
      resetLocalizations();
    }
    loadStoreLinks(s.uuid);
    setLinkForm({ location_uuid: '', role: 'SALES', priority: 1 });
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
      address_id: '',
      address_country_code: 'IL',
      address_city: `Tel Aviv ${rand}`,
      address_line1: `${rand} Main St`,
      address_postal_code: `${rand}`,
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

  const handleAddLink = async () => {
    if (!editing || !linkForm.location_uuid || !linkForm.role) {
      addToast('Select a location and role', 'error');
      return;
    }
    setLinkSaving(true);
    try {
      await createStoreLocationLink({
        store_uuid: editing.uuid,
        location_uuid: linkForm.location_uuid,
        role: linkForm.role,
        priority: Number(linkForm.priority) || 1,
      });
      addToast('Location linked', 'success');
      setLinkForm({ location_uuid: '', role: 'SALES', priority: 1 });
      loadStoreLinks(editing.uuid);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      addToast(`Failed to link location: ${msg}`, 'error');
    } finally {
      setLinkSaving(false);
    }
  };

  const handleRemoveLink = async (link: StoreLocationLink) => {
    setLinkSaving(true);
    try {
      await deleteStoreLocationLink({
        store_uuid: link.store_uuid,
        location_uuid: link.location_uuid,
        role: link.role,
      });
      addToast('Location unlinked', 'success');
      if (editing) loadStoreLinks(editing.uuid);
    } catch (error) {
      console.error(error);
      addToast('Failed to unlink location', 'error');
    } finally {
      setLinkSaving(false);
    }
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
        const payload: UpdateStoreRequest = {
          ...form,
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
          localizations: resolvedLocalizations,
        };
        await updateStoreWithLocalizations({
          ...payload,
          uuid: editing.uuid,
          localizations: resolvedLocalizations,
        });
        addToast('Store updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateStoreRequest = {
          ...form,
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
    <div className="accounts-page">
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
            <div className="form-field"><label className="label">Address ID</label><input className="input ltr-input" dir="ltr" value={form.address_id} onChange={(e) => setForm((p) => ({ ...p, address_id: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Country</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.address_country_code} onChange={(e) => setForm((p) => ({ ...p, address_country_code: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">Address City</label><input className="input" value={form.address_city} onChange={(e) => setForm((p) => ({ ...p, address_city: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Line 1</label><input className="input" value={form.address_line1} onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Address Postal Code</label><input className="input ltr-input" dir="ltr" value={form.address_postal_code} onChange={(e) => setForm((p) => ({ ...p, address_postal_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Timezone</label><select className="input" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}>{MOCK_TIMEZONES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field"><label className="label">Phone</label><input className="input ltr-input" dir="ltr" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Email</label><input className="input ltr-input" dir="ltr" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <LocalizationsEditor localizations={localizations} onChange={setLocalizations} />

          {editing && (
            <div style={{ marginTop: '20px' }}>
              <h4 className="section-title" style={{ marginBottom: '12px' }}>Linked Locations</h4>
              {storeLinks.length > 0 ? (
                <div className="table-wrapper" style={{ marginBottom: '16px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Role</th>
                        <th>Priority</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeLinks.map((link) => {
                        const loc = availableLocations.find((l) => l.uuid === link.location_uuid);
                        return (
                          <tr key={`${link.location_uuid}-${link.role}`}>
                            <td className="cell-name">{loc ? `${loc.name} (${LOCATION_TYPE_LABELS[loc.location_type] || loc.location_type})` : link.location_uuid}</td>
                            <td>{STORE_LOCATION_ROLE_LABELS[link.role] || link.role}</td>
                            <td>{link.priority}</td>
                            <td className="cell-actions">
                              <button className="action-btn delete" disabled={linkSaving} onClick={() => handleRemoveLink(link)}>🗑</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '12px' }}>No locations linked to this store</p>
              )}
              <div className="form-grid" style={{ alignItems: 'end' }}>
                <div className="form-field">
                  <label className="label">Location</label>
                  <select className="input" value={linkForm.location_uuid} onChange={(e) => setLinkForm((p) => ({ ...p, location_uuid: e.target.value }))}>
                    <option value="">Select location</option>
                    {availableLocations.map((loc) => (
                      <option key={loc.uuid} value={loc.uuid}>{loc.name} ({LOCATION_TYPE_LABELS[loc.location_type] || loc.location_type})</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="label">Role</label>
                  <select className="input" value={linkForm.role} onChange={(e) => setLinkForm((p) => ({ ...p, role: e.target.value }))}>
                    {STORE_LOCATION_ROLES.map((r) => <option key={r} value={r}>{STORE_LOCATION_ROLE_LABELS[r] || r}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="label">Priority</label>
                  <input type="number" min={1} className="input ltr-input" dir="ltr" value={linkForm.priority} onChange={(e) => setLinkForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
                </div>
                <div className="form-field">
                  <button type="button" className="btn btn-secondary" disabled={linkSaving || !linkForm.location_uuid} onClick={handleAddLink}>
                    {linkSaving ? 'Linking...' : 'Link Location'}
                  </button>
                </div>
              </div>
              {availableLocations.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '8px' }}>No locations available. Create locations for this account first.</p>
              )}
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCreate(false);
                setEditing(null);
                resetLocalizations();
                setStoreLinks([]);
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
              value={selectedAccountUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('account_uuid', e.target.value); else params.delete('account_uuid');
                params.delete('legal_entity_uuid');
                params.delete('merchant_uuid');
                params.delete('merchant_account_uuid');
                setSearchParams(params);
              }}
              disabled={!!selectedSubMerchantUUID}
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
                if (e.target.value) params.set('legal_entity_uuid', e.target.value); else params.delete('legal_entity_uuid');
                params.delete('merchant_uuid');
                params.delete('merchant_account_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedAccountUUID || !!selectedSubMerchantUUID}
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
                if (account?.account_uuid) params.set('account_uuid', account.account_uuid);
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
