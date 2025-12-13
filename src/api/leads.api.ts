/**
 * Leads API class
 * Handles all leads-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetUsersFromAgentIdRequest,
    GetUsersFromAgentIdResponse,
} from '@/types/leads.types';

export class LeadsApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get users (leads) from agent ID
     * Endpoint: POST /get_users_from_agent_id
     */
    async getUsersFromAgentId(
        request: GetUsersFromAgentIdRequest
    ): Promise<GetUsersFromAgentIdResponse> {
        try {
            const response = await this.post<GetUsersFromAgentIdResponse>(
                '/get_users_from_agent_id',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                message: response.message || 'Failed to fetch leads',
                response: [],
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                message: apiError.message || 'Failed to fetch leads. Please try again.',
                response: [],
            };
        }
    }
}

// Singleton instance
export const leadsApi = new LeadsApi();

