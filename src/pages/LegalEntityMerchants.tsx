import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createMerchant,
  deleteMerchant,
  listMerchants,
  updateMerchant,
} from '../api/merchants';
import { listCompanies } from '../api/companies';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import type { LegalEntity } from '../types/legalEntity';
import type { CreateMerchantRequest, Merchant, UpdateMerchantRequest } from '../types/merchant';
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

  const selectedLegalEntityUUID = routeLegalEntityUUID || searchParams.get('legal_entity_uuid') || '';
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
  const [items, setItems] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const page = Number(searchParams.get('page')) || 1;

  useEffect(() => {
    const loadLegalEntities = async () => {
      try {
        const companyUUID = searchParams.get('company_uuid') || '';

        if (companyUUID) {
          const data = await listLegalEntities({ company_uuid: companyUUID, page: 1, page_size: 200 });
          setLegalEntities(data.legal_entities || []);
          return;
        }

        // When no specific company filter is provided, aggregate legal entities
        // from all companies so the selector still has options.
        const companiesData = await listCompanies({ page: 1, page_size: 200 });
        const unique = new Map<string, LegalEntity>();

        await Promise.all(
          (companiesData.companies || []).map(async (company) => {
            try {
              const data = await listLegalEntities({ company_uuid: company.uuid, page: 1, page_size: 200 });
              (data.legal_entities || []).forEach((le) => unique.set(le.uuid, le));
            } catch {
              // Keep going even if one company fails.
            }
          }),
        );

        setLegalEntities(Array.from(unique.values()));
      } catch {
        setLegalEntities([]);
      }
    };

    loadLegalEntities();
  }, [searchParams]);

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
    setLegalEntities((prev) => {
      if (prev.some((x) => x.uuid === selectedLegalEntity.uuid)) return prev;
      return [selectedLegalEntity, ...prev];
    });
  }, [selectedLegalEntity]);

  useEffect(() => {
    if (routeLegalEntityUUID || selectedLegalEntityUUID || legalEntities.length === 0) return;
    const params = new URLSearchParams(searchParams);
    params.set('legal_entity_uuid', legalEntities[0].uuid);
    params.set('page', '1');
    setSearchParams(params);
  }, [routeLegalEntityUUID, selectedLegalEntityUUID, legalEntities, searchParams, setSearchParams]);

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
      addToast('שגיאה בטעינת סוחרים', 'error');
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
        ? `ישות משפטית נבחרת: ${selectedLegalEntity.legal_name}`
        : 'בחר ישות משפטית כדי לנהל את הסוחרים שלה',
    [selectedLegalEntity],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (selectedLegalEntityUUID) params.set('legal_entity_uuid', selectedLegalEntityUUID);
    if (search) params.set('search', search);
    setSearchParams(params);
  };

  const handleCreate = async (payload: CreateMerchantRequest | UpdateMerchantRequest) => {
    if (!selectedLegalEntityUUID) return;
    setSaving(true);
    try {
      await createMerchant(payload as CreateMerchantRequest);
      addToast('סוחר נוצר בהצלחה', 'success');
      setShowCreate(false);
      await fetchMerchants();
    } catch (error) {
      console.error(error);
      addToast('יצירת סוחר נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: CreateMerchantRequest | UpdateMerchantRequest) => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateMerchant(editing.uuid, payload as UpdateMerchantRequest);
      addToast('סוחר עודכן בהצלחה', 'success');
      setEditing(null);
      await fetchMerchants();
    } catch (error) {
      console.error(error);
      addToast('עדכון סוחר נכשל', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteMerchant(deleteTarget.uuid);
      addToast('סוחר נמחק בהצלחה', 'success');
      setDeleteTarget(null);
      await fetchMerchants();
    } catch (error) {
      console.error(error);
      addToast('מחיקת סוחר נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/legal-entities')}>
          ישויות משפטיות
        </button>
        <span className="breadcrumb-sep">/</span>
        <span>סוחרים</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">סוחרים</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedLegalEntityUUID}
          onClick={() => setShowCreate((p) => !p)}
        >
          {showCreate ? 'סגור טופס' : 'סוחר חדש'}
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
          onSubmit={handleEdit}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={handleSearch}>
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
              disabled={!!routeLegalEntityUUID}
            >
              <option value="">בחר ישות משפטית</option>
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
              placeholder="חיפוש לפי שם / Merchant Code"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            חיפוש
          </button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>טוען סוחרים...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>לא נמצאו סוחרים</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>Merchant Code</th>
                  <th>Business Model</th>
                  <th>סטטוס</th>
                  <th>Email</th>
                  <th>פעולות</th>
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
                        חשבונות סוחר
                      </button>
                      <button className="action-btn edit" onClick={() => setEditing(m)} title="עריכה">
                        ✎
                      </button>
                      <button className="action-btn delete" onClick={() => setDeleteTarget(m)} title="מחיקה">
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
        title="מחיקת סוחר"
        message={`למחוק את "${deleteTarget?.name}"?`}
        confirmLabel="מחק"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
