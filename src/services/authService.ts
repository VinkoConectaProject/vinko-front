import { API_CONFIG, TOKEN_CONFIG } from '../config/api';
import { 
  AuthResponse, 
  RegisterRequest, 
  LoginRequest, 
  EmailVerificationRequest, 
  ResendCodeRequest, 
  RegisterResponse,
  UserType 
} from '../types';

class AuthService {
  private baseURL = API_CONFIG.BASE_URL;

  // Função para fazer requisições HTTP
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Se a API retornou uma mensagem específica, use ela
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        // Caso contrário, use mensagens genéricas baseadas no status
        const genericMessages: Record<number, string> = {
          400: 'Dados inválidos. Verifique as informações fornecidas.',
          401: 'Credenciais inválidas. Verifique seu email e senha.',
          403: 'Acesso negado. Você não tem permissão para esta ação.',
          404: 'Recurso não encontrado.',
          409: 'Conflito. Este email já está em uso.',
          422: 'Dados inválidos. Verifique as informações fornecidas.',
          429: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
          500: 'Erro interno do servidor. Tente novamente mais tarde.',
          502: 'Serviço temporariamente indisponível. Tente novamente.',
          503: 'Serviço em manutenção. Tente novamente mais tarde.',
        };
        
        const genericMessage = genericMessages[response.status] || `Erro ${response.status}. Tente novamente.`;
        throw new Error(genericMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
      
      // Se já é um Error com mensagem, apenas rethrow
      if (error instanceof Error) {
        throw error;
      }
      
      // Caso contrário, criar um erro genérico
      throw new Error('Erro inesperado. Verifique sua conexão e tente novamente.');
    }
  }

  // Obter tipos de usuário
  async getUserTypes(name?: string): Promise<UserType[]> {
    const queryParams = name ? `?name=${encodeURIComponent(name)}` : '';
    return this.makeRequest<UserType[]>(`${API_CONFIG.ENDPOINTS.USER.USER_TYPES}${queryParams}`);
  }

  // Registrar usuário
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Login
  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Verificar código de email
  async verifyEmail(data: EmailVerificationRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reenviar código de verificação
  async resendVerificationCode(data: ResendCodeRequest): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_CONFIG.ENDPOINTS.AUTH.RESEND_CODE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    return this.makeRequest<{ access: string }>(API_CONFIG.ENDPOINTS.AUTH.TOKEN_REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  // Salvar tokens no localStorage
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    
    // Salvar timestamp de expiração
    const accessExpiry = Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_LIFETIME;
    localStorage.setItem('vinko_access_expiry', accessExpiry.toString());
  }

  // Obter access token
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
  }

  // Obter refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
  }

  // Verificar se o token está expirado
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('vinko_access_expiry');
    if (!expiry) return true;
    
    return Date.now() > parseInt(expiry);
  }

  // Limpar tokens
  clearTokens(): void {
    localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem('vinko_access_expiry');
  }

  // Verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired();
  }
}

export const authService = new AuthService(); 
