import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Search, Filter, MapPin, Clock, DollarSign, User, MessageCircle, Heart, Eye, X, Phone, ChevronLeft, ChevronRight, ChevronDown, HeartOff, Calendar } from 'lucide-react';
import { Demand } from '../../types';
import { demandService } from '../../services/demandService';
import { userService } from '../../services/userService';
import { LocationService } from '../../services/locationService';
import { useApiMessage } from '../../hooks/useApiMessage';
import { ApiMessage } from '../UI/ApiMessage';

interface OpportunitiesPageProps {
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
  selectedDemandId?: string | null;
  onCloseModal?: () => void;
}

interface ServiceOption {
  id: number;
  name: string;
  areas?: ServiceOption[];
}

interface State {
  id: number;
  sigla: string;
  nome: string;
}

interface City {
  id: number;
  nome: string;
}

interface SearchFilters {
  services: number[];
  areas: number[];
  states: string[];
  cities: string[];
}

export default function OpportunitiesPage({ onStartConversation, selectedDemandId, onCloseModal }: OpportunitiesPageProps) {
  const { state, dispatch } = useApp();
  const { apiMessage, showMessage, hideMessage } = useApiMessage();
  
  // Estados para dados da API
  const [opportunities, setOpportunities] = useState<Demand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    services: [],
    areas: [],
    states: [],
    cities: []
  });
  
  // Estados para opções dos filtros
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceOption[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Estados para dropdowns e busca
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  
  // Estados para modal
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState<{ clientName: string } | null>(null);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Abrir modal automaticamente se selectedDemandId for fornecido
  useEffect(() => {
    if (selectedDemandId && opportunities.length > 0) {
      const demand = opportunities.find(d => d.id === selectedDemandId);
      if (demand) {
        setSelectedDemand(demand);
      }
    }
  }, [selectedDemandId, opportunities]);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carregar oportunidades apenas quando clicar em filtrar
  // useEffect removido - agora só carrega quando clicar no botão "Filtrar"

  // Carregar cidades quando estado mudar
  useEffect(() => {
    if (filters.states.length > 0) {
      loadCitiesByStates(filters.states);
    } else {
      setCities([]);
    }
  }, [filters.states]);

  // Carregar todas as áreas (não dependem de serviço)
  useEffect(() => {
    // Manter todas as áreas sempre disponíveis
    // Não filtrar baseado em serviços
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar dados do usuário atual
      const userData = await userService.getUserById();
      setCurrentUser(userData);
      
      // Carregar serviços e áreas via API
      await loadServices();
      
      // Carregar estados
      const statesData = await LocationService.getStates();
      setStates(statesData);
      
      // Carregar oportunidades iniciais com filtros automáticos baseados no perfil
      await loadOpportunitiesWithUserProfile(userData);
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      showMessage('Erro ao carregar dados. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      // Carregar serviços e áreas via API
      const [servicesData, areasData] = await Promise.all([
        userService.getServices(),
        userService.getServiceAreas()
      ]);
      
      
      setServices(servicesData);
      setServiceAreas(areasData); // Todas as áreas sempre disponíveis
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const loadCitiesByStates = async (stateCodes: string[]) => {
    try {
      if (stateCodes.length === 0) {
        setCities([]);
        return;
      }
      
      // Carregar cidades para todos os estados selecionados
      const citiesPromises = stateCodes.map(stateCode => LocationService.getCitiesByState(stateCode));
      const citiesArrays = await Promise.all(citiesPromises);
      
      // Combinar todas as cidades e remover duplicatas
      const allCities = citiesArrays.flat();
      const uniqueCities = allCities.filter((city, index, self) => 
        index === self.findIndex(c => c.id === city.id)
      );
      
      setCities(uniqueCities);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    }
  };

  // Função para carregar oportunidades com filtros automáticos do perfil do usuário
  const loadOpportunitiesWithUserProfile = async (userData: any) => {
    try {
      console.log('Carregando todas as oportunidades abertas...');
      
      // Carregar todas as demandas com status ABERTA (sem filtros automáticos)
      const result = await demandService.getOpportunities({});
      console.log('Oportunidades carregadas:', result.demands);
      setOpportunities(result.demands);
      
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error);
      showMessage('Erro ao carregar oportunidades. Tente novamente.', 'error');
    }
  };

  // Função para carregar oportunidades com filtros manuais
  const loadOpportunities = useCallback(async (overrideFilters?: { search?: string }) => {
    try {
      console.log('Carregando oportunidades com filtros manuais...');
      const apiFilters: any = {};
      
      // Usar filtros override ou os filtros atuais
      const currentSearch = overrideFilters?.search !== undefined ? overrideFilters.search : searchTerm;
      
      if (currentSearch) apiFilters.search = currentSearch;
      if (filters.states.length > 0) apiFilters.uf = filters.states.join(',');
      if (filters.cities.length > 0) apiFilters.city = filters.cities.join(',');
      if (filters.services.length > 0) apiFilters.service = filters.services.join(',');
      if (filters.areas.length > 0) apiFilters.area = filters.areas.join(',');
      
      console.log('Filtros manuais aplicados:', apiFilters);
      const result = await demandService.getOpportunities(apiFilters);
      console.log('Oportunidades carregadas:', result.demands);
      setOpportunities(result.demands);
      
    } catch (error) {
      console.error('Erro ao carregar oportunidades:', error);
      showMessage('Erro ao carregar oportunidades. Tente novamente.', 'error');
    }
  }, [searchTerm, filters, showMessage]);

  const handleContactWhatsApp = (demand: Demand) => {
    // Verificar se tem telefone cadastrado usando o campo correto do endpoint
    const backendDemand = demand as any; // BackendDemand com campos extras
    const clientPhone = backendDemand.user_cellphone;
    const clientName = backendDemand.user_full_name;
    
    console.log('Debug WhatsApp:', {
      demandId: demand.id,
      clientPhone,
      clientName,
      hasPhone: !!clientPhone,
      phoneLength: clientPhone ? clientPhone.length : 0
    });
    
    // Verificar se tem telefone válido (não null, undefined ou string vazia)
    if (clientPhone && clientPhone.trim() !== '') {
      // Abrir WhatsApp
      const message = `Olá! Vi sua demanda "${demand.title}" na VINKO e gostaria de conversar sobre o projeto.`;
      const whatsappUrl = `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      console.log('Abrindo WhatsApp:', whatsappUrl);
      window.open(whatsappUrl, '_blank');
    } else {
      // Mostrar modal de telefone não cadastrado usando o campo correto do endpoint
      console.log('Mostrando modal - sem telefone:', clientName);
      setShowPhoneModal({ clientName: clientName || 'Cliente' });
    }
  };

  const handleStartConversationDemand = (demand: Demand) => {
    if (!onStartConversation) return;

    const initialMessage = `Olá! Tenho interesse na sua demanda: "${demand.title}". Gostaria de conversar sobre os detalhes do projeto.`;
    onStartConversation(demand.clientId, demand.id, initialMessage);

    // Send notification to client
    const notification = {
      id: Date.now().toString(),
      userId: demand.clientId,
      type: 'new_message' as const,
      title: 'Nova mensagem',
      message: `Um profissional enviou uma mensagem sobre sua demanda: ${demand.title}`,
      isRead: false,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const handleShowInterest = async (demandId: string) => {
    try {
      if (!currentUser?.id) {
        showMessage('Usuário não encontrado. Faça login novamente.', 'error');
        return;
      }

      // Chamar API para demonstrar interesse
      const updatedDemand = await demandService.showInterest(parseInt(demandId), currentUser.id);
      
      // Atualizar a demanda específica na lista local
      setOpportunities(prevOpportunities => 
        prevOpportunities.map(demand => 
          demand.id === demandId 
            ? { 
                ...demand, 
                user_is_interested: true, // Marcar como interessado
                interestedProfessionals: [
                  ...(demand.interestedProfessionals || []), 
                  { id: parseInt(currentUser.id), full_name: currentUser.full_name || 'Usuário' }
                ],
                interested_professionals_count: (demand.interested_professionals_count || 0) + 1
              }
            : demand
        )
      );
      
      showMessage('Interesse demonstrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao demonstrar interesse:', error);
      
      // Verificar se é um erro específico da API
      if (error instanceof Error && error.message.includes('Você só pode se adicionar como interessado')) {
        showMessage('Você só pode se adicionar como interessado.', 'error');
      } else {
        showMessage('Erro ao demonstrar interesse. Tente novamente.', 'error');
      }
    }
  };

  const isInterestedInDemand = (demandId: string) => {
    if (!currentUser?.id) return false;
    
    // Verificar se o usuário atual está interessado usando o campo user_is_interested da API
    const demand = opportunities.find(d => d.id === demandId);
    if (!demand) {
      return false;
    }
    
    // Usar o campo user_is_interested que vem diretamente da API
    return demand.user_is_interested === true;
  };

  const clearFilters = async () => {
    setSearchTerm('');
    setFilters({
      services: [],
      areas: [],
      states: [],
      cities: []
    });
    // Limpar oportunidades quando limpar filtros
    setOpportunities([]);
    
    // Filtrar automaticamente após limpar (buscar todas as oportunidades)
    try {
      console.log('Limpando filtros e buscando todas as oportunidades...');
      const result = await demandService.getOpportunities({});
      console.log('Todas as oportunidades carregadas:', result.demands);
      setOpportunities(result.demands);
    } catch (error) {
      console.error('Erro ao carregar oportunidades após limpar filtros:', error);
      showMessage('Erro ao carregar oportunidades. Tente novamente.', 'error');
    }
  };

  // Verificar se há filtros ativos para habilitar/desabilitar o botão limpar
  const hasActiveFilters = searchTerm || filters.services.length > 0 || filters.areas.length > 0 || filters.states.length > 0 || filters.cities.length > 0;

  // Funções para gerenciar dropdowns e filtros
  const toggleDropdown = (filterType: keyof SearchFilters) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: string | number) => {
    setFilters(prev => {
      const currentValues = prev[filterType] as (string | number)[];
      let newValues: (string | number)[];

      if (currentValues.includes(value)) {
        // Remove se já estiver selecionado
        newValues = currentValues.filter(v => v !== value);
      } else {
        // Adiciona se não estiver selecionado
        newValues = [...currentValues, value];
      }

      return {
        ...prev,
        [filterType]: newValues as any
      };
    });
  };

  const removeFilter = (filterType: keyof SearchFilters, value: string | number) => {
    setFilters(prev => {
      const newValues = (prev[filterType] as (string | number)[]).filter(v => v !== value);
      
      // Se for estado, remover também as cidades daquele estado que foi removido
      if (filterType === 'states') {
        const removedState = states.find(s => s.sigla === value);
        if (removedState) {
          const citiesToRemove = cities.filter(c => c.nome.includes(removedState.nome));
          const newCities = prev.cities.filter(city => 
            !citiesToRemove.some(c => c.nome === city)
          );
          return {
            ...prev,
            [filterType]: newValues as string[],
            cities: newCities
          };
        }
      }
      
      return {
        ...prev,
        [filterType]: newValues as any
      };
    });
  };

  // Função para renderizar dropdown múltiplo
  const renderMultiSelect = (
    filterType: keyof SearchFilters,
    placeholder: string,
    options: Array<{ id: number; nome?: string; name?: string; sigla?: string }>,
    disabled: boolean = false
  ) => {
    const currentValues = filters[filterType] as (string | number)[];
    const isOpen = openDropdowns[filterType] || false;
    const displayName = (item: any) => {
      if (filterType === 'states') {
        return item.sigla;
      }
      return item.nome || item.name;
    };
    const searchTerm = searchTerms[filterType] || '';

    // Filtrar opções que não estão selecionadas
    const availableOptions = options.filter(option => {
      if (filterType === 'states') {
        return !currentValues.includes(option.sigla!);
      } else if (filterType === 'cities') {
        return !currentValues.includes(displayName(option));
      } else {
        return !currentValues.includes(option.id);
      }
    });

    // Filtrar opções baseado no termo de busca
    const filteredOptions = availableOptions.filter(option => {
      const name = displayName(option).toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });

    return (
      <div className="relative dropdown-container">
        <div
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none cursor-pointer h-10 flex items-center ${
            disabled 
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 bg-white focus:ring-pink-500'
          }`}
          onClick={() => !disabled && toggleDropdown(filterType)}
        >
          <span className={`${currentValues.length === 0 ? 'text-gray-500' : 'text-gray-900'} truncate`}>
            {disabled 
              ? 'Selecione um estado primeiro' 
              : currentValues.length === 0 
                ? placeholder 
                : `${currentValues.length} selecionado(s)`
            }
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
                disabled ? 'text-gray-300' : 'text-gray-400'
              }`} 
            />
          </div>
        </div>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {/* Campo de busca */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <input
                type="text"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerms(prev => ({
                    ...prev,
                    [filterType]: e.target.value
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Lista de opções */}
            {filteredOptions.map(option => {
              const optionName = displayName(option);
              return (
                <div
                  key={option.id}
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={() => {
                    if (filterType === 'states') {
                      handleFilterChange(filterType, option.sigla!);
                    } else if (filterType === 'cities') {
                      handleFilterChange(filterType, optionName);
                    } else {
                      handleFilterChange(filterType, option.id);
                    }
                    // Limpar o termo de busca após selecionar
                    setSearchTerms(prev => ({
                      ...prev,
                      [filterType]: ''
                    }));
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{optionName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Função para renderizar tags selecionadas
  const renderSelectedTags = (filterType: keyof SearchFilters) => {
    const values = filters[filterType] as (string | number)[];
    if (values.length === 0) return null;

    const getDisplayValue = (value: string | number) => {
      if (filterType === 'states') {
        const state = states.find(s => s.sigla === value);
        return state ? state.sigla : value;
      } else if (filterType === 'cities') {
        return value;
      } else {
        // Para services e areas - buscar pelo ID
        let optionList: any[] = [];
        if (filterType === 'services') optionList = services;
        else if (filterType === 'areas') optionList = serviceAreas;
        
        const option = optionList.find(o => o.id === value);
        return option ? (option.nome || option.name) : value;
      }
    };

    return (
      <div className="mt-2">
        <div className="max-w-full">
          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 max-h-12" style={{ maxWidth: '100%' }}>
            {values.map(value => (
              <span
                key={value}
                className="inline-flex items-center bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
              >
                {getDisplayValue(value)}
                <button
                  type="button"
                  onClick={() => removeFilter(filterType, value)}
                  className="ml-2 text-pink-600 hover:text-pink-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Oportunidades Disponíveis</h1>
        <p className="text-gray-600">Encontre projetos que combinam com seu perfil profissional</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="space-y-4">
          {/* Primeira linha: Busca, Serviço e Área */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar oportunidades..."
                value={searchTerm}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  // Chamar API automaticamente quando o valor mudar
                  await loadOpportunities({ search: value });
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent h-10"
              />
            </div>

            {/* Tipo de Serviço */}
            <div className="flex-1 min-w-0">
              {renderMultiSelect('services', 'Selecione o tipo de serviço', services, false)}
              {renderSelectedTags('services')}
            </div>

            {/* Área de Atuação */}
            <div className="flex-1 min-w-0">
              {renderMultiSelect('areas', 'Selecione a área de atuação', serviceAreas, false)}
              {renderSelectedTags('areas')}
            </div>
          </div>

          {/* Segunda linha: Estado, Cidade e Botões */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Estado */}
            <div className="flex-1 min-w-0">
              {renderMultiSelect('states', 'Selecione o estado', states, false)}
              {renderSelectedTags('states')}
            </div>

            {/* Cidade */}
            <div className="flex-1 min-w-0">
              {renderMultiSelect('cities', 'Selecione a cidade', cities, filters.states.length === 0)}
              {renderSelectedTags('cities')}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 md:w-auto w-full">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={`flex items-center justify-center px-4 rounded-lg transition-colors text-sm h-10 flex-1 md:flex-none ${
                  hasActiveFilters 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </button>
              <button 
                onClick={loadOpportunities}
                className="flex items-center justify-center px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm h-10 flex-1 md:flex-none"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Oportunidades */}
      <div className="space-y-6">
        {opportunities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma oportunidade encontrada</h3>
            <p className="text-gray-500">Tente ajustar os filtros para encontrar mais oportunidades.</p>
          </div>
        ) : (
          opportunities.map((demand) => (
            <OpportunityCard
              key={demand.id}
              demand={demand}
              onViewDetails={() => setSelectedDemand(demand)}
              onContactWhatsApp={handleContactWhatsApp}
              onStartConversation={handleStartConversationDemand}
              onShowInterest={handleShowInterest}
              isInterested={isInterestedInDemand(demand.id)}
            />
          ))
        )}
      </div>

      {/* Demand Details Modal */}
      {selectedDemand && (
        <DemandDetailsModal
          demand={selectedDemand}
          onClose={() => {
            setSelectedDemand(null);
            onCloseModal?.();
          }}
          onContactWhatsApp={handleContactWhatsApp}
          onStartConversation={handleStartConversationDemand}
          onShowInterest={handleShowInterest}
          isInterested={isInterestedInDemand(selectedDemand.id)}
        />
      )}

      {/* Phone Not Registered Modal */}
      {showPhoneModal && (
        <PhoneNotRegisteredModal
          clientName={showPhoneModal.clientName}
          onClose={() => setShowPhoneModal(null)}
        />
      )}
      
      {/* ApiMessage para mostrar notificações */}
      {apiMessage.show && (
        <ApiMessage
          message={apiMessage.message}
          type={apiMessage.type}
          onClose={hideMessage}
        />
      )}
    </div>
  );
}

// Componente de Card de Oportunidade
interface OpportunityCardProps {
  demand: Demand;
  onViewDetails: () => void;
  onContactWhatsApp: (demand: Demand) => void;
  onStartConversation: (demand: Demand) => void;
  onShowInterest: (demandId: string) => void;
  isInterested: boolean;
}

function OpportunityCard({ 
  demand, 
  onViewDetails, 
  onContactWhatsApp, 
  onStartConversation, 
  onShowInterest, 
  isInterested 
}: OpportunityCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 
            className="text-xl font-semibold text-gray-900 mb-2 truncate" 
            title={demand.title}
          >
            {demand.title}
          </h3>
          <p 
            className="text-gray-600 mb-4 line-clamp-2 overflow-hidden max-w-2xl"
            title={demand.description}
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {demand.description}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center min-w-0">
              <User className="h-4 w-4 mr-1 flex-shrink-0" />
              <span 
                className="truncate max-w-32"
                title={demand.serviceType || '-'}
              >
                {demand.serviceType || '-'}
              </span>
            </div>
            <div className="flex items-center min-w-0">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span 
                className="truncate max-w-24"
                title={(() => {
                  const { city, state } = demand.location;
                  if (city && state) {
                    return `${city}, ${state}`;
                  } else if (city) {
                    return city;
                  } else if (state) {
                    return state;
                  }
                  return '-';
                })()}
              >
                {(() => {
                  const { city, state } = demand.location;
                  if (city && state) {
                    return `${city}, ${state}`;
                  } else if (city) {
                    return city;
                  } else if (state) {
                    return state;
                  }
                  return '-';
                })()}
              </span>
            </div>
            <div className="flex items-center min-w-0">
              <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
              <span 
                className="truncate max-w-40"
                title={demand.budget.min > 0 || demand.budget.max > 0 
                  ? (() => {
                      const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString('pt-BR')}` : '';
                      const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString('pt-BR')}` : '';
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
              >
                {demand.budget.min > 0 || demand.budget.max > 0 
                  ? (() => {
                      const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString('pt-BR')}` : '';
                      const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString('pt-BR')}` : '';
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
            <div className="flex items-center min-w-0">
              <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
              <span 
                className="truncate max-w-20"
                title={demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : '-'}
              >
                {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center text-sm text-gray-500 min-w-0">
              <Heart className="h-4 w-4 mr-1 flex-shrink-0" />
              <span 
                className="truncate"
                title={`${demand.interested_professionals_count || 0} interessados`}
              >
                {demand.interested_professionals_count || 0} interessados
              </span>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="flex items-center px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm whitespace-nowrap"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Detalhes
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContactWhatsApp(demand);
                }}
                className="flex items-center px-3 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm whitespace-nowrap"
              >
                <Phone className="h-4 w-4 mr-1" />
                WhatsApp
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartConversation(demand);
                }}
                className="flex items-center px-3 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Mensagem
              </button>
              
              {isInterested ? (
                <button
                  disabled
                  className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg cursor-not-allowed text-sm whitespace-nowrap"
                >
                  <Heart className="h-4 w-4 mr-1 fill-current" />
                  Interessado
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowInterest(demand.id);
                  }}
                  className="flex items-center px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm whitespace-nowrap"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Interessar-se
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de Detalhes da Demanda
interface DemandDetailsModalProps {
  demand: Demand;
  onClose: () => void;
  onContactWhatsApp: (demand: Demand) => void;
  onStartConversation: (demand: Demand) => void;
  onShowInterest: (demandId: string) => void;
  isInterested: boolean;
}

function DemandDetailsModal({ 
  demand, 
  onClose, 
  onContactWhatsApp, 
  onStartConversation, 
  onShowInterest, 
  isInterested 
}: DemandDetailsModalProps) {
  const [demandFiles, setDemandFiles] = useState<{id: number; file: string; created_at: string; updated_at: string; demand: number}[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; index: number } | null>(null);

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

  const openImageModal = (src: string, index: number) => {
    setSelectedImage({ src, index });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage || !demand.attachments) return;
    
    const currentIndex = selectedImage.index;
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : demand.attachments.length - 1;
    } else {
      newIndex = currentIndex < demand.attachments.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedImage({ src: demand.attachments[newIndex], index: newIndex });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-4">
              <h2 
                className="text-2xl font-semibold text-gray-900 mb-2 truncate" 
                title={demand.title}
              >
                {demand.title}
              </h2>
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
            
            {/* Seção de Profissionais Interessados */}
            <div className="flex items-center mx-4 bg-gray-50 rounded-lg px-3 py-2">
              <Heart className="h-4 w-4 mr-1 text-gray-500" />
              <span className="text-sm text-gray-500">
                {demand.interested_professionals_count || 0} profissionais interessados
              </span>
            </div>
            
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Descrição do Projeto</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <p className="text-gray-600 leading-relaxed">{demand.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                Orçamento
              </h3>
              <p className={demand.budget.min > 0 || demand.budget.max > 0 ? "text-sm font-medium text-green-600" : "text-gray-500 text-xs"}>
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
                      return 'Nenhum orçamento informado';
                    })()
                  : 'Nenhum orçamento informado'
                }
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Prazo
              </h3>
              <p className={demand.deadline ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : 'Nenhum prazo informado'}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                Localização
              </h3>
              <p className={demand.location.city || demand.location.state ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {(() => {
                  const { city, state } = demand.location;
                  if (city && state) {
                    return `${city}, ${state}`;
                  } else if (city) {
                    return city;
                  } else if (state) {
                    return state;
                  }
                  return 'Nenhuma localização informada';
                })()}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2 text-purple-600" />
                Tipo de Serviço
              </h3>
              <p className={demand.serviceType ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.serviceType || 'Nenhum tipo de serviço informado'}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Área de Atuação
              </h3>
              <p className={demand.area ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.area || 'Nenhuma área de atuação informada'}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Especialidade
              </h3>
              <p className={demand.specialty ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.specialty || 'Nenhuma especialidade informada'}
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Tipo de Tecido
              </h3>
              <p className={demand.tecidType ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.tecidType || 'Nenhum tipo de tecido informado'}
              </p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="h-4 w-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Quantidade
              </h3>
              <p className={demand.amount ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.amount ? demand.amount.toLocaleString('pt-BR') : 'Nenhuma quantidade informada'}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-red-600" />
                Disponibilidade
              </h3>
              <p className={demand.availability ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                {demand.availability || 'Nenhuma disponibilidade informada'}
              </p>
            </div>
          </div>

          {/* Arquivos Anexados */}
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
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
              <p className="text-gray-500 text-sm">Nenhum arquivo anexado</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {demandFiles.map((file) => {
                  const fileName = file.file.split('/').pop() || 'Arquivo';
                  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                  
                  return (
                    <div 
                      key={file.id} 
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group flex-shrink-0 w-24"
                      onClick={() => window.open(file.file, '_blank')}
                    >
                      <div className="flex flex-col items-center text-center">
                        {isImage ? (
                          <img 
                            src={file.file} 
                            alt={fileName}
                            className="w-10 h-10 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-pink-200 transition-colors">
                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <p className="text-xs text-gray-600 truncate w-full" title={fileName}>
                          {fileName.length > 12 ? fileName.substring(0, 12) + '...' : fileName}
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

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Criada em {new Date(demand.createdAt).toLocaleDateString('pt-BR')} | Atualizada em {new Date(demand.updatedAt).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onContactWhatsApp(demand)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Phone className="h-4 w-4" />
                WhatsApp
              </button>
              
              <button
                onClick={() => {
                  onStartConversation(demand);
                  onClose();
                }}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
              
              {isInterested ? (
                <button
                  disabled
                  className="bg-green-100 text-green-700 px-6 py-2 rounded-lg cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  Interessado
                </button>
              ) : (
                <button
                  onClick={() => {
                    onShowInterest(demand.id);
                  }}
                  className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Heart className="h-4 w-4" />
                  Demonstrar Interesse
                </button>
              )}
              
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-[95vw] max-h-[95vh] overflow-auto">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors z-10 shadow-lg"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Arrows */}
            {demand.attachments && demand.attachments.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image Container */}
            <div className="p-4">
              <img
                src={selectedImage.src}
                alt={`Imagem ${selectedImage.index + 1} em tamanho real`}
                className="block mx-auto rounded-lg shadow-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            {/* Image Counter */}
            {demand.attachments && demand.attachments.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 text-white px-3 py-1 rounded-full shadow-lg">
                {selectedImage.index + 1} / {demand.attachments.length}
              </div>
            )}

            {/* Download/Open Actions */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              {selectedImage.src.startsWith('data:') ? (
                <a
                  href={selectedImage.src}
                  download={`imagem-projeto-${selectedImage.index + 1}.jpg`}
                  className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm shadow-lg"
                >
                  Download
                </a>
              ) : (
                <a
                  href={selectedImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm shadow-lg"
                >
                  Abrir
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal de Telefone Não Cadastrado
interface PhoneNotRegisteredModalProps {
  clientName: string;
  onClose: () => void;
}

function PhoneNotRegisteredModal({ clientName, onClose }: PhoneNotRegisteredModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Telefone não cadastrado
          </h3>
          <p className="text-gray-600 mb-6">
            O cliente <span className="font-medium">{clientName}</span> não possui telefone cadastrado para WhatsApp.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Você pode tentar entrar em contato através do botão "Conversar" ou aguardar até que o cliente atualize suas informações de contato.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors font-medium"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

