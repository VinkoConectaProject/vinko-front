import { useState, useEffect } from 'react';
import { Search, ChevronDown, X, Calendar, MapPin, Phone, Mail, Target, Star, Layers, MessageSquare, Eye } from 'lucide-react';
import { userService } from '../../services/userService';
import { BRAZILIAN_STATES } from '../../data/locations';
import { LocationService } from '../../services/locationService';
import { useApp } from '../../contexts/AppContext';
import { useUserRefresh } from '../../hooks/useUserRefresh';
import { StarRating } from '../UI/StarRating';
import { RatingModal } from '../UI/RatingModal';
import { ProfessionalProfileModal } from '../UI/ProfessionalProfileModal';
import { ratingService } from '../../services/ratingService';
import { ProfessionalSearchResult } from '../../types';

interface ServiceOption {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  areas?: ServiceOption[];
}


interface SearchFilters {
  serviceTypes: number[];
  operationAreas: number[];
  specialties: string[];
  fabricTypes: string;
  availabilities: number[];
  cities: string[];
  ufs: string[];
}


interface SearchResponse {
  status: string;
  message: string;
  error: string;
  data: ProfessionalSearchResult[];
}

export function SearchProfessionalsPage() {
  const { state } = useApp();
  const { refreshUserData } = useUserRefresh();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<number | null>(null);
  const [lastSearchTerm, setLastSearchTerm] = useState(''); // Para controlar quando fazer busca
  const [isResettingFilters, setIsResettingFilters] = useState(false);
  const [showNoPhoneModal, setShowNoPhoneModal] = useState(false);
  const [selectedProfessionalName, setSelectedProfessionalName] = useState('');
  
  // Controle de visibilidade do botão Avaliar - desabilitado por segurança
  const SHOW_RATING_BUTTON = false;
  
  // Função para abrir modal de avaliação
  const handleOpenRatingModal = async (professional: ProfessionalSearchResult) => {
    // Verificação de segurança - função desabilitada
    if (!SHOW_RATING_BUTTON) {
      return;
    }
    
    setSelectedProfessional(professional);
    
    // Verificar se já existe avaliação para este profissional
        if (currentUser?.id) {
      try {
        const response = await ratingService.getRatingByClientProfessional(
          currentUser.id, 
          professional.id
        );
        
        console.log('🔍 Resposta da API para rating:', response);
        console.log('🔍 Status:', response.status);
        console.log('🔍 Data:', response.data);
        console.log('🔍 Data keys:', response.data ? Object.keys(response.data) : 'no data');
        
        // Verificar se há dados na resposta e se não é um objeto vazio
        if (response.status === 'success' && response.data && Object.keys(response.data).length > 0 && response.data.id) {
          console.log('✅ Encontrou avaliação existente:', response.data);
          setExistingRating({
            id: response.data.id,
            score: response.data.score || 0,
            comment: response.data.comment || ''
          });
        } else {
          console.log('❌ Nenhuma avaliação encontrada');
          setExistingRating(null);
        }
      } catch (error) {
        console.error('Erro ao verificar avaliação existente:', error);
        setExistingRating(null);
      }
    }
    
    setShowRatingModal(true);
  };
  
  // Função para fechar modal de avaliação
  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setSelectedProfessional(null);
    setExistingRating(null);
  };

  // Função para abrir modal de perfil
  const handleOpenProfileModal = (professional: ProfessionalSearchResult) => {
    setSelectedProfileProfessional(professional);
    setShowProfileModal(true);
  };

  // Função para fechar modal de perfil
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfileProfessional(null);
  };

  // Função para avaliar profissional a partir do modal de perfil
  const handleRateFromProfile = (professional: ProfessionalSearchResult) => {
    setSelectedProfessional(professional);
    setShowRatingFromProfile(true);
    
    // Verificar se já existe avaliação para este profissional
    if (currentUser?.id) {
      ratingService.getRatingByClientProfessional(currentUser.id, professional.id)
        .then(response => {
          if (response.status === 'success' && response.data && Object.keys(response.data).length > 0 && response.data.id) {
            setExistingRating({
              id: response.data.id,
              score: response.data.score || 0,
              comment: response.data.comment || ''
            });
          } else {
            setExistingRating(null);
          }
        })
        .catch(error => {
          console.error('Erro ao verificar avaliação existente:', error);
          setExistingRating(null);
        });
    }
  };

  // Função para fechar modal de avaliação do perfil e recarregar dados
  const handleCloseRatingFromProfile = async () => {
    setShowRatingFromProfile(false);
    // Recarregar a lista de profissionais para atualizar os ratings nos cards
    const updatedProfessionals = await searchProfessionals();
    
    // Se o modal de perfil estiver aberto, atualizar o profissional selecionado
    if (showProfileModal && selectedProfileProfessional && updatedProfessionals) {
      const updatedProfessional = updatedProfessionals.find(p => p.id === selectedProfileProfessional.id);
      if (updatedProfessional) {
        setSelectedProfileProfessional(updatedProfessional);
      }
    }
  };
  
  // Função para submeter avaliação
  const handleRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedProfessional || !currentUser?.id) return;
    
    try {
      if (existingRating) {
        // Atualizar avaliação existente
        await ratingService.updateRating(existingRating.id, { score: rating, comment });
      } else {
        // Criar nova avaliação
        await ratingService.createRating({
          professional: selectedProfessional.id,
          score: rating,
          comment
        });
      }
      
      // Recarregar a lista de profissionais para atualizar os ratings
      const updatedProfessionals = await searchProfessionals();
      
      // Se o modal de perfil estiver aberto, atualizar o profissional selecionado e trigger refresh das avaliações
      if (showProfileModal && selectedProfileProfessional && updatedProfessionals) {
        const updatedProfessional = updatedProfessionals.find(p => p.id === selectedProfileProfessional.id);
        if (updatedProfessional) {
          setSelectedProfileProfessional(updatedProfessional);
        }
        setProfileRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      throw error;
    }
  };
  
  // Função para remover avaliação
  const handleRatingDelete = async () => {
    if (!existingRating) return;
    
    try {
      await ratingService.deleteRating(existingRating.id);
      
      // Recarregar a lista de profissionais para atualizar os ratings
      const updatedProfessionals = await searchProfessionals();
      
      // Se o modal de perfil estiver aberto, atualizar o profissional selecionado e trigger refresh das avaliações
      if (showProfileModal && selectedProfileProfessional && updatedProfessionals) {
        const updatedProfessional = updatedProfessionals.find(p => p.id === selectedProfileProfessional.id);
        if (updatedProfessional) {
          setSelectedProfileProfessional(updatedProfessional);
        }
        setProfileRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      throw error;
    }
  };
  
  // Obter dados do usuário atual
  const currentUser = state.djangoUser;
  
  // DEBUG: Remover logs em produção
  // console.log('👤 Dados do usuário atual:', currentUser);
  
  const [filters, setFilters] = useState<SearchFilters>({
    serviceTypes: [],
    operationAreas: [],
    specialties: [], // Será preenchido pelo useEffect quando as especialidades forem carregadas
    fabricTypes: '',
    availabilities: [],
    cities: currentUser?.city ? [currentUser.city] : [],
    ufs: currentUser?.uf ? [currentUser.uf] : []
  });

  const [options, setOptions] = useState<{
    services: ServiceOption[];
    serviceAreas: ServiceOption[];
    specialties: ServiceOption[];
    availabilities: ServiceOption[];
    ufs: { code: string; name: string }[];
    cities: {id: number; nome: string}[];
  }>({
    services: [],
    serviceAreas: [],
    specialties: [],
    availabilities: [],
    ufs: [],
    cities: []
  });

  const [loading, setLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  
  const [statesLoaded, setStatesLoaded] = useState(false);

  // Estados para busca de profissionais
  const [professionals, setProfessionals] = useState<ProfessionalSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  
  // Estados para modal de avaliação
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalSearchResult | null>(null);
  const [existingRating, setExistingRating] = useState<{id: number; score: number; comment?: string} | null>(null);
  
  // Estados para modal de perfil
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileProfessional, setSelectedProfileProfessional] = useState<ProfessionalSearchResult | null>(null);
  const [showRatingFromProfile, setShowRatingFromProfile] = useState(false);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);

  // Função para buscar profissionais
  const searchProfessionals = async (customSearchTerm?: string, customFilters?: SearchFilters): Promise<ProfessionalSearchResult[]> => {
    try {
      setSearchLoading(true);
      setSearchMessage('');

      // Usar o termo customizado se fornecido, senão usar o estado atual
      const currentSearchTerm = customSearchTerm !== undefined ? customSearchTerm : searchTerm;
      
      // Usar filtros customizados se fornecidos, senão usar o estado atual
      const currentFilters = customFilters || filters;

      // Construir parâmetros da URL
      const params = new URLSearchParams();

      // Adicionar filtros apenas se tiverem valores
      if (currentFilters.serviceTypes.length > 0) {
        params.append('services', currentFilters.serviceTypes.join(','));
      }
      if (currentFilters.operationAreas.length > 0) {
        params.append('areas', currentFilters.operationAreas.join(','));
      }
      if (currentFilters.specialties.length > 0) {
        // Se as especialidades são nomes, converter para IDs se necessário
        const specialtyIds = currentFilters.specialties.map(specialtyName => {
          const specialty = options.specialties.find(s => s.name === specialtyName);
          return specialty ? specialty.id : specialtyName;
        }).filter(Boolean);
        
        if (specialtyIds.length > 0) {
          params.append('specialties', specialtyIds.join(','));
        }
      }
      if (currentFilters.fabricTypes) {
        params.append('tecid_type', currentFilters.fabricTypes);
      }
      if (currentFilters.availabilities.length > 0) {
        params.append('availabilities', currentFilters.availabilities.join(','));
      }
      if (currentFilters.ufs.length > 0) {
        params.append('ufs', currentFilters.ufs.join(','));
      }
      if (currentFilters.cities.length > 0) {
        params.append('cities', currentFilters.cities.join(','));
      }
      if (currentSearchTerm && currentSearchTerm.trim().length >= 3) {
        params.append('search', currentSearchTerm.trim());
      }

      const response = await fetch(`https://vinko-api.fly.dev/api/v1/user/professionals/search/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data: SearchResponse = await response.json();

      if (data.status === 'success') {
        setProfessionals(data.data);
        setSearchMessage(data.message);
        return data.data;
      } else {
        setProfessionals([]);
        setSearchMessage(data.error || 'Erro ao buscar profissionais');
        return [];
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setProfessionals([]);
      setSearchMessage('Erro ao conectar com o servidor');
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  // Função para busca dinâmica com debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Limpar timer anterior
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    const currentLength = value.trim().length;
    const lastLength = lastSearchTerm.trim().length;
    
    // Só fazer busca em duas situações:
    // 1. Chegou aos 3 caracteres (primeira vez)
    // 2. Tinha 3+ caracteres e agora tem menos de 3 (voltou)
    const shouldSearch = 
      (currentLength >= 3) || // Chegou aos 3 caracteres
      (lastLength >= 3 && currentLength < 3); // Tinha 3+ e agora tem menos
    
    if (shouldSearch) {
      const timer = setTimeout(() => {
        if (currentLength >= 3) {
          searchProfessionals(value); // Buscar com termo
        } else {
          searchProfessionals(''); // Buscar sem termo, só filtros
        }
        setLastSearchTerm(value); // Atualizar último termo buscado
      }, 500);
      setSearchDebounceTimer(timer);
    }
  };

  // Carregar opções dos filtros
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const [services, serviceAreas, specialties, availabilities] = await Promise.all([
          userService.getServices(),
          userService.getServiceAreas(),
          userService.getSpecialties(),
          userService.getAvailabilities(),
        ]);

        setOptions(prev => ({
          ...prev,
          services,
          serviceAreas,
          specialties,
          availabilities
        }));
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Carregar estados do Brasil (usando dados locais)
  useEffect(() => {
    setOptions(prev => ({ ...prev, ufs: BRAZILIAN_STATES }));
    setStatesLoaded(true);
  }, []);

  // Atualizar dados do usuário automaticamente quando a página carrega
  useEffect(() => {
    const updateUserData = async () => {
      try {
        await refreshUserData();
      } catch (error) {
        console.error('Erro ao atualizar dados do usuário:', error);
      }
    };

    updateUserData();
  }, []); // Executa apenas uma vez quando o componente monta

  // Aplicar filtro de especialidade quando as especialidades forem carregadas
  useEffect(() => {
    // console.log('🔄 useEffect especialidade executado');
    
    // Tentar usar specialties, services_areas ou specialty
    const userSpecialtyIds = currentUser?.specialties || currentUser?.services_areas || [];
    const hasSpecialty = currentUser?.specialty || userSpecialtyIds.length > 0;
    
    if (hasSpecialty && options.specialties.length > 0) {
      let userSpecialties: any[] = [];
      
      // Se tem specialty como string, tentar encontrar por nome
      if (currentUser?.specialty) {
        let userSpecialty = options.specialties.find(
          specialty => specialty.name === currentUser.specialty
        );
        
        if (!userSpecialty) {
          userSpecialty = options.specialties.find(
            specialty => specialty.name.toLowerCase() === currentUser.specialty?.toLowerCase()
          );
        }
        
        if (userSpecialty) {
          userSpecialties.push(userSpecialty);
        }
      }
      
      // Se tem services_areas (IDs), buscar por ID
      if (userSpecialtyIds.length > 0) {
        const specialtiesById = userSpecialtyIds.map((id: number) => {
          return options.specialties.find(specialty => specialty.id === id);
        }).filter(Boolean);
        userSpecialties.push(...specialtiesById);
      }
      
      // Remover duplicatas
      userSpecialties = userSpecialties.filter((specialty, index, self) => 
        index === self.findIndex(s => s.id === specialty.id)
      );
      
      if (userSpecialties.length > 0) {
        const specialtyNames = userSpecialties.map(s => s.name);
        setFilters(prev => ({
          ...prev,
          specialties: specialtyNames
        }));
      }
    }
  }, [currentUser?.specialty, currentUser?.services_areas, currentUser?.specialties, options.specialties]);

  // Busca automática APENAS na primeira vez que a página carregar (se houver dados completos do usuário)
  useEffect(() => {
    if (currentUser?.city && currentUser?.uf && statesLoaded && !loading && options.specialties.length > 0) {
      // Aguardar um pouco para garantir que os filtros foram aplicados
      const timer = setTimeout(() => {
        searchProfessionals();
      }, 1500); // Tempo para garantir que especialidades sejam aplicadas
      return () => clearTimeout(timer);
    }
  }, [currentUser?.city, currentUser?.uf, statesLoaded, loading, options.specialties.length]); // Removido filters.specialties para evitar busca automática em mudanças de filtro

  // Carregar cidades quando UFs forem selecionados
  useEffect(() => {
    const loadCities = async () => {
      if (filters.ufs.length > 0) {
        try {
          const allCities: { id: number; nome: string }[] = [];
          
          // Carregar cidades para cada UF selecionado
          for (const uf of filters.ufs) {
            const cities = await LocationService.getCitiesByState(uf);
            allCities.push(...cities);
          }
          
          // Remover duplicatas e ordenar
          const uniqueCities = allCities.filter((city, index, self) => 
            index === self.findIndex(c => c.nome === city.nome)
          ).sort((a, b) => a.nome.localeCompare(b.nome));
          
          setOptions(prev => ({
            ...prev,
            cities: uniqueCities
          }));
        } catch (error) {
          console.error('Erro ao carregar cidades:', error);
          setOptions(prev => ({ ...prev, cities: [] }));
        }
      } else {
        setOptions(prev => ({ ...prev, cities: [] }));
      }
    };

    if (statesLoaded) {
      loadCities();
    }
  }, [filters.ufs, statesLoaded]);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limpar timer de busca quando componente for desmontado
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

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

      // Se for UF, não limpar cidades selecionadas (serão filtradas automaticamente)
        if (filterType === 'ufs') {
          return {
            ...prev,
            [filterType]: newValues as string[]
          };
        }

      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const removeFilter = (filterType: keyof SearchFilters, value: string | number) => {
    setFilters(prev => {
      const newValues = (prev[filterType] as (string | number)[]).filter(v => v !== value);
      
      // Se for UF, remover também as cidades daquele estado que foi removido
      if (filterType === 'ufs') {
        // Se não há mais UFs selecionados, limpar todas as cidades
        if (newValues.length === 0) {
          return {
            ...prev,
            [filterType]: newValues as string[],
            cities: []
          };
        }
        
        // Se ainda há UFs, limpar cidades para forçar nova seleção baseada nos UFs restantes
        return {
          ...prev,
          [filterType]: newValues as string[],
          cities: [] // Simplificado: limpar todas as cidades quando qualquer UF for removido
        };
      }

      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const resetFilters = () => {
    // Limpar todos os filtros completamente
    const newFilters = {
      serviceTypes: [],
      operationAreas: [],
      specialties: [],
      fabricTypes: '',
      availabilities: [],
      cities: [],
      ufs: []
    };

    setFilters(newFilters);
    return newFilters; // Retornar os novos filtros para uso imediato
  };


  const toggleDropdown = (filterType: string) => {
    setOpenDropdowns(prev => {
      const newState = {
        ...prev,
        [filterType]: !prev[filterType]
      };
      
      // Se está fechando o dropdown, limpar o termo de busca
      if (prev[filterType]) {
        setSearchTerms(prevTerms => ({
          ...prevTerms,
          [filterType]: ''
        }));
      }
      
      return newState;
    });
  };

  const renderMultiSelect = (
    filterType: keyof SearchFilters,
    placeholder: string,
    options: Array<{ id: number; nome?: string; name: string }>,
    disabled: boolean = false
  ) => {
    const currentValues = filters[filterType] as (string | number)[];
    const isOpen = openDropdowns[filterType] || false;
    const displayName = (item: any) => {
      if (filterType === 'ufs') {
        return (item as any).code;
      }
      return item.nome || item.name;
    };
    const searchTerm = searchTerms[filterType] || '';

    // Filtrar opções que não estão selecionadas
    const availableOptions = options.filter(option => {
      if (filterType === 'ufs') {
        return !currentValues.includes((option as any).code);
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
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none cursor-pointer ${
            disabled 
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'border-gray-300 bg-white focus:ring-pink-500'
          }`}
          onClick={() => !disabled && toggleDropdown(filterType)}
        >
          <span className={currentValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
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
                    if (filterType === 'ufs') {
                      handleFilterChange(filterType, (option as any).code);
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

  const renderSelectedTags = (filterType: keyof SearchFilters) => {
    const values = filters[filterType] as (string | number)[];
    if (values.length === 0) return null;

    const getDisplayValue = (value: string | number) => {
      if (filterType === 'ufs') {
        const uf = options.ufs.find(u => (u as any).code === value);
        return uf ? (uf as any).code : value;
      } else if (filterType === 'cities') {
        return value;
      } else {
        // Para services, areas, specialties, availabilities - buscar pelo ID
        let optionList: any[] = [];
        if (filterType === 'serviceTypes') optionList = options.services;
        else if (filterType === 'operationAreas') optionList = options.serviceAreas;
        else if (filterType === 'specialties') optionList = options.specialties;
        else if (filterType === 'availabilities') optionList = options.availabilities;
        
        const option = optionList.find(o => o.id === value);
        return option ? (option.nome || option.name) : value;
      }
    };

    return (
      <div className="mt-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
    );
  };



  if (loading && !statesLoaded) {
    return (
      <div className="w-full py-8 flex justify-center items-center">
        <div className="text-gray-600">Carregando filtros...</div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Encontre o prestador ideal para a sua demanda
        </h1>
        <p className="text-gray-600">
          Use os filtros abaixo para localizar profissionais alinhados ao que você precisa. 
          A busca é feita com base na especialidade, região e disponibilidade.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Procurar (mínimo 3 caracteres)..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim().length >= 3) {
                searchProfessionals(searchTerm);
              }
            }}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        {/* Primeira linha: Tipo de Serviço, Área de Atuação, Especialidade, Tipo de Tecido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Tipo de Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço
            </label>
            {renderMultiSelect('serviceTypes', 'Selecione...', options.services, false)}
            {renderSelectedTags('serviceTypes')}
          </div>

          {/* Área de Atuação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Área de Atuação
            </label>
            {renderMultiSelect('operationAreas', 'Selecione...', options.serviceAreas, false)}
            {renderSelectedTags('operationAreas')}
          </div>

          {/* Especialidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidade
            </label>
            {renderMultiSelect('specialties', 'Selecione...', options.specialties, false)}
            {renderSelectedTags('specialties')}
          </div>

          {/* Tipo de Tecido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Tecido
            </label>
            <div className="flex gap-3">
              {[
                { id: 1, name: 'Plano' },
                { id: 2, name: 'Malha' },
                { id: 3, name: 'Ambos' }
              ].map((option) => (
                <label key={option.id} className="flex items-center p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="fabricTypes"
                    value={option.name}
                    checked={filters.fabricTypes === option.name}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        fabricTypes: e.target.value
                      }));
                    }}
                    className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-2 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{option.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Segunda linha: Disponibilidade, Estado, Cidade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Disponibilidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disponibilidade
            </label>
            {renderMultiSelect('availabilities', 'Selecione...', options.availabilities, false)}
            {renderSelectedTags('availabilities')}
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value=""
              onChange={(e) => {
                const value = e.target.value;
                if (value && !filters.ufs.includes(value)) {
                  setFilters(prev => ({
                    ...prev,
                    ufs: [...prev.ufs, value]
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Adicionar estado...</option>
              {BRAZILIAN_STATES.filter(state => !filters.ufs.includes(state.code)).map(state => (
                <option key={state.code} value={state.code}>
                  {state.code}
                </option>
              ))}
            </select>
            {renderSelectedTags('ufs')}
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade
            </label>
            <select
              value=""
              onChange={(e) => {
                const value = e.target.value;
                if (value && !filters.cities.includes(value)) {
                  setFilters(prev => ({
                    ...prev,
                    cities: [...prev.cities, value]
                  }));
                }
              }}
              disabled={filters.ufs.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {filters.ufs.length === 0 ? 'Primeiro selecione um estado' : 'Adicionar cidade...'}
              </option>
              {options.cities.filter(city => !filters.cities.includes(city.nome)).map(city => (
                <option key={city.id} value={city.nome}>
                  {city.nome}
                </option>
              ))}
            </select>
            {renderSelectedTags('cities')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={async () => {
            setIsResettingFilters(true);
            
            try {
              // Resetar filtros e obter os novos filtros
              const newFilters = resetFilters();
              
              // Limpar o campo de pesquisa também
              setSearchTerm('');
              setLastSearchTerm('');
              
              // Executar busca imediatamente com os novos filtros (sem aguardar estado)
              await searchProfessionals('', newFilters);
            } finally {
              setIsResettingFilters(false);
            }
          }}
          disabled={isResettingFilters || searchLoading}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isResettingFilters ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
              Redefinindo...
            </>
          ) : (
            'Redefinir Filtros'
          )}
        </button>
        <button
          onClick={() => searchProfessionals()}
          disabled={searchLoading}
          className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {searchLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Buscando...
            </>
          ) : (
            'Buscar Prestadores'
          )}
        </button>
      </div>



      {professionals.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-normal text-gray-500 mb-4">Resultados encontrados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((professional, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col cursor-pointer"
                onClick={() => handleOpenProfileModal(professional)}
              >
                {/* Nome do Prestador */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{professional.full_name}</h4>
                
                {/* Avaliação */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <StarRating 
                      rating={professional.rating_avg || 0} 
                      size="sm"
                    />
                  </div>
                  {SHOW_RATING_BUTTON && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRatingModal(professional);
                      }}
                      className="text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors"
                    >
                      Avaliar
                    </button>
                  )}
                </div>
                
                {/* Serviços */}
                <div className="mb-6 h-8 flex items-center">
                  {professional.services.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full">
                      {professional.services.map((service, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 text-xs rounded-full bg-purple-200 text-purple-800 whitespace-nowrap flex-shrink-0"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </div>

                {/* Primeira Seção: Áreas, Especialidades, Tipo de Tecido */}
                <div className="mb-4 pb-4 border-b border-gray-200 space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <Target className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="font-medium text-gray-600 mr-1">Área:</span>
                    <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis flex-1" title={professional.areas.length > 0 ? professional.areas.join(', ') : '-'}>
                      {professional.areas.length > 0 ? professional.areas.join(', ') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Star className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="font-medium text-gray-600 mr-1">Especialidades:</span>
                    <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis flex-1" title={professional.specialties.length > 0 ? professional.specialties.join(', ') : '-'}>
                      {professional.specialties.length > 0 ? professional.specialties.join(', ') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Layers className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="font-medium text-gray-600 mr-1">Tecido:</span>
                    <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis flex-1" title={professional.tecid_type || '-'}>
                      {professional.tecid_type || '-'}
                    </span>
                  </div>
                </div>

                {/* Segunda Seção: Localização, Email, Disponibilidade */}
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.city && professional.uf ? `${professional.city} - ${professional.uf}` : '-'}>
                      {professional.city && professional.uf ? `${professional.city} - ${professional.uf}` : '-'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Mail className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.email || '-'}>
                      {professional.email || '-'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    {professional.availability ? (
                      <span className="inline-block px-3 py-1 text-xs rounded-full bg-green-200 text-green-800 whitespace-nowrap">
                        {professional.availability}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </div>
                </div>


                {/* Botões de Ação */}
                <div className="pt-6 mt-auto space-y-3">
                  {/* Botão Conversar - Primário */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Função será implementada depois
                      console.log('Conversar com:', professional.full_name);
                    }}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Conversar
                  </button>

                  {/* Botões Secundários */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Verificar se tem WhatsApp/telefone
                        const phone = professional.cellphone || professional.telephone;
                        if (phone) {
                          const cleanPhone = phone.replace(/\D/g, '');
                          const message = `Olá ${professional.full_name}! Vi seu perfil na VINKO e gostaria de conversar sobre um projeto.`;
                          const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        } else {
                          setSelectedProfessionalName(professional.full_name);
                          setShowNoPhoneModal(true);
                        }
                      }}
                      className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      WhatsApp
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfileModal(professional);
                      }}
                      className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver perfil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {professionals.length === 0 && searchMessage && !searchLoading && (
        <div className="mt-6 text-center text-gray-500">
          <p>Nenhum profissional encontrado com os filtros aplicados.</p>
        </div>
      )}

      {/* Modal de Avaliação */}
      {showRatingModal && selectedProfessional && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleCloseRatingModal}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.full_name}
          existingRating={existingRating}
          onRatingSubmit={handleRatingSubmit}
          onRatingDelete={handleRatingDelete}
        />
      )}

      {/* Modal de Avaliação a partir do perfil */}
      {showRatingFromProfile && selectedProfessional && (
        <RatingModal
          isOpen={showRatingFromProfile}
          onClose={handleCloseRatingFromProfile}
          professionalId={selectedProfessional.id}
          professionalName={selectedProfessional.full_name}
          existingRating={existingRating}
          onRatingSubmit={handleRatingSubmit}
          onRatingDelete={handleRatingDelete}
        />
      )}

      {/* Modal de Perfil do Profissional */}
      {showProfileModal && selectedProfileProfessional && (
        <ProfessionalProfileModal
          isOpen={showProfileModal}
          onClose={handleCloseProfileModal}
          professional={selectedProfileProfessional}
          onStartConversation={(professionalId) => {
            console.log('Iniciar conversa com profissional:', professionalId);
          }}
          onRateProfessional={handleRateFromProfile}
          showRatingModal={showRatingFromProfile}
          onCloseRatingModal={() => setShowRatingFromProfile(false)}
          onRatingSubmit={handleRatingSubmit}
          onRatingDelete={handleRatingDelete}
          refreshTrigger={profileRefreshTrigger}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Modal de Telefone Não Cadastrado */}
      {showNoPhoneModal && (
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
                O profissional <span className="font-medium">{selectedProfessionalName}</span> não possui telefone cadastrado para WhatsApp.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Você pode tentar entrar em contato através do botão "Conversar" ou aguardar até que o profissional atualize suas informações de contato.
              </p>
              <button
                onClick={() => setShowNoPhoneModal(false)}
                className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors font-medium"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
