import { BaseApiService } from './baseApiService';
import { ApiResponse } from '../types';

export interface Rating {
  id: number;
  created_at: string;
  updated_at: string;
  score: number;
  comment?: string;
  professional: number;
  client: number;
}

export interface CreateRatingRequest {
  professional: number;
  score: number;
  comment?: string;
  demand?: number;
}

export interface UpdateRatingRequest {
  score: number;
  comment?: string;
}

export interface GetRatingByClientProfessionalResponse {
  id?: number;
  created_at?: string;
  updated_at?: string;
  score?: number;
  comment?: string;
  professional?: number;
  client?: number;
}

export class RatingService extends BaseApiService {
  private baseUrl = '/user/ratings';

  /**
   * Lista todas as avaliações do usuário logado
   */
  async getRatings(): Promise<ApiResponse<Rating[]>> {
    return this.makeRequest<Rating[]>(`${this.baseUrl}/`);
  }

  /**
   * Lista avaliações por profissional
   */
  async getRatingsByProfessional(professionalId: number): Promise<ApiResponse<Rating[]>> {
    return this.makeRequest<Rating[]>(`${this.baseUrl}/?professional=${professionalId}`);
  }

  /**
   * Obtém uma avaliação específica por ID
   */
  async getRatingById(ratingId: number): Promise<ApiResponse<Rating>> {
    return this.makeRequest<Rating>(`${this.baseUrl}/${ratingId}`);
  }

  /**
   * Obtém avaliação por cliente e profissional
   */
  async getRatingByClientProfessional(
    clientId: number, 
    professionalId: number,
    demandId?: number
  ): Promise<ApiResponse<GetRatingByClientProfessionalResponse>> {
    const params = new URLSearchParams({
      client_id: clientId.toString(),
      professional_id: professionalId.toString()
    });
    
    if (demandId) {
      params.append('demand_id', demandId.toString());
    }
    
    return this.makeRequest<GetRatingByClientProfessionalResponse>(
      `${this.baseUrl}/get_by_client_professional/?${params.toString()}`
    );
  }

  /**
   * Cria uma nova avaliação
   */
  async createRating(data: CreateRatingRequest): Promise<ApiResponse<Rating>> {
    return this.makeRequest<Rating>(`${this.baseUrl}/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Atualiza uma avaliação existente
   */
  async updateRating(ratingId: number, data: UpdateRatingRequest): Promise<ApiResponse<Rating>> {
    return this.makeRequest<Rating>(`${this.baseUrl}/${ratingId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * Remove uma avaliação
   */
  async deleteRating(ratingId: number): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`${this.baseUrl}/${ratingId}/`, {
      method: 'DELETE'
    });
  }

  /**
   * Método utilitário para criar ou atualizar uma avaliação
   */
  async createOrUpdateRating(
    professionalId: number,
    score: number,
    comment?: string,
    existingRatingId?: number
  ): Promise<ApiResponse<Rating>> {
    if (existingRatingId) {
      return this.updateRating(existingRatingId, { score, comment });
    } else {
      return this.createRating({ professional: professionalId, score, comment });
    }
  }
}

export const ratingService = new RatingService();
