/**
 * Notes API class
 * Handles all notes-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetLoanNotesRequest,
    GetLoanNotesResponse,
    AddLoanNoteRequest,
    AddLoanNoteResponse,
} from '@/types/notes.types';

export class NotesApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get loan notes
     * Endpoint: POST /muthoot/cp-mfl-get-notes
     */
    async getLoanNotes(request: GetLoanNotesRequest): Promise<GetLoanNotesResponse> {
        try {
            const response = await this.post<GetLoanNotesResponse>(
                '/muthoot/cp-mfl-get-notes',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch notes',
                data: {
                    notes: [],
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch notes. Please try again.',
                data: {
                    notes: [],
                },
            };
        }
    }

    /**
     * Add loan note
     * Endpoint: POST /muthoot/cp-mfl-add-note
     */
    async addLoanNote(request: AddLoanNoteRequest): Promise<AddLoanNoteResponse> {
        try {
            const response = await this.post<AddLoanNoteResponse>(
                '/muthoot/cp-mfl-add-note',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: false,
                message: response.message || 'Failed to add note',
                data: {
                    note_id: '',
                    loan_id: request.loan_id,
                    created_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: false,
                message: apiError.message || 'Failed to add note. Please try again.',
                data: {
                    note_id: '',
                    loan_id: request.loan_id,
                    created_at: new Date().toISOString(),
                },
            };
        }
    }
}

// Singleton instance
export const notesApi = new NotesApi();

