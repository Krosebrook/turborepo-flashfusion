import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiClientConfig, ApiResponse, RequestOptions } from '../types/client';
import { AgentTask, AgentResult, WorkflowConfig, ProjectContext } from '../types/api';
import { ApiError } from '../utils/errors';
import { validateApiKey } from '../utils/validation';

export class FlashFusionApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    if (this.config.apiKey && !validateApiKey(this.config.apiKey)) {
      throw new ApiError('Invalid API key format', 400);
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        ...this.config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(new ApiError('Request configuration error', 400, error))
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        const message = error.response?.data?.message || error.message || 'Unknown API error';
        const status = error.response?.status || 500;
        console.error(`❌ API Error: ${status} ${error.config?.url} - ${message}`);
        return Promise.reject(new ApiError(message, status, error));
      }
    );
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
        timeout: options?.timeout,
        headers: options?.headers,
      });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Request failed', 500, error);
    }
  }

  // Agent methods
  async createAgentTask(task: Omit<AgentTask, 'id'>): Promise<ApiResponse<AgentTask>> {
    return this.request<AgentTask>('POST', '/agents/tasks', task);
  }

  async getAgentTask(taskId: string): Promise<ApiResponse<AgentTask>> {
    return this.request<AgentTask>('GET', `/agents/tasks/${taskId}`);
  }

  async getAgentResult(taskId: string): Promise<ApiResponse<AgentResult>> {
    return this.request<AgentResult>('GET', `/agents/tasks/${taskId}/result`);
  }

  // Workflow methods
  async createWorkflow(workflow: Omit<WorkflowConfig, 'id'>): Promise<ApiResponse<WorkflowConfig>> {
    return this.request<WorkflowConfig>('POST', '/workflows', workflow);
  }

  async getWorkflow(workflowId: string): Promise<ApiResponse<WorkflowConfig>> {
    return this.request<WorkflowConfig>('GET', `/workflows/${workflowId}`);
  }

  async executeWorkflow(workflowId: string, input?: Record<string, any>): Promise<ApiResponse<{ executionId: string }>> {
    return this.request('POST', `/workflows/${workflowId}/execute`, { input });
  }

  // Project methods
  async createProject(project: Omit<ProjectContext, 'projectId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ProjectContext>> {
    return this.request<ProjectContext>('POST', '/projects', project);
  }

  async getProject(projectId: string): Promise<ApiResponse<ProjectContext>> {
    return this.request<ProjectContext>('GET', `/projects/${projectId}`);
  }

  async updateProject(projectId: string, updates: Partial<ProjectContext>): Promise<ApiResponse<ProjectContext>> {
    return this.request<ProjectContext>('PUT', `/projects/${projectId}`, updates);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request('GET', '/health');
  }
}