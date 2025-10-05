import { BaseApiService } from './baseApiService';
import { ApiResponse } from '../types';

// Tipos específicos para mensagens
export interface ConversationsApiResponse extends ApiResponse<any[]> {}

class MessagingService extends BaseApiService {
  /**
   * Busca todas as conversas do usuário logado (aba Todas)
   */
  async getAllConversations(): Promise<ConversationsApiResponse> {
    return this.makeRequest<any[]>(`/messaging/conversations/?is_archived=false&is_hidden=false`);
  }

  /**
   * Busca conversas não lidas (aba Não lidas)
   */
  async getUnreadConversations(): Promise<ConversationsApiResponse> {
    return this.makeRequest<any[]>(`/messaging/conversations/?has_unread=true&is_archived=false&is_hidden=false`);
  }

  /**
   * Busca conversas arquivadas (aba Arquivadas)
   */
  async getArchivedConversations(): Promise<ConversationsApiResponse> {
    return this.makeRequest<any[]>(`/messaging/conversations/?is_archived=true&is_hidden=false`);
  }

  /**
   * Busca mensagens de uma conversa específica
   */
  async getConversationMessages(conversationId: number): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/messaging/messages/?conversation=${conversationId}`);
  }

  /**
   * Envia uma mensagem para uma conversa
   */
  async sendMessage(conversationId: number, content: string): Promise<ApiResponse<any>> {
    console.log('📤 MessagingService.sendMessage:', {
      conversationId,
      content,
      url: '/messaging/messages/',
      body: { conversation: conversationId, content }
    });
    
    return this.makeRequest<any>(`/messaging/messages/`, {
      method: 'POST',
      body: JSON.stringify({ 
        conversation: conversationId,
        content: content 
      }),
    });
  }

  /**
   * Busca conversas por termo de busca
   */
  async searchConversations(searchTerm: string): Promise<ConversationsApiResponse> {
    // A API retorna mensagens, então precisamos agrupá-las por conversa
    const response = await this.makeRequest<any[]>(`/messaging/messages/?search=${encodeURIComponent(searchTerm)}`);
    
    if (!response.data || response.data.length === 0) {
      return {
        status: response.status,
        message: response.message,
        error: response.error,
        data: []
      };
    }

    // Obter IDs únicos das conversas
    const conversationIds = [...new Set(response.data.map((message: any) => message.conversation))];
    
    // Buscar detalhes das conversas
    const conversationDetailsPromises = conversationIds.map(async (conversationId) => {
      try {
        const convResponse = await this.makeRequest<any>(`/messaging/conversations/${conversationId}/`);
        return convResponse.data;
      } catch (error) {
        console.warn(`Erro ao buscar detalhes da conversa ${conversationId}:`, error);
        return null;
      }
    });

    const conversationDetails = await Promise.all(conversationDetailsPromises);
    const validConversations = conversationDetails.filter(conv => conv !== null);

    // Agrupar mensagens por conversa e mesclar com detalhes
    const conversationMap = new Map<number, any>();
    
    response.data.forEach((message: any) => {
      const conversationId = message.conversation;
      const conversationDetail = validConversations.find(conv => conv.id === conversationId);
      
      if (!conversationMap.has(conversationId)) {
        // Usar detalhes da conversa se disponível, senão criar baseado na mensagem
        const conversation = conversationDetail || {
          id: conversationId,
          participants: [message.sender],
          title: `Conversa ${conversationId}`,
          last_message_at: message.created_at,
          created_at: message.created_at,
          updated_at: message.updated_at,
          last_message: null,
          unread_count: 0,
          is_archived: false
        };

        // Atualizar com dados da mensagem
        conversation.last_message = message;
        conversation.last_message_at = message.created_at;
        conversation.unread_count = message.is_read ? 0 : 1;

        conversationMap.set(conversationId, conversation);
      } else {
        const conversation = conversationMap.get(conversationId);
        
        // Atualizar última mensagem se esta for mais recente
        if (new Date(message.created_at) > new Date(conversation.last_message_at)) {
          conversation.last_message_at = message.created_at;
          conversation.last_message = message;
        }
        
        // Incrementar contador de não lidas se a mensagem não foi lida
        if (!message.is_read) {
          conversation.unread_count += 1;
        }
      }
    });

    // Converter Map para array e ordenar por última mensagem
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    return {
      status: response.status,
      message: response.message,
      error: response.error,
      data: conversations
    };
  }

  /**
   * Editar uma mensagem
   */
  async editMessage(messageId: number, content: string): Promise<ApiResponse<any>> {
    console.log('✏️ MessagingService.editMessage:', {
      messageId,
      content,
      url: `/messaging/messages/${messageId}/`,
      method: 'PATCH',
      body: { content }
    });
    
    return this.makeRequest<any>(`/messaging/messages/${messageId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Deleta uma mensagem específica
   */
  async deleteMessage(messageId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/messaging/messages/${messageId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Marca uma mensagem como lida
   */
  async markMessageAsRead(messageId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/messaging/messages/${messageId}/mark_as_read/`, {
      method: 'POST',
    });
  }

  /**
   * Marca todas as mensagens de uma conversa como lidas
   */
  async markConversationAsRead(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/messaging/messages/mark_conversation_as_read/`, {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId }),
    });
  }

  /**
   * Arquivar uma conversa
   */
  async archiveConversation(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/messaging/conversations/${conversationId}/archive/`, {
      method: 'POST',
    });
  }

  /**
   * Desarquivar uma conversa
   */
  async unarchiveConversation(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/messaging/conversations/${conversationId}/unarchive/`, {
      method: 'POST',
    });
  }

  /**
   * Deletar uma conversa (esconder)
   */
  async deleteConversation(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(`/messaging/conversations/${conversationId}/hide/`, {
      method: 'POST',
    });
  }
}

export const messagingService = new MessagingService();