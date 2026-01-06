/**
 * Types for Leads API
 */

export interface GetUsersFromAgentIdRequest {
  agent_id: string;
  page?: number;
  page_size?: number;
  ranges?: {
    created_at?: [string | null, string | null];
    updated_at?: [string | null, string | null];
  };
  sort_by?: {
    [key: string]: -1 | 1;
  };
  filters?: {
    sub_status?: string[];
    status?: string[];
  };
  search_text?: string;
  search_type?: "number" | "name" | "id" | "email" | "agent_name";
}

export interface UserLead {
  user_id: string;
  fname: string;
  mname?: string;
  lname: string;
  mob_num: number;
  email?: string;
  created_at: string;
  updated_at: string;
  application_status: string;
  agent_id: string;
  agent_name?: string;
  agent_mob_num?: number;
  dob?: string;
  gender?: string;
  pan_num?: string;
  aadhaar_num?: string;
  occupation?: string;
  education?: string;
  income?: number;
  home_address1?: string;
  home_address2?: string;
  home_area?: string;
  home_district?: string;
  home_state?: string;
  home_pin_code?: string;
  office_address1?: string;
  office_address2?: string;
  office_area?: string;
  office_district?: string;
  office_state?: string;
  office_pin_code?: string;
  application_num?: number;
  is_politically_exposed?: boolean;
  nationality?: string;
  num_of_dependents?: string;
  property_ownership?: string;
  years_in_business?: string;
  home_ownership?: string;
  family_ref_name?: string;
  family_ref_num?: string;
  friend_ref_name?: string;
  friend_ref_num?: string;
  preferred_language?: string;
  referred_by?: string;
  business_kind?: string;
  work_experience?: string;
  role_name?: string;
  operational_years?: string;
  pf_deduction?: string;
  current_home_address1?: string;
  current_home_address2?: string;
  current_home_area?: string;
  current_home_district?: string;
  current_home_landmark?: string;
  current_home_state?: string;
  current_home_pin_code?: string;
  mothers_name?: string;
  udhyam_aadhaar_number?: string;
  user_description?: string;
  total_records?: number;
  clickpe_page_id?: string;
}

export interface GetUsersFromAgentIdResponse {
  message: string;
  response: UserLead[];
  pagination_metadata?: {
    total_records: number;
    total_pages: number;
    page: number;
    page_size: number;
  };
}
