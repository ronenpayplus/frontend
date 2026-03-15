import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAccountWithLocalizations } from '../api/accounts';
import type { CreateAccountRequest } from '../types/account';
import AccountForm from '../components/AccountForm';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './AccountCreate.css';

export default function AccountCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleSubmit = async (data: CreateAccountRequest) => {
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
      const result = await createAccountWithLocalizations({
        ...(payload as CreateAccountRequest),
        localizations,
      });
      addToast('Account created successfully', 'success');
      setTimeout(() => navigate(`/accounts/${result.uuid}`), 500);
    } catch (err) {
      addToast('Failed to create account', 'error');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="account-create-page">
      <div className="page-header">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/accounts')}>Accounts</button>
          <span className="breadcrumb-sep">/</span>
          <span>New Account</span>
        </div>
        <h1 className="page-title">Create New Account</h1>
      </div>

      <AccountForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/accounts')}
        loading={loading}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
