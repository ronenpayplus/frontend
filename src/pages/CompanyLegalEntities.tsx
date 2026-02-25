import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createLegalEntity,
  deleteLegalEntity,
  listLegalEntities,
  updateLegalEntity,
} from '../api/legalEntities';
import { listCompanies } from '../api/companies';
import type {
  CreateLegalEntityRequest,
  LegalEntity,
  UpdateLegalEntityRequest,
} from '../types/legalEntity';
import {
  LEGAL_ENTITY_KYC_LABELS,
  LEGAL_ENTITY_STATUS_LABELS,
  LEGAL_ENTITY_TYPE_LABELS,
} from '../types/legalEntity';
import type { Company, Pagination } from '../types/company';
import LegalEntityForm from '../components/LegalEntityForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

export default function CompanyLegalEntities() {
  const navigate = useNavigate();
  const { uuid: routeCompanyUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedCompanyUUID = routeCompanyUUID || searchParams.get('company_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [items, setItems] = useState<LegalEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const headerTitle = useMemo(() => 'ישויות משפטיות', []);
  const selectedCompanyName = useMemo(
    () => companies.find((c) => c.uuid === selectedCompanyUUID)?.name || '',
    [companies, selectedCompanyUUID],
  );

  useEffect(() => {
    listCompanies({ page: 1, page_size: 200 })
      .then((data) => setCompanies(data.companies || []))
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const fetchEntities = useCallback(async () => {
    if (!selectedCompanyUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listLegalEntities({
        company_uuid: selectedCompanyUUID,
        search: search || undefined,
        page,
        page_size: 10,
      });
      setItems(data.legal_entities ?? []);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת ישויות משפטיות', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyUUID, search, page, addToast]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  useEffect(() => {
    if (!editUUID || editing) return;
    const target = items.find((item) => item.uuid === editUUID);
    if (target) {
      setEditing(target);
      setShowCreate(false);
    }
  }, [editUUID, items, editing]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (selectedCompanyUUID) params.set('company_uuid', selectedCompanyUUID);
    if (search) params.set('search', search);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleCreate = async (payload: CreateLegalEntityRequest | UpdateLegalEntityRequest) => {
    if (!selectedCompanyUUID) return;
    setSaving(true);
    try {
      await createLegalEntity(payload as CreateLegalEntityRequest);
      addToast('ישות משפטית נוצרה בהצלחה', 'success');
      setShowCreate(false);
      await fetchEntities();
    } catch (error) {
      console.error(error);
      addToast('יצירת ישות משפטית נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: CreateLegalEntityRequest | UpdateLegalEntityRequest) => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateLegalEntity(editing.uuid, payload as UpdateLegalEntityRequest);
      addToast('ישות משפטית עודכנה בהצלחה', 'success');
      setEditing(null);
      const params = new URLSearchParams(searchParams);
      params.delete('edit_uuid');
      setSearchParams(params);
      await fetchEntities();
    } catch (error) {
      console.error(error);
      addToast('עדכון ישות משפטית נכשל', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteLegalEntity(deleteTarget.uuid);
      addToast('ישות משפטית נמחקה בהצלחה', 'success');
      setDeleteTarget(null);
      await fetchEntities();
    } catch (error) {
      console.error(error);
      addToast('מחיקת ישות משפטית נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (selectedCompanyUUID) params.set('company_uuid', selectedCompanyUUID);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleCompanyChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    params.delete('edit_uuid');
    if (value) {
      params.set('company_uuid', value);
    } else {
      params.delete('company_uuid');
    }
    setSearchParams(params);
    setShowCreate(false);
    setEditing(null);
  };

  const closeEdit = () => {
    setEditing(null);
    const params = new URLSearchParams(searchParams);
    params.delete('edit_uuid');
    setSearchParams(params);
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/companies')}>
          חברות
        </button>
        {selectedCompanyUUID ? (
          <>
            <span className="breadcrumb-sep">/</span>
            <button
              className="breadcrumb-link"
              onClick={() => navigate(`/companies/${selectedCompanyUUID}`)}
            >
              {selectedCompanyName || 'פרטי חברה'}
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
            {selectedCompanyUUID
              ? `חברה נבחרת: ${selectedCompanyName || selectedCompanyUUID}`
              : 'בחר חברה כדי לנהל את הישויות המשפטיות שלה'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate((prev) => !prev)}
          disabled={!selectedCompanyUUID}
        >
          {showCreate ? 'סגור טופס' : 'ישות חדשה'}
        </button>
      </div>

      {showCreate ? (
        <LegalEntityForm
          companyUUID={selectedCompanyUUID}
          mode="create"
          loading={saving}
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      {editing ? (
        <LegalEntityForm
          companyUUID={selectedCompanyUUID}
          mode="edit"
          loading={saving}
          initial={editing}
          onSubmit={handleEdit}
          onCancel={closeEdit}
        />
      ) : null}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={handleSearch}>
          <div className="filter-group">
            <select
              className="input"
              value={selectedCompanyUUID}
              onChange={(e) => handleCompanyChange(e.target.value)}
              disabled={!!routeCompanyUUID}
            >
              <option value="">בחר חברה</option>
              {companies.map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.name}
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
              placeholder="חיפוש לפי שם משפטי / Tax ID"
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
            <span>טוען ישויות משפטיות...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p>לא נמצאו ישויות משפטיות</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>שם משפטי</th>
                    <th>סוג</th>
                    <th>Tax ID</th>
                    <th>מדינה</th>
                    <th>KYC</th>
                    <th>סטטוס</th>
                    <th>נוצר</th>
                    <th>פעולות</th>
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
                          title="ניהול מסמכי ציות"
                          onClick={() =>
                            navigate(
                              `/legal-entities/${entity.uuid}/compliance-documents?company_uuid=${selectedCompanyUUID}`,
                            )
                          }
                        >
                          מסמכי ציות
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="ניהול בעלי שליטה"
                          onClick={() =>
                            navigate(
                              `/legal-entities/${entity.uuid}/beneficial-owners?company_uuid=${selectedCompanyUUID}`,
                            )
                          }
                        >
                          בעלי שליטה
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="ניהול סוחרים"
                          onClick={() =>
                            navigate(
                              `/legal-entities/${entity.uuid}/merchants?company_uuid=${selectedCompanyUUID}`,
                            )
                          }
                        >
                          סוחרים
                        </button>
                        <button
                          className="action-btn edit"
                          title="עריכה"
                          onClick={() => {
                            setEditing(entity);
                            const params = new URLSearchParams(searchParams);
                            params.set('edit_uuid', entity.uuid);
                            setSearchParams(params);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          className="action-btn delete"
                          title="מחיקה"
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
                  {pagination.total_items} תוצאות | עמוד {pagination.page} מתוך {pagination.total_pages}
                </span>
                <div className="pagination-btns">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    הקודם
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    הבא
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="מחיקת ישות משפטית"
        message={`למחוק את "${deleteTarget?.legal_name}"?`}
        confirmLabel="מחק"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
