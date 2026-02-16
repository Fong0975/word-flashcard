import { API_CONFIG, API_ENDPOINTS, DICTIONARY_ENDPOINTS } from './api-config';
import {
  Word,
  WordDefinition,
  CreateWordRequest,
  UpdateWordRequest,
  WordsSearchParams,
  WordsRandomRequest,
  SearchFilter,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionsSearchParams,
  QuestionsRandomRequest,
  ErrorResponse,
  ApiRequestOptions,
} from '../types/api';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API service class
class ApiService {
  private baseURL: string;
  private defaultOptions: RequestInit;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultOptions = {
      headers: API_CONFIG.headers,
    };
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Merge default options with provided options
    const requestOptions: RequestInit = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers,
      },
    };

    // Add timeout support
    const timeout = options.timeout || API_CONFIG.timeout;
    const controller = new AbortController();

    // Use provided signal if available, otherwise use timeout signal
    if (options.signal) {
      requestOptions.signal = options.signal;
    } else {
      requestOptions.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData: ErrorResponse = await response.json();
          errorMessage = errorData.error || response.statusText;
        } catch {
          errorMessage = response.statusText || 'Unknown error occurred';
        }

        throw new ApiError(
          response.status,
          response.statusText,
          errorMessage,
          response
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      // Handle fetch errors (network, timeout, etc.)
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'Request Timeout', 'Request timed out');
      }

      throw new ApiError(0, 'Network Error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Dictionary API request method (uses different base URL)
  private async dictionaryRequest<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const url = `${API_CONFIG.dictionaryBaseURL}${endpoint}`;

    // Merge default options with provided options
    const requestOptions: RequestInit = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers,
      },
    };

    // Add timeout support
    const timeout = options.timeout || API_CONFIG.timeout;
    const controller = new AbortController();

    // Use provided signal if available, otherwise use timeout signal
    if (options.signal) {
      requestOptions.signal = options.signal;
    } else {
      requestOptions.signal = controller.signal;
      setTimeout(() => controller.abort(), timeout);
    }

    try {
      const response = await fetch(url, requestOptions);

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData: ErrorResponse = await response.json();
          errorMessage = errorData.error || response.statusText;
        } catch {
          errorMessage = response.statusText || 'Unknown error occurred';
        }

        throw new ApiError(
          response.status,
          response.statusText,
          errorMessage,
          response
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      // Handle fetch errors (network, timeout, etc.)
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError(0, 'Request Timeout', 'Request timed out');
      }

      throw new ApiError(0, 'Network Error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // GET request
  private async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  // POST request
  private async post<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // PUT request
  private async put<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // DELETE request
  private async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  // Words API methods

  async searchWords(params: WordsSearchParams = {}, options?: ApiRequestOptions): Promise<Word[]> {
    const searchParams = new URLSearchParams();

    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }

    if (params.offset !== undefined) {
      searchParams.append('offset', params.offset.toString());
    }

    const endpoint = `${API_ENDPOINTS.wordsSearch}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    // If searchFilter is provided, send it in the request body
    // If no searchFilter (empty search), send empty body to get all words
    const requestBody = params.searchFilter ? params.searchFilter : {};

    return this.post<Word[]>(endpoint, requestBody, options);
  }

  async getRandomWords(request: WordsRandomRequest, options?: ApiRequestOptions): Promise<Word[]> {
    return this.post<Word[]>(API_ENDPOINTS.wordsRandom, request, options);
  }

  async getWordsCount(searchFilter?: SearchFilter, options?: ApiRequestOptions): Promise<{ count: number }> {
    return this.post<{ count: number }>(API_ENDPOINTS.wordsCount, searchFilter || {}, options);
  }

  async createWord(wordData: CreateWordRequest, options?: ApiRequestOptions): Promise<Word> {
    return this.post<Word>(API_ENDPOINTS.words, wordData, options);
  }

  async updateWordFields(id: number, wordData: UpdateWordRequest, options?: ApiRequestOptions): Promise<Word> {
    return this.put<Word>(`${API_ENDPOINTS.words}/${id}`, wordData, options);
  }

  async deleteWord(id: number, options?: ApiRequestOptions): Promise<void> {
    await this.delete<void>(`${API_ENDPOINTS.words}/${id}`, options);
  }

  async addDefinition(wordId: number, definition: Partial<WordDefinition>, options?: ApiRequestOptions): Promise<WordDefinition> {
    return this.post<WordDefinition>(API_ENDPOINTS.wordDefinition(wordId), definition, options);
  }

  async updateDefinition(definitionId: number, definition: Partial<WordDefinition>, options?: ApiRequestOptions): Promise<WordDefinition> {
    return this.put<WordDefinition>(API_ENDPOINTS.updateDefinition(definitionId), definition, options);
  }

  async deleteDefinition(definitionId: number, options?: ApiRequestOptions): Promise<void> {
    await this.delete<void>(API_ENDPOINTS.deleteDefinition(definitionId), options);
  }

  // Questions API methods

  async getAllQuestions(params: QuestionsSearchParams = {}, options?: ApiRequestOptions): Promise<Question[]> {
    const searchParams = new URLSearchParams();

    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }

    if (params.offset !== undefined) {
      searchParams.append('offset', params.offset.toString());
    }

    const endpoint = `${API_ENDPOINTS.questions}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    return this.get<Question[]>(endpoint, options);
  }

  async getQuestion(id: number, options?: ApiRequestOptions): Promise<Question> {
    return this.get<Question>(API_ENDPOINTS.questionById(id), options);
  }

  async createQuestion(questionData: CreateQuestionRequest, options?: ApiRequestOptions): Promise<Question> {
    return this.post<Question>(API_ENDPOINTS.questions, questionData, options);
  }

  async updateQuestion(id: number, questionData: UpdateQuestionRequest, options?: ApiRequestOptions): Promise<Question> {
    return this.put<Question>(API_ENDPOINTS.questionById(id), questionData, options);
  }

  async deleteQuestion(id: number, options?: ApiRequestOptions): Promise<void> {
    await this.delete<void>(API_ENDPOINTS.questionById(id), options);
  }

  async getRandomQuestions(request: QuestionsRandomRequest, options?: ApiRequestOptions): Promise<Question[]> {
    return this.post<Question[]>(API_ENDPOINTS.questionsRandom, request, options);
  }

  async getQuestionsCount(options?: ApiRequestOptions): Promise<{ count: number }> {
    return this.get<{ count: number }>(API_ENDPOINTS.questionsCount, options);
  }

  // Dictionary API methods
  async lookupWord<T = any>(word: string, options?: ApiRequestOptions): Promise<T> {
    return this.dictionaryRequest<T>(DICTIONARY_ENDPOINTS.lookup(word), { method: 'GET', ...options });
  }

}

// Export singleton instance
export const apiService = new ApiService();

// Export types for convenience
export type {
  Word,
  WordDefinition,
  CreateWordRequest,
  UpdateWordRequest,
  WordsRandomRequest,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionsRandomRequest,
  QuizConfig,
  QuizResult,
  QuestionQuizConfig,
  QuestionQuizResult
} from '../types/api';