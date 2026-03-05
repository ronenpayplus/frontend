import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listCompanies, deleteCompany } from '../api/companies';
import type { Company, Pagination, ListCompaniesParams } from '../types/company';
import {
  COMPANY_STATUSES,
  COMPANY_TYPES,
  STATUS_LABELS,
  COMPANY_TYPE_LABELS,
} from '../types/company';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import './CompaniesList.css';

export default function CompaniesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('company_type') || '');
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const page = Number(searchParams.get('page')) || 1;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListCompaniesParams = {
        page,
        page_size: 10,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.company_type = typeFilter;

      const data = await listCompanies(params);
      setCompanies(data.companies || []);
      setPagination(data.pagination);
    } catch (err) {
      addToast('Failed to load companies', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, addToast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('company_type', typeFilter);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCompany(deleteTarget.uuid);
      addToast(`Company "${deleteTarget.name}" deleted successfully`, 'success');
      setDeleteTarget(null);
      fetchCompanies();
    } catch {
      addToast('Failed to delete company', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setSearchParams({ page: '1' });
  };

  const hasFilters = search || statusFilter || typeFilter;

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Manage companies</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/companies/new')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Company
        </button>
      </div>

      <div className="card filters-card">
        <form className="filters-form" onSubmit={handleSearch}>
          <div className="filter-group">
            <input
              type="text"
              className="input"
              placeholder="Search by name or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {COMPANY_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {COMPANY_TYPES.map((t) => (
                <option key={t} value={t}>{COMPANY_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
          {hasFilters && (
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear</button>
          )}
        </form>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading companies...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <p>No companies found</p>
            {hasFilters && (
              <button className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Number</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Currency</th>
                    <th>Country</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.uuid}
                      className="table-row"
                      onClick={() => navigate(`/companies/${company.uuid}`)}
                    >
                      <td className="cell-name">{company.name}</td>
                      <td className="cell-mono">{company.number}</td>
                      <td>{COMPANY_TYPE_LABELS[company.company_type] || company.company_type}</td>
                      <td><StatusBadge status={company.status} /></td>
                      <td className="cell-mono">{company.default_currency}</td>
                      <td className="cell-mono">{company.default_country}</td>
                      <td className="cell-date">
                        {new Date(company.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="action-btn edit"
                          title="Edit"
                          onClick={() => navigate(`/companies/${company.uuid}/edit`)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() => setDeleteTarget(company)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.total_pages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  {pagination.total_items} results | page {pagination.page} of {pagination.total_pages}
                </span>
                <div className="pagination-btns">
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => {
                    const start = Math.max(1, pagination.page - 2);
                    const p = start + i;
                    if (p > pagination.total_pages) return null;
                    return (
                      <button
                        key={p}
                        className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={pagination.page >= pagination.total_pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
