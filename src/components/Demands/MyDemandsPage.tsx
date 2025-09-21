import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  MessageSquare, 
  Heart, 
  X, 
  Clock, 
  CheckCircle,
  Star,
  Phone,
  Award
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { BRAZILIAN_STATES } from '../../data/locations';
import { Demand, ProfessionalProfile, Rating } from '../../types';

interface MyDemandsPageProps {
  showCreateForm?: boolean;
  selectedDemandId?: string | null;
  onCloseForm?: () => void;
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export function MyDemandsPage({ showCreateForm, selectedDemandId, onCloseForm, onStartConversation }: MyDemandsPageProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemandForm, setShowDemandForm] = useState(showCreateForm || false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<{ demandId: string; professionalId: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceType: '',
    deadline: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
    uf: '',
    isRemote: false,
  });

  const userDemands = state.demands.filter(d => d.clientId === state.currentUser?.id);
  
  const filteredDemands = userDemands.filter(demand => {
    const matchesSearch = demand.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demand.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || demand.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = [
    { label: 'Total', value: userDemands.length, status: 'all' },
    { label: 'Abertas', value: userDemands.filter(d => d.status === 'open').length, status: 'open' },
    { label: 'Em Andamento', value: userDemands.filter(d => d.status === 'in_progress').length, status: 'in_progress' },
    { label: 'Concluídas', value: userDemands.filter(d => d.status === 'completed').length, status: 'completed' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDemand: Demand = {
      id: Date.now().toString(),
      clientId: state.currentUser?.id || '',
      title: formData.title,
      description: formData.description,
      serviceType: formData.serviceType,
      deadline: new Date(formData.deadline),
      budget: {
        min: parseInt(formData.budgetMin),
        max: parseInt(formData.budgetMax),
      },
      location: {
        city: formData.city,
        state: formData.uf,
        isRemote: formData.isRemote,
      },
      status: 'open',
      attachments: [],
      interestedProfessionals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_DEMAND', payload: newDemand });
    setShowDemandForm(false);
    setFormData({
      title: '',
      description: '',
      serviceType: '',
      deadline: '',
      budgetMin: '',
      budgetMax: '',
      city: '',
      uf: '',
      isRemote: false,
    });
  };

  const handleSelectProfessional = (demandId: string, professionalId: string) => {
    const demand = state.demands.find(d => d.id === demandId);
    if (demand) {
      const updatedDemand = {
        ...demand,
        selectedProfessional: professionalId,
        status: 'in_progress' as const,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_DEMAND', payload: updatedDemand });

      // Notify selected professional
      const professional = state.professionalProfiles.find(p => p.userId === professionalId);
      const notification = {
        id: Date.now().toString(),
        userId: professionalId,
        type: 'selected' as const,
        title: 'Você foi selecionado!',
        message: `Parabéns! Você foi selecionado para o projeto: ${demand.title}`,
        isRead: false,
        createdAt: new Date(),
        demandId: demand.id,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }
  };

  const handleRemoveProfessional = (demandId: string) => {
    const demand = state.demands.find(d => d.id === demandId);
    if (demand?.selectedProfessional) {
      const oldProfessionalId = demand.selectedProfessional;
      const updatedDemand = {
        ...demand,
        selectedProfessional: undefined,
        status: 'open' as const,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_DEMAND', payload: updatedDemand });

      // Notify removed professional
      const notification = {
        id: Date.now().toString(),
        userId: oldProfessionalId,
        type: 'removed' as const,
        title: 'Profissional removido',
        message: `Você foi removido do projeto: ${demand.title}`,
        isRead: false,
        createdAt: new Date(),
        demandId: demand.id,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }
  };

  const handleCompleteDemand = (demandId: string) => {
    const demand = state.demands.find(d => d.id === demandId);
    if (demand && demand.selectedProfessional) {
      // Show rating modal first
      setShowRatingModal({ demandId, professionalId: demand.selectedProfessional });
    } else {
      // Complete without rating if no professional selected
      dispatch({ type: 'COMPLETE_DEMAND', payload: demandId });
    }
  };

  const handleDeleteDemand = (demandId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta demanda?')) {
      dispatch({ type: 'DELETE_DEMAND', payload: demandId });
    }
  };

  const handleSubmitRating = (rating: number, comment: string) => {
    if (!showRatingModal) return;
    
    const { demandId, professionalId } = showRatingModal;
    
    // Create rating
    const newRating: Rating = {
      id: Date.now().toString(),
      demandId,
      clientId: state.currentUser?.id || '',
      professionalId,
      stars: rating,
      comment,
      createdAt: new Date(),
    };
    
    dispatch({ type: 'ADD_RATING', payload: newRating });
    
    // Complete the demand
    dispatch({ type: 'COMPLETE_DEMAND', payload: demandId });
    
    // Update professional's rating
    const professional = state.professionalProfiles.find(p => p.userId === professionalId);
    if (professional) {
      const allRatings = [...state.ratings, newRating].filter(r => r.professionalId === professionalId);
      const averageRating = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;
      
      const updatedProfessional = { 
        ...professional, 
        rating: averageRating,
        completedJobs: professional.completedJobs + 1 
      };
      dispatch({ type: 'UPDATE_PROFESSIONAL_PROFILE', payload: updatedProfessional });
    }
    
    setShowRatingModal(null);
  };

  const getProfessionalInfo = (professionalId: string) => {
    return state.professionalProfiles.find(p => p.userId === professionalId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };

  React.useEffect(() => {
    if (selectedDemandId) {
      const demand = state.demands.find(d => d.id === selectedDemandId);
      setSelectedDemand(demand || null);
    }
  }, [selectedDemandId, state.demands]);

  React.useEffect(() => {
    setShowDemandForm(showCreateForm || false);
  }, [showCreateForm]);

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Demandas</h1>
            <p className="text-gray-600">Gerencie suas solicitações e acompanhe o progresso dos projetos</p>
          </div>
          <button
            onClick={() => setShowDemandForm(true)}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Demanda
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(stat.status)}
            className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-colors ${
              activeTab === stat.status 
                ? 'border-pink-500 bg-pink-50' 
                : 'border-gray-200 hover:border-pink-300'
            }`}
          >
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar demandas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpar
          </button>
        </div>
      </div>

      {/* Demands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDemands.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              {activeTab === 'all' 
                ? 'Nenhuma demanda encontrada'
                : `Nenhuma demanda ${getStatusLabel(activeTab).toLowerCase()}`
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {userDemands.length === 0 
                ? 'Crie sua primeira demanda para começar'
                : 'Tente ajustar os filtros ou escolha outra categoria'
              }
            </p>
            {userDemands.length === 0 && (
              <button
                onClick={() => setShowDemandForm(true)}
                className="mt-4 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeira Demanda
              </button>
            )}
          </div>
        ) : (
          filteredDemands.map((demand) => {
            const selectedProfessional = demand.selectedProfessional 
              ? getProfessionalInfo(demand.selectedProfessional)
              : null;

            return (
              <div
                key={demand.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight pr-2">
                      {demand.title}
                    </h3>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(demand.status)}`}>
                      {getStatusLabel(demand.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    {demand.description}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-green-600">
                      R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Prazo: {new Date(demand.deadline).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{demand.location.city}, {demand.location.state}</span>
                    {demand.location.isRemote && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Remoto
                      </span>
                    )}
                  </div>

                  {demand.serviceType && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{demand.serviceType}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Heart className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                    <span>{demand.interestedProfessionals.length} profissionais interessados</span>
                  </div>
                </div>

                {/* Selected Professional */}
                {selectedProfessional && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900 text-sm">{selectedProfessional.name}</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(selectedProfessional.rating)
                                      ? 'text-yellow-500 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-green-700">
                              ({selectedProfessional.completedJobs} trabalhos)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  {demand.status === 'open' && (
                    <button
                      onClick={() => setSelectedDemand(demand)}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Gerenciar ({demand.interestedProfessionals.length} candidatos)
                    </button>
                  )}

                  {demand.status === 'in_progress' && selectedProfessional && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onStartConversation?.(selectedProfessional.userId, demand.id)}
                        className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Conversar
                      </button>
                      <button
                        onClick={() => handleCompleteDemand(demand.id)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Finalizar
                      </button>
                    </div>
                  )}

                  {demand.status === 'completed' && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-blue-900">Projeto Concluído</p>
                      <p className="text-xs text-blue-700">
                        Finalizado em {new Date(demand.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setSelectedDemand(demand)}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detalhes
                    </button>
                    <button
                      onClick={() => handleDeleteDemand(demand.id)}
                      className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Criada em {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Demand Modal */}
      {showDemandForm && (
        <CreateDemandModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowDemandForm(false);
            onCloseForm?.();
          }}
        />
      )}

      {/* Demand Details Modal */}
      {selectedDemand && (
        <DemandDetailsModal
          demand={selectedDemand}
          updatedDemand={state.demands.find(d => d.id === selectedDemand.id) || selectedDemand}
          interestedProfessionals={selectedDemand.interestedProfessionals.map(id => 
            state.professionalProfiles.find(p => p.userId === id)
          ).filter(Boolean) as ProfessionalProfile[]}
          onClose={() => setSelectedDemand(null)}
          onSelectProfessional={handleSelectProfessional}
          onRemoveProfessional={handleRemoveProfessional}
          onStartConversation={onStartConversation}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          professionalId={showRatingModal.professionalId}
          demandTitle={state.demands.find(d => d.id === showRatingModal.demandId)?.title || ''}
          onSubmit={handleSubmitRating}
          onClose={() => setShowRatingModal(null)}
        />
      )}
    </div>
  );
}

// Create Demand Modal Component
interface CreateDemandModalProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function CreateDemandModal({ formData, setFormData, onSubmit, onClose }: CreateDemandModalProps) {
  const serviceTypes = [
    'Design Gráfico',
    'Desenvolvimento Web',
    'Marketing Digital',
    'Fotografia',
    'Redação',
    'Tradução',
    'Consultoria',
    'Arquitetura',
    'Engenharia',
    'Advocacia',
    'Contabilidade',
    'Psicologia'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">Nova Demanda</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Projeto
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Ex: Desenvolvimento de site institucional"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Detalhada
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Descreva detalhadamente o que precisa..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">Selecione...</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Mínimo (R$)
              </label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Máximo (R$)
              </label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="5000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="São Paulo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF)
              </label>
              <select
                value={formData.uf}
                onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o estado</option>
                {BRAZILIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isRemote}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRemote: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Aceito trabalho remoto
                </span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Publicar Demanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Demand Details Modal Component
interface DemandDetailsModalProps {
  demand: Demand;
  updatedDemand: Demand;
  interestedProfessionals: ProfessionalProfile[];
  onClose: () => void;
  onSelectProfessional: (demandId: string, professionalId: string) => void;
  onRemoveProfessional: (demandId: string) => void;
  onStartConversation?: (userId: string, demandId?: string) => void;
}

function DemandDetailsModal({ 
  demand, 
  updatedDemand,
  interestedProfessionals, 
  onClose, 
  onSelectProfessional, 
  onRemoveProfessional, 
  onStartConversation 
}: DemandDetailsModalProps) {
  const { state } = useApp();

  const selectedProfessional = updatedDemand.selectedProfessional 
    ? state.professionalProfiles.find(p => p.userId === updatedDemand.selectedProfessional)
    : null;

  const handleContactWhatsApp = (professional: ProfessionalProfile) => {
    const phone = professional.contact.whatsapp || professional.contact.phone;
    if (phone) {
      const message = `Olá ${professional.name}! Vi que você tem interesse na demanda "${demand.title}" na VINKO. Gostaria de conversar sobre o projeto.`;
      const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Informações de WhatsApp não disponíveis');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{demand.title}</h2>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                demand.status === 'open' ? 'bg-green-100 text-green-800' :
                demand.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                demand.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {demand.status === 'open' ? 'Demanda Aberta' :
                 demand.status === 'in_progress' ? 'Em Andamento' :
                 demand.status === 'completed' ? 'Concluída' : 'Cancelada'}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Demand Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Descrição do Projeto</h3>
                <p className="text-gray-600 leading-relaxed">{demand.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Orçamento
                  </h3>
                  <p className="text-lg font-medium text-green-600">
                    R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Prazo
                  </h3>
                  <p className="text-gray-600">
                    {new Date(demand.deadline).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                  Localização
                </h3>
                <p className="text-gray-600">
                  {demand.location.city}, {demand.location.state}
                  {demand.location.isRemote && (
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Trabalho remoto aceito
                    </span>
                  )}
                </p>
              </div>

              {demand.serviceType && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tipo de Serviço</h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                    {demand.serviceType}
                  </span>
                </div>
              )}
            </div>

            {/* Professionals */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profissionais Interessados ({interestedProfessionals.length})
              </h3>

              {selectedProfessional && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-900">Profissional Selecionado</h4>
                    <button
                      onClick={() => onRemoveProfessional(updatedDemand.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                  <ProfessionalCard
                    professional={selectedProfessional}
                    isSelected={true}
                    onSelect={() => {}}
                    onContact={() => handleContactWhatsApp(selectedProfessional)}
                    onStartConversation={() => onStartConversation?.(selectedProfessional.userId, updatedDemand.id)}
                  />
                </div>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {interestedProfessionals.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum profissional interessado ainda</p>
                  </div>
                ) : (
                  interestedProfessionals
                    .filter(p => p.userId !== updatedDemand.selectedProfessional)
                    .map((professional) => (
                      <ProfessionalCard
                        key={professional.id}
                        professional={professional}
                        isSelected={false}
                        onSelect={() => onSelectProfessional(updatedDemand.id, professional.userId)}
                        onContact={() => handleContactWhatsApp(professional)}
                        onStartConversation={() => onStartConversation?.(professional.userId, updatedDemand.id)}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Criada em {new Date(updatedDemand.createdAt).toLocaleDateString('pt-BR')}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Professional Card Component
interface ProfessionalCardProps {
  professional: ProfessionalProfile;
  isSelected: boolean;
  onSelect: () => void;
  onContact: () => void;
  onStartConversation: () => void;
}

function ProfessionalCard({ professional, isSelected, onSelect, onContact, onStartConversation }: ProfessionalCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{professional.name}</p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(professional.rating)
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600">
                ({professional.completedJobs} trabalhos)
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{professional.specialty}</p>

      <div className="text-xs text-gray-500 mb-3">
        <div className="flex items-center mb-1">
          <MapPin className="h-3 w-3 mr-1" />
          {professional.city}, {professional.uf}
        </div>
        {professional.contact.phone && (
          <div className="flex items-center">
            <Phone className="h-3 w-3 mr-1" />
            {professional.contact.phone}
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        {!isSelected && (
          <button
            onClick={onSelect}
            className="flex-1 bg-pink-600 text-white px-3 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
          >
            Selecionar
          </button>
        )}
        <button
          onClick={onContact}
          className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
        >
          <Phone className="h-3 w-3 mr-1" />
          WhatsApp
        </button>
        <button
          onClick={onStartConversation}
          className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          Chat
        </button>
      </div>
    </div>
  );
}

// Rating Modal Component
interface RatingModalProps {
  professionalId: string;
  demandTitle: string;
  onSubmit: (rating: number, comment: string) => void;
  onClose: () => void;
}

function RatingModal({ professionalId, demandTitle, onSubmit, onClose }: RatingModalProps) {
  const { state } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const professional = state.professionalProfiles.find(p => p.userId === professionalId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      // Por favor, selecione uma avaliação
      return;
    }
    onSubmit(rating, comment);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-colors"
        >
          <Star
            className={`h-8 w-8 ${
              starValue <= (hoveredRating || rating)
                ? 'text-yellow-500 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Avaliar Profissional</h3>
              <p className="text-sm text-gray-600">Como foi sua experiência?</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="font-medium text-gray-900 mb-2">{professional?.name}</p>
            <p className="text-sm text-gray-600 mb-4">Projeto: {demandTitle}</p>
            <div className="flex justify-center space-x-1 mb-4">
              {renderStars()}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiência com este profissional..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
          />

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              Enviar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}