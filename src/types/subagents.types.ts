/**
 * Types for Sub Agents API
 */

export interface GetSubAgentsRequest {
    agent_id: string;
}

export interface SubAgent {
    agent_id: string;
    fname: string;
    mname?: string | null;
    lname: string;
    name?: string;
    mob_num: number;
    email?: string;
    depth: number;
    is_active: boolean;
    status: string;
    children: SubAgent[];
}

export interface GetSubAgentsResponse {
    message: string;
    root_agent_id: string;
    response: SubAgent[];
}

