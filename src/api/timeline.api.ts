/**
 * Timeline API class
 * Handles timeline-related API calls
 */

import { BaseApi } from './base.api';
import { LOS_API_BASE_URL } from '@/config';
import type {
    GetUserTimelineRequest,
    GetUserTimelineResponse,
} from '@/types/timeline.types';

export class TimelineApi extends BaseApi {
    constructor() {
        super(LOS_API_BASE_URL);
    }

    /**
     * Get user timeline
     * Endpoint: POST /cp_mf_get_user_timeline
     */
    async getUserTimeline(request: GetUserTimelineRequest): Promise<GetUserTimelineResponse> {
        try {
            const response = await this.post<GetUserTimelineResponse>(
                '/cp_mf_get_user_timeline',
                request,
                true
            );

            if (response.success && response.data) {
                return response.data;
            }

            return {
                status: 'Error',
                message: response.message || 'Failed to fetch timeline',
                error: '',
                response: {
                    user_id: request.key.user_id,
                    timeline: [],
                    last_updated_at: new Date().toISOString(),
                },
            };
        } catch (error) {
            const apiError = this.handleError(error);
            return {
                status: 'Error',
                message: apiError.message || 'Failed to fetch timeline. Please try again.',
                error: apiError.message || '',
                response: {
                    user_id: request.key.user_id,
                    timeline: [],
                    last_updated_at: new Date().toISOString(),
                },
            };
        }
    }
}

// Singleton instance
export const timelineApi = new TimelineApi();

