import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createCompanyContact,
  deleteCompanyContact,
  listCompanyContacts,
  updateCompanyContact,
} from '../api/companyContacts';
import { getCompany, listCompanies } from '../api/companies';
import type { Company } from '../types/company';
import type {
  CompanyContact,
  CreateCompanyContactRequest,
  UpdateCompanyContactRequest,
} from '../types/companyContact';
import { COMPANY_CONTACT_TYPES, COMPANY_CONTACT_TYPE_LABELS } from '../types/companyContact';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';
import './CompanyCreate.css';

type ContactFormState = {
  contact_type: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  mobile: string;
  job_title: string;
  department: string;
  lang_code: string;
  is_default: boolean;
  is_primary: boolean;
};

const defaultForm: ContactFormState = {
  contact_type: 'general',
  first_name: '',
  last_name: '',
  full_name: '',
  email: '',
  phone: '',
  mobile: '',
  job_title: '',
  department: '',
  lang_code: 'en',
  is_default: true,
  is_primary: true,
};

export default function CompanyContactsPage() {
  const navigate = useNavigate();
  const { uuid: routeCompanyUUID } = useParams<{ uuid: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const selectedCompanyUUID = routeCompanyUUID || searchParams.get('company_uuid') || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [items, setItems] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<CompanyContact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyContact | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('contact_type') || '');
  const [defaultFilter, setDefaultFilter] = useState(searchParams.get('is_default') || '');
  const [primaryFilter, setPrimaryFilter] = useState(searchParams.get('is_primary') || '');
  const [form, setForm] = useState<ContactFormState>(defaultForm);

  useEffect(() => {
    listCompanies({ page: 1, page_size: 300 })
      .then((data) => setCompanies(data.companies || []))
      .catch(() => setCompanies([]));
  }, []);

  useEffect(() => {
    if (!selectedCompanyUUID) {
      setSelectedCompany(null);
      return;
    }
    getCompany(selectedCompanyUUID)
      .then((data) => setSelectedCompany(data.company))
      .catch(() => setSelectedCompany(null));
  }, [selectedCompanyUUID]);

  useEffect(() => {
    if (!routeCompanyUUID && !selectedCompanyUUID && companies.length > 0) {
      const params = new URLSearchParams(searchParams);
      params.set('company_uuid', companies[0].uuid);
      setSearchParams(params);
    }
  }, [routeCompanyUUID, selectedCompanyUUID, companies, searchParams, setSearchParams]);

  const fetchContacts = useCallback(async () => {
    if (!selectedCompanyUUID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listCompanyContacts({
        company_uuid: selectedCompanyUUID,
        search: search || undefined,
        contact_type: typeFilter || undefined,
        is_default: defaultFilter || undefined,
        is_primary: primaryFilter || undefined,
        page: 1,
        page_size: 50,
      });
      setItems(data.contacts || []);
    } catch (error) {
      console.error(error);
      addToast('שגיאה בטעינת אנשי קשר', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyUUID, search, typeFilter, defaultFilter, primaryFilter, addToast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const subtitle = useMemo(
    () => (selectedCompany ? `חברה נבחרת: ${selectedCompany.name}` : 'בחר חברה כדי לנהל אנשי קשר'),
    [selectedCompany],
  );

  const resetForm = () => setForm(defaultForm);

  const autoFill = () => {
    const rand = Math.floor(Math.random() * 9000) + 1000;
    setForm({
      contact_type: 'general',
      first_name: 'John',
      last_name: 'Doe',
      full_name: `John Doe ${rand}`,
      email: `contact-${rand}@example.com`,
      phone: `+972-3-${rand}`,
      mobile: `+972-50-${rand}`,
      job_title: 'Manager',
      department: 'Operations',
      lang_code: 'en',
      is_default: true,
      is_primary: true,
    });
  };

  const startEdit = (item: CompanyContact) => {
    setShowCreate(false);
    setEditing(item);
    setForm({
      contact_type: item.contact_type || 'general',
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      full_name: item.full_name || '',
      email: item.email || '',
      phone: item.phone || '',
      mobile: item.mobile || '',
      job_title: item.job_title || '',
      department: item.department || '',
      lang_code: item.lang_code || 'en',
      is_default: item.is_default,
      is_primary: item.is_primary,
    });
  };

  const createPayload = (): CreateCompanyContactRequest => ({
    company_uuid: selectedCompanyUUID,
    contact_type: form.contact_type || undefined,
    first_name: form.first_name.trim() || undefined,
    last_name: form.last_name.trim() || undefined,
    full_name: form.full_name.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    mobile: form.mobile.trim() || undefined,
    job_title: form.job_title.trim() || undefined,
    department: form.department.trim() || undefined,
    lang_code: form.lang_code.trim() || undefined,
    is_default: form.is_default,
    is_primary: form.is_primary,
  });

  const updatePayload = (): UpdateCompanyContactRequest => ({
    contact_type: form.contact_type || undefined,
    first_name: form.first_name.trim() || undefined,
    last_name: form.last_name.trim() || undefined,
    full_name: form.full_name.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    mobile: form.mobile.trim() || undefined,
    job_title: form.job_title.trim() || undefined,
    department: form.department.trim() || undefined,
    lang_code: form.lang_code.trim() || undefined,
    is_default: form.is_default,
    is_primary: form.is_primary,
  });

  const save = async () => {
    if (!selectedCompanyUUID || !form.full_name) {
      addToast('יש לבחור חברה ולמלא שם מלא', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCompanyContact(editing.uuid, updatePayload());
        addToast('איש הקשר עודכן', 'success');
        setEditing(null);
      } else {
        await createCompanyContact(createPayload());
        addToast('איש הקשר נוצר', 'success');
        setShowCreate(false);
      }
      resetForm();
      await fetchContacts();
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
      await deleteCompanyContact(deleteTarget.uuid);
      addToast('איש הקשר נמחק', 'success');
      setDeleteTarget(null);
      await fetchContacts();
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
        <button className="breadcrumb-link" onClick={() => navigate('/companies')}>חברות</button>
        <span className="breadcrumb-sep">/</span>
        <span>אנשי קשר</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">אנשי קשר חברה</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <button className="btn btn-primary" disabled={!selectedCompanyUUID} onClick={() => { setShowCreate((v) => !v); setEditing(null); resetForm(); }}>
          {showCreate ? 'סגור טופס' : 'איש קשר חדש'}
        </button>
      </div>

      {(showCreate || editing) && (
        <div className="form-section">
          <div className="auto-fill-bar">
            <button type="button" className="btn btn-auto-fill" onClick={autoFill}>מילוי מהיר</button>
          </div>
          <h3 className="section-title">{editing ? 'עריכת איש קשר' : 'יצירת איש קשר'}</h3>
          <div className="form-grid">
            <div className="form-field"><label className="label">Full Name *</label><input className="input" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Contact Type</label><select className="input" value={form.contact_type} onChange={(e) => setForm((p) => ({ ...p, contact_type: e.target.value }))}>{COMPANY_CONTACT_TYPES.map((t) => <option key={t} value={t}>{COMPANY_CONTACT_TYPE_LABELS[t] || t}</option>)}</select></div>
            <div className="form-field"><label className="label">First Name</label><input className="input" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Email</label><input className="input ltr-input" dir="ltr" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Phone</label><input className="input ltr-input" dir="ltr" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Mobile</label><input className="input ltr-input" dir="ltr" value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Job Title</label><input className="input" value={form.job_title} onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Department</label><input className="input" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Lang Code</label><input className="input ltr-input" dir="ltr" value={form.lang_code} onChange={(e) => setForm((p) => ({ ...p, lang_code: e.target.value }))} /></div>
            <div className="form-field"><label className="label">Default</label><select className="input" value={form.is_default ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.value === 'true' }))}><option value="true">כן</option><option value="false">לא</option></select></div>
            <div className="form-field"><label className="label">Primary</label><select className="input" value={form.is_primary ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, is_primary: e.target.value === 'true' }))}><option value="true">כן</option><option value="false">לא</option></select></div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'שומר...' : editing ? 'עדכן' : 'צור'}</button>
            <button className="btn btn-secondary" onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }}>ביטול</button>
          </div>
        </div>
      )}

      <div className="card filters-card">
        <form className="filters-form" onSubmit={(e) => { e.preventDefault(); fetchContacts(); }}>
          <div className="filter-group">
            <select className="input" value={selectedCompanyUUID} onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) params.set('company_uuid', e.target.value);
              else params.delete('company_uuid');
              setSearchParams(params);
            }} disabled={!!routeCompanyUUID}>
              <option value="">בחר חברה</option>
              {companies.map((c) => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
            </select>
          </div>
          <div className="filter-group"><input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם / אימייל" /></div>
          <div className="filter-group"><select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="">סוג קשר (הכל)</option>{COMPANY_CONTACT_TYPES.map((t) => <option key={t} value={t}>{COMPANY_CONTACT_TYPE_LABELS[t] || t}</option>)}</select></div>
          <div className="filter-group"><select className="input" value={defaultFilter} onChange={(e) => setDefaultFilter(e.target.value)}><option value="">Default (הכל)</option><option value="true">כן</option><option value="false">לא</option></select></div>
          <div className="filter-group"><select className="input" value={primaryFilter} onChange={(e) => setPrimaryFilter(e.target.value)}><option value="">Primary (הכל)</option><option value="true">כן</option><option value="false">לא</option></select></div>
          <button className="btn btn-primary" type="submit">חיפוש</button>
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>טוען אנשי קשר...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><p>לא נמצאו אנשי קשר</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>סוג</th>
                  <th>Email</th>
                  <th>טלפון</th>
                  <th>Default</th>
                  <th>Primary</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid}>
                    <td className="cell-name">{item.full_name}</td>
                    <td>{COMPANY_CONTACT_TYPE_LABELS[item.contact_type] || item.contact_type || '—'}</td>
                    <td className="cell-mono">{item.email || '—'}</td>
                    <td className="cell-mono">{item.phone || item.mobile || '—'}</td>
                    <td>{item.is_default ? 'כן' : 'לא'}</td>
                    <td>{item.is_primary ? 'כן' : 'לא'}</td>
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
        title="מחיקת איש קשר"
        message={`למחוק את "${deleteTarget?.full_name}"?`}
        confirmLabel="מחק"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
