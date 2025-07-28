import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  User, 
  Clock, 
  CheckCircle, 
  Search, 
  Phone, 
  Video,
  MoreVertical,
  Trash2,
  Archive,
  AlertTriangle,
  Calendar,
  Filter,
  X
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Conversation, Message } from '../../types';

interface MessagesPageProps {
  selectedConversationId?: string;
  onStartConversation?: (userId: string, demandId?: string) => void;
}

export function MessagesPage({ selectedConversationId, onStartConversation }: MessagesPageProps) {
  const { state, dispatch } = useApp();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'archived'>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-cleanup messages older than 60 days
  useEffect(() => {
    const cleanupOldMessages = () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Remove old messages
      const validMessages = state.messages.filter(message => 
        new Date(message.timestamp) > sixtyDaysAgo
      );

      // Remove conversations with no recent messages
      const validConversations = state.conversations.filter(conv => {
        const hasRecentMessages = validMessages.some(msg => msg.conversationId === conv.id);
        return hasRecentMessages || new Date(conv.updatedAt) > sixtyDaysAgo;
      });

      // Update state if cleanup is needed
      if (validMessages.length !== state.messages.length || 
          validConversations.length !== state.conversations.length) {
        dispatch({ type: 'CLEANUP_OLD_DATA', payload: { messages: validMessages, conversations: validConversations } });
      }
    };

    // Run cleanup on component mount and every hour
    cleanupOldMessages();
    const interval = setInterval(cleanupOldMessages, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [state.messages, state.conversations, dispatch]);

  // Get user conversations with filtering
  const userConversations = state.conversations
    .filter(conv => conv.participants && Array.isArray(conv.participants) && conv.participants.includes(state.currentUser?.id || ''))
    .filter(conv => {
      if (filterStatus === 'unread') {
        const unreadCount = getUnreadCount(conv.id);
        return unreadCount > 0;
      }
      if (filterStatus === 'archived') {
        return conv.isArchived;
      }
      return !conv.isArchived;
    })
    .filter(conv => {
      if (!searchTerm) return true;
      const otherParticipant = getOtherParticipant(conv);
      const name = getUserName(otherParticipant);
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Get messages for selected conversation
  const conversationMessages = selectedConversation 
    ? state.messages.filter(m => m.conversationId === selectedConversation.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  // Select conversation from props
  useEffect(() => {
    if (selectedConversationId) {
      const conversation = state.conversations.find(c => c.id === selectedConversationId);
      if (conversation) {
        setSelectedConversation(conversation);
        markMessagesAsRead(conversation.id);
      }
    }
  }, [selectedConversationId, state.conversations]);

  const markMessagesAsRead = (conversationId: string) => {
    dispatch({ 
      type: 'MARK_MESSAGES_READ', 
      payload: { conversationId, userId: state.currentUser?.id || '' } 
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      conversationId: selectedConversation.id,
      senderId: state.currentUser?.id || '',
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
      type: 'text',
    };

    dispatch({ type: 'ADD_MESSAGE', payload: message });

    // Update conversation with last message
    const updatedConversation = {
      ...selectedConversation,
      lastMessage: message,
      updatedAt: new Date(),
    };
    dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });

    setNewMessage('');

    // Send notification to other participant
    const otherParticipant = selectedConversation.participants.find(p => p !== state.currentUser?.id);
    if (otherParticipant) {
      const senderName = getUserName(state.currentUser?.id || '');
      const notification = {
        id: Date.now().toString(),
        userId: otherParticipant,
        type: 'new_message' as const,
        title: 'Nova mensagem',
        message: `${senderName}: ${newMessage.slice(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
        isRead: false,
        createdAt: new Date(),
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }
  };

  const handleDeleteConversation = (conversationId: string) => {
    // Remove all messages from conversation
    const updatedMessages = state.messages.filter(m => m.conversationId !== conversationId);
    
    // Remove conversation
    const updatedConversations = state.conversations.filter(c => c.id !== conversationId);
    
    dispatch({ 
      type: 'CLEANUP_OLD_DATA', 
      payload: { messages: updatedMessages, conversations: updatedConversations } 
    });

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
    setShowDeleteModal(null);
  };

  const handleArchiveConversation = (conversationId: string) => {
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (conversation) {
      const updatedConversation = { ...conversation, isArchived: !conversation.isArchived };
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
    }
  };

  const getUserName = (userId: string) => {
    const professional = state.professionalProfiles.find(p => p.userId === userId);
    const client = state.clientProfiles.find(c => c.userId === userId);
    return professional?.name || client?.name || 'Usuário';
  };

  const getUserType = (userId: string) => {
    const user = state.currentUser?.id === userId ? state.currentUser : null;
    if (user) return user.type;
    
    const professional = state.professionalProfiles.find(p => p.userId === userId);
    return professional ? 'professional' : 'client';
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants && Array.isArray(conversation.participants) 
      ? conversation.participants.find(p => p !== state.currentUser?.id) || ''
      : '';
  };

  const getUnreadCount = (conversationId: string) => {
    return state.messages.filter(m => 
      m.conversationId === conversationId && 
      m.senderId !== state.currentUser?.id && 
      !m.isRead
    ).length;
  };

  const getConversationAge = (conversation: Conversation) => {
    const now = new Date();
    const created = new Date(conversation.createdAt);
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getDemandTitle = (demandId?: string) => {
    if (!demandId) return null;
    const demand = state.demands.find(d => d.id === demandId);
    return demand?.title;
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'Todas', count: userConversations.length },
                { id: 'unread', label: 'Não lidas', count: userConversations.filter(c => getUnreadCount(c.id) > 0).length },
                { id: 'archived', label: 'Arquivadas', count: userConversations.filter(c => c.isArchived).length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id as any)}
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
            {userConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {filterStatus === 'unread' ? 'Nenhuma conversa não lida' :
                   filterStatus === 'archived' ? 'Nenhuma conversa arquivada' :
                   'Nenhuma conversa ainda'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Suas conversas aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {userConversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const name = getUserName(otherParticipant);
                  const userType = getUserType(otherParticipant);
                  const unreadCount = getUnreadCount(conversation.id);
                  const isSelected = selectedConversation?.id === conversation.id;
                  const age = getConversationAge(conversation);
                  const demandTitle = getDemandTitle(conversation.demandId);

                  return (
                    <div
                      key={conversation.id}
                      className={`relative group ${
                        isSelected ? 'bg-purple-50 border-r-2 border-r-purple-500' : 'hover:bg-gray-50'
                      } ${conversation.isArchived ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => {
                          setSelectedConversation(conversation);
                          markMessagesAsRead(conversation.id);
                        }}
                        className="w-full p-4 text-left transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userType === 'professional' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            <User className={`h-5 w-5 ${
                              userType === 'professional' ? 'text-purple-600' : 'text-blue-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 truncate">{name}</p>
                              <div className="flex items-center space-x-2">
                                {age > 45 && (
                                  <div className="flex items-center text-amber-500" title={`Expira em ${60 - age} dias`}>
                                    <Clock className="h-3 w-3" />
                                  </div>
                                )}
                                {conversation.lastMessage && (
                                  <span className="text-xs text-gray-500">
                                    {formatTime(conversation.lastMessage.timestamp)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {demandTitle && (
                              <p className="text-xs text-purple-600 mb-1 truncate">
                                📋 {demandTitle}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage?.content || 'Conversa iniciada'}
                              </p>
                              {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                userType === 'professional' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {userType === 'professional' ? 'Profissional' : 'Cliente'}
                              </span>
                              
                              {conversation.isArchived && (
                                <span className="text-xs text-gray-500">Arquivada</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Conversation Actions */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveConversation(conversation.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title={conversation.isArchived ? 'Desarquivar' : 'Arquivar'}
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
                      <p className="font-medium text-gray-900">
                        {getUserName(getOtherParticipant(selectedConversation))}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>
                          {getUserType(getOtherParticipant(selectedConversation)) === 'professional' 
                            ? 'Profissional' : 'Cliente'}
                        </span>
                        {selectedConversation.demandId && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600">
                              {getDemandTitle(selectedConversation.demandId)}
                            </span>
                          </>
                        )}
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.map((message) => {
                  const isOwn = message.senderId === state.currentUser?.id;
                  const senderName = getUserName(message.senderId);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-200 text-gray-900'
                      }`}>
                        {!isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {senderName}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isOwn ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {isOwn && (
                            <CheckCircle className={`h-3 w-3 ${
                              message.isRead ? 'text-green-300' : 'text-purple-300'
                            }`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
    </div>
  );
}