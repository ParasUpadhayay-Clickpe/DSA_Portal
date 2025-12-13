/**
 * Types for Agent API
 */

export interface GetAgentDetailsRequest {
    query_type: 'get_agent_details';
    agent_id: string;
}

export interface AgentDetails {
    agent_id: string;
    fname: string;
    mname?: string | null;
    lname: string;
    name?: string;
    email: string;
    mob_num: number;
    mobile?: string;
    phone?: string;
    status?: string;
    active_status?: string;
    is_active?: boolean;
    parent_agent_id?: string;
    created_at?: string;
    updated_at?: string;
    dob?: string;
    gender?: string;
    home_address1?: string;
    home_address2?: string;
    home_district?: string;
    home_state?: string;
    home_pin_code?: string;
    office_address1?: string;
    office_address2?: string;
    office_district?: string;
    office_state?: string;
    office_pin_code?: string;
    pan?: string;
    ifsc?: string;
    acc_num?: string;
    beneficiary_name?: string;
    fos_or_dsa?: string;
    contract_or_commission?: string;
}

export interface GetAgentDetailsResponse {
    status: string;
    message: string;
    response: AgentDetails[];
}

export interface UpdateAgentRequest {
    agent_id: string;
    email?: string;
    parent_agent_id?: string;
    fname?: string;
    mname?: string;
    lname?: string;
    mob_num?: number;
    dob?: string;
    gender?: string;
    home_address1?: string;
    home_address2?: string;
    home_district?: string;
    home_state?: string;
    home_pin_code?: string;
    office_address1?: string;
    office_address2?: string;
    office_district?: string;
    office_state?: string;
    office_pin_code?: string;
    pan?: string;
    ifsc?: string;
    acc_num?: string;
    beneficiary_name?: string;
    fos_or_dsa?: string;
    contract_or_commission?: string;
    is_active?: boolean;
    status?: string;
}

export interface UpdateAgentResponse {
    status: string;
    message: string;
    response: {
        agent_id: string;
        updated_at: string;
    };
}

