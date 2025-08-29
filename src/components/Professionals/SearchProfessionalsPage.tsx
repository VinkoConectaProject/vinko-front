import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, X, Scissors, Shirt, Calendar, MapPin, Phone, Mail, Target, Star, Layers } from 'lucide-react';
import { userService } from '../../services/userService';

interface ServiceOption {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  areas?: ServiceOption[];
}

interface State {
  id: number;
  nome: string;
  sigla: string;
}

interface City {
  id: number;
  nome: string;
  estado: State;
}

interface SearchFilters {
  serviceTypes: number[];
  operationAreas: number[];
  specialties: number[];
  fabricTypes: string;
  availabilities: number[];
  cities: string[];
  states: string[];
}

interface Professional {
  full_name: string;
  services: string[];
  areas: string[];
  specialties: string[];
  tecid_type: string;
  availability: number;
  state: string;
  city: string;
  email: string;
}

interface SearchResponse {
  status: string;
  message: string;
  error: string;
  data: Professional[];
}

export function SearchProfessionalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    serviceTypes: [],
    operationAreas: [],
    specialties: [],
    fabricTypes: '',
    availabilities: [],
    cities: [],
    states: []
  });

  const [options, setOptions] = useState<{
    services: ServiceOption[];
    serviceAreas: ServiceOption[];
    specialties: ServiceOption[];
    availabilities: ServiceOption[];
    states: State[];
    cities: City[];
  }>({
    services: [],
    serviceAreas: [],
    specialties: [],
    availabilities: [],
    states: [],
    cities: []
  });

  const [loading, setLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  
  // Cache para estados e cidades
  const [citiesCache, setCitiesCache] = useState<Record<number, City[]>>({});
  const [statesLoaded, setStatesLoaded] = useState(false);

  // Estados para busca de profissionais
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // Função para buscar profissionais
  const searchProfessionals = async () => {
    try {
      setSearchLoading(true);
      setSearchMessage('');

      // Construir parâmetros da URL
      const params = new URLSearchParams();

      // Adicionar filtros apenas se tiverem valores
      if (filters.serviceTypes.length > 0) {
        params.append('services', filters.serviceTypes.join(','));
      }
      if (filters.operationAreas.length > 0) {
        params.append('areas', filters.operationAreas.join(','));
      }
      if (filters.specialties.length > 0) {
        params.append('specialties', filters.specialties.join(','));
      }
      if (filters.fabricTypes) {
        params.append('tecid_type', filters.fabricTypes);
      }
      if (filters.availabilities.length > 0) {
        params.append('availabilities', filters.availabilities.join(','));
      }
      if (filters.states.length > 0) {
        params.append('states', filters.states.join(','));
      }
      if (filters.cities.length > 0) {
        params.append('cities', filters.cities.join(','));
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`http://localhost:8000/api/v1/user/professionals/search/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: SearchResponse = await response.json();

      if (data.status === 'success') {
        setProfessionals(data.data);
        setSearchMessage(data.message);
      } else {
        setProfessionals([]);
        setSearchMessage(data.error || 'Erro ao buscar profissionais');
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setProfessionals([]);
      setSearchMessage('Erro ao conectar com o servidor');
    } finally {
      setSearchLoading(false);
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

  // Carregar estados do Brasil (apenas uma vez)
  useEffect(() => {
    const loadStates = async () => {
      // Verificar se já temos estados no localStorage
      const cachedStates = localStorage.getItem('vinko_states');
      if (cachedStates) {
        try {
          const statesData = JSON.parse(cachedStates);
          setOptions(prev => ({ ...prev, states: statesData }));
          setStatesLoaded(true);
          return;
        } catch (error) {
          console.error('Erro ao carregar estados do cache:', error);
        }
      }

      try {
        const statesResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const statesData: State[] = await statesResponse.json();
        const sortedStates = statesData.sort((a, b) => a.nome.localeCompare(b.nome));
        
        // Salvar no localStorage para cache
        localStorage.setItem('vinko_states', JSON.stringify(sortedStates));
        
        setOptions(prev => ({ ...prev, states: sortedStates }));
        setStatesLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
      }
    };

    if (!statesLoaded) {
      loadStates();
    }
  }, [statesLoaded]);

  // Carregar cidades quando um estado for selecionado
  useEffect(() => {
    const loadCities = async () => {
      if (filters.states.length > 0) {
        try {
          const stateIds = filters.states.map(stateName => {
            const state = options.states.find(s => s.nome === stateName);
            return state?.id;
          }).filter(Boolean);

          if (stateIds.length > 0) {
            const citiesToLoad: number[] = [];
            const citiesFromCache: City[] = [];

            // Verificar quais estados precisam carregar cidades
            stateIds.forEach(stateId => {
              if (citiesCache[stateId]) {
                citiesFromCache.push(...citiesCache[stateId]);
              } else {
                citiesToLoad.push(stateId);
              }
            });

            // Carregar cidades que não estão em cache
            if (citiesToLoad.length > 0) {
              const citiesPromises = citiesToLoad.map(async (stateId) => {
                const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
                const cities = await response.json();
                
                // Salvar no cache
                setCitiesCache(prev => ({
                  ...prev,
                  [stateId]: cities
                }));
                
                return cities;
              });

              const newCitiesArrays = await Promise.all(citiesPromises);
              const allNewCities = citiesFromCache.concat(newCitiesArrays.flat());
              const sortedCities = allNewCities.sort((a: City, b: City) => a.nome.localeCompare(b.nome));
              
              setOptions(prev => ({
                ...prev,
                cities: sortedCities
              }));
            } else {
              // Todas as cidades já estão em cache
              const sortedCities = citiesFromCache.sort((a: City, b: City) => a.nome.localeCompare(b.nome));
              setOptions(prev => ({
                ...prev,
                cities: sortedCities
              }));
            }
          }
        } catch (error) {
          console.error('Erro ao carregar cidades:', error);
        }
      } else {
        setOptions(prev => ({ ...prev, cities: [] }));
      }
    };

    if (statesLoaded) {
      loadCities();
    }
  }, [filters.states, options.states, citiesCache, statesLoaded]);

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

      // Se for estado, não limpar cidades selecionadas (serão filtradas automaticamente)
      if (filterType === 'states') {
        return {
          ...prev,
          [filterType]: newValues
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
      
      // Se for estado, remover apenas as cidades daquele estado
      if (filterType === 'states') {
        const removedState = options.states.find(s => s.nome === value);
        if (removedState) {
          const citiesToRemove = citiesCache[removedState.id] || [];
          const citiesToRemoveNames = citiesToRemove.map(city => city.nome);
          
          const remainingCities = (prev.cities as string[]).filter(cityName => 
            !citiesToRemoveNames.includes(cityName)
          );
          
          return {
            ...prev,
            [filterType]: newValues,
            cities: remainingCities
          };
        }
      }

      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      serviceTypes: [],
      operationAreas: [],
      specialties: [],
      fabricTypes: '',
      availabilities: [],
      cities: [],
      states: []
    });
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
    const displayName = (item: any) => item.nome || item.name;
    const searchTerm = searchTerms[filterType] || '';

    // Filtrar opções que não estão selecionadas
    const availableOptions = options.filter(option => {
      if (filterType === 'states' || filterType === 'cities') {
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
                    if (filterType === 'states' || filterType === 'cities') {
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
      if (filterType === 'states') {
        const state = options.states.find(s => s.nome === value);
        return state ? state.nome : value;
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
            placeholder="Procurar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchProfessionals();
              }
            }}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
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
            {renderMultiSelect('states', 'Selecione...', options.states, false)}
            {renderSelectedTags('states')}
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade
            </label>
            {filters.states.length === 0 ? (
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
                Selecione um estado primeiro
              </div>
            ) : (
              renderMultiSelect('cities', 'Selecione...', options.cities, false)
            )}
            {renderSelectedTags('cities')}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={resetFilters}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Redefinir Filtros
        </button>
        <button
          onClick={searchProfessionals}
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
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                {/* Nome do Prestador */}
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{professional.full_name}</h4>
                
                {/* Serviços */}
                <p className="text-sm text-gray-700 mb-6 whitespace-nowrap overflow-hidden text-ellipsis" title={professional.services.length > 0 ? professional.services.join(', ') : '-'}>
                  {professional.services.length > 0 ? professional.services.join(', ') : '-'}
                </p>

                {/* Primeira Seção: Áreas, Especialidades, Tipo de Tecido */}
                <div className="mb-4 pb-4 border-b border-gray-200 space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <Target className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.areas.length > 0 ? professional.areas.join(', ') : '-'}>
                      {professional.areas.length > 0 ? professional.areas.join(', ') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Star className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.specialties.length > 0 ? professional.specialties.join(', ') : '-'}>
                      {professional.specialties.length > 0 ? professional.specialties.join(', ') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Layers className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.tecid_type || '-'}>
                      {professional.tecid_type || '-'}
                    </span>
                  </div>
                </div>

                {/* Segunda Seção: Localização, Email, Disponibilidade */}
                <div className="space-y-3 flex-grow">
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.city && professional.state ? `${professional.city} - ${professional.state}` : '-'}>
                      {professional.city && professional.state ? `${professional.city} - ${professional.state}` : '-'}
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
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis" title={professional.availability || '-'}>
                      {professional.availability || '-'}
                    </span>
                  </div>
                </div>

                {/* Botão de Contato */}
                <div className="pt-6 mt-auto">
                  <a 
                    href={`mailto:${professional.email}`}
                    className="w-full bg-pink-500 text-white text-center py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium block"
                  >
                    Entrar em contato
                  </a>
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
    </div>
  );
}
