import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCompany, updateCompany } from '../api/companies';
import { listLegalEntities } from '../api/legalEntities';
import type { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../types/company';
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
      addToast('שגיאה בטעינת הישויות המשפטיות', 'error');
    }
  }, [uuid, addToast]);

  useEffect(() => {
    loadCompany();
    loadLegalEntities();
  }, [loadCompany, loadLegalEntities]);

  const handleSubmit = async (data: CreateCompanyRequest | UpdateCompanyRequest) => {
    if (!uuid) return;
    setSaving(true);
    try {
      await updateCompany(uuid, data as UpdateCompanyRequest);
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
              ישויות משפטיות קשורות
            </h3>
            <p className="page-subtitle">בחר ישות משפטית לעריכה או עבור לניהול מלא</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/companies/${uuid}/legal-entities`)}
          >
            ניהול ישויות משפטיות
          </button>
        </div>

        {legalEntities.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>
            <p>אין ישויות משפטיות לחברה זו עדיין</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/companies/${uuid}/legal-entities`)}
            >
              צור ישות משפטית ראשונה
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם משפטי</th>
                  <th>סוג</th>
                  <th>Tax ID</th>
                  <th>KYC</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
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
                        ערוך ישות זו
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
