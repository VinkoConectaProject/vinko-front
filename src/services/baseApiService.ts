import { API_CONFIG } from '../config/api';
import { ApiResponse, ApiError } from '../types';
import { ERROR_MESSAGES } from '../config/errorMessages';
import { authService } from './authService';

export class BaseApiService {
  protected baseURL = API_CONFIG.BASE_URL;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  // Processar fila de requisições falhadas
  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Função genérica para fazer requisições HTTP com tratamento padronizado da API
  protected async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Adicionar token de autorização se disponível
    const authHeaders = this.getAuthHeaders();
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      // Verificar se é erro de autenticação (401)
      if (response.status === 401) {
        // Tentar renovar o token
        const newToken = await this.handleTokenRefresh();
        if (newToken) {
          // Reenviar a requisição com o novo token
          const authHeaders = { 'Authorization': `Bearer ${newToken}` };
          const retryOptions: RequestInit = {
            ...defaultOptions,
            headers: {
              ...defaultOptions.headers,
              ...authHeaders,
            },
          };
          
          const retryResponse = await fetch(url, retryOptions);
          const retryData = await retryResponse.json();
          return this.handleApiResponse<T>(retryData);
        } else {
          // Falha na renovação, fazer logout
          authService.logout();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }
      
      const responseData = await response.json();
      return this.handleApiResponse<T>(responseData);

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

  // Tratar resposta da API
  private handleApiResponse<T>(responseData: any): ApiResponse<T> {
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
  }

  // Renovar token automaticamente
  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      // Se já está renovando, aguardar
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        this.processQueue(new Error('Refresh token não encontrado'), null);
        return null;
      }

      // Fazer refresh diretamente sem chamar checkAndRefreshTokens
      const newTokens = await authService.refreshToken(refreshToken);
      
      // Buscar dados atualizados do usuário
      const currentUser = await authService.getCurrentUser();
      
      // Salvar novos dados
      authService.saveAuthData(newTokens.access, newTokens.refresh, currentUser);
      
      this.processQueue(null, newTokens.access);
      return newTokens.access;
    } catch (error) {
      this.processQueue(error, null);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Função para adicionar token de autorização
  protected getAuthHeaders(): Record<string, string> {
    const token = authService.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }


}
