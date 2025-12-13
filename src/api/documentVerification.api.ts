/**
 * Document Verification API class
 * Handles document verification-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    UploadKYCDocumentsRequest,
    UploadKYCDocumentsResponse,
    RequestDocumentAnalysisRequest,
    RequestDocumentAnalysisResponse,
    GetDocumentAnalysisDataRequest,
    GetDocumentAnalysisDataResponse,
    GetKYCDocumentsRequest,
    GetKYCDocumentsResponse,
} from '@/types/documentVerification.types';

export class DocumentVerificationApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Upload KYC documents
     * Endpoint: POST /muthoot/cp-mfl-upload-kyc-docs
     */
    async uploadKYCDocuments(request: UploadKYCDocumentsRequest): Promise<UploadKYCDocumentsResponse> {
        try {
            const response = await this.post<UploadKYCDocumentsResponse>(
                '/muthoot/cp-mfl-upload-kyc-docs',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: false,
                message: response.message || 'Failed to upload KYC documents',
                data: {
                    upload_id: '',
                    uploaded_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: false,
                message: apiError.message || 'Failed to upload KYC documents. Please try again.',
                data: {
                    upload_id: '',
                    uploaded_at: new Date().toISOString(),
                },
            };
        }
    }

    /**
     * Request document analysis
     * Endpoint: POST /muthoot/cp-mfl-request-document-analysis
     */
    async requestDocumentAnalysis(request: RequestDocumentAnalysisRequest): Promise<RequestDocumentAnalysisResponse> {
        try {
            const response = await this.post<RequestDocumentAnalysisResponse>(
                '/muthoot/cp-mfl-request-document-analysis',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: false,
                message: response.message || 'Failed to request document analysis',
                data: {
                    run_id: request.run_id || '',
                    status: 'FAILED' as const,
                    created_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: false,
                message: apiError.message || 'Failed to request document analysis. Please try again.',
                data: {
                    run_id: request.run_id || '',
                    status: 'FAILED' as const,
                    created_at: new Date().toISOString(),
                },
            };
        }
    }

    /**
     * Get document analysis data
     * Endpoint: POST /muthoot/cp-mfl-document-analysis-data
     */
    async getDocumentAnalysisData(request: GetDocumentAnalysisDataRequest): Promise<GetDocumentAnalysisDataResponse> {
        try {
            const response = await this.post<GetDocumentAnalysisDataResponse>(
                '/muthoot/cp-mfl-document-analysis-data',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: false,
                message: response.message || 'Failed to fetch document analysis data',
                data: {
                    user_id: request.user_id,
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: false,
                message: apiError.message || 'Failed to fetch document analysis data. Please try again.',
                data: {
                    user_id: request.user_id,
                },
            };
        }
    }

    /**
     * Get KYC documents
     * Endpoint: POST /muthoot/cp-mfl-get-kyc-docs
     */
    async getKYCDocuments(request: GetKYCDocumentsRequest): Promise<GetKYCDocumentsResponse> {
        try {
            const response = await this.post<GetKYCDocumentsResponse>(
                '/muthoot/cp-mfl-get-kyc-docs',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: false,
                message: response.message || 'Failed to fetch KYC documents',
                data: {
                    user_id: request.user_id,
                    documents: [],
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: false,
                message: apiError.message || 'Failed to fetch KYC documents. Please try again.',
                data: {
                    user_id: request.user_id,
                    documents: [],
                },
            };
        }
    }
}

// Singleton instance
export const documentVerificationApi = new DocumentVerificationApi();

