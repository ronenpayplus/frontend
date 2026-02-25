import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createComplianceDocument,
  deleteComplianceDocument,
  listComplianceDocuments,
  updateComplianceDocument,
} from '../api/complianceDocuments';
import { listBeneficialOwners } from '../api/beneficialOwners';
import { listCompanies } from '../api/companies';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import type { BeneficialOwner } from '../types/beneficialOwner';
import type { Company } from '../types/company';
import type { LegalEntity } from '../types/legalEntity';
import type {
  ComplianceDocument,
  CreateComplianceDocumentRequest,
  UpdateComplianceDocumentRequest,
} from '../types/complianceDocument';
import {
  COMPLIANCE_DOCUMENT_TYPES,
  COMPLIANCE_FILE_TYPES,
  COMPLIANCE_VERIFICATION_STATUSES,
} from '../types/complianceDocument';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type ComplianceFormState = {
  beneficial_owner_uuid: string;
  document_type: string;
  document_name: string;
  file_reference: string;
  file_type: string;
  file_size_bytes: string;
  issuing_country: string;
  issue_date: string;
  expiry_date: string;
  verification_status: string;
  rejection_reason: string;
  verified_by: string;
};

const defaultForm: ComplianceFormState = {
  beneficial_owner_uuid: '',
  document_type: 'incorporation_certificate',
  document_name: '',
  file_reference: '',
  file_type: 'pdf',
  file_size_bytes: '',
  issuing_country: '',
  issue_date: '',
  expiry_date: '',
  verification_status: 'pending',
  rejection_reason: '',
  verified_by: '',
};

const toRfc3339Date = (value: string): string | undefined => (value ? `${value}T00:00:00Z` : undefined);
const toDateInput = (value?: string): string => (value ? value.slice(0, 10) : '');

export default function ComplianceDocumentsPage() {
  const navigate = useNavigate();
  const { uuid: routeLegalEntityUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const selectedLegalEntityUUID = routeLegalEntityUUID || searchParams.get('legal_entity_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>([]);
  const [items, setItems] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ComplianceDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComplianceDocument | null>(null);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [beneficialOwnerFilter, setBeneficialOwnerFilter] = useState('');
  const [form, setForm] = useState<ComplianceFormState>(defaultForm);

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
      .catch(() => setSelectedLegalEntity(null));
  }, [selectedLegalEntityUUID]);

  useEffect(() => {
    if (!selectedLegalEntityUUID) {
      setBeneficialOwners([]);
      return;
    }
    listBeneficialOwners({ legal_entity_uuid: selectedLegalEntityUUID, page: 1, page_size: 200 })
      .then((data) => setBeneficialOwners(data.beneficial_owners || []))
      .catch(() => setBeneficialOwners([]));
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
  }, [selectedLegalEntity, selectedCompanyUUID, searchParams, setSearchParams]);

  const fetchItems = useCallback(async () => {
    if (!selectedLegalEntityUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listComplianceDocuments({
        legal_entity_uuid: selectedLegalEntityUUID,
        beneficial_owner_uuid: beneficialOwnerFilter || undefined,
        document_type: docTypeFilter || undefined,
        verification_status: verificationFilter || undefined,
        search: search || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.compliance_documents || []);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת מסמכי ציות', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedLegalEntityUUID, beneficialOwnerFilter, docTypeFilter, verificationFilter, search, addToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const subtitle = useMemo(
    () => (selectedLegalEntity ? `ישות משפטית נבחרת: ${selectedLegalEntity.legal_name}` : 'בחר ישות משפטית לניהול מסמכים'),
    [selectedLegalEntity],
  );

  const resetForm = () => setForm(defaultForm);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      beneficial_owner_uuid: beneficialOwners[0]?.uuid || '',
      document_type: 'business_license',
      document_name: `Business License ${rand}`,
      file_reference: `s3://bucket/compliance/doc-${rand}.pdf`,
      file_type: 'pdf',
      file_size_bytes: '102400',
      issuing_country: 'IL',
      issue_date: '2025-01-01',
      expiry_date: '2026-01-01',
      verification_status: 'pending',
      rejection_reason: '',
      verified_by: '',
    });
  };

  const startEdit = (item: ComplianceDocument) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      beneficial_owner_uuid: item.beneficial_owner_uuid || '',
      document_type: item.document_type,
      document_name: item.document_name,
      file_reference: item.file_reference,
      file_type: item.file_type || 'pdf',
      file_size_bytes: item.file_size_bytes ? String(item.file_size_bytes) : '',
      issuing_country: item.issuing_country || '',
      issue_date: toDateInput(item.issue_date),
      expiry_date: toDateInput(item.expiry_date),
      verification_status: item.verification_status || 'pending',
      rejection_reason: item.rejection_reason || '',
      verified_by: item.verified_by || '',
    });
  };

  const buildCreatePayload = (): CreateComplianceDocumentRequest => ({
    legal_entity_uuid: selectedLegalEntityUUID,
    beneficial_owner_uuid: form.beneficial_owner_uuid || undefined,
    document_type: form.document_type,
    document_name: form.document_name.trim(),
    file_reference: form.file_reference.trim(),
    file_type: form.file_type || undefined,
    file_size_bytes: form.file_size_bytes ? Number(form.file_size_bytes) : undefined,
    issuing_country: form.issuing_country.trim().toUpperCase() || undefined,
    issue_date: toRfc3339Date(form.issue_date),
    expiry_date: toRfc3339Date(form.expiry_date),
    verification_status: form.verification_status || undefined,
  });

  const buildUpdatePayload = (): UpdateComplianceDocumentRequest => ({
    document_type: form.document_type,
    document_name: form.document_name.trim(),
    file_reference: form.file_reference.trim(),
    file_type: form.file_type || undefined,
    file_size_bytes: form.file_size_bytes ? Number(form.file_size_bytes) : undefined,
    issuing_country: form.issuing_country.trim().toUpperCase() || undefined,
    issue_date: toRfc3339Date(form.issue_date),
    expiry_date: toRfc3339Date(form.expiry_date),
    verification_status: form.verification_status,
    rejection_reason: form.rejection_reason.trim() || undefined,
    verified_by: form.verified_by.trim() || undefined,
  });

  const save = async () => {
    if (!selectedLegalEntityUUID || !form.document_name || !form.file_reference) {
      addToast('יש לבחור ישות משפטית ולמלא שם מסמך ו-File Reference', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateComplianceDocument(editing.uuid, buildUpdatePayload());
        addToast('המסמך עודכן', 'success');
        setEditing(null);
      } else {
        await createComplianceDocument(buildCreatePayload());
        addToast('המסמך נוצר', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('שמירה נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteComplianceDocument(deleteTarget.uuid);
      addToast('המסמך נמחק', 'success');
      setDeleteTarget(null);
      await fetchItems();
    } catch (error) {
      console.error(error);
      addToast('מחיקה נכשלה', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="companies-page">
      <div className="breadcrumb">
        <button className="breadcrumb-link" onClick={() => navigate('/legal-entities')}>ישויות משפטיות</button>
        <span className="breadcrumb-sep">/</span>
        <span>מסמכי ציות</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">מסמכי ציות</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedLegalEntityUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'סגור טופס' : 'מסמך חדש'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>מילוי מהיר</button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת מסמך ציות' : 'יצירת מסמך ציות'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Document Name *</label><input className="input" value={form.document_name} onChange={(e) => setForm((p) => ({ ...p, document_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Document Type *</label><select className="input" value={form.document_type} onChange={(e) => setForm((p) => ({ ...p, document_type: e.target.value }))}>{COMPLIANCE_DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">File Reference *</label><input className="input ltr-input" dir="ltr" value={form.file_reference} onChange={(e) => setForm((p) => ({ ...p, file_reference: e.target.value }))} /></div>
            <div className="form-field"><label className="label">File Type</label><select className="input" value={form.file_type} onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value }))}>{COMPLIANCE_FILE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">File Size (bytes)</label><input type="number" className="input ltr-input" dir="ltr" value={form.file_size_bytes} onChange={(e) => setForm((p) => ({ ...p, file_size_bytes: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Issuing Country</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.issuing_country} onChange={(e) => setForm((p) => ({ ...p, issuing_country: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">Issue Date</label><input type="date" className="input ltr-input" dir="ltr" value={form.issue_date} onChange={(e) => setForm((p) => ({ ...p, issue_date: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Expiry Date</label><input type="date" className="input ltr-input" dir="ltr" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Beneficial Owner</label><select className="input" value={form.beneficial_owner_uuid} onChange={(e) => setForm((p) => ({ ...p, beneficial_owner_uuid: e.target.value }))}><option value="">ללא</option>{beneficialOwners.map((bo) => <option key={bo.uuid} value={bo.uuid}>{bo.first_name} {bo.last_name}</option>)}</select></div>
            <div className="form-field"><label className="label">Verification</label><select className="input" value={form.verification_status} onChange={(e) => setForm((p) => ({ ...p, verification_status: e.target.value }))}>{COMPLIANCE_VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            {editing ? (
              <>
                <div className="form-field"><label className="label">Verified By</label><input className="input ltr-input" dir="ltr" value={form.verified_by} onChange={(e) => setForm((p) => ({ ...p, verified_by: e.target.value }))} /></div>
                <div className="form-field"><label className="label">Rejection Reason</label><input className="input" value={form.rejection_reason} onChange={(e) => setForm((p) => ({ ...p, rejection_reason: e.target.value }))} /></div>
              </>
            ) : null}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>ביטול</button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchItems(); }}>
          <div className="filter-group">
            <select
              className="input"
              value={selectedCompanyUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('company_uuid', e.target.value);
                else params.delete('company_uuid');
                if (!routeLegalEntityUUID) params.delete('legal_entity_uuid');
                setSearchParams(params);
              }}
            >
              <option value="">בחר חברה</option>
              {companies.map((company) => <option key={company.uuid} value={company.uuid}>{company.name}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <select className="input" value={selectedLegalEntityUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('legal_entity_uuid', e.target.value);
              else params.delete('legal_entity_uuid');
              setSearchParams(params);
            }} disabled={!selectedCompanyUUID || !!routeLegalEntityUUID}>
              <option value="">בחר ישות משפטית</option>
              {legalEntities.map((le) => <option key={le.uuid} value={le.uuid}>{le.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group"><select className="input" value={beneficialOwnerFilter} onChange={(e) => setBeneficialOwnerFilter(e.target.value)}><option value="">בעל שליטה (הכל)</option>{beneficialOwners.map((bo) => <option key={bo.uuid} value={bo.uuid}>{bo.first_name} {bo.last_name}</option>)}</select></div>
          <div className="filter-group"><select className="input" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}><option value="">סוג מסמך (הכל)</option>{COMPLIANCE_DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="filter-group"><select className="input" value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}><option value="">אימות (הכל)</option>{COMPLIANCE_VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם מסמך" /></div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>טוען מסמכי ציות...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>לא נמצאו מסמכים</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם מסמך</th>
                  <th>סוג</th>
                  <th>File Type</th>
                  <th>Verification</th>
                  <th>Issue</th>
                  <th>Expiry</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.document_name}</td>
                    <td>{item.document_type}</td>
                    <td className="cell-mono">{item.file_type || '-'}</td>
                    <td>{item.verification_status}</td>
                    <td className="cell-mono">{toDateInput(item.issue_date) || '-'}</td>
                    <td className="cell-mono">{toDateInput(item.expiry_date) || '-'}</td>
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
        title="מחיקת מסמך ציות"
        message={`למחוק את "${deleteTarget?.document_name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
