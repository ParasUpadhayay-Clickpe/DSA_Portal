/**
 * Types for Entity Role Mapping API
 */

export interface GetAgentRolesRequest {
    agent_id: string;
}

export interface AgentRole {
    id: number;
    role_id: string;
    role_type: string;
    agent_id: string;
    parent_role_id: string | null;
    is_available_to_assign: boolean;
    created_at: string;
}

export interface GetAgentRolesResponse {
    status: string;
    message: string;
    error: string;
    response: {
        agent_id: string;
        role_types: string[];
        total_roles: number;
        roles: AgentRole[];
    };
}

export interface GetAgentsRequest {
    agent_id: string;
    role_type: string; // e.g., "DOCUMENT_VERIFIER"
}

export interface RoleTreeNode {
    role_id: string;
    agent_id: string;
    agent_name: string;
    children: RoleTreeNode[];
}

export interface GetAgentsResponse {
    status: string;
    message: string;
    error: string;
    response: {
        root_role_id: string;
        root_agent_id: string;
        role_type: string;
        tree: RoleTreeNode[];
    };
}

export interface GetAgentEntitiesRequest {
    role_id: string;
    entity_type: string; // e.g., "loan_id"
    role_type: string; // e.g., "DOCUMENT_VERIFIER"
    page?: number;
    page_size?: number;
    sort_by?: {
        [key: string]: -1 | 1;
    };
    filters?: {
        sub_status?: string[];
        user_mob_num?: string;
        user_id?: string;
    };
    ranges?: {
        created_at?: [string | null, string | null];
    };
    text?: string;
    search_columns?: string[];
}

export interface AgentEntity {
    loan_id: string;
    user_id: string;
    fname: string;
    mname?: string;
    lname: string;
    user_mob_num: number;
    user_email?: string;
    loan_created_at: string;
    loan_updated_at: string;
    sub_status: string;
    requested_amt?: number;
    lender_approved_amt?: number;
    loan_tenure?: number;
    payment_frequency?: string;
    agent_name?: string;
    assignment_date?: string;
    assigned_by?: string;
    assigned_agent_id?: string;
    assigned_to_agent?: string;
}

export interface GetAgentEntitiesResponse {
    status: string;
    message: string;
    error: string;
    response: {
        role_id: string;
        entity_type: string;
        role_type: string;
        response: AgentEntity[];
        total_entities: number;
        pagination: {
            total_records: number;
            total_pages: number;
            page: number;
            page_size: number;
        };
    };
}

export interface ChangeEntityMappingRequest {
    entity_id: string; // loan_id
    entity_type: string; // "loan_id"
    role_type: string; // "DOCUMENT_VERIFIER"
    assigned_by: string; // Role ID of assigner
    assigned_to: string; // Role ID of assignee
}

export interface ChangeEntityMappingResponse {
    status: string;
    message: string;
    error: string;
    response: {
        entity_id: string;
        assigned_to: string;
        assignment_date: string;
    };
}

