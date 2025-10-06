import { BaseApiService } from './baseApiService';
import { API_CONFIG } from '../config/api';
import { 
  BackendDemand, 
  DemandsApiResponse, 
  Demand, 
  CreateDemandRequest, 
  UpdateDemandRequest,
  ApiResponse
} from '../types';

export interface DemandsWithCounters {
  demands: Demand[];
  counters: {
    total: number;
    abertas: number;
    emAndamento: number;
    concluidas: number;
  };
}

export class DemandService extends BaseApiService {
  
  /**
   * Busca todas as demandas do usuário logado com contadores
   */
  async getDemands(search?: string, userCreated?: number): Promise<DemandsWithCounters> {
    let url = API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS;
    const params = new URLSearchParams();
    
    if (search) {
      params.append('search', search);
    }
    if (userCreated) {
      params.append('user_created', userCreated.toString());
    }
    params.append('ordering', '-created_at');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await this.makeRequest<DemandsApiResponse['data']>(url);
    
    const demands = response.data.results.map(demand => this.convertBackendDemandToFrontend(demand));
    const counters = {
      total: response.data.total,
      abertas: response.data.abertas,
      emAndamento: response.data.em_andamento,
      concluidas: response.data.concluidas,
    };

    return { demands, counters };
  }

  /**
   * Busca oportunidades para profissionais (demandas abertas com filtros)
   */
  async getOpportunities(filters?: {
    search?: string;
    uf?: string;
    city?: string;
    service?: string;
    area?: string;
  }): Promise<DemandsWithCounters> {
    let url = API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS;
    const params = new URLSearchParams();
    
    // Sempre filtrar por status ABERTA e ordenar por data de atualização
    params.append('status', 'ABERTA');
    params.append('ordering', '-created_at');
    
    // Adicionar filtros opcionais
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.uf) {
      params.append('uf', filters.uf);
    }
    if (filters?.city) {
      params.append('city', filters.city);
    }
    if (filters?.service) {
      params.append('service', filters.service);
    }
    if (filters?.area) {
      params.append('area', filters.area);
    }
    
    url += `?${params.toString()}`;
    
    const response = await this.makeRequest<DemandsApiResponse['data']>(url);
    
    const demands = response.data.results.map(demand => this.convertBackendDemandToFrontend(demand));
    const counters = {
      total: response.data.total,
      abertas: response.data.abertas,
      emAndamento: response.data.em_andamento,
      concluidas: response.data.concluidas,
    };

    return { demands, counters };
  }

  /**
   * Converte uma demanda do backend para o formato do frontend
   */
  private convertBackendDemandToFrontend(backendDemand: BackendDemand): Demand {
    const frontendDemand: Demand = {
      id: backendDemand.id.toString(),
      clientId: backendDemand.user_created.toString(),
      title: backendDemand.title,
      description: backendDemand.description,
      serviceType: backendDemand.service_name || this.getServiceTypeName(backendDemand.service),
      deadline: backendDemand.deadline ? new Date(backendDemand.deadline) : null,
      budget: {
        min: parseFloat(backendDemand.min_budget),
        max: parseFloat(backendDemand.max_budget),
      },
      location: {
        city: backendDemand.city,
        state: backendDemand.uf,
        isRemote: backendDemand.remote_work_accepted,
      },
      status: this.convertStatus(backendDemand.status),
      attachments: [], // Não temos attachments no backend ainda
      interestedProfessionals: backendDemand.interested_professionals || [],
      selectedProfessional: backendDemand.chosen_professional?.toString(),
      createdAt: new Date(backendDemand.created_at),
      updatedAt: new Date(backendDemand.updated_at),
      // Novos campos adicionados
      area: backendDemand.area_name || this.getAreaName(backendDemand.area),
      specialty: backendDemand.specialty_name || this.getSpecialtyName(backendDemand.specialty),
      tecidType: backendDemand.tecid_type,
      amount: backendDemand.amount,
      availability: backendDemand.availability_name || this.getAvailabilityName(backendDemand.availability),
      // Campos do backend preservados
      user_cellphone: backendDemand.user_cellphone,
      user_full_name: backendDemand.user_full_name,
      interested_professionals_count: backendDemand.interested_professionals_count,
      finalizedAt: backendDemand.finalized_at ? new Date(backendDemand.finalized_at) : undefined,
    };

    console.log('Convertendo demanda:', {
      id: backendDemand.id,
      user_cellphone: backendDemand.user_cellphone,
      user_full_name: backendDemand.user_full_name,
      hasPhone: !!backendDemand.user_cellphone
    });

    return frontendDemand;
  }

  /**
   * Converte status do backend para o formato do frontend
   */
  private convertStatus(backendStatus: string): 'open' | 'in_progress' | 'completed' | 'cancelled' {
    switch (backendStatus) {
      case 'ABERTA':
        return 'open';
      case 'EM ANDAMENTO':
        return 'in_progress';
      case 'CONCLUÍDA':
        return 'completed';
      default:
        return 'cancelled';
    }
  }


  /**
   * Obtém o nome do tipo de serviço baseado no ID
   * TODO: Implementar busca real dos tipos de serviço
   */
  private getServiceTypeName(serviceId: number): string {
    // Mapeamento temporário - deve ser substituído por uma busca real
    const serviceTypes: Record<number, string> = {
      1: 'Desenvolvimento Web',
      2: 'Design Gráfico',
      3: 'Marketing Digital',
      4: 'Fotografia',
      5: 'Redação',
      6: 'Tradução',
      7: 'Consultoria',
      8: 'Arquitetura',
      9: 'Engenharia',
      10: 'Advocacia',
      11: 'Contabilidade',
      12: 'Psicologia',
    };
    
    return serviceTypes[serviceId] || '-';
  }

  private getAreaName(areaId: number): string {
    // Mapeamento temporário - deve ser substituído por uma busca real
    const areas: Record<number, string> = {
      1: 'Tecnologia da Informação',
      2: 'Marketing e Publicidade',
      3: 'Design e Arte',
      4: 'Engenharia',
      5: 'Arquitetura',
      6: 'Consultoria',
      7: 'Educação',
      8: 'Saúde',
      9: 'Jurídico',
      10: 'Financeiro',
    };
    
    return areas[areaId] || '-';
  }

  private getSpecialtyName(specialtyId: number): string {
    // Mapeamento temporário - deve ser substituído por uma busca real
    const specialties: Record<number, string> = {
      1: 'Especialização A',
      2: 'Especialização B',
      3: 'Especialização C',
      4: 'Especialização D',
      5: 'Especialização E',
    };
    
    return specialties[specialtyId] || '-';
  }

  public getAvailabilityName(availabilityId: number): string {
    // Mapeamento temporário - deve ser substituído por uma busca real
    const availabilities: Record<number, string> = {
      1: 'Imediato',
      2: '1 semana',
      3: '2 semanas',
      4: '1 mês',
      5: '2 meses',
      6: '3 meses',
    };
    
    return availabilities[availabilityId] || '-';
  }

  /**
   * Busca demandas e converte para o formato do frontend (método legado)
   * @deprecated Use getDemands() que retorna contadores também
   */
  async getDemandsForFrontend(): Promise<Demand[]> {
    const { demands } = await this.getDemands();
    return demands;
  }

  /**
   * Busca demandas para "Meus Trabalhos" com filtros específicos
   */
  async getMyJobs(status?: string, chosenProfessional?: number, interestedProfessional?: number): Promise<DemandsWithCounters> {
    const params = new URLSearchParams();
    
    if (status) {
      params.append('status', status);
    }
    
    if (chosenProfessional) {
      params.append('chosen_professional', chosenProfessional.toString());
    }
    
    if (interestedProfessional) {
      params.append('interested_professionals', interestedProfessional.toString());
    }
    
    params.append('ordering', '-created_at');
    
    const url = params.toString() 
      ? `${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}?${params.toString()}`
      : API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS;
    
    const response = await this.makeRequest<DemandsWithCounters>(url);
    return response.data;
  }

  /**
   * Cria uma nova demanda
   */
  async createDemand(demandData: CreateDemandRequest): Promise<BackendDemand> {
    const response = await this.makeRequest<BackendDemand>(
      API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS,
      {
        method: 'POST',
        body: JSON.stringify(demandData),
      }
    );
    
    return response.data;
  }

  /**
   * Atualiza uma demanda existente
   */
  async updateDemand(demandId: number, demandData: UpdateDemandRequest): Promise<ApiResponse<BackendDemand>> {
    const response = await this.makeRequest<BackendDemand>(
      `${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}${demandId}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(demandData),
      }
    );
    
    return response;
  }

  /**
   * Deleta uma demanda
   */
  async deleteDemand(demandId: number): Promise<void> {
    await this.makeRequest<null>(
      `${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}${demandId}/`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Upload de arquivos para uma demanda
   */
  async uploadDemandFiles(demandId: number, files: File[]): Promise<any[]> {
    const formData = new FormData();
    formData.append('demand', demandId.toString());
    
    files.forEach(file => {
      formData.append('file', file);
    });

    const response = await this.makeRequest<any[]>(
      API_CONFIG.ENDPOINTS.DEMANDS.DEMAND_FILES,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    return response.data;
  }

  /**
   * Lista arquivos de uma demanda
   */
  async getDemandFiles(demandId: number): Promise<any[]> {
    const response = await this.makeRequest<any[]>(
      `${API_CONFIG.ENDPOINTS.DEMANDS.DEMAND_FILES}?demand=${demandId}`
    );
    
    return response.data;
  }

  /**
   * Demonstra interesse em uma demanda
   */
  async showInterest(demandId: number, userId: number): Promise<BackendDemand> {
    const response = await this.makeRequest<BackendDemand>(
      `${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}${demandId}/`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          interested_professionals_ids: [userId]
        }),
      }
    );
    
    return response.data;
  }

  /**
   * Busca uma demanda específica por ID
   */
  async getDemand(demandId: number): Promise<BackendDemand> {
    const response = await this.makeRequest<BackendDemand>(
      `${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}${demandId}/`
    );
    
    return response.data;
  }

  /**
   * Deleta um arquivo de uma demanda
   */
  async deleteDemandFile(fileId: number): Promise<void> {
    await this.makeRequest<null>(
      `${API_CONFIG.ENDPOINTS.DEMANDS.DEMAND_FILES}${fileId}/`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Busca o profissional selecionado para uma demanda específica
   */
  async getChosenProfessional(demandId: number): Promise<any> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Token de acesso não encontrado');
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}${demandId}/chosen-professional/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Se não há profissional selecionado, retornar null em vez de erro
    if (response.status === 404 || response.status === 400) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Busca profissionais interessados em uma demanda específica
   */
  async getInterestedProfessionals(demandId: number): Promise<any[]> {
    try {
      const response = await this.makeRequest<any[]>(
        `${API_CONFIG.ENDPOINTS.DEMANDS.DEMANDS}${demandId}/interested-professionals/`
      );
      return response.data || [];
    } catch (error: any) {
      // Se não há profissionais interessados, retornar array vazio
      if (error.message?.includes('404') || error.message?.includes('400')) {
        return [];
      }
      throw error;
    }
  }
}

// Instância singleton do serviço
export const demandService = new DemandService();
