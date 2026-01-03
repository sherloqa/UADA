// Export types from models for external use
export { ILog, ArtifactType, LogLevel, Severity } from '../models/Log';
export { CreateLogDTO, QueryLogsDTO } from '../services/logsService';

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export interface PaginationInfo {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
}

export interface LogsQueryResponse {
    logs: ILog[];
    pagination: PaginationInfo;
}

// Import ILog type for use in this file
import { ILog } from '../models/Log';