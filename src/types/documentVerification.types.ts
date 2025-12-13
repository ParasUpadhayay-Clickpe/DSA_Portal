/**
 * Types for Document Verification API
 */

export interface UploadKYCDocumentsRequest {
    user_id: string;
}

export interface UploadKYCDocumentsResponse {
    status: boolean;
    message: string;
    data: {
        upload_id: string;
        uploaded_at: string;
    };
}

export interface RequestDocumentAnalysisRequest {
    user_id: string;
    run_id?: string;
}

export interface RequestDocumentAnalysisResponse {
    status: boolean;
    message: string;
    data: {
        run_id: string;
        status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'COMPLETED' | 'FAILED';
        progress?: number;
        created_at: string;
        completed_at?: string;
        results?: {
            documents_analyzed: number;
            extracted_fields: Record<string, unknown>;
        };
    };
}

export interface GetDocumentAnalysisDataRequest {
    user_id: string;
    query_type?: 'get' | 'update';
    changeset?: Record<string, unknown>;
}

export interface GetDocumentAnalysisDataResponse {
    status: boolean;
    message: string;
    data: {
        user_id: string;
        analysis_id?: string;
        extracted_fields?: Record<string, unknown>;
        analysis_date?: string;
        updated_at?: string;
    };
}

export interface GetKYCDocumentsRequest {
    user_id: string;
}

export interface KYCDocument {
    document_id: string;
    document_type: string;
    document_url: string;
    uploaded_at: string;
}

export interface GetKYCDocumentsResponse {
    status: boolean;
    message: string;
    data: {
        user_id: string;
        documents: KYCDocument[];
    };
}

