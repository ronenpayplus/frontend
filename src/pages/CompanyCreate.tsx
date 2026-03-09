import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCompanyWithLocalizations } from '../api/companies';
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
      const localizations = data.localizations && data.localizations.length > 0
        ? data.localizations
        : [{
          lang_code: 'en',
          display_name: data.name,
          is_default: true,
        }];
      const payload = { ...data };
      delete payload.localizations;
      const result = await createCompanyWithLocalizations({
        ...(payload as CreateCompanyRequest),
        localizations,
      });
      addToast('Company created successfully', 'success');
      setTimeout(() => navigate(`/companies/${result.uuid}`), 500);
    } catch (err) {
      addToast('Failed to create company', 'error');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="company-create-page">
      <div className="page-header">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/companies')}>Companies</button>
          <span className="breadcrumb-sep">/</span>
          <span>New Company</span>
        </div>
        <h1 className="page-title">Create New Company</h1>
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
