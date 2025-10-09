import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  User, 
  Clock, 
  CheckCheck,
  Search, 
  Trash2,
  Archive,
  AlertTriangle,
  X,
  Edit3,
  Check
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { messagingService } from '../../services/messagingService';
import { ApiConversation, ConversationParticipant, ConversationMessage } from '../../types';

interface MessagesPageProps {
  selectedConversationId?: string;
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export function MessagesPage({ selectedConversationId, onStartConversation }: MessagesPageProps) {
  // onStartConversation pode ser usado no futuro para iniciar conversas programaticamente
  void onStartConversation;
  const { state, dispatch } = useApp();
  const [selectedConversation, setSelectedConversation] = useState<ApiConversation | null>(null);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [allConversations, setAllConversations] = useState<ApiConversation[]>([]);
  const [unreadConversations, setUnreadConversations] = useState<ApiConversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<ApiConversation[]>([]);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'archived'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageContent, setEditMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar todas as conversas e contadores
  useEffect(() => {
    const loadAllConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar todas as conversas em paralelo
        const [allResponse, unreadResponse, archivedResponse] = await Promise.all([
          messagingService.getAllConversations(), // Aba Todas
          messagingService.getUnreadConversations(), // Aba Não lidas
          messagingService.getArchivedConversations() // Aba Arquivadas
        ]);
        
        setAllConversations(allResponse.data);
        setUnreadConversations(unreadResponse.data);
        setArchivedConversations(archivedResponse.data);
        
        // Definir conversas ativas baseado no filtro
        switch (filterStatus) {
          case 'unread':
            setConversations(unreadResponse.data);
            break;
          case 'archived':
            setConversations(archivedResponse.data);
            break;
          default:
            setConversations(allResponse.data);
        }
      } catch (err) {
        console.error('Erro ao carregar conversas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar conversas');
      } finally {
        setLoading(false);
      }
    };

    loadAllConversations();
  }, [filterStatus]);

  // Estado para conversas de busca
  const [searchResults, setSearchResults] = useState<ApiConversation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Buscar conversas quando o termo de busca mudar
  useEffect(() => {
    const searchConversations = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        console.log('Buscando conversas com termo:', searchTerm);
        const response = await messagingService.searchConversations(searchTerm);
        console.log('Resposta da busca:', response);
        setSearchResults(response.data || []);
      } catch (err) {
        console.error('Erro ao buscar conversas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar conversas');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchConversations, 300); // Debounce de 300ms
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Get user conversations with search filtering - usar dados como vêm da API (já ordenados)
  const userConversations = searchTerm.trim() 
    ? searchResults
    : conversations;

  // Carregar mensagens da conversa selecionada
  const loadConversationMessages = async (conversationId: number) => {
    try {
      setMessagesLoading(true);
      const response = await messagingService.getConversationMessages(conversationId);
      setConversationMessages(response.data);
      
      // Marcar todas as mensagens da conversa como lidas
      await messagingService.markConversationAsRead(conversationId);
      
      // Aguardar um pequeno delay para garantir que a API processou
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Atualizar contadores após marcar como lidas
      await updateConversationCounters();
      
      // Scroll para baixo quando carregar mensagens
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Função para atualizar uma conversa específica na lista (mover para o topo)
  const updateConversationInList = useCallback((conversationId: number, updatedConversation?: ApiConversation) => {
    console.log('🔄 Atualizando conversa na lista:', conversationId);
    
    const updateConversationList = (conversations: ApiConversation[]) => {
      // Encontrar a conversa atual
      const currentConversation = conversations.find(c => c.id === conversationId);
      if (!currentConversation) return conversations;
      
      // Remover a conversa da lista
      const filteredConversations = conversations.filter(c => c.id !== conversationId);
      
      // Atualizar dados da conversa se fornecido
      const conversationToMove = updatedConversation || currentConversation;
      
      // Adicionar no topo da lista
      return [conversationToMove, ...filteredConversations];
    };
    
    // Atualizar todas as listas
    setAllConversations(prev => updateConversationList(prev));
    setUnreadConversations(prev => updateConversationList(prev));
    setArchivedConversations(prev => updateConversationList(prev));
    
    // Atualizar lista ativa baseado no filtro atual
    switch (filterStatus) {
      case 'unread':
        setConversations(prev => updateConversationList(prev));
        break;
      case 'archived':
        setConversations(prev => updateConversationList(prev));
        break;
      default:
        setConversations(prev => updateConversationList(prev));
    }
    
    console.log('✅ Conversa movida para o topo da lista');
  }, [filterStatus]);

  // Função para atualizar contadores de conversas
  const updateConversationCounters = async () => {
    try {
      console.log('🔄 Atualizando contadores de conversas...');
      
      const [allResponse, unreadResponse, archivedResponse] = await Promise.all([
        messagingService.getAllConversations(), // Aba Todas
        messagingService.getUnreadConversations(), // Aba Não lidas
        messagingService.getArchivedConversations() // Aba Arquivadas
      ]);
      
      console.log('📊 Contadores atualizados:', {
        todas: allResponse.data.length,
        naoLidas: unreadResponse.data.length,
        arquivadas: archivedResponse.data.length
      });
      
      // Forçar atualização dos estados
      setAllConversations([...allResponse.data]);
      setUnreadConversations([...unreadResponse.data]);
      setArchivedConversations([...archivedResponse.data]);
      
      // Atualizar conversas ativas baseado no filtro atual
      switch (filterStatus) {
        case 'unread':
          setConversations([...unreadResponse.data]);
          console.log('📋 Lista ativa atualizada para: Não lidas');
          break;
        case 'archived':
          setConversations([...archivedResponse.data]);
          console.log('📋 Lista ativa atualizada para: Arquivadas');
          break;
        default:
          setConversations([...allResponse.data]);
          console.log('📋 Lista ativa atualizada para: Todas');
      }
      
      console.log('✅ Contadores atualizados com sucesso');
    } catch (err) {
      console.error('❌ Erro ao atualizar contadores:', err);
    }
  };

  // Função para atualizar resultados de busca
  const updateSearchResults = async () => {
    if (searchTerm.trim()) {
      try {
        console.log('🔍 Atualizando resultados de busca para:', searchTerm);
        const response = await messagingService.searchConversations(searchTerm);
        setSearchResults(response.data || []);
        console.log('✅ Resultados de busca atualizados:', response.data?.length || 0, 'conversas');
      } catch (err) {
        console.error('❌ Erro ao atualizar resultados de busca:', err);
        setSearchResults([]);
      }
    } else {
      console.log('🔍 Limpando resultados de busca (sem termo)');
      setSearchResults([]);
    }
  };

  // Função para forçar atualização completa do frontend
  const forceUpdateFrontend = async () => {
    try {
      console.log('🚀 Forçando atualização completa do frontend...');
      
      // Aguardar um pequeno delay para garantir que a API processou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Atualizar tudo
      await Promise.all([
        updateConversationCounters(),
        updateSearchResults()
      ]);
      
      console.log('✅ Atualização completa do frontend concluída');
    } catch (err) {
      console.error('❌ Erro na atualização completa:', err);
    }
  };

  // Função para fazer scroll para baixo
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Pequeno delay para garantir que o DOM foi atualizado
  };

  // Função para agrupar mensagens por data
  const groupMessagesByDate = (messages: ConversationMessage[]) => {
    const groups: { [key: string]: ConversationMessage[] } = {};
    
    // Ordenar mensagens da mais antiga para a mais recente (para que apareçam embaixo)
    const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sortedMessages.forEach((message) => {
      const date = new Date(message.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  // Função para formatar data para exibição
  const formatDateLabel = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(dateString.split('/').reverse().join('-'));
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return dateString;
    }
  };

  // Função para adicionar mensagem sutilmente (sem refresh)
  const addMessageSubtly = useCallback((newMessage: ConversationMessage) => {
    setConversationMessages(prevMessages => {
      // Verificar se a mensagem já existe (evitar duplicatas)
      const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
      if (messageExists) {
        return prevMessages;
      }
      
      // Adicionar nova mensagem no final
      return [...prevMessages, newMessage];
    });
  }, []);

  // Função para remover mensagem sutilmente (sem refresh)
  const removeMessageSubtly = (messageId: number) => {
    setConversationMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== messageId)
    );
  };

  const markMessagesAsRead = useCallback((conversationId: string) => {
    dispatch({ 
      type: 'MARK_MESSAGES_READ', 
      payload: { conversationId, userId: state.currentUser?.id || '' } 
    });
  }, [dispatch, state.currentUser?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Select conversation from props
  useEffect(() => {
    if (selectedConversationId) {
      // Buscar na lista de conversas carregadas
      const conversation = conversations.find(c => c.id.toString() === selectedConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        setNewMessage(''); // Limpar input de mensagem ao selecionar conversa via props
        markMessagesAsRead(conversation.id.toString());
      }
    }
  }, [selectedConversationId, conversations, markMessagesAsRead]);

  // Polling automático para atualizar conversas a cada 5 segundos
  useEffect(() => {
    const pollConversations = async () => {
      try {
        console.log('🔄 Polling: Atualizando conversas...');
        
        // Atualizar apenas as abas "Todas" e "Não lidas"
        const [allResponse, unreadResponse] = await Promise.all([
          messagingService.getAllConversations(), // Aba Todas
          messagingService.getUnreadConversations() // Aba Não lidas
        ]);
        
        // Verificar se há mudanças nas conversas antes de atualizar
        const hasChanges = JSON.stringify(allResponse.data) !== JSON.stringify(allConversations);
        
        if (hasChanges) {
          console.log('📝 Polling: Detectadas mudanças nas conversas, atualizando...');
          
          // Forçar atualização com spread operator
          setAllConversations([...allResponse.data]);
          setUnreadConversations([...unreadResponse.data]);
          
          // Atualizar a lista ativa se estiver nas abas "Todas" ou "Não lidas"
          if (filterStatus === 'all') {
            setConversations([...allResponse.data]);
          } else if (filterStatus === 'unread') {
            setConversations([...unreadResponse.data]);
          }
          
          // Verificar se há mensagens novas na conversa atual
          if (selectedConversation) {
            const updatedConversation = allResponse.data.find(c => c.id === selectedConversation.id);
            if (updatedConversation && updatedConversation.last_message) {
              const lastMessageTime = new Date(updatedConversation.last_message.created_at);
              const currentLastMessageTime = selectedConversation.last_message ? 
                new Date(selectedConversation.last_message.created_at) : new Date(0);
              
              // Se há mensagem nova, adicionar sutilmente
              if (lastMessageTime > currentLastMessageTime) {
                console.log('📨 Polling: Nova mensagem detectada, adicionando sutilmente...');
                addMessageSubtly(updatedConversation.last_message);
                updateConversationInList(selectedConversation.id, updatedConversation);
              }
            }
          }
          
          console.log('✅ Polling: Conversas atualizadas com sucesso');
        } else {
          console.log('⏭️ Polling: Nenhuma mudança detectada, pulando atualização');
        }
      } catch (err) {
        console.error('❌ Erro no polling de conversas:', err);
      }
    };

    // Executar imediatamente
    pollConversations();
    
    // Configurar intervalo de 5 segundos (mais frequente)
    const intervalId = setInterval(pollConversations, 5000);
    
    // Cleanup: limpar intervalo quando componente for desmontado
    return () => {
      console.log('🧹 Limpando polling de conversas');
      clearInterval(intervalId);
    };
  }, [filterStatus, allConversations, selectedConversation, updateConversationInList, addMessageSubtly]); // Re-executar quando o filtro mudar

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    
    try {
      console.log('📤 Enviando mensagem:', {
      conversationId: selectedConversation.id,
        content: messageContent
      });
      
      // Limpar campo de mensagem imediatamente
    setNewMessage('');

      // Enviar mensagem via API
      const response = await messagingService.sendMessage(selectedConversation.id, messageContent);
      console.log('✅ Mensagem enviada com sucesso:', response);
      
      // Adicionar mensagem sutilmente (sem refresh)
      if (response.data) {
        addMessageSubtly(response.data);
      }
      
      // Atualizar conversa na lista (mover para o topo) com dados atualizados
      if (response.data && response.data.conversation) {
        // Buscar dados atualizados da conversa
        try {
          const updatedConversationResponse = await messagingService.getAllConversations();
          const updatedConversation = updatedConversationResponse.data.find(c => c.id === selectedConversation.id);
          if (updatedConversation) {
            updateConversationInList(selectedConversation.id, updatedConversation);
          }
        } catch (error) {
          console.warn('Erro ao buscar conversa atualizada:', error);
          // Se falhar, apenas mover a conversa atual para o topo
          updateConversationInList(selectedConversation.id);
        }
      }
      
      // Atualizar resultados de busca se necessário
      await updateSearchResults();

      // Scroll para baixo após enviar
      scrollToBottom();
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
      console.error('❌ Detalhes do erro:', {
        conversationId: selectedConversation.id,
        content: messageContent,
        error: err
      });
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      
      // Restaurar mensagem no campo se houve erro
      setNewMessage(messageContent);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      console.log('🗑️ Deletando conversa:', conversationId);
      await messagingService.deleteConversation(conversationId);
      console.log('✅ Conversa deletada com sucesso');
      
      // Forçar atualização completa do frontend
      await forceUpdateFrontend();

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
        setConversationMessages([]);
    }
    setShowDeleteModal(null);
    } catch (err) {
      console.error('❌ Erro ao deletar conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar conversa');
    }
  };

  const handleArchiveConversation = async (conversationId: number) => {
    try {
      const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
        const action = conversation.is_archived ? 'desarquivar' : 'arquivar';
        console.log(`📁 ${action} conversa:`, conversationId);
        
        if (conversation.is_archived) {
          await messagingService.unarchiveConversation(conversationId);
        } else {
          await messagingService.archiveConversation(conversationId);
        }
        console.log(`✅ Conversa ${action} com sucesso`);
        
        // Forçar atualização completa do frontend
        await forceUpdateFrontend();
      }
    } catch (err) {
      console.error('❌ Erro ao arquivar conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro ao arquivar conversa');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      console.log('🗑️ Deletando mensagem:', messageId);
      
      // Remover mensagem sutilmente (sem refresh)
      removeMessageSubtly(messageId);
      
      // Fechar modal imediatamente
      setShowDeleteMessageModal(null);
      
      // Deletar mensagem via API
      await messagingService.deleteMessage(messageId);
      console.log('✅ Mensagem deletada com sucesso');
      
      // Atualizar contadores (sem recarregar mensagens)
      await updateConversationCounters();
      
      // Scroll para baixo após deletar mensagem
      scrollToBottom();
    } catch (err) {
      console.error('❌ Erro ao deletar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar mensagem');
      
      // Se houve erro, recarregar mensagens para restaurar estado
      if (selectedConversation) {
        await loadConversationMessages(selectedConversation.id);
      }
    }
  };

  const handleEditMessage = (message: ConversationMessage) => {
    setEditingMessageId(message.id);
    setEditMessageContent(message.content);
  };

  // Função para calcular o número de linhas baseado no conteúdo
  const calculateRows = (content: string) => {
    const lines = content.split('\n').length;
    const estimatedLines = Math.ceil(content.length / 50);
    return Math.min(Math.max(Math.max(lines, estimatedLines), 3), 8);
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editMessageContent.trim()) return;

    try {
      console.log('✏️ Editando mensagem:', editingMessageId);
      
      // Editar mensagem via API
      const response = await messagingService.editMessage(editingMessageId, editMessageContent.trim());
      console.log('✅ Mensagem editada com sucesso:', response);
      
      // Atualizar mensagem sutilmente
      setConversationMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, content: editMessageContent.trim(), is_edited: true }
            : msg
        )
      );
      
      // Limpar estado de edição
      setEditingMessageId(null);
      setEditMessageContent('');
      
      // Scroll para baixo após editar
      scrollToBottom();
    } catch (err) {
      console.error('❌ Erro ao editar mensagem:', err);
      setError(err instanceof Error ? err.message : 'Erro ao editar mensagem');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageContent('');
  };

  const getUserName = (participant: ConversationParticipant | null) => {
    if (!participant) return 'Usuário';
    return participant.full_name || participant.username || 'Usuário';
  };

  const getUserType = (participant: ConversationParticipant | null) => {
    if (!participant) return 'client';
    return participant.user_type === 'PROFISSIONAL' ? 'professional' : 'client';
  };

  const getOtherParticipant = (conversation: ApiConversation): ConversationParticipant | null => {
    if (!conversation.participants || !Array.isArray(conversation.participants)) {
      return null;
    }
    
    // Encontrar o participante que não é o usuário atual
    const currentUserId = state.djangoUser?.id;
    return conversation.participants.find(p => p.id !== currentUserId) || null;
  };

  const getUnreadCount = (conversation: ApiConversation) => {
    return conversation.unread_count;
  };

  const getConversationAge = (conversation: ApiConversation) => {
    const now = new Date();
    const created = new Date(conversation.created_at);
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const formatTime = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };


  return (
    <div className="py-8 h-[calc(100vh-8rem)] max-w-none">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens</h1>
        <div className="flex items-center space-x-4 text-sm">
          <p className="text-gray-600">
            Converse com profissionais e clientes sobre seus projetos
          </p>
          <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="font-medium">Mensagens expiram em 60 dias</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  searchTerm.trim() ? 'border-purple-300 bg-purple-50' : 'border-gray-300'
                }`}
              />
              {searchTerm.trim() && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'Todas', count: allConversations.length },
                { id: 'unread', label: 'Não lidas', count: unreadConversations.length },
                { id: 'archived', label: 'Arquivadas', count: archivedConversations.length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id as 'all' | 'unread' | 'archived')}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                    filterStatus === filter.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando conversas...</p>
              </div>
            ) : isSearching ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Buscando conversas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-500 mb-2">Erro ao carregar conversas</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            ) : userConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchTerm.trim() ? 'Nenhuma conversa encontrada' :
                   filterStatus === 'unread' ? 'Nenhuma conversa não lida' :
                   filterStatus === 'archived' ? 'Nenhuma conversa arquivada' :
                   'Nenhuma conversa ainda'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm.trim() ? `Tente buscar por outro termo` : 'Suas conversas aparecerão aqui'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {userConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  if (!otherParticipant) return null;
                  
                  const name = getUserName(otherParticipant);
                  const userType = getUserType(otherParticipant);
                  const unreadCount = getUnreadCount(conversation);
                  const isSelected = selectedConversation?.id === conversation.id;
                  const age = getConversationAge(conversation);

                  return (
                    <div
                      key={conversation.id}
                      className={`relative group ${
                        isSelected ? 'bg-purple-50 border-r-2 border-r-purple-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center w-full">
                        <button
                          onClick={() => {
                            setSelectedConversation(conversation);
                            setNewMessage(''); // Limpar input de mensagem ao mudar de conversa
                            loadConversationMessages(conversation.id);
                          }}
                          className="flex-1 p-4 text-left transition-colors min-w-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              userType === 'professional' ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                              <User className={`h-5 w-5 ${
                                userType === 'professional' ? 'text-purple-600' : 'text-blue-600'
                              }`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Linha superior: Nome e Data */}
                              <div className="flex items-center justify-between">
                                <p 
                                  className="font-medium text-gray-900 truncate" 
                                  title={name}
                                >
                                  {name}
                                </p>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {age > 45 && (
                                    <div className="flex items-center text-amber-500" title={`Expira em ${60 - age} dias`}>
                                      <Clock className="h-3 w-3" />
                                    </div>
                                  )}
                                  {conversation.last_message && (
                                    <span className="text-xs text-gray-500">
                                      {formatTime(conversation.last_message.created_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Linha do meio: Mensagem e Badge de não lidas */}
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex-1 min-w-0">
                                  <span 
                                    className="text-sm text-gray-500 truncate cursor-pointer hover:text-gray-700 transition-colors inline-block w-full"
                                    title={
                                      conversation.last_message?.content && 
                                      conversation.last_message.content !== 'Conversa iniciada'
                                        ? conversation.last_message.content 
                                        : undefined
                                    }
                                  >
                                  {conversation.last_message?.content || 'Conversa iniciada'}
                                  </span>
                                </div>
                                {unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0 ml-2">
                                    {unreadCount}
                                  </span>
                                )}
                              </div>
                              
                              {/* Linha inferior: Tag do tipo de usuário, status e ações */}
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  userType === 'professional' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {userType === 'professional' ? 'Profissional' : 'Cliente'}
                                </span>
                                
                                {conversation.is_archived && (
                                  <span className="text-xs text-gray-500">Arquivada</span>
                                )}
                              </div>
                        
                                {/* Ícones de ação na mesma linha */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveConversation(conversation.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title={conversation.is_archived ? 'Desarquivar' : 'Arquivar'}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteModal(conversation.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Excluir conversa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      getUserType(getOtherParticipant(selectedConversation)) === 'professional' 
                        ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      <User className={`h-5 w-5 ${
                        getUserType(getOtherParticipant(selectedConversation)) === 'professional' 
                          ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                    </div>
                    
                    <div>
                      <p 
                        className="font-medium text-gray-900 truncate max-w-[250px]" 
                        title={getUserName(getOtherParticipant(selectedConversation)!)}
                      >
                        {getUserName(getOtherParticipant(selectedConversation)!)}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>
                          {getUserType(getOtherParticipant(selectedConversation)!) === 'professional' 
                            ? 'Profissional' : 'Cliente'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500 text-right">
                      <div>Expira em {60 - getConversationAge(selectedConversation)} dias</div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {getConversationAge(selectedConversation)} dias atrás
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma mensagem ainda</p>
                    <p className="text-gray-400 text-sm mt-2">Seja o primeiro a enviar uma mensagem!</p>
                  </div>
                ) : (
                  Object.entries(groupMessagesByDate(conversationMessages))
                    .sort(([dateA], [dateB]) => new Date(dateA.split('/').reverse().join('-')).getTime() - new Date(dateB.split('/').reverse().join('-')).getTime())
                    .map(([date, messages]) => (
                      <fieldset key={date} className="border border-gray-200 rounded-lg mb-4">
                        <legend className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 rounded-md mx-auto">
                          {formatDateLabel(date)}
                        </legend>
                        <div className="p-3 space-y-3">
                          {messages.map((message) => {
                            const isOwn = message.sender.id === state.djangoUser?.id;
                            const senderName = getUserName(message.sender);

                  return (
                    <div
                      key={message.id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group/message`}
                    >
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative break-words ${
                        isOwn 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {senderName}
                          </p>
                        )}
                        {editingMessageId === message.id ? (
                          // Modo de edição - Design limpo sem fundo
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 mb-2">
                              <Edit3 className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-600">
                                Editando mensagem
                              </span>
                            </div>
                            <textarea
                              value={editMessageContent}
                              onChange={(e) => setEditMessageContent(e.target.value)}
                              className="w-full px-4 py-3 text-sm rounded-lg border-2 focus:outline-none focus:ring-2 transition-all duration-200 resize-none bg-white text-gray-900 border-purple-300 focus:ring-purple-400 focus:border-purple-400"
                              rows={calculateRows(editMessageContent)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <div className="flex items-center justify-center space-x-4">
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors duration-200"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
                              >
                                <Check className="h-3 w-3" />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Modo normal
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <div className={`flex items-center justify-end mt-1 space-x-1 ${
                              isOwn ? 'text-purple-200' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                                {message.is_edited && (
                                  <span className="ml-1 text-xs opacity-75 italic">
                                    (editado)
                                  </span>
                                )}
                              </span>
                              {isOwn && (
                                <CheckCheck className={`h-3 w-3 ${
                                  message.is_read ? 'text-blue-400' : 'text-purple-300'
                                }`} />
                              )}
                              {/* Botões de ação - aparecem no hover */}
                              {isOwn && (
                                <>
                                  <button
                                    onClick={() => handleEditMessage(message)}
                                    className="ml-1 opacity-0 group-hover/message:opacity-100 transition-opacity text-purple-200 hover:text-blue-300"
                                    title="Editar mensagem"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteMessageModal(message.id)}
                                    className="ml-1 opacity-0 group-hover/message:opacity-100 transition-opacity text-purple-200 hover:text-red-300"
                                    title="Deletar mensagem"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                        </div>
                      </fieldset>
                    ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Mensagens são temporárias e expiram em 60 dias</span>
                  <span>{newMessage.length}/500</span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Selecione uma conversa</p>
                <p className="text-gray-400 text-sm mt-2">
                  Escolha uma conversa para começar a trocar mensagens
                </p>
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center text-amber-700 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span>Lembre-se: mensagens expiram automaticamente em 60 dias</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Excluir Conversa</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta conversa? Todas as mensagens serão removidas permanentemente.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteConversation(showDeleteModal)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      {showDeleteMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Excluir Mensagem</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta mensagem? Ela será removida permanentemente.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteMessageModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMessage(showDeleteMessageModal)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}