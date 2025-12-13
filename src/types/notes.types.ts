/**
 * Types for Notes API
 */

export interface GetLoanNotesRequest {
    loan_id: string;
}

export interface LoanNote {
    note_id: string;
    loan_id: string;
    note: string; // HTML content
    createdBy: string;
    createdAt: string;
    userGroup: string;
    tag: string;
}

export interface GetLoanNotesResponse {
    status: string;
    message: string;
    data: {
        notes: LoanNote[];
    };
}

export interface AddLoanNoteRequest {
    loan_id: string;
    createdAt: string; // ISO timestamp
    createdBy: string;
    note: string; // HTML content
    userGroup: string;
    tag: string;
}

export interface AddLoanNoteResponse {
    status: boolean;
    message: string;
    data: {
        note_id: string;
        loan_id: string;
        created_at: string;
    };
}

