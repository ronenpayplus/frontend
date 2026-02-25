import type { Pagination } from './company';

export interface ComplianceDocument {
  uuid: string;
  legal_entity_uuid: string;
  beneficial_owner_uuid?: string;
  document_type: string;
  document_name: string;
  file_reference: string;
  file_type?: string;
  file_size_bytes?: number;
  issuing_country?: string;
  issue_date?: string;
  expiry_date?: string;
  verification_status: string;
  rejection_reason?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface ListComplianceDocumentsParams {
  legal_entity_uuid?: string;
  beneficial_owner_uuid?: string;
  document_type?: string;
  verification_status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ListComplianceDocumentsResponse {
  compliance_documents: ComplianceDocument[];
  pagination: Pagination;
}

export interface CreateComplianceDocumentRequest {
  legal_entity_uuid: string;
  beneficial_owner_uuid?: string;
  document_type: string;
  document_name: string;
  file_reference: string;
  file_type?: string;
  file_size_bytes?: number;
  issuing_country?: string;
  issue_date?: string;
  expiry_date?: string;
  verification_status?: string;
}

export interface UpdateComplianceDocumentRequest {
  document_type: string;
  document_name: string;
  file_reference: string;
  file_type?: string;
  file_size_bytes?: number;
  issuing_country?: string;
  issue_date?: string;
  expiry_date?: string;
  verification_status: string;
  rejection_reason?: string;
  verified_by?: string;
}

export const COMPLIANCE_DOCUMENT_TYPES = [
  'incorporation_certificate',
  'business_license',
  'tax_registration',
  'proof_of_address',
  'bank_statement',
  'government_id_front',
  'government_id_back',
  'selfie',
  'articles_of_association',
  'shareholder_register',
  'financial_statement',
  'power_of_attorney',
  'other',
] as const;

export const COMPLIANCE_FILE_TYPES = ['pdf', 'jpg', 'png', 'doc', 'docx', 'xlsx', 'csv'] as const;
export const COMPLIANCE_VERIFICATION_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;
