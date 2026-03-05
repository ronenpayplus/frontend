import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createMerchant,
  createMerchantWithLocalizations,
  deleteMerchant,
  listMerchants,
  updateMerchant,
  updateMerchantWithLocalizations,
} from '../api/merchants';
import { listCompanies } from '../api/companies';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import { listOrgEntityLocalizations } from '../api/orgEntityLocalizations';
import type { Company } from '../types/company';
import type { LegalEntity } from '../types/legalEntity';
import type { CreateMerchantRequest, Merchant, UpdateMerchantRequest } from '../types/merchant';
import type { LocalizationInput } from '../types/orgEntityLocalization';
import { MERCHANT_BUSINESS_MODEL_LABELS } from '../types/merchant';
import { STATUS_LABELS } from '../types/company';
import MerchantForm from '../components/MerchantForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function LegalEntityMerchants() {
  const navigate = useNavigate();
  const { uuid: routeLegalEntityUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const selectedLegalEntityUUID = routeLegalEntityUUID || searchParams.get('legal_entity_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
  const [items, setItems] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLocalizations, setEditingLocalizations] = useState<LocalizationInput[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const page = Number(searchParams.get('page')) || 1;

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
      setSelectedLegalEntity(null);
      return;
    }
    getLegalEntity(selectedLegalEntityUUID)
      .then((data) => setSelectedLegalEntity(data.legal_entity))
      .catch(() => {
        setSelectedLegalEntity(null);
      });
  }, [selectedLegalEntityUUID]);

  useEffect(() => {
    if (!selectedLegalEntity) return;
    const params = new URLSearchParams(searchParams);
    if (selectedLegalEntity.company_uuid && selectedLegalEntity.company_uuid !== selectedCompanyUUID) {
      params.set('company_uuid', selectedLegalEntity.company_uuid);
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
  }, [selectedLegalEntity, selectedCompanyUUID, searchParams, setSearchParams]);

  const fetchMerchants = useCallback(async () => {
    if (!selectedLegalEntityUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listMerchants({
        legal_entity_uuid: selectedLegalEntityUUID,
        search: search || undefined,
        page,
        page_size: 10,
      });
      setItems(data.merchants || []);
    } catch (error) {
      console.error(error);
      addToast('Failed to load merchants', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedLegalEntityUUID, search, page, addToast]);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const subtitle = useMemo(
    () =>
      selectedLegalEntity
        ? `Selected legal entity: ${selectedLegalEntity.legal_name}`
        : 'Select a legal entity to manage its merchants',
    [selectedLegalEntity],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (selectedCompanyUUID) params.set('company_uuid', selectedCompanyUUID);
    if (selectedLegalEntityUUID) params.set('legal_entity_uuid', selectedLegalEntityUUID);
    if (search) params.set('search', search);
    setSearchParams(params);
  };

  const handleCreate = async (payload: CreateMerchantRequest | UpdateMerchantRequest) => {
    if (!selectedLegalEntityUUID) return;
    setSaving(true);
    try {
      const data = payload as CreateMerchantRequest;
      const localizations = data.localizations || [];
      const base = { ...data };
      delete base.localizations;
      if (localizations.length > 0) {
        await createMerchantWithLocalizations({
          ...(base as CreateMerchantRequest),
          localizations,
        });
      } else {
        await createMerchant(base as CreateMerchantRequest);
      }
      addToast('Merchant created successfully', 'success');
      setShowCreate(false);
      await fetchMerchants();
    } catch (error) {
      console.error(error);
      addToast('Failed to create merchant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: CreateMerchantRequest | UpdateMerchantRequest) => {
    if (!editing) return;
    setSaving(true);
    try {
      const data = payload as UpdateMerchantRequest;
      const localizations = data.localizations || [];
      const base = { ...data };
      delete base.localizations;
      await updateMerchant(editing.uuid, { ...(base as UpdateMerchantRequest), uuid: editing.uuid });
      if (localizations.length > 0) {
        await updateMerchantWithLocalizations({
          uuid: editing.uuid,
          localizations,
        });
      }
      addToast('Merchant updated successfully', 'success');
      setEditing(null);
      setEditingLocalizations([]);
      await fetchMerchants();
    } catch (error) {
      console.error(error);
      addToast('Failed to update merchant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteMerchant(deleteTarget.uuid);
      addToast('Merchant deleted successfully', 'success');
      setDeleteTarget(null);
      await fetchMerchants();
    } catch (error) {
      console.error(error);
      addToast('Failed to delete merchant', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/legal-entities')}>
          Legal Entities
        </button>
        <span className="breadcrumb-sep">/</span>
        <span>Merchants</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Merchants</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedLegalEntityUUID}
          onClick={() => setShowCreate((p) => !p)}
        >
          {showCreate ? 'Close Form' : 'New Merchant'}
        </button>
      </div>

      {showCreate ? (
        <MerchantForm
          legalEntityUUID={selectedLegalEntityUUID}
          mode="create"
          loading={saving}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      {editing ? (
        <MerchantForm
          legalEntityUUID={selectedLegalEntityUUID}
          mode="edit"
          loading={saving}
          initial={editing}
          initialLocalizations={editingLocalizations}
          onSubmit={handleEdit}
          onCancel={() => {
            setEditing(null);
            setEditingLocalizations([]);
          }}
        />
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={handleSearch}>
          <div className="filter-group">
            <select
              className="input"
              value={selectedCompanyUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('company_uuid', e.target.value);
                else params.delete('company_uuid');
                if (!routeLegalEntityUUID) params.delete('legal_entity_uuid');
                params.set('page', '1');
                setSearchParams(params);
                setShowCreate(false);
                setEditing(null);
              }}
            >
              <option value="">Select Company</option>
              {companies.map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.name}
                </option>
              ))}
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
                params.set('page', '1');
                setSearchParams(params);
                setShowCreate(false);
                setEditing(null);
              }}
              disabled={!selectedCompanyUUID || !!routeLegalEntityUUID}
            >
              <option value="">Select Legal Entity</option>
              {legalEntities.map((le) => (
                <option key={le.uuid} value={le.uuid}>
                  {le.legal_name}
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
              placeholder="Search by name / Merchant Code"
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
            <span>Loading merchants...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>No merchants found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Merchant Code</th>
                  <th>Business Model</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.uuid}>
                    <td className="cell-name">{m.name}</td>
                    <td className="cell-mono">{m.merchant_code}</td>
                    <td>{MERCHANT_BUSINESS_MODEL_LABELS[m.business_model || ''] || m.business_model || '—'}</td>
                    <td>{STATUS_LABELS[m.status] || m.status}</td>
                    <td className="cell-mono">{m.contact_email || '—'}</td>
                    <td className="cell-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          navigate(
                            `/merchants/${m.uuid}/merchant-accounts?legal_entity_uuid=${selectedLegalEntityUUID}&company_uuid=${selectedLegalEntity?.company_uuid || ''}`,
                          )
                        }
                      >
                        Merchant Accounts
                      </button>
                      <button
                        className="action-btn edit"
                        onClick={async () => {
                          setEditing(m);
                          try {
                            const rows = await listOrgEntityLocalizations('merchant', m.uuid);
                            setEditingLocalizations(rows);
                          } catch {
                            setEditingLocalizations([]);
                          }
                        }}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(m)} title="Delete">
                        🗑
                      </button>
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
        title="Delete Merchant"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
