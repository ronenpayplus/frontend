import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createTerminal, deleteTerminal, listTerminals, updateTerminal } from '../api/terminals';
import { getTerminalGroup, listTerminalGroups } from '../api/terminalGroups';
import { getStore, listStores } from '../api/stores';
import { listMerchantAccounts } from '../api/merchantAccounts';
import { listAccounts } from '../api/accounts';
import { listLegalEntities } from '../api/legalEntities';
import { listMerchants } from '../api/merchants';
import type { TerminalGroup } from '../types/terminalGroup';
import type { Store } from '../types/store';
import type { MerchantAccount } from '../types/merchantAccount';
import type { Account } from '../types/account';
import type { LegalEntity } from '../types/legalEntity';
import type { Merchant } from '../types/merchant';
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
import './AccountsList.css';
import './AccountCreate.css';

export default function TerminalsPage() {
  const navigate = useNavigate();
  const { uuid: routeTerminalGroupUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedAccountUUID = searchParams.get('account_uuid') || '';
  const selectedLegalEntityUUID = searchParams.get('legal_entity_uuid') || '';
  const selectedMerchantUUID = searchParams.get('merchant_uuid') || '';
  const selectedMerchantAccountUUID = searchParams.get('merchant_account_uuid') || '';
  const selectedStoreUUID = searchParams.get('store_uuid') || '';
  const selectedTerminalGroupUUID = routeTerminalGroupUUID || searchParams.get('terminal_group_uuid') || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [allMerchantAccounts, setAllMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
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
  const selectedTerminalGroup = terminalGroups.find((g) => g.uuid === selectedTerminalGroupUUID) || null;
  const selectedStore = stores.find((s) => s.uuid === (selectedStoreUUID || selectedTerminalGroup?.store_uuid || '')) || null;
  const selectedStoreAccount =
    allMerchantAccounts.find((a) => a.uuid === (selectedStore?.merchant_account_uuid || selectedMerchantAccountUUID)) || null;

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
    if (!selectedMerchantAccountUUID) {
      setStores([]);
      return;
    }
    listStores({ merchant_account_uuid: selectedMerchantAccountUUID, page: 1, page_size: 500 })
      .then((data) => setStores(data.stores || []))
      .catch(() => setStores([]));
  }, [selectedMerchantAccountUUID]);

  useEffect(() => {
    if (!selectedStoreUUID) {
      setTerminalGroups([]);
      return;
    }
    listTerminalGroups({ store_uuid: selectedStoreUUID, page: 1, page_size: 500 })
      .then((data) => setTerminalGroups(data.terminal_groups || []))
      .catch(() => setTerminalGroups([]));
  }, [selectedStoreUUID]);

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
        // ignore store fallback failure
      });
  }, [selectedStoreUUID, stores, selectedMerchantAccountUUID, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedTerminalGroupUUID) return;
    if (terminalGroups.some((group) => group.uuid === selectedTerminalGroupUUID)) return;
    getTerminalGroup(selectedTerminalGroupUUID)
      .then((data) => {
        const group = data.terminal_group;
        if (!group?.uuid) return;
        setTerminalGroups((prev) => (prev.some((x) => x.uuid === group.uuid) ? prev : [group, ...prev]));
        if (group.store_uuid && group.store_uuid !== selectedStoreUUID) {
          const params = new URLSearchParams(searchParams);
          params.set('store_uuid', group.store_uuid);
          params.set('terminal_group_uuid', group.uuid);
          setSearchParams(params);
        }
      })
      .catch(() => {
        // ignore terminal-group fallback failure
      });
  }, [selectedTerminalGroupUUID, terminalGroups, selectedStoreUUID, searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedTerminalGroup || !selectedStore || !selectedStoreAccount) return;
    const params = new URLSearchParams(searchParams);
    if (selectedStoreAccount.account_uuid) params.set('account_uuid', selectedStoreAccount.account_uuid);
    if (selectedStoreAccount.legal_entity_uuid) params.set('legal_entity_uuid', selectedStoreAccount.legal_entity_uuid);
    if (selectedStoreAccount.merchant_uuid) params.set('merchant_uuid', selectedStoreAccount.merchant_uuid);
    params.set('merchant_account_uuid', selectedStoreAccount.uuid);
    params.set('store_uuid', selectedStore.uuid);
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [selectedTerminalGroup, selectedStore, selectedStoreAccount, searchParams, setSearchParams]);

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
      addToast('Failed to load terminals', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTerminalGroupUUID, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selectedGroupName = useMemo(
    () => selectedTerminalGroup?.name || '',
    [selectedTerminalGroup],
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
      addToast('Terminal group and terminal code are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const payload: UpdateTerminalRequest = { ...form };
        await updateTerminal(editing.uuid, payload);
        addToast('Terminal updated', 'success');
        setEditing(null);
      } else {
        const payload: CreateTerminalRequest = { ...form, terminal_group_uuid: selectedTerminalGroupUUID };
        await createTerminal(payload);
        addToast('Terminal created', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('Failed to save terminal', 'error');
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
      addToast('Terminal deleted', 'success');
      await fetchItems();
    } catch {
      addToast('Failed to delete terminal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="accounts-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/terminal-groups')}>Terminal Groups</button>
        <span className="breadcrumb-sep">/</span>
        <span>Terminals</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Terminals</h1>
          <p className="page-subtitle">{selectedGroupName ? `Selected group: ${selectedGroupName}` : 'Select terminal group'}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedTerminalGroupUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'Close Form' : 'New Terminal'}
        </button>
      </div>

      {(showCreate || editing) ? (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFillTerminalForm}>
              Quick Fill
            </button>
          </div>
          <h3 className="section-title">{editing ? 'Edit Terminal' : 'Create Terminal'}</h3>
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
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</button>
          </div>
        </div>
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select className="input" value={selectedAccountUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('account_uuid', e.target.value); else params.delete('account_uuid');
              params.delete('legal_entity_uuid');
              params.delete('merchant_uuid');
              params.delete('merchant_account_uuid');
              params.delete('store_uuid');
              if (!routeTerminalGroupUUID) params.delete('terminal_group_uuid');
              setSearchParams(params);
            }}>
              <option value="">Select Account</option>
              {accounts.map((account) => <option key={account.uuid} value={account.uuid}>{account.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedLegalEntityUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('legal_entity_uuid', e.target.value); else params.delete('legal_entity_uuid');
              params.delete('merchant_uuid');
              params.delete('merchant_account_uuid');
              params.delete('store_uuid');
              if (!routeTerminalGroupUUID) params.delete('terminal_group_uuid');
              setSearchParams(params);
            }} disabled={!selectedAccountUUID}>
              <option value="">Select Legal Entity</option>
              {legalEntities.map((entity) => <option key={entity.uuid} value={entity.uuid}>{entity.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedMerchantUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('merchant_uuid', e.target.value); else params.delete('merchant_uuid');
              params.delete('merchant_account_uuid');
              params.delete('store_uuid');
              if (!routeTerminalGroupUUID) params.delete('terminal_group_uuid');
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
              params.delete('store_uuid');
              if (!routeTerminalGroupUUID) params.delete('terminal_group_uuid');
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
              if (!routeTerminalGroupUUID) params.delete('terminal_group_uuid');
              setSearchParams(params);
            }} disabled={!selectedMerchantAccountUUID}>
              <option value="">Select Store</option>
              {stores.map((store) => <option key={store.uuid} value={store.uuid}>{store.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedTerminalGroupUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('terminal_group_uuid', e.target.value); else params.delete('terminal_group_uuid');
              setSearchParams(params);
            }} disabled={!!routeTerminalGroupUUID || (!selectedStoreUUID && !selectedTerminalGroupUUID)}>
              <option value="">Select Terminal Group</option>
              {terminalGroups.map((g) => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" /></div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? <div className="loading-state"><div className="spinner" /><span>Loading terminals...</span></div> : items.length === 0 ? <div className="empty-state"><p>No terminals found</p></div> : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Code</th><th>Type</th><th>Status</th><th>Device</th><th>User</th><th>Actions</th></tr></thead>
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
        title="Delete Terminal"
        message={`Delete "${deleteTarget?.terminal_code}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
