import { API_CONFIG, TOKEN_CONFIG } from '../config/api';
import { 
  AuthApiResponse, 
  RegisterApiResponse,
  UserTypesApiResponse,
  RegisterRequest, 
  LoginRequest, 
  EmailVerificationRequest, 
  ResendCodeRequest, 
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  UserType,
  ApiResponse,
  ApiError
} from '../types';
import { BaseApiService } from './baseApiService';

class AuthService extends BaseApiService {
  // Obter tipos de usuário
  async getUserTypes(name?: string): Promise<UserType[]> {
    const queryParams = name ? `?name=${encodeURIComponent(name)}` : '';
    const response = await this.makeRequest<UserType[]>(`${API_CONFIG.ENDPOINTS.USER.USER_TYPES}${queryParams}`);
    return response.data;
  }

  // Registrar usuário
  async register(data: RegisterRequest): Promise<{ user: any; message: string }> {
    const response = await this.makeRequest<{ user: any }>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      message: response.message
    };
  }

  // Login
  async login(data: LoginRequest): Promise<{ user: any; token: any; message: string }> {
    const response = await this.makeRequest<{ user: any; token: any }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      token: response.data.token,
      message: response.message
    };
  }

  // Verificar código de email
  async verifyEmail(data: EmailVerificationRequest): Promise<{ user: any; token: any; message: string }> {
    const response = await this.makeRequest<{ user: any; token: any }>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      token: response.data.token,
      message: response.message
    };
  }

  // Reenviar código de verificação
  async resendVerificationCode(data: ResendCodeRequest): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>(API_CONFIG.ENDPOINTS.AUTH.RESEND_CODE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      message: response.message
    };
  }

  // Solicitar recuperação de senha
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>(API_CONFIG.ENDPOINTS.AUTH.PASSWORD_RESET, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      message: response.message
    };
  }

  // Confirmar nova senha
  async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>(API_CONFIG.ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      message: response.message
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ access: string; message: string }> {
    const response = await this.makeRequest<{ access: string }>(API_CONFIG.ENDPOINTS.AUTH.TOKEN_REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    return {
      access: response.data.access,
      message: response.message
    };
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
