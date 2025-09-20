import { BaseApiService } from './baseApiService';
import { ApiResponse } from '../types';

export interface Rating {
  id: number;
  created_at: string;
  updated_at: string;
  score: number;
  professional: number;
  client: number;
}

export interface CreateRatingRequest {
  professional: number;
  score: number;
}

export interface UpdateRatingRequest {
  score: number;
}

export interface GetRatingByClientProfessionalResponse {
  id?: number;
  created_at?: string;
  updated_at?: string;
  score?: number;
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
    professionalId: number
  ): Promise<ApiResponse<GetRatingByClientProfessionalResponse>> {
    return this.makeRequest<GetRatingByClientProfessionalResponse>(
      `${this.baseUrl}/get_by_client_professional/?client_id=${clientId}&professional_id=${professionalId}`
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
    existingRatingId?: number
  ): Promise<ApiResponse<Rating>> {
    if (existingRatingId) {
      return this.updateRating(existingRatingId, { score });
    } else {
      return this.createRating({ professional: professionalId, score });
    }
  }
}

export const ratingService = new RatingService();
