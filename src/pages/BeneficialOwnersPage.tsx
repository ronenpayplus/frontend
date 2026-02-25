import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createBeneficialOwner,
  deleteBeneficialOwner,
  listBeneficialOwners,
  updateBeneficialOwner,
} from '../api/beneficialOwners';
import { listCompanies } from '../api/companies';
import { getLegalEntity, listLegalEntities } from '../api/legalEntities';
import type { Company } from '../types/company';
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
} from '../types/beneficialOwner';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type BeneficialOwnerFormState = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  national_id_type: string;
  ownership_percentage: number;
  role: string;
  address_id: string;
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
  ownership_percentage: 50,
  role: 'owner',
  address_id: '',
  pep_status: false,
  sanctions_clear: true,
  verification_status: 'pending',
};

export default function BeneficialOwnersPage() {
  const navigate = useNavigate();
  const { uuid: routeLegalEntityUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedCompanyUUID = searchParams.get('company_uuid') || '';
  const selectedLegalEntityUUID = routeLegalEntityUUID || searchParams.get('legal_entity_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
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
      addToast('שגיאה בטעינת בעלי שליטה', 'error');
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
      ownership_percentage: 55,
      role: 'owner',
      address_id: '',
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
      ownership_percentage: item.ownership_percentage,
      role: item.role,
      address_id: item.address_id ? String(item.address_id) : '',
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
    ownership_percentage: Number(form.ownership_percentage),
    role: form.role,
    address_id: form.address_id ? Number(form.address_id) : undefined,
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
    ownership_percentage: Number(form.ownership_percentage),
    role: form.role,
    address_id: form.address_id ? Number(form.address_id) : undefined,
    pep_status: form.pep_status,
    sanctions_clear: form.sanctions_clear,
    verification_status: form.verification_status,
  });

  const save = async () => {
    if (!selectedLegalEntityUUID || !form.first_name || !form.last_name || !form.date_of_birth) {
      addToast('יש לבחור ישות משפטית ולמלא את שדות החובה', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateBeneficialOwner(editing.uuid, buildUpdatePayload());
        addToast('בעל השליטה עודכן', 'success');
        setEditing(null);
      } else {
        await createBeneficialOwner(buildCreatePayload());
        addToast('בעל השליטה נוצר', 'success');
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
      await deleteBeneficialOwner(deleteTarget.uuid);
      addToast('בעל השליטה נמחק', 'success');
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
        <span>בעלי שליטה</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">בעלי שליטה</h1>
          <p className="page-subtitle">
            {selectedLegalEntityName ? `ישות משפטית נבחרת: ${selectedLegalEntityName}` : 'בחר ישות משפטית כדי לנהל בעלי שליטה'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!selectedLegalEntityUUID}
          onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}
        >
          {showCreate ? 'סגור טופס' : 'בעל שליטה חדש'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>מילוי מהיר</button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת בעל שליטה' : 'יצירת בעל שליטה'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">שם פרטי *</label><input className="input" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">שם משפחה *</label><input className="input" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">תאריך לידה *</label><input type="date" className="input ltr-input" dir="ltr" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Nationality *</label><input className="input ltr-input" dir="ltr" maxLength={2} value={form.nationality} onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value.toUpperCase() }))} /></div>
            <div className="form-field"><label className="label">Role *</label><select className="input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>{BENEFICIAL_OWNER_ROLES.map((role) => <option key={role} value={role}>{BENEFICIAL_OWNER_ROLE_LABELS[role] || role}</option>)}</select></div>
            <div className="form-field"><label className="label">Ownership % *</label><input type="number" min={0} max={100} step="0.01" className="input ltr-input" dir="ltr" value={form.ownership_percentage} onChange={(e) => setForm((p) => ({ ...p, ownership_percentage: Number(e.target.value) }))} /></div>
            <div className="form-field"><label className="label">National ID</label><input className="input ltr-input" dir="ltr" value={form.national_id} onChange={(e) => setForm((p) => ({ ...p, national_id: e.target.value }))} /></div>
            <div className="form-field"><label className="label">National ID Type</label><select className="input" value={form.national_id_type} onChange={(e) => setForm((p) => ({ ...p, national_id_type: e.target.value }))}>{BENEFICIAL_OWNER_NATIONAL_ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-field"><label className="label">Address ID</label><input type="number" className="input ltr-input" dir="ltr" value={form.address_id} onChange={(e) => setForm((p) => ({ ...p, address_id: e.target.value }))} /></div>
            <div className="form-field"><label className="label">PEP</label><select className="input" value={form.pep_status ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, pep_status: e.target.value === 'true' }))}><option value="false">לא</option><option value="true">כן</option></select></div>
            <div className="form-field"><label className="label">Sanctions Clear</label><select className="input" value={form.sanctions_clear ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, sanctions_clear: e.target.value === 'true' }))}><option value="true">כן</option><option value="false">לא</option></select></div>
            {editing ? (
              <div className="form-field"><label className="label">Verification</label><select className="input" value={form.verification_status} onChange={(e) => setForm((p) => ({ ...p, verification_status: e.target.value }))}>{BENEFICIAL_OWNER_VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
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
            <select
              className="input"
              value={selectedLegalEntityUUID}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('legal_entity_uuid', e.target.value);
                else params.delete('legal_entity_uuid');
                setSearchParams(params);
              }}
              disabled={!selectedCompanyUUID || !!routeLegalEntityUUID}
            >
              <option value="">בחר ישות משפטית</option>
              {legalEntities.map((le) => <option key={le.uuid} value={le.uuid}>{le.legal_name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם" /></div>
          <div className="filter-group"><select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="">תפקיד (הכל)</option>{BENEFICIAL_OWNER_ROLES.map((role) => <option key={role} value={role}>{BENEFICIAL_OWNER_ROLE_LABELS[role] || role}</option>)}</select></div>
          <div className="filter-group"><select className="input" value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}><option value="">אימות (הכל)</option>{BENEFICIAL_OWNER_VERIFICATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>טוען בעלי שליטה...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>לא נמצאו בעלי שליטה</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>תפקיד</th>
                  <th>Ownership %</th>
                  <th>Nationality</th>
                  <th>Verification</th>
                  <th>PEP</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.first_name} {item.last_name}</td>
                    <td>{BENEFICIAL_OWNER_ROLE_LABELS[item.role] || item.role}</td>
                    <td>{item.ownership_percentage}</td>
                    <td className="cell-mono">{item.nationality}</td>
                    <td>{item.verification_status}</td>
                    <td>{item.pep_status ? 'כן' : 'לא'}</td>
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
        title="מחיקת בעל שליטה"
        message={`למחוק את "${deleteTarget?.first_name} ${deleteTarget?.last_name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
