import { BaseApiService } from './baseApiService';
import { DjangoUser, ApiResponse } from '../types';

export class UserService extends BaseApiService {
  // Obter perfil do usuário atual
  async getCurrentUser(): Promise<DjangoUser> {
    const response = await this.makeAuthenticatedRequest<DjangoUser>('/user/profile/');
    return response.data;
  }

  // Atualizar perfil do usuário
  async updateProfile(userData: Partial<DjangoUser>): Promise<{ user: DjangoUser; message: string }> {
    const response = await this.makeAuthenticatedRequest<{ user: DjangoUser }>('/user/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    
    return {
      user: response.data.user,
      message: response.message
    };
  }

  // Alterar senha
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.makeAuthenticatedRequest<{ message: string }>('/user/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
    
    return {
      message: response.message
    };
  }

  // Deletar conta
  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await this.makeAuthenticatedRequest<{ message: string }>('/user/delete-account/', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    
    return {
      message: response.message
    };
  }
}

export const userService = new UserService();
