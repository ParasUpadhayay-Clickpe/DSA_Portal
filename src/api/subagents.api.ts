/**
 * Sub Agents API class
 * Handles all sub agents-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetSubAgentsRequest,
    GetSubAgentsResponse,
} from '@/types/subagents.types';

export class SubAgentsApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get sub agents
     * Endpoint: POST /get_sub_agents
     */
    async getSubAgents(
        request: GetSubAgentsRequest
    ): Promise<GetSubAgentsResponse> {
        try {
            const response = await this.post<GetSubAgentsResponse>(
                '/get_sub_agents',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                message: response.message || 'Failed to fetch sub agents',
                root_agent_id: request.agent_id,
                response: [],
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                message: apiError.message || 'Failed to fetch sub agents. Please try again.',
                root_agent_id: request.agent_id,
                response: [],
            };
        }
    }
}

// Singleton instance
export const subAgentsApi = new SubAgentsApi();

