/**
 * Entity Role Mapping API class
 * Handles all entity role mapping-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetAgentRolesRequest,
    GetAgentRolesResponse,
    GetAgentsRequest,
    GetAgentsResponse,
    GetAgentEntitiesRequest,
    GetAgentEntitiesResponse,
    ChangeEntityMappingRequest,
    ChangeEntityMappingResponse,
} from '@/types/entityRoleMapping.types';

export class EntityRoleMappingApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get agent roles
     * Endpoint: POST /entity-role-mapping/get-agent-roles
     */
    async getAgentRoles(request: GetAgentRolesRequest): Promise<GetAgentRolesResponse> {
        try {
            const response = await this.post<GetAgentRolesResponse>(
                '/entity-role-mapping/get-agent-roles',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch agent roles',
                error: response.message || '',
                response: {
                    agent_id: request.agent_id,
                    role_types: [],
                    total_roles: 0,
                    roles: [],
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch agent roles. Please try again.',
                error: apiError.message || '',
                response: {
                    agent_id: request.agent_id,
                    role_types: [],
                    total_roles: 0,
                    roles: [],
                },
            };
        }
    }

    /**
     * Get agents (role tree)
     * Endpoint: POST /entity-role-mapping/get-agents
     */
    async getAgents(request: GetAgentsRequest): Promise<GetAgentsResponse> {
        try {
            const response = await this.post<GetAgentsResponse>(
                '/entity-role-mapping/get-agents',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch agents',
                error: response.message || '',
                response: {
                    root_role_id: '',
                    root_agent_id: request.agent_id,
                    role_type: request.role_type,
                    tree: [],
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch agents. Please try again.',
                error: apiError.message || '',
                response: {
                    root_role_id: '',
                    root_agent_id: request.agent_id,
                    role_type: request.role_type,
                    tree: [],
                },
            };
        }
    }

    /**
     * Get agent entities
     * Endpoint: POST /entity-role-mapping/get-agent-entity
     */
    async getAgentEntities(request: GetAgentEntitiesRequest): Promise<GetAgentEntitiesResponse> {
        try {
            const response = await this.post<GetAgentEntitiesResponse>(
                '/entity-role-mapping/get-agent-entity',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch agent entities',
                error: response.message || '',
                response: {
                    role_id: request.role_id,
                    entity_type: request.entity_type,
                    role_type: request.role_type,
                    response: [],
                    total_entities: 0,
                    pagination: {
                        total_records: 0,
                        total_pages: 0,
                        page: request.page || 1,
                        page_size: request.page_size || 10,
                    },
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch agent entities. Please try again.',
                error: apiError.message || '',
                response: {
                    role_id: request.role_id,
                    entity_type: request.entity_type,
                    role_type: request.role_type,
                    response: [],
                    total_entities: 0,
                    pagination: {
                        total_records: 0,
                        total_pages: 0,
                        page: request.page || 1,
                        page_size: request.page_size || 10,
                    },
                },
            };
        }
    }

    /**
     * Change entity mapping
     * Endpoint: POST /entity-role-mapping/change-entity-mapping
     */
    async changeEntityMapping(request: ChangeEntityMappingRequest): Promise<ChangeEntityMappingResponse> {
        try {
            const response = await this.post<ChangeEntityMappingResponse>(
                '/entity-role-mapping/change-entity-mapping',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to change entity mapping',
                error: response.message || '',
                response: {
                    entity_id: request.entity_id,
                    assigned_to: request.assigned_to,
                    assignment_date: new Date().toISOString(),
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to change entity mapping. Please try again.',
                error: apiError.message || '',
                response: {
                    entity_id: request.entity_id,
                    assigned_to: request.assigned_to,
                    assignment_date: new Date().toISOString(),
                },
            };
        }
    }
}

// Singleton instance
export const entityRoleMappingApi = new EntityRoleMappingApi();

