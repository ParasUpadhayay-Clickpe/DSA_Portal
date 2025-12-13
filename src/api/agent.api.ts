/**
 * Agent API class
 * Handles all agent-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetAgentDetailsRequest,
    GetAgentDetailsResponse,
    UpdateAgentRequest,
    UpdateAgentResponse,
} from '@/types/agent.types';

export class AgentApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get agent details
     * Endpoint: POST /get_agent_details
     */
    async getAgentDetails(
        request: GetAgentDetailsRequest
    ): Promise<GetAgentDetailsResponse> {
        try {
            const response = await this.post<GetAgentDetailsResponse>(
                '/get_agent_details',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch agent details',
                response: [],
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch agent details. Please try again.',
                response: [],
            };
        }
    }

    /**
     * Update agent details
     * Endpoint: POST /update_agent
     */
    async updateAgent(
        request: UpdateAgentRequest
    ): Promise<UpdateAgentResponse> {
        try {
            const response = await this.post<UpdateAgentResponse>(
                '/update_agent',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to update agent details',
                response: {
                    agent_id: request.agent_id,
                    updated_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to update agent details. Please try again.',
                response: {
                    agent_id: request.agent_id,
                    updated_at: new Date().toISOString(),
                },
            };
        }
    }
}

// Singleton instance
export const agentApi = new AgentApi();

