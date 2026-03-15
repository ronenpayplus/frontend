import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createLegalEntityWithLocalizations,
  deleteLegalEntity,
  listLegalEntities,
  updateLegalEntityWithLocalizations,
} from '../api/legalEntities';
import { listAccounts } from '../api/accounts';
import { listOrgEntityLocalizations } from '../api/orgEntityLocalizations';
import type {
  CreateLegalEntityRequest,
  LegalEntity,
  UpdateLegalEntityRequest,
} from '../types/legalEntity';
import type { LocalizationInput } from '../types/orgEntityLocalization';
import {
  LEGAL_ENTITY_KYC_LABELS,
  LEGAL_ENTITY_STATUS_LABELS,
  LEGAL_ENTITY_TYPE_LABELS,
} from '../types/legalEntity';
import type { Account, Pagination } from '../types/account';
import LegalEntityForm from '../components/LegalEntityForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountsList.css';
import './AccountCreate.css';

export default function AccountLegalEntities() {
  const navigate = useNavigate();
  const { uuid: routeAccountUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedAccountUUID = searchParams.get('account_uuid') || routeAccountUUID || '';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [items, setItems] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLocalizations, setEditingLocalizations] = useState<LocalizationInput[]>([]);
  const [editing, setEditing] = useState<LegalEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LegalEntity | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0,
  });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const editUUID = searchParams.get('edit_uuid') || '';

  const page = Number(searchParams.get('page')) || 1;

  const headerTitle = useMemo(() => 'Legal Entities', []);
  const selectedAccountName = useMemo(
    () => accounts.find((c) => c.uuid === selectedAccountUUID)?.name || '',
    [accounts, selectedAccountUUID],
  );

  useEffect(() => {
    listAccounts({ page: 1, page_size: 200 })
      .then((data) => setAccounts(data.accounts || []))
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const fetchEntities = useCallback(async () => {
    let accountUUIDForQuery = selectedAccountUUID;
    let legalEntitySearch = search || undefined;
    const searchTerm = search.trim();

    if (!accountUUIDForQuery && searchTerm) {
      try {
        const accountsData = await listAccounts({
          search: searchTerm,
          page: 1,
          page_size: 50,
        });
        const resolvedAccount =
          accountsData.accounts.find((account) => account.number === searchTerm)
          || accountsData.accounts.find((account) => account.name === searchTerm)
          || accountsData.accounts[0];

        if (resolvedAccount?.uuid) {
          accountUUIDForQuery = resolvedAccount.uuid;
          // When search is used to resolve account context, do not also filter legal entities by the same term.
          legalEntitySearch = undefined;
          const params = new URLSearchParams(searchParams);
          params.set('account_uuid', resolvedAccount.uuid);
          params.set('page', String(page));
          if (searchTerm) params.set('search', searchTerm);
          if (params.toString() !== searchParams.toString()) {
            setSearchParams(params);
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (!accountUUIDForQuery) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await listLegalEntities({
        account_uuid: accountUUIDForQuery,
        search: legalEntitySearch,
        page,
        page_size: 10,
      });
      setItems(data.legal_entities ?? []);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      addToast('Failed to load legal entities', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountUUID, search, page, addToast, searchParams, setSearchParams]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  useEffect(() => {
    if (!editUUID || editing) return;
    const target = items.find((item) => item.uuid === editUUID);
    if (target) {
      setEditing(target);
      listOrgEntityLocalizations('legal_entity', target.uuid)
        .then((rows) => setEditingLocalizations(rows))
        .catch(() => setEditingLocalizations([]));
      setShowCreate(false);
    }
  }, [editUUID, items, editing]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (selectedAccountUUID) params.set('account_uuid', selectedAccountUUID);
    if (search) params.set('search', search);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleCreate = async (payload: CreateLegalEntityRequest | UpdateLegalEntityRequest) => {
    if (!selectedAccountUUID) return;
    setSaving(true);
    try {
      const data = payload as CreateLegalEntityRequest;
      const localizations = data.localizations || [{
        lang_code: 'en',
        display_name: data.legal_name,
        is_default: true,
      }];
      await createLegalEntityWithLocalizations({
        ...(data as CreateLegalEntityRequest),
        localizations,
      });
      addToast('Legal entity created successfully', 'success');
      setShowCreate(false);
      await fetchEntities();
    } catch (error) {
      console.error(error);
      addToast('Failed to create legal entity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: CreateLegalEntityRequest | UpdateLegalEntityRequest) => {
    if (!editing) return;
    setSaving(true);
    try {
      const data = payload as UpdateLegalEntityRequest;
      const localizations = data.localizations && data.localizations.length > 0
        ? data.localizations
        : [{
          lang_code: 'en',
          display_name: data.legal_name,
          is_default: true,
        }];
      await updateLegalEntityWithLocalizations({
        ...(data as UpdateLegalEntityRequest),
        uuid: editing.uuid,
        localizations,
      });
      addToast('Legal entity updated successfully', 'success');
      setEditing(null);
      setEditingLocalizations([]);
      const params = new URLSearchParams(searchParams);
      params.delete('edit_uuid');
      setSearchParams(params);
      await fetchEntities();
    } catch (error) {
      console.error(error);
      addToast('Failed to update legal entity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteLegalEntity(deleteTarget.uuid);
      addToast('Legal entity deleted successfully', 'success');
      setDeleteTarget(null);
      await fetchEntities();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete legal entity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (selectedAccountUUID) params.set('account_uuid', selectedAccountUUID);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleAccountChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    params.delete('edit_uuid');
    if (value) {
      params.set('account_uuid', value);
    } else {
      params.delete('account_uuid');
    }
    if (routeAccountUUID) {
      const query = params.toString();
      navigate(query ? `/legal-entities?${query}` : '/legal-entities');
    } else {
      setSearchParams(params);
    }
    setShowCreate(false);
    setEditing(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditingLocalizations([]);
    const params = new URLSearchParams(searchParams);
    params.delete('edit_uuid');
    setSearchParams(params);
  };

  return (
    <div className="accounts-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/accounts')}>
          Accounts
        </button>
        {selectedAccountUUID ? (
          <>
            <span className="breadcrumb-sep">/</span>
            <button
              className="breadcrumb-link"
              onClick={() => navigate(`/accounts/${selectedAccountUUID}`)}
            >
              {selectedAccountName || 'Account Details'}
            </button>
            <span className="breadcrumb-sep">/</span>
          </>
        ) : null}
        <span>{headerTitle}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{headerTitle}</h1>
          <p className="page-subtitle">
            {selectedAccountUUID
              ? `Selected account: ${selectedAccountName || selectedAccountUUID}`
              : 'Select a account to manage its legal entities'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate((prev) => !prev)}
          disabled={!selectedAccountUUID}
        >
          {showCreate ? 'Close Form' : 'New Entity'}
        </button>
      </div>

      {showCreate ? (
        <LegalEntityForm
          accountUUID={selectedAccountUUID}
          mode="create"
          loading={saving}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      {editing ? (
        <LegalEntityForm
          accountUUID={selectedAccountUUID}
          mode="edit"
          loading={saving}
          initial={editing}
          initialLocalizations={editingLocalizations}
          onSubmit={handleEdit}
          onCancel={closeEdit}
        />
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={handleSearch}>
          <div className="filter-group">
            <select
              className="input"
              value={selectedAccountUUID}
              onChange={(e) => handleAccountChange(e.target.value)}
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.uuid} value={account.uuid}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <input
              type="text"
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by legal name / Tax ID"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading legal entities...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No legal entities found</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Legal Name</th>
                    <th>Type</th>
                    <th>Tax ID</th>
                    <th>Country</th>
                    <th>KYC</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((entity) => (
                    <tr key={entity.uuid}>
                      <td className="cell-name">{entity.legal_name}</td>
                      <td>{LEGAL_ENTITY_TYPE_LABELS[entity.entity_type] ?? entity.entity_type}</td>
                      <td className="cell-mono">{entity.tax_id}</td>
                      <td className="cell-mono">{entity.country}</td>
                      <td>{LEGAL_ENTITY_KYC_LABELS[entity.kyc_status] ?? entity.kyc_status}</td>
                      <td>{LEGAL_ENTITY_STATUS_LABELS[entity.status] ?? entity.status}</td>
                      <td className="cell-date">
                        {new Date(entity.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="cell-actions">
                        <button
                          className="btn btn-outline btn-sm"
                          title="Manage compliance documents"
                          onClick={() =>
                            navigate(
                              `/legal-entities/${entity.uuid}/compliance-documents?account_uuid=${selectedAccountUUID}`,
                            )
                          }
                        >
                          Compliance Documents
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Manage beneficial owners"
                          onClick={() =>
                            navigate(
                              `/legal-entities/${entity.uuid}/beneficial-owners?account_uuid=${selectedAccountUUID}`,
                            )
                          }
                        >
                          Beneficial Owners
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Manage merchants"
                          onClick={() =>
                            navigate(
                              `/legal-entities/${entity.uuid}/merchants?account_uuid=${selectedAccountUUID}`,
                            )
                          }
                        >
                          Merchants
                        </button>
                        <button
                          className="action-btn edit"
                          title="Edit"
                          onClick={async () => {
                            setEditing(entity);
                            try {
                              const rows = await listOrgEntityLocalizations('legal_entity', entity.uuid);
                              setEditingLocalizations(rows);
                            } catch {
                              setEditingLocalizations([]);
                            }
                            const params = new URLSearchParams(searchParams);
                            params.set('edit_uuid', entity.uuid);
                            setSearchParams(params);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() => setDeleteTarget(entity)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.total_pages > 1 ? (
              <div className="pagination">
                <span className="pagination-info">
                  {pagination.total_items} results | page {pagination.page} of {pagination.total_pages}
                </span>
                <div className="pagination-btns">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Legal Entity"
        message={`Delete "${deleteTarget?.legal_name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
