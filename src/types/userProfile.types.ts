/**
 * Types for User Profile API
 */

export interface GetUserProfileDataRequest {
    query_type: 'user_details';
    user_id: string;
    include_details?: string[];
}

export interface BankAccount {
    account_number: string;
    ifsc: string;
    bank_name: string;
    account_type: string;
    is_primary: boolean;
}

export interface AadhaarDetails {
    aadhaar_num: string;
    name: string;
    dob: string;
    address: string;
}

export interface PANDetails {
    pan_num: string;
    name: string;
    dob: string;
}

export interface BureauDetails {
    bureau_name: string;
    bureau_score: string;
    is_active: boolean;
}

export interface Location {
    address1: string;
    address2?: string;
    district: string;
    state: string;
    pin_code: string;
}

export interface GetUserProfileDataResponse {
    status: string;
    message: string;
    response: {
        user_id: string;
        fname: string;
        mname?: string;
        lname: string;
        mob_num: number;
        email: string;
        dob?: string;
        gender?: string;
        pan_num?: string;
        aadhaar_num?: string;
        occupation?: string;
        education?: string;
        income?: number;
        work_experience?: string;
        property_ownership?: string;
        home_ownership?: string;
        bank_accounts?: BankAccount[];
        primary_bank_account?: BankAccount;
        verified_bank_accounts?: BankAccount[];
        bsa_infos?: {
            available_bsa_infos: BankAccount[];
        };
        consents?: Array<{
            consent_id: string;
            consent_type: string;
            status: string;
            created_at: string;
        }>;
        aadhaar_details?: AadhaarDetails;
        pan_details?: PANDetails;
        bureau_details?: BureauDetails;
        locations?: {
            home?: Location;
            office?: Location;
        };
    };
}

export interface GetVerifiedUserDocumentsRequest {
    user_id: string;
}

export interface VerifiedDocument {
    document_id: string;
    user_id: string;
    document_type: string;
    document_url: string;
    verified: boolean;
    verified_at: string;
    uploaded_at: string;
}

export interface GetVerifiedUserDocumentsResponse {
    status: string;
    message: string;
    response: VerifiedDocument[];
}

