import { BaseApiService } from './baseApiService';
import { DjangoUser, ApiResponse } from '../types';

interface ServiceOption {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  areas?: ServiceOption[]; // Áreas relacionadas ao serviço
}

interface ServiceOptionsResponse {
  success: boolean;
  message: string;
  data: ServiceOption[];
}

interface ProfessionalRating {
  id: number;
  score: number;
  comment: string;
  client_name: string;
  demand_title: string;
  created_at: string;
}

interface ProfessionalAnalytics {
  active_jobs: number;
  rating_avg: number;
  rating_count: number;
  completed_jobs: number;
  open_demands: number;
  ratings: ProfessionalRating[];
}

interface ClientAnalytics {
  active_demands: number;
  interested_professionals: number;
  completed_jobs: number;
  available_professionals: number;
}

interface ClientSearchResult {
  id: number;
  nome: string;
  razao_social: string;
  especialidade: string;
  estado: string;
  cidade: string;
  total_demandas: number;
  trabalhos_concluidos: number;
}

interface ClientSearchResponse {
  status: string;
  message: string;
  error: string;
  data: ClientSearchResult[];
}

export class UserService extends BaseApiService {
  // Obter perfil do usuário atual
  async getCurrentUser(): Promise<DjangoUser> {
    const response = await this.makeRequest<DjangoUser>('/user/profile/');
    return response.data;
  }

  // Obter perfil do usuário atual
  async getUserById(): Promise<DjangoUser> {
    // Usar a rota /me/ para obter dados do usuário atual
    try {
      const response = await this.makeRequest<DjangoUser>('/user/users/me/');
      // Verificar se a resposta tem estrutura aninhada
      if (response.data && typeof response.data === 'object') {
        // Se a resposta tem user dentro de data, retornar apenas o user
        if (response.data.user) {
          return response.data.user;
        }
        return response.data;
      } else {
        return response;
      }
    } catch (error) {
      // Se falhar, usar a rota de perfil atual como fallback
      const response = await this.makeRequest<DjangoUser>('/user/profile/');
      // Verificar se a resposta tem estrutura aninhada
      if (response.data && typeof response.data === 'object') {
        // Se a resposta tem user dentro de data, retornar apenas o user
        if (response.data.user) {
          return response.data.user;
        }
        return response.data;
      } else {
        return response;
      }
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(userData: Partial<DjangoUser>): Promise<{ user: DjangoUser; message: string }> {
    const response = await this.makeRequest<{ user: DjangoUser }>('/user/profile/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    
    return {
      user: response.data.user,
      message: response.message
    };
  }

  // Atualizar perfil do usuário por ID
  async updateUserById(userId: number, userData: Partial<DjangoUser>): Promise<{ user: DjangoUser; message: string }> {
    const response = await this.makeRequest<{ user: DjangoUser }>(`/user/users/${userId}/`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    
    return {
      user: response.data.user,
      message: response.message
    };
  }

  // Listar serviços
  async getServices(): Promise<ServiceOption[]> {
    try {
      const response = await this.makeRequest<ServiceOptionsResponse>('/user/services/');
      // Verificar se a resposta tem estrutura aninhada
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Obter serviço específico
  async getServiceById(serviceId: number): Promise<ServiceOption> {
    const response = await this.makeRequest<ServiceOption>(`/user/services/${serviceId}/`);
    return response.data;
  }

  // Listar áreas de atuação
  async getServiceAreas(): Promise<ServiceOption[]> {
    try {
      const response = await this.makeRequest<ServiceOptionsResponse>('/user/service-areas/');
      // Verificar se a resposta tem estrutura aninhada
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  // Obter área de atuação específica
  async getServiceAreaById(areaId: number): Promise<ServiceOption> {
    const response = await this.makeRequest<ServiceOption>(`/user/service-areas/${areaId}/`);
    return response.data;
  }

  // Listar especialidades
  async getSpecialties(): Promise<ServiceOption[]> {
    try {
      const response = await this.makeRequest<ServiceOptionsResponse>('/user/specialties/');
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Obter especialidade específica
  async getSpecialtyById(specialtyId: number): Promise<ServiceOption> {
    const response = await this.makeRequest<ServiceOption>(`/user/specialties/${specialtyId}/`);
    return response.data;
  }

  // Listar maquinários
  async getMachines(): Promise<ServiceOption[]> {
    try {
      const response = await this.makeRequest<ServiceOptionsResponse>('/user/machines/');
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Obter maquinário específico
  async getMachineById(machineId: number): Promise<ServiceOption> {
    const response = await this.makeRequest<ServiceOption>(`/user/machines/${machineId}/`);
    return response.data;
  }

  // Listar disponibilidades
  async getAvailabilities(): Promise<ServiceOption[]> {
    try {
      const response = await this.makeRequest<ServiceOptionsResponse>('/user/availabilities/');
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // Obter disponibilidade específica
  async getAvailabilityById(availabilityId: number): Promise<ServiceOption> {
    const response = await this.makeRequest<ServiceOption>(`/user/availabilities/${availabilityId}/`);
    return response.data;
  }

  // Alterar senha
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>('/user/change-password/', {
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
    const response = await this.makeRequest<{ message: string }>('/user/delete-account/', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    
    return {
      message: response.message
    };
  }

  // Obter analytics do dashboard profissional
  async getProfessionalAnalytics(): Promise<ProfessionalAnalytics> {
    const response = await this.makeRequest<ProfessionalAnalytics>('/user/users/dashboard_professional_analytics/');
    return response.data;
  }

  // Obter analytics do dashboard do cliente
  async getClientAnalytics(): Promise<ClientAnalytics> {
    const response = await this.makeRequest<ClientAnalytics>('/user/users/dashboard_client_analytics/');
    return response.data;
  }

  // Buscar clientes/marca
  async searchClients(params: {
    specialty_id?: string;
    uf?: string;
    city?: string;
    search?: string;
  } = {}): Promise<ClientSearchResult[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.specialty_id) queryParams.append('specialty_id', params.specialty_id);
      if (params.uf) queryParams.append('uf', params.uf);
      if (params.city) queryParams.append('city', params.city);
      if (params.search) queryParams.append('search', params.search);

      const queryString = queryParams.toString();
      const url = `/user/clients/search/${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.makeRequest<ClientSearchResponse>(url);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }
}

export const userService = new UserService();
