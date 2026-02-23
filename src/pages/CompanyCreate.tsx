import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompany } from '../api/companies';
import type { CreateCompanyRequest } from '../types/company';
import CompanyForm from '../components/CompanyForm';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompanyCreate.css';

export default function CompanyCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleSubmit = async (data: CreateCompanyRequest) => {
    setLoading(true);
    try {
      const result = await createCompany(data);
      addToast('החברה נוצרה בהצלחה', 'success');
      setTimeout(() => navigate(`/companies/${result.uuid}`), 500);
    } catch (err) {
      addToast('שגיאה ביצירת החברה', 'error');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="company-create-page">
      <div className="page-header">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/companies')}>חברות</button>
          <span className="breadcrumb-sep">/</span>
          <span>חברה חדשה</span>
        </div>
        <h1 className="page-title">יצירת חברה חדשה</h1>
      </div>

      <CompanyForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/companies')}
        loading={loading}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
