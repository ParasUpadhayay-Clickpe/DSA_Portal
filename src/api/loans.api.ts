/**
 * Loans API class
 * Handles all loans-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetLoanDetailsRequest,
    GetLoanDetailsResponse,
} from '@/types/loans.types';

export class LoansApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get loan details
     * Endpoint: POST /get_loan_details
     */
    async getLoanDetails(
        request: GetLoanDetailsRequest
    ): Promise<GetLoanDetailsResponse> {
        try {
            const response = await this.post<GetLoanDetailsResponse>(
                '/get_loan_details',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                message: response.message || 'Failed to fetch loans',
                response: [],
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                message: apiError.message || 'Failed to fetch loans. Please try again.',
                response: [],
            };
        }
    }
}

// Singleton instance
export const loansApi = new LoansApi();

