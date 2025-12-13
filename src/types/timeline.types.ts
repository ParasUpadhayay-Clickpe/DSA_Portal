/**
 * Types for Timeline API
 */

export interface GetUserTimelineRequest {
    query_name: 'cp_mfl_user_timeline';
    key: {
        user_id: string;
    };
}

export interface TimelineEvent {
    loanApplicationID: string;
    loggedAt: string;
    sourceEntityID: string;
    entityType: string;
    eventDescription: string;
    entityRef: string;
    eventType: string;
}

export interface GetUserTimelineResponse {
    status: string;
    message: string;
    error: string;
    response: {
        user_id: string;
        timeline: TimelineEvent[];
        last_updated_at: string;
    };
}

