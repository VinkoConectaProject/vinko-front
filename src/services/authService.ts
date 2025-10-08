import { API_CONFIG, TOKEN_CONFIG } from '../config/api';
import { 
  RegisterRequest, 
  LoginRequest, 
  EmailVerificationRequest, 
  ResendCodeRequest, 
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  PasswordResetValidateRequest,
  TokenResponse,
  DjangoUser
} from '../types';
import { BaseApiService } from './baseApiService';

class AuthService extends BaseApiService {
  // Obter tokens (login)
  async getTokens(email: string, password: string): Promise<TokenResponse> {
    const response = await this.makeRequest<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.TOKEN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    return response.data;
  }

  // Registrar usuário
  async register(data: RegisterRequest): Promise<{ user: DjangoUser; message: string }> {
    const response = await this.makeRequest<{ user: DjangoUser }>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    return {
      user: response.data.user,
      message: response.message
    };
  }

  // Login
  async login(data: LoginRequest): Promise<{ user: DjangoUser; token: TokenResponse; message: string }> {
    const response = await this.makeRequest<{ user: DjangoUser; token: TokenResponse }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
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
  async verifyEmail(data: EmailVerificationRequest): Promise<{ user: DjangoUser; token: TokenResponse; message: string }> {
    const response = await this.makeRequest<{ user: DjangoUser; token: TokenResponse }>(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, {
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

  // Validar código de redefinição de senha
  async validatePasswordResetCode(data: PasswordResetValidateRequest): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>(API_CONFIG.ENDPOINTS.AUTH.PASSWORD_RESET_VALIDATE, {
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
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await this.makeRequest<TokenResponse>(API_CONFIG.ENDPOINTS.AUTH.TOKEN_REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    return response.data;
  }

  // Obter dados do usuário atual usando a nova rota
  async getCurrentUser(): Promise<DjangoUser> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User ID não encontrado');
    }

    const endpoint = API_CONFIG.ENDPOINTS.USER.USER_BY_ID.replace('id_user', userId);
    const response = await this.makeRequest<{ user: DjangoUser; token: TokenResponse }>(endpoint, {
      method: 'GET',
    });
    
    // Atualizar tokens se fornecidos na resposta
    if (response.data.token) {
      this.saveAuthData(response.data.token.access, response.data.token.refresh, response.data.user);
    }
    
    return response.data.user;
  }

  // Salvar dados de autenticação no localStorage (apenas as variáveis especificadas)
  saveAuthData(accessToken: string, refreshToken: string, user: DjangoUser): void {
    localStorage.setItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(TOKEN_CONFIG.USER_ID_KEY, user.id.toString());
    localStorage.setItem(TOKEN_CONFIG.USER_TYPE_KEY, user.user_type);
    localStorage.setItem(TOKEN_CONFIG.USER_KEY, JSON.stringify(user));
  }

  // Obter access token
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
  }

  // Obter refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
  }

  // Obter user ID
  getUserId(): string | null {
    return localStorage.getItem(TOKEN_CONFIG.USER_ID_KEY);
  }

  // Obter user type
  getUserType(): string | null {
    return localStorage.getItem(TOKEN_CONFIG.USER_TYPE_KEY);
  }

  // Obter user
  getUser(): DjangoUser | null {
    const userStr = localStorage.getItem(TOKEN_CONFIG.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Verificar se o usuário está autenticado
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const userId = this.getUserId();
    
    if (!accessToken || !refreshToken || !userId) return false;
    
    return true;
  }

  // Limpar todos os dados de autenticação (apenas as variáveis especificadas)
  clearAuthData(): void {
    localStorage.removeItem(TOKEN_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_CONFIG.USER_ID_KEY);
    localStorage.removeItem(TOKEN_CONFIG.USER_TYPE_KEY);
    localStorage.removeItem(TOKEN_CONFIG.USER_KEY);
  }

  // Logout completo - limpa todos os dados de autenticação
  logout(): void {
    console.log('Iniciando logout completo...');
    
    // 1. Limpar dados de autenticação
    this.clearAuthData();
    
    // 2. Limpar dados específicos do Vinko
    localStorage.removeItem('vinko-current-user');
    localStorage.removeItem('vinko-users');
    localStorage.removeItem('vinko-data');
    
    // 3. Limpar todos os dados de sessão
    sessionStorage.clear();
    
    // 4. Limpar qualquer outro dado que possa estar armazenado
    // Lista de todas as chaves que devem ser removidas
    const keysToRemove = [
      'vinko-current-user',
      'vinko-users', 
      'vinko-data',
      'access_token',
      'refresh_token',
      'user_id',
      'user_type',
      'user'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // 5. Forçar limpeza do cache do navegador (apenas para dados do app)
    // Isso garante que não haja dados residuais
    try {
      // Verificar se há outras chaves relacionadas ao Vinko
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes('vinko') || key.includes('token') || key.includes('user')) {
          localStorage.removeItem(key);
        }
      });
    } catch (err) {
      console.error('Erro ao limpar localStorage:', err);
    }
    
    console.log('Logout completo. Redirecionando...');
    
    // 6. Forçar reload completo da página para limpar memória
    // Usar replace para não permitir voltar com o botão de voltar
    window.location.replace('/');
  }

  // Verificar e renovar tokens automaticamente
  async checkAndRefreshTokens(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      // Primeiro, tentar fazer uma requisição simples para verificar se o access token ainda é válido
      const userId = this.getUserId();
      if (!userId) {
        this.logout();
        return false;
      }

      const endpoint = API_CONFIG.ENDPOINTS.USER.USER_BY_ID.replace('id_user', userId);
      
      try {
        // Tentar fazer uma requisição com o access token atual
        const response = await this.makeRequest<{ user: DjangoUser; token: TokenResponse }>(endpoint, {
          method: 'GET',
        });
        
        // Se a requisição foi bem-sucedida, o token ainda é válido
        // Atualizar tokens se fornecidos na resposta
        if (response.data.token) {
          this.saveAuthData(response.data.token.access, response.data.token.refresh, response.data.user);
        }
        
        return true;
      } catch (error: unknown) {
        // Se recebeu 401, o access token expirou, tentar renovar
        if (error instanceof Error && error.message.includes('401')) {
          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            this.logout();
            return false;
          }

          // Tentar renovar o token
          const newTokens = await this.refreshToken(refreshToken);
          
          // Buscar dados atualizados do usuário
          const currentUser = await this.getCurrentUser();
          
          // Salvar novos dados
          this.saveAuthData(newTokens.access, newTokens.refresh, currentUser);
          
          return true;
        } else {
          // Outro tipo de erro, fazer logout
          this.logout();
          return false;
        }
      }
    } catch {
      this.logout();
      return false;
    }
  }
}

export const authService = new AuthService(); 
