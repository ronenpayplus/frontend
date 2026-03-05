import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createTerminalGroup, deleteTerminalGroup, listTerminalGroups, updateTerminalGroup } from '../api/terminalGroups';
import { getStore, listStores } from '../api/stores';
import { listMerchantAccounts } from '../api/merchantAccounts';
import { listCompanies } from '../api/companies';
import { listLegalEntities } from '../api/legalEntities';
import { listMerchants } from '../api/merchants';
import type { Store } from '../types/store';
import type { MerchantAccount } from '../types/merchantAccount';
import type { Company } from '../types/company';
import type { LegalEntity } from '../types/legalEntity';
import type { Merchant } from '../types/merchant';
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

  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const selectedLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const selectedMerchantUUID = searchParams.get('merchant_uuid') || '';
  const selectedMerchantAccountUUID = searchParams.get('merchant_account_uuid') || '';
  const selectedStoreUUID = routeStoreUUID || searchParams.get('store_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [allMerchantAccounts, setAllMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<TerminalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<TerminalGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TerminalGroup | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [form, setForm] = useState({ name: '', description: '', status: 'ACTIVE' });
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
  const selectedStore = stores.find((s) => s.uuid === selectedStoreUUID) || null;
  const selectedStoreAccount =
    allMerchantAccounts.find((a) => a.uuid === (selectedStore?.merchant_account_uuid || selectedMerchantAccountUUID)) || null;

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
    if (!selectedMerchantAccountUUID) {
      setStores([]);
      return;
    }
    listStores({ merchant_account_uuid: selectedMerchantAccountUUID, page: 1, page_size: 500 })
      .then((data) => setStores(data.stores || []))
      .catch(() => setStores([]));
  }, [selectedMerchantAccountUUID]);

  useEffect(() => {
    if (!selectedStoreUUID) return;
    if (stores.some((store) => store.uuid === selectedStoreUUID)) return;
    getStore(selectedStoreUUID)
      .then((data) => {
        const store = data.store;
        if (!store?.uuid) return;
        setStores((prev) => (prev.some((x) => x.uuid === store.uuid) ? prev : [store, ...prev]));
        if (store.merchant_account_uuid && store.merchant_account_uuid !== selectedMerchantAccountUUID) {
          const params = new URLSearchParams(searchParams);
          params.set('merchant_account_uuid', store.merchant_account_uuid);
          params.set('store_uuid', store.uuid);
          setSearchParams(params);
        }
      })
      .catch(() => {
        // ignore if store fetch fails
      });
  }, [selectedStoreUUID, stores, selectedMerchantAccountUUID, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedStore || !selectedStoreAccount) return;
    const params = new URLSearchParams(searchParams);
    if (selectedStoreAccount.company_uuid) params.set('company_uuid', selectedStoreAccount.company_uuid);
    if (selectedStoreAccount.legal_entity_uuid) params.set('legal_entity_uuid', selectedStoreAccount.legal_entity_uuid);
    if (selectedStoreAccount.merchant_uuid) params.set('merchant_uuid', selectedStoreAccount.merchant_uuid);
    params.set('merchant_account_uuid', selectedStoreAccount.uuid);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [selectedStore, selectedStoreAccount, searchParams, setSearchParams]);

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
      addToast('Failed to load terminal groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedStoreUUID, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedStoreName = useMemo(
    () => selectedStore?.name || '',
    [selectedStore],
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
      addToast('Store selection and name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateTerminalGroupRequest = { ...form };
        await updateTerminalGroup(editing.uuid, payload);
        addToast('Terminal group updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateTerminalGroupRequest = { ...form, store_uuid: selectedStoreUUID };
        await createTerminalGroup(payload);
        addToast('Terminal group created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Failed to save terminal group', 'error');
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
      addToast('Terminal group deleted', 'success');
      await fetchItems();
    } catch {
      addToast('Failed to delete terminal group', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/stores')}>Stores</button>
        <span className="breadcrumb-sep">/</span>
        <span>Terminal Groups</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Terminal Groups</h1>
          <p className="page-subtitle">{selectedStoreName ? `Selected store: ${selectedStoreName}` : 'Select a store'}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedStoreUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'Close Form' : 'New Group'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillTerminalGroupForm}>
              Quick Fill
            </button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Terminal Group' : 'Create Terminal Group'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Name *</label><input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Status</label><select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>{TERMINAL_GROUP_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
            <div className="form-field span-full"><label className="label">Description</label><textarea className="input textarea" rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select className="input" value={selectedCompanyUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('company_uuid', e.target.value); else params.delete('company_uuid');
              params.delete('legal_entity_uuid');
              params.delete('merchant_uuid');
              params.delete('merchant_account_uuid');
              if (!routeStoreUUID) params.delete('store_uuid');
              setSearchParams(params);
            }}>
              <option value="">Select Company</option>
              {companies.map((company) => <option key={company.uuid} value={company.uuid}>{company.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedLegalEntityUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('legal_entity_uuid', e.target.value); else params.delete('legal_entity_uuid');
              params.delete('merchant_uuid');
              params.delete('merchant_account_uuid');
              if (!routeStoreUUID) params.delete('store_uuid');
              setSearchParams(params);
            }} disabled={!selectedCompanyUUID}>
              <option value="">Select Legal Entity</option>
              {legalEntities.map((entity) => <option key={entity.uuid} value={entity.uuid}>{entity.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedMerchantUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_uuid', e.target.value); else params.delete('merchant_uuid');
              params.delete('merchant_account_uuid');
              if (!routeStoreUUID) params.delete('store_uuid');
              setSearchParams(params);
            }} disabled={!selectedLegalEntityUUID}>
              <option value="">Select Merchant</option>
              {merchants.map((merchant) => <option key={merchant.uuid} value={merchant.uuid}>{merchant.name || merchant.uuid}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedMerchantAccountUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_account_uuid', e.target.value); else params.delete('merchant_account_uuid');
              if (!routeStoreUUID) params.delete('store_uuid');
              setSearchParams(params);
            }} disabled={!selectedMerchantUUID}>
              <option value="">Select Merchant Account</option>
              {merchantAccounts.map((account) => <option key={account.uuid} value={account.uuid}>{account.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedStoreUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('store_uuid', e.target.value); else params.delete('store_uuid');
              setSearchParams(params);
            }} disabled={!!routeStoreUUID || (!selectedMerchantAccountUUID && !selectedStoreUUID)}>
              <option value="">Select Store</option>
              {stores.map((s) => <option key={s.uuid} value={s.uuid}>{s.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" /></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>Loading terminal groups...</span></div> : items.length === 0 ? <div className="empty-state"><p>No terminal groups found</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
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
                        Terminals
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
        title="Delete Terminal Group"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
