import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCompany,
  listCompanyLocalizations,
  updateCompanyWithLocalizations,
} from '../api/companies';
import { listLegalEntities } from '../api/legalEntities';
import type {
  Company,
  CompanyLocalizationInput,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from '../types/company';
import type { LegalEntity } from '../types/legalEntity';
import {
  LEGAL_ENTITY_KYC_LABELS,
  LEGAL_ENTITY_STATUS_LABELS,
  LEGAL_ENTITY_TYPE_LABELS,
} from '../types/legalEntity';
import CompanyForm from '../components/CompanyForm';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompanyCreate.css';
import './CompaniesList.css';

export default function CompanyEdit() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [legalEntities, setLegalEntities] = useState<LegalEntity[]>([]);
  const [localizations, setLocalizations] = useState<CompanyLocalizationInput[]>([]);
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
      addToast('Failed to load company details', 'error');
    } finally {
      setPageLoading(false);
    }
  }, [uuid, addToast]);

  const loadLegalEntities = useCallback(async () => {
    if (!uuid) return;
    try {
      const data = await listLegalEntities({
        company_uuid: uuid,
        page: 1,
        page_size: 50,
      });
      setLegalEntities(data.legal_entities || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load legal entities', 'error');
    }
  }, [uuid, addToast]);

  const loadLocalizations = useCallback(async () => {
    if (!uuid) return;
    try {
      const rows = await listCompanyLocalizations(uuid);
      setLocalizations(rows.map((row) => ({
        lang_code: row.lang_code || '',
        display_name: row.display_name || '',
        brand_name: row.brand_name || '',
        legal_entity_name: row.legal_entity_name || '',
        settlement_descriptor: row.settlement_descriptor || '',
        description: row.description || '',
        website_url: row.website_url || '',
        contact_name: row.contact_name || '',
        contact_email: row.contact_email || '',
        contact_phone: row.contact_phone || '',
        support_email: row.support_email || '',
        support_phone: row.support_phone || '',
        receipt_header: row.receipt_header || '',
        receipt_footer: row.receipt_footer || '',
        invoice_notes: row.invoice_notes || '',
        is_default: row.is_default,
      })));
    } catch (err) {
      console.error(err);
      setLocalizations([]);
    }
  }, [uuid]);

  useEffect(() => {
    loadCompany();
    loadLegalEntities();
    loadLocalizations();
  }, [loadCompany, loadLegalEntities, loadLocalizations]);

  const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    if (!uuid) return;
    setSaving(true);
    try {
      const localizationsPayload = data.localizations && data.localizations.length > 0
        ? data.localizations
        : [{
          lang_code: 'en',
          display_name: data.name,
          is_default: true,
        }];
      await updateCompanyWithLocalizations({
        ...(data as UpdateCompanyRequest),
        uuid,
        localizations: localizationsPayload,
      });
      addToast('Company updated successfully', 'success');
      setTimeout(() => navigate(`/companies/${uuid}`), 500);
    } catch (err) {
      addToast('Failed to update company', 'error');
      console.error(err);
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading company details...</span>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="empty-state">
        <p>Company not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/companies')}>
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="company-create-page">
      <div className="page-header">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/companies')}>Companies</button>
          <span className="breadcrumb-sep">/</span>
          <button className="breadcrumb-link" onClick={() => navigate(`/companies/${uuid}`)}>
            {company.name}
          </button>
          <span className="breadcrumb-sep">/</span>
          <span>Edit</span>
        </div>
        <h1 className="page-title">Edit {company.name}</h1>
      </div>

      <CompanyForm
        company={company}
        initialLocalizations={localizations}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/companies/${uuid}`)}
        isEdit
        loading={saving}
      />

      <div className="card table-card" style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          <div>
            <h3 className="section-title" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>
              Related Legal Entities
            </h3>
            <p className="page-subtitle">Select a legal entity to edit or go to full management</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/companies/${uuid}/legal-entities`)}
          >
            Manage Legal Entities
          </button>
        </div>

        {legalEntities.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>No legal entities for this company yet</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/companies/${uuid}/legal-entities`)}
            >
              Create first legal entity
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Legal Name</th>
                  <th>Type</th>
                  <th>Tax ID</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {legalEntities.map((entity) => (
                  <tr key={entity.uuid}>
                    <td className="cell-name">{entity.legal_name}</td>
                    <td>{LEGAL_ENTITY_TYPE_LABELS[entity.entity_type] ?? entity.entity_type}</td>
                    <td className="cell-mono">{entity.tax_id}</td>
                    <td>{LEGAL_ENTITY_KYC_LABELS[entity.kyc_status] ?? entity.kyc_status}</td>
                    <td>{LEGAL_ENTITY_STATUS_LABELS[entity.status] ?? entity.status}</td>
                    <td className="cell-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() =>
                          navigate(
                            `/companies/${uuid}/legal-entities?edit_uuid=${entity.uuid}`,
                          )
                        }
                      >
                        Edit this entity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
