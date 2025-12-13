/**
 * Types for Loans API
 */

export interface GetLoanDetailsRequest {
    query_type: 'agent_all_loan' | 'loan_by_id';
    agent_id?: string;
    loan_id?: string;
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
        loan_id?: string;
        sub_status?: string[];
        mob_num?: string;
        'l.user_id'?: string;
    };
    text?: string;
    search_columns?: string[];
}

export interface Loan {
    loan_id: string;
    user_id: string;
    agent_id: string;
    loan_type?: string;
    loan_purpose?: string;
    requested_amt?: number;
    requested_tenure?: number;
    payment_frequency?: string;
    lender_approved_amt?: number;
    total_amt_to_pay?: number;
    total_interest?: string;
    disbursed_amt?: number;
    loan_interest_rate?: number;
    loan_processing_fees_amt?: number;
    loan_processing_fees_percentage?: string;
    loan_processing_fees_gst_percentage?: string;
    loan_processing_fees_gst_amt?: string;
    loan_installment_amt?: number;
    loan_tenure?: number;
    num_installment_recived?: number;
    amt_installment_recived?: number;
    disbursed_date?: string;
    loan_start_date?: string;
    loan_end_date?: string;
    loan_created_at?: string;
    loan_updated_at?: string;
    loan_status?: string;
    sub_status?: string;
    description?: string;
    loan_acc_num?: string;
    old_loan_acc_num?: string | null;
    old_loan_remaining_amt?: string | null;
    lender_approved_date?: string;
    last_cleared_installment_date?: string;
    last_cleared_installment_num?: number;
    last_installment_paid_date?: string;
    last_installment_paid_amt?: string;
    annual_interest_rate?: string;
    loan_closed_date?: string | null;
    rejection_reason?: string | null;
    insurance_amt?: string;
    insurance_gst_amt?: string;
    lender_id?: string;
    agent_name?: string;
    agent_code?: string;
    agent_mobile?: string;
    stamp_paper_fee_amt?: string;
    total_pre_disbursal_charges?: number;
    lock_in_tenure?: string;
    foreclousure_percentage?: string;
    apr?: string;
    overdue_interest_percentage?: string;
    lock_in_breaking_percentage?: string;
    lender_account_number?: string;
    lender_ifsc?: string;
    lender_cif?: string;
    branch_id?: string;
    is_active?: boolean;
    mob_num?: number;
    email?: string;
    fname?: string;
    mname?: string;
    lname?: string;
    dob?: string;
    education?: string;
    gender?: string;
    marital_status?: string;
    salaried?: string;
    income?: number;
    occupation?: string;
    gst_num?: string;
    pan_num?: string;
    business_name?: string;
    home_address1?: string;
    home_address2?: string;
    home_area?: string;
    home_district?: string;
    home_state?: string;
    home_landmark?: string;
    home_pin_code?: string;
    office_address1?: string;
    office_address2?: string;
    office_area?: string;
    office_district?: string;
    office_state?: string;
    office_landmark?: string;
    office_pin_code?: number;
    app_version?: string;
    active_status?: string;
    application_status?: string;
    created_at?: string;
    updated_at?: string;
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
    id?: number;
    bureau_name?: string;
    bureau_score?: string;
}

export interface GetLoanDetailsResponse {
    message: string;
    response: Loan[];
    pagination_metadata?: {
        total_records: number;
        total_pages: number;
        page: number;
        page_size: number;
    };
}

