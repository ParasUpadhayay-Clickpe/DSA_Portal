/**
 * Base API class following SOLID principles
 * Single Responsibility: Handles HTTP requests only
 * Open/Closed: Can be extended without modification
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthorizationHeader } from '@/utils/auth';

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface ApiError {
    message: string;
    status?: number;
    data?: unknown;
}

export abstract class BaseApi {
    protected baseURL: string;
    protected axiosInstance: AxiosInstance;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds
        });

        // Add request interceptor to include authorization header
        this.axiosInstance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                try {
                    const token = await getAuthorizationHeader(true);
                    if (token && config.headers) {
                        config.headers.Authorization = token;
                    }
                } catch (error) {
                    console.error('Failed to get authorization header:', error);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    /**
     * Generic GET request handler
     */
    protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.get<T>(endpoint);
            return {
                success: true,
                message: 'Success',
                data: response.data,
            };
        } catch (error) {
            return this.handleRequestError<T>(error);
        }
    }

    /**
     * Generic POST request handler
     */
    protected async post<T>(
        endpoint: string,
        data: unknown,
        useJsonContentType: boolean = true
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.post<T>(endpoint, data, {
                headers: {
                    'Content-Type': useJsonContentType ? 'application/json' : 'text/plain',
                },
            });
            return {
                success: true,
                message: 'Success',
                data: response.data,
            };
        } catch (error) {
            return this.handleRequestError<T>(error);
        }
    }

    /**
     * Generic PUT request handler
     */
    protected async put<T>(
        endpoint: string,
        data: unknown
    ): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.put<T>(endpoint, data);
            return {
                success: true,
                message: 'Success',
                data: response.data,
            };
        } catch (error) {
            return this.handleRequestError<T>(error);
        }
    }

    /**
     * Generic DELETE request handler
     */
    protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await this.axiosInstance.delete<T>(endpoint);
            return {
                success: true,
                message: 'Success',
                data: response.data,
            };
        } catch (error) {
            return this.handleRequestError<T>(error);
        }
    }

    /**
     * Handle request errors
     */
    private handleRequestError<T>(error: unknown): ApiResponse<T> {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            return {
                success: false,
                message:
                    (axiosError.response?.data as { message?: string })?.message ||
                    axiosError.message ||
                    'Request failed',
                error: axiosError.message,
            };
        }
        return {
            success: false,
            message: 'An unknown error occurred',
        };
    }

    /**
     * Error handler - can be overridden by child classes
     */
    protected handleError(error: unknown): ApiError {
        if (error instanceof Error) {
            return {
                message: error.message,
            };
        }
        return {
            message: 'An unknown error occurred',
        };
    }
}
