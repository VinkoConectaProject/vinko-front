import { API_CONFIG } from '../config/api';
import { ApiResponse, ApiError } from '../types';
import { ERROR_MESSAGES } from '../config/errorMessages';

export class BaseApiService {
  protected baseURL = API_CONFIG.BASE_URL;

  // Função genérica para fazer requisições HTTP com tratamento padronizado da API
  protected async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const responseData = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada da API
      if (!responseData.hasOwnProperty('status') || !responseData.hasOwnProperty('message')) {
        console.error('Resposta da API em formato inválido:', responseData);
        throw new Error(ERROR_MESSAGES.API_INVALID_FORMAT);
      }

      // Se a API retornou erro, lançar exceção com a mensagem
      if (responseData.status === 'error') {
        throw new Error(responseData.message || ERROR_MESSAGES.OPERATION_FAILED);
      }

      // Se a API retornou sucesso, retornar os dados
      if (responseData.status === 'success') {
        return responseData as ApiResponse<T>;
      }

      // Caso inesperado
      console.error('Status de resposta inesperado da API:', responseData);
      throw new Error(ERROR_MESSAGES.API_UNEXPECTED_STATUS);

    } catch (error) {
      console.error('Erro na requisição:', error);
      
      // Se já é um Error com mensagem, apenas rethrow
      if (error instanceof Error) {
        throw error;
      }
      
      // Caso contrário, criar um erro genérico
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  // Função para adicionar token de autorização
  protected getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('vinko_access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Função para fazer requisições autenticadas
  protected async makeAuthenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const authHeaders = this.getAuthHeaders();
    
    const updatedOptions: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    };

    return this.makeRequest<T>(endpoint, updatedOptions);
  }
}
