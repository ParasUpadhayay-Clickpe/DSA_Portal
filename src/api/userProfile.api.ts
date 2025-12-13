/**
 * User Profile API class
 * Handles user profile-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetUserProfileDataRequest,
    GetUserProfileDataResponse,
    GetVerifiedUserDocumentsRequest,
    GetVerifiedUserDocumentsResponse,
} from '@/types/userProfile.types';

export class UserProfileApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get user profile data
     * Endpoint: POST /get_user_profile_data
     */
    async getUserProfileData(request: GetUserProfileDataRequest): Promise<GetUserProfileDataResponse> {
        try {
            const response = await this.post<GetUserProfileDataResponse>(
                '/get_user_profile_data',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch user profile',
                response: {
                    user_id: request.user_id,
                    fname: '',
                    lname: '',
                    mob_num: 0,
                    email: '',
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch user profile. Please try again.',
                response: {
                    user_id: request.user_id,
                    fname: '',
                    lname: '',
                    mob_num: 0,
                    email: '',
                },
            };
        }
    }

    /**
     * Get verified user documents
     * Endpoint: POST /get_verified_user_documents
     */
    async getVerifiedUserDocuments(request: GetVerifiedUserDocumentsRequest): Promise<GetVerifiedUserDocumentsResponse> {
        try {
            const response = await this.post<GetVerifiedUserDocumentsResponse>(
                '/get_verified_user_documents',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch verified documents',
                response: [],
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch verified documents. Please try again.',
                response: [],
            };
        }
    }
}

// Singleton instance
export const userProfileApi = new UserProfileApi();

