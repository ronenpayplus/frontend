import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany, updateCompany } from '../api/companies';
import type { Company, UpdateCompanyRequest } from '../types/company';
import CompanyForm from '../components/CompanyForm';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompanyCreate.css';

export default function CompanyEdit() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const loadCompany = useCallback(async () => {
    if (!uuid) return;
    try {
      const data = await getCompany(uuid);
      setCompany(data.company);
    } catch (err) {
      console.error(err);
      addToast('שגיאה בטעינת פרטי החברה', 'error');
    } finally {
      setPageLoading(false);
    }
  }, [uuid, addToast]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const handleSubmit = async (data: UpdateCompanyRequest) => {
    if (!uuid) return;
    setSaving(true);
    try {
      await updateCompany(uuid, data);
      addToast('החברה עודכנה בהצלחה', 'success');
      setTimeout(() => navigate(`/companies/${uuid}`), 500);
    } catch (err) {
      addToast('שגיאה בעדכון החברה', 'error');
      console.error(err);
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>טוען פרטי חברה...</span>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="empty-state">
        <p>החברה לא נמצאה</p>
        <button className="btn btn-primary" onClick={() => navigate('/companies')}>
          חזרה לרשימה
        </button>
      </div>
    );
  }

  return (
    <div className="company-create-page">
      <div className="page-header">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/companies')}>חברות</button>
          <span className="breadcrumb-sep">/</span>
          <button className="breadcrumb-link" onClick={() => navigate(`/companies/${uuid}`)}>
            {company.name}
          </button>
          <span className="breadcrumb-sep">/</span>
          <span>עריכה</span>
        </div>
        <h1 className="page-title">עריכת {company.name}</h1>
      </div>

      <CompanyForm
        company={company}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/companies/${uuid}`)}
        isEdit
        loading={saving}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
