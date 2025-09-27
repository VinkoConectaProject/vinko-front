import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
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
import { Demand, ProfessionalProfile, Rating, CreateDemandRequest } from '../../types';
import { demandService } from '../../services/demandService';
import { useApiMessage } from '../../hooks/useApiMessage';
import { userService } from '../../services/userService';
import { LocationService } from '../../services/locationService';

interface MyDemandsPageProps {
  showCreateForm?: boolean;
  selectedDemandId?: string | null;
  onCloseForm?: () => void;
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export function MyDemandsPage({ showCreateForm, selectedDemandId, onCloseForm, onStartConversation }: MyDemandsPageProps) {
  const { state, dispatch } = useApp();
  const { showMessage } = useApiMessage();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemandForm, setShowDemandForm] = useState(showCreateForm || false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<{ demandId: string; professionalId: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ demandId: string; demandTitle: string } | null>(null);
  const [apiDemands, setApiDemands] = useState<Demand[]>([]);
  const [demandCounters, setDemandCounters] = useState({
    total: 0,
    abertas: 0,
    emAndamento: 0,
    concluidas: 0,
  });
  const [isLoadingDemands, setIsLoadingDemands] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    service: '',
    area: '',
    specialty: '',
    tecidType: '',
    availability: '',
    deadline: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
    uf: '',
  });

  // Estados para validação visual
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    service?: string;
    area?: string;
    specialty?: string;
    availability?: string;
    budget?: string;
  }>({});

  // Estados para notificação
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  // Estados para upload de arquivos
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Estados para opções dos dropdowns
  const [options, setOptions] = useState({
    services: [] as { id: number; name: string; areas?: { id: number; name: string }[] }[],
    serviceAreas: [] as { id: number; name: string }[],
    specialties: [] as { id: number; name: string }[],
    availabilities: [] as { id: number; name: string }[],
  });

  // Estados para cidades
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);


  // Estados para opções filtradas
  const [filteredServiceAreas, setFilteredServiceAreas] = useState<{ id: number; name: string }[]>([]);


  // Usar demandas da API em vez do estado local
  const userDemands = apiDemands;
  
  // Filtrar demandas baseado na aba ativa (busca agora é feita na API)
  const filteredDemands = userDemands.filter(demand => {
    const matchesTab = activeTab === 'all' || demand.status === activeTab;
    return matchesTab;
  });

  // Função para carregar demandas da API
  const loadDemands = useCallback(async (searchTerm?: string) => {
    try {
      setIsLoadingDemands(true);
      const { demands, counters } = await demandService.getDemands(searchTerm);
      setApiDemands(demands);
      setDemandCounters(counters);
    } catch (error) {
      console.error('Erro ao carregar demandas:', error);
      showMessage('Erro ao carregar demandas. Tente novamente.', 'error');
    } finally {
      setIsLoadingDemands(false);
    }
  }, [showMessage]);

  // Carregar demandas quando o componente montar
  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  // Carregar opções dos dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [services, serviceAreas, specialties, availabilities] = await Promise.all([
          userService.getServices(),
          userService.getServiceAreas(),
          userService.getSpecialties(),
          userService.getAvailabilities(),
        ]);

        setOptions({
          services,
          serviceAreas,
          specialties,
          availabilities,
        });

        // Inicializar opções filtradas
        setFilteredServiceAreas(serviceAreas);
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      }
    };

    loadOptions();
  }, []);


  // Função para carregar cidades baseado no estado selecionado
  const loadCitiesByState = async (stateCode: string) => {
    if (!stateCode) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    
    try {
      const citiesData = await LocationService.getCitiesByState(stateCode);
      setCities(citiesData);
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };


  const stats = [
    { label: 'Total', value: demandCounters.total, status: 'all' },
    { label: 'Abertas', value: demandCounters.abertas, status: 'open' },
    { label: 'Em Andamento', value: demandCounters.emAndamento, status: 'in_progress' },
    { label: 'Concluídas', value: demandCounters.concluidas, status: 'completed' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit chamado', formData);
    
    // Limpar erros anteriores
    setValidationErrors({});
    
    try {
      // Validar campos obrigatórios
      const errors: typeof validationErrors = {};
      
      if (!formData.title) errors.title = 'Título é obrigatório';
      if (!formData.description) errors.description = 'Descrição é obrigatória';
      if (!formData.service) errors.service = 'Tipo de serviço é obrigatório';
      if (!formData.area) errors.area = 'Área de atuação é obrigatória';
      if (!formData.specialty) errors.specialty = 'Especialidade é obrigatória';
      if (!formData.availability || formData.availability === '') errors.availability = 'Disponibilidade é obrigatória';
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Função para converter valor formatado para número
      const parseCurrency = (value: string): number => {
        if (!value) return 0;
        const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      };

      // Validação de orçamento
      const minBudget = parseCurrency(formData.budgetMin);
      const maxBudget = parseCurrency(formData.budgetMax);
      console.log('Validação de orçamento:', { minBudget, maxBudget, budgetMin: formData.budgetMin, budgetMax: formData.budgetMax });
      
      if (minBudget > 0 && maxBudget > 0 && minBudget > maxBudget) {
        console.log('Erro: orçamento mínimo maior que máximo');
        setValidationErrors({ budget: 'O orçamento mínimo não pode ser maior que o máximo.' });
        return;
      }

      // Preparar dados para a API
      const demandData: CreateDemandRequest = {
      title: formData.title,
      description: formData.description,
        amount: parseInt(formData.amount) || 1,
        availability: parseInt(formData.availability),
        service: parseInt(formData.service),
        area: parseInt(formData.area),
        specialty: parseInt(formData.specialty),
        tecid_type: formData.tecidType as "AMBOS" | "MALHA" | "PLANO",
        deadline: formData.deadline || null,
        city: formData.city,
        uf: formData.uf,
        min_budget: parseCurrency(formData.budgetMin),
        max_budget: parseCurrency(formData.budgetMax),
        remote_work_accepted: false,
      };

      // Criar demanda via API
      const createdDemand = await demandService.createDemand(demandData);
      
      // Upload de arquivos se houver
      if (uploadedFiles.length > 0) {
        try {
          await demandService.uploadDemandFiles(createdDemand.id, uploadedFiles);
        } catch (uploadError) {
          console.error('Erro ao fazer upload dos arquivos:', uploadError);
          setNotification({
            show: true,
            message: 'Demanda criada, mas houve erro no upload dos arquivos.',
            type: 'error'
          });
        }
      }
      
      // Recarregar lista de demandas
      await loadDemands();
      
      // Fechar formulário e limpar dados
    setShowDemandForm(false);
    setFormData({
      title: '',
      description: '',
        amount: '',
        service: '',
        area: '',
        specialty: '',
        tecidType: '',
        availability: '',
      deadline: '',
      budgetMin: '',
      budgetMax: '',
      city: '',
      uf: '',
    });
      
      // Limpar erros e mostrar sucesso
      setValidationErrors({});
      setUploadedFiles([]);
      setFilePreviews([]);
      setNotification({
        show: true,
        message: 'Demanda criada com sucesso!',
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      setNotification({
        show: true,
        message: 'Erro ao criar demanda. Tente novamente.',
        type: 'error'
      });
    }
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
    const demand = apiDemands.find(d => d.id === demandId);
    if (demand) {
      setShowDeleteModal({ demandId, demandTitle: demand.title });
    }
  };

  const confirmDeleteDemand = async () => {
    if (!showDeleteModal) return;
    
    try {
      await demandService.deleteDemand(parseInt(showDeleteModal.demandId));
      await loadDemands(searchTerm);
      setShowDeleteModal(null);
      showMessage('Demanda excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir demanda:', error);
      showMessage('Erro ao excluir demanda. Tente novamente.', 'error');
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
            onClick={() => {
              // Limpar formulário ao abrir modal
              setFormData({
                title: '',
                description: '',
                amount: '',
                service: '',
                area: '',
                specialty: '',
                tecidType: '',
                availability: '',
                deadline: '',
                budgetMin: '',
                budgetMax: '',
                city: '',
                uf: '',
              });
              setValidationErrors({});
              setNotification({ show: false, message: '', type: 'info' });
              setShowDemandForm(true);
            }}
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                loadDemands(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              loadDemands('');
            }}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpar
          </button>
        </div>
      </div>

      {/* Demands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoadingDemands ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
            <p className="text-gray-500 text-lg">Carregando demandas...</p>
          </div>
        ) : filteredDemands.length === 0 ? (
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
                onClick={() => {
                  // Limpar formulário ao abrir modal
                  setFormData({
                    title: '',
                    description: '',
                    amount: '',
                    service: '',
                    area: '',
                    specialty: '',
                    tecidType: '',
                    availability: '',
                    deadline: '',
                    budgetMin: '',
                    budgetMax: '',
                    city: '',
                    uf: '',
                  });
                  setValidationErrors({});
                  setNotification({ show: false, message: '', type: 'info' });
                  setShowDemandForm(true);
                }}
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
                      {demand.budget.min > 0 || demand.budget.max > 0 
                        ? (() => {
                            const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString()}` : '';
                            const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString()}` : '';
                            if (min && max) {
                              return `Mín: ${min} - Máx: ${max}`;
                            } else if (min) {
                              return `Mín: ${min}`;
                            } else if (max) {
                              return `Máx: ${max}`;
                            }
                            return '-';
                          })()
                        : '-'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                    <span>Prazo: {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-purple-600 flex-shrink-0" />
                    <span className="truncate">
                      {demand.location.city && demand.location.state 
                        ? `${demand.location.city} - ${demand.location.state}`
                        : '-'
                      }
                    </span>
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
            setValidationErrors({});
            setNotification({ show: false, message: '', type: 'info' });
            setUploadedFiles([]);
            setFilePreviews([]);
            onCloseForm?.();
          }}
          options={options}
          filteredServiceAreas={filteredServiceAreas}
          setFilteredServiceAreas={setFilteredServiceAreas}
          cities={cities}
          loadingCities={loadingCities}
          loadCitiesByState={loadCitiesByState}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
          notification={notification}
          setNotification={setNotification}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          filePreviews={filePreviews}
          setFilePreviews={setFilePreviews}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          demandTitle={showDeleteModal.demandTitle}
          onConfirm={confirmDeleteDemand}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}
    </div>
  );
}

// Create Demand Modal Component
interface DemandFormData {
  title: string;
  description: string;
  amount: string;
  service: string;
  area: string;
  specialty: string;
  tecidType: string;
  availability: string;
  deadline: string;
  budgetMin: string;
  budgetMax: string;
  city: string;
  uf: string;
}

interface CreateDemandModalProps {
  formData: DemandFormData;
  setFormData: (data: (prev: DemandFormData) => DemandFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  options: {
    services: { id: number; name: string; areas?: { id: number; name: string }[] }[];
    serviceAreas: { id: number; name: string }[];
    specialties: { id: number; name: string }[];
    availabilities: { id: number; name: string }[];
  };
  filteredServiceAreas: { id: number; name: string }[];
  setFilteredServiceAreas: (areas: { id: number; name: string }[]) => void;
  cities: { id: number; nome: string }[];
  loadingCities: boolean;
  loadCitiesByState: (stateCode: string) => Promise<void>;
  validationErrors: {
    title?: string;
    description?: string;
    service?: string;
    area?: string;
    specialty?: string;
    availability?: string;
    budget?: string;
  };
  setValidationErrors: (errors: {
    title?: string;
    description?: string;
    service?: string;
    area?: string;
    specialty?: string;
    availability?: string;
    budget?: string;
  }) => void;
  notification: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  setNotification: (notification: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  filePreviews: string[];
  setFilePreviews: (previews: string[] | ((prev: string[]) => string[])) => void;
}

function CreateDemandModal({ 
  formData, 
  setFormData, 
  onSubmit, 
  onClose, 
  options, 
  filteredServiceAreas, 
  setFilteredServiceAreas,
  cities,
  loadingCities,
  loadCitiesByState,
  validationErrors,
  setValidationErrors,
  notification,
  setNotification,
  uploadedFiles,
  setUploadedFiles,
  filePreviews,
  setFilePreviews
}: CreateDemandModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Função para processar arquivos (usada tanto para input quanto drag&drop)
  const processFiles = (files: File[]) => {
    // Validar tamanho dos arquivos (20MB = 20 * 1024 * 1024 bytes)
    const maxSize = 20 * 1024 * 1024;
    const oversizedFiles: string[] = [];
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
        return false;
      }
      return true;
    });

    // Mostrar notificação para arquivos que excedem o limite
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.join(', ');
      setNotification({
        show: true,
        message: `Os seguintes arquivos excedem o limite de 20MB: ${fileNames}`,
        type: 'error'
      });
    }

    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newFiles);

      // Criar previews para imagens
      validFiles.forEach((file, fileIndex) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setFilePreviews((prev: string[]) => {
              const newPreviews = [...prev];
              newPreviews[uploadedFiles.length + fileIndex] = result;
              return newPreviews;
            });
          };
          reader.readAsDataURL(file);
        } else {
          // Para arquivos não-imagem, adicionar null no array de previews
          setFilePreviews((prev: string[]) => {
            const newPreviews = [...prev];
            newPreviews[uploadedFiles.length + fileIndex] = '';
            return newPreviews;
          });
        }
      });
    }
  };

  // Função para lidar com upload de arquivos via input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // Funções para drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Função para remover arquivo
  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

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

        <form onSubmit={(e) => { console.log('Form submit'); onSubmit(e); }} className="p-6 space-y-6">
          {/* Notificação */}
          {notification.show && (
            <div className={`p-4 rounded-lg border-l-4 ${
              notification.type === 'success' 
                ? 'bg-green-50 border-green-400 text-green-700' 
                : notification.type === 'error'
                ? 'bg-red-50 border-red-400 text-red-700'
                : 'bg-blue-50 border-blue-400 text-blue-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {notification.type === 'success' && (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="font-medium">{notification.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotification({ show: false, message: '', type: 'info' })}
                  className="ml-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título - Obrigatório */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.title 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="Ex: Desenvolvimento de site institucional"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caracteres</p>
              {validationErrors.title && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
              )}
            </div>

            {/* Descrição - Obrigatória */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.description 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="Descreva detalhadamente o que precisa..."
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 caracteres</p>
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>

            {/* Tipo de Serviço e Área de Atuação na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service}
                onChange={(e) => {
                  const serviceId = e.target.value;
                  setFormData((prev: DemandFormData) => ({ ...prev, service: serviceId, area: '' }));
                  
                  // Filtrar áreas baseado no serviço selecionado
                  if (serviceId) {
                    const selectedService = options.services.find(s => s.id === parseInt(serviceId));
                    if (selectedService && selectedService.areas) {
                      setFilteredServiceAreas(selectedService.areas);
                    } else {
                      setFilteredServiceAreas([]);
                    }
                  } else {
                    setFilteredServiceAreas(options.serviceAreas);
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.service 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                required
              >
                <option value="">Selecione...</option>
                {options.services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
              {validationErrors.service && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.service}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área de Atuação <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, area: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.area 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                disabled={!formData.service}
                required
              >
                <option value="">
                  {!formData.service ? 'Primeiro selecione um serviço' : 'Selecione...'}
                </option>
                {filteredServiceAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              {validationErrors.area && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.area}</p>
              )}
            </div>

            {/* Especialidade - Obrigatória (linha inteira) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, specialty: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.specialty 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                required
              >
                <option value="">Selecione...</option>
                {options.specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                ))}
              </select>
              {validationErrors.specialty && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.specialty}</p>
              )}
            </div>

            {/* Tipo de Tecido - Radio Buttons */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Tecido
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'PLANO', label: 'Plano' },
                  { value: 'MALHA', label: 'Malha' },
                  { value: 'AMBOS', label: 'Ambos' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tecidType"
                      value={option.value}
                      checked={formData.tecidType === option.value}
                      onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, tecidType: e.target.value }))}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>


            {/* Quantidade e Prazo na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="1"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo
              </label>
              <input
                type="date"
                value={formData.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Orçamento Mínimo e Máximo na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Mínimo
              </label>
              <input
                type="text"
                value={formData.budgetMin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value ? `R$ ${(parseInt(value) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : '';
                  setFormData((prev: DemandFormData) => ({ ...prev, budgetMin: formatted }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.budget 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Máximo
              </label>
              <input
                type="text"
                value={formData.budgetMax}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value ? `R$ ${(parseInt(value) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : '';
                  setFormData((prev: DemandFormData) => ({ ...prev, budgetMax: formatted }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.budget 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="R$ 0,00"
              />
            </div>
            
            {/* Mensagem de erro do orçamento */}
            {validationErrors.budget && (
              <div className="md:col-span-2">
                <p className="text-red-500 text-sm">{validationErrors.budget}</p>
              </div>
            )}

            {/* Estado e Cidade na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF)
              </label>
              <select
                value={formData.uf}
                onChange={(e) => {
                  const uf = e.target.value;
                  setFormData((prev: DemandFormData) => ({ ...prev, uf, city: '' }));
                  loadCitiesByState(uf);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Selecione o estado</option>
                {BRAZILIAN_STATES.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={!formData.uf || loadingCities}
              >
                <option value="">
                  {!formData.uf ? 'Primeiro selecione o estado' : 
                   loadingCities ? 'Carregando cidades...' : 
                   'Selecione a cidade'}
                </option>
                {cities.map(city => (
                  <option key={city.id} value={city.nome}>
                    {city.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload de Arquivos */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexar Arquivos (Opcional)
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-pink-500 bg-pink-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-pink-600 hover:text-pink-500">Clique para fazer upload</span> ou arraste e solte
                    </p>
                    {isDragOver && (
                      <p className="text-sm text-pink-600 font-medium mt-2">
                        Solte os arquivos aqui!
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, DOC até 20MB cada</p>
                  </div>
                </label>
              </div>
              {/* Área para previews dos arquivos */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">Arquivos selecionados:</p>
                  <div className="flex flex-wrap gap-1">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer"
                        title={file.name}
                      >
                        {file.type.startsWith('image/') && filePreviews[index] ? (
                          <img 
                            src={filePreviews[index]} 
                            alt={file.name}
                            className="w-full h-full object-cover rounded-lg hover:scale-150 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg hover:scale-150 transition-transform duration-200">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm z-20"
                        >
                          <X size={10} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate rounded-b-lg">
                          {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Disponibilidade - Radio Buttons */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Disponibilidade para Início <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {options.availabilities.map((availability) => (
                  <label key={availability.id} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="availability"
                      value={availability.id}
                      checked={formData.availability === availability.id.toString()}
                      onChange={(e) => {
                        console.log('Disponibilidade selecionada:', e.target.value);
                        setFormData((prev: DemandFormData) => ({ ...prev, availability: e.target.value }));
                        // Limpar erro de disponibilidade ao selecionar
                        if (validationErrors.availability) {
                          setValidationErrors({ ...validationErrors, availability: undefined });
                        }
                      }}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    <span className="text-gray-700">{availability.name}</span>
                  </label>
                ))}
              </div>
              {validationErrors.availability && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.availability}</p>
              )}
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
              onClick={() => console.log('Botão clicado')}
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
  const [demandFiles, setDemandFiles] = useState<{id: number; file: string; created_at: string; updated_at: string; demand: number}[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const selectedProfessional = updatedDemand.selectedProfessional 
    ? state.professionalProfiles.find(p => p.userId === updatedDemand.selectedProfessional)
    : null;

  // Carregar arquivos da demanda
  useEffect(() => {
    const loadDemandFiles = async () => {
      setLoadingFiles(true);
      try {
        const files = await demandService.getDemandFiles(parseInt(demand.id));
        setDemandFiles(files);
      } catch (error) {
        console.error('Erro ao carregar arquivos da demanda:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadDemandFiles();
  }, [demand.id]);

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
                    {demand.budget.min > 0 || demand.budget.max > 0 
                      ? (() => {
                          const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString()}` : '';
                          const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString()}` : '';
                          if (min && max) {
                            return `Mín: ${min} - Máx: ${max}`;
                          } else if (min) {
                            return `Mín: ${min}`;
                          } else if (max) {
                            return `Máx: ${max}`;
                          }
                          return '-';
                        })()
                      : '-'
                    }
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Prazo
                  </h3>
                  <p className="text-gray-600">
                    {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
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

              {/* Arquivos Anexados */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Arquivos Anexados ({demandFiles.length})
                </h3>
                
                {loadingFiles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-gray-600">Carregando arquivos...</span>
                  </div>
                ) : demandFiles.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500">Nenhum arquivo anexado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {demandFiles.map((file) => {
                      const fileName = file.file.split('/').pop() || 'Arquivo';
                      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                      
                      return (
                        <div 
                          key={file.id} 
                          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => window.open(file.file, '_blank')}
                        >
                          <div className="flex flex-col items-center text-center">
                            {isImage ? (
                              <img 
                                src={file.file} 
                                alt={fileName}
                                className="w-12 h-12 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-pink-200 transition-colors">
                                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 truncate w-full" title={fileName}>
                              {fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(file.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  demandTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ demandTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Excluir Demanda</h3>
              <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Tem certeza que deseja excluir a demanda <strong>"{demandTitle}"</strong>?
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
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