import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Mail } from 'lucide-react';
import { userService } from '../../../services/userService';
import { LocationService } from '../../../services/locationService';

interface CTASectionProps {
  onNavigateToAuth: (mode: 'login' | 'register' | 'forgot') => void;
}

export function CTASection({ onNavigateToAuth }: CTASectionProps) {
  const [activeTab, setActiveTab] = useState('cliente');
  
  // Estados para dados dos filtros
  const [services, setServices] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para filtros selecionados
  const [selectedService, setSelectedService] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para clientes
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Função para buscar clientes
  const searchClients = async () => {
    try {
      setIsLoadingClients(true);
      
      const searchParams: any = {};
      
      if (activeTab === 'cliente') {
        // Para Cliente/Marca: especialidade, estado, cidade, busca
        if (selectedSpecialty) searchParams.specialty_id = selectedSpecialty;
        if (selectedState) searchParams.uf = selectedState;
        if (selectedCity) searchParams.city = selectedCity;
        if (searchTerm.trim()) searchParams.search = searchTerm.trim();
      }
      
      const clientsData = await userService.searchClients(searchParams);
      setClients(clientsData);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Carregar clientes inicialmente
  useEffect(() => {
    searchClients();
  }, [activeTab]);

  // Carregar clientes quando filtros mudarem
  useEffect(() => {
    if (activeTab === 'cliente') {
      searchClients();
    }
  }, [selectedSpecialty, selectedState, selectedCity, searchTerm, activeTab]);

  // Carregar dados dos filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        setIsLoading(true);
        
        // Carregar serviços, áreas e especialidades
        const [servicesData, areasData, specialtiesData] = await Promise.all([
          userService.getServices(),
          userService.getServiceAreas(),
          userService.getSpecialties()
        ]);
        
        setServices(servicesData);
        setAreas(areasData);
        setSpecialties(specialtiesData);
        
        // Carregar estados
        const statesData = await LocationService.getStates();
        setStates(statesData);
        
      } catch (error) {
        console.error('Erro ao carregar dados dos filtros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilterData();
  }, []);

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    const loadCities = async () => {
      if (selectedState) {
        try {
          const citiesData = await LocationService.getCitiesByState(selectedState);
          setCities(citiesData);
        } catch (error) {
          console.error('Erro ao carregar cidades:', error);
        }
      } else {
        setCities([]);
      }
    };

    loadCities();
  }, [selectedState]);

  // Carregar áreas quando serviço for selecionado (apenas para prestador)
  useEffect(() => {
    const loadAreasByService = () => {
      if (selectedService && activeTab === 'prestador') {
        try {
          // Buscar áreas do serviço selecionado
          const selectedServiceData = services.find(service => service.id === parseInt(selectedService));
          if (selectedServiceData && selectedServiceData.areas) {
            setAreas(selectedServiceData.areas);
          } else {
            // Se não há áreas específicas do serviço, usar todas as áreas
            setAreas(areas);
          }
        } catch (error) {
          console.error('Erro ao carregar áreas do serviço:', error);
        }
      } else if (activeTab === 'prestador') {
        // Se não há serviço selecionado, mostrar todas as áreas
        setAreas(areas);
      }
    };

    loadAreasByService();
  }, [selectedService, activeTab, services]);

  // Carregar especialidades quando área for selecionada (apenas para prestador)
  useEffect(() => {
    const loadSpecialtiesByArea = () => {
      if (selectedArea && activeTab === 'prestador') {
        try {
          // Buscar especialidades da área selecionada
          const selectedAreaData = areas.find(area => area.id === parseInt(selectedArea));
          if (selectedAreaData && selectedAreaData.areas) {
            setSpecialties(selectedAreaData.areas);
          } else {
            // Se não há especialidades específicas da área, usar todas as especialidades
            setSpecialties(specialties);
          }
        } catch (error) {
          console.error('Erro ao carregar especialidades da área:', error);
        }
      } else if (activeTab === 'prestador') {
        // Se não há área selecionada, mostrar todas as especialidades
        setSpecialties(specialties);
      }
    };

    loadSpecialtiesByArea();
  }, [selectedArea, activeTab, areas]);

  // Limpar filtros quando trocar de aba
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Limpar todos os filtros
    setSelectedService('');
    setSelectedArea('');
    setSelectedSpecialty('');
    setSelectedState('');
    setSelectedCity('');
    setSearchTerm('');
    setCities([]);
  };

  const handleRegister = () => {
    onNavigateToAuth('register');
  };

  // Função para formatar campos vazios
  const formatField = (value: string | null | undefined, fallback: string) => {
    if (!value || value.trim() === '') {
      return fallback;
    }
    return value;
  };

  return (
    <section id="oportunidades" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-pink-500 font-medium mb-4">Oportunidades</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Experimente a VINKO na prática
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Veja como funciona a plataforma, seja você uma marca em busca de parceiros ou um
            prestador pronto para novos trabalhos. Navegue e entenda a experiência de cada perfil.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => handleTabChange('prestador')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'prestador'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Prestador de Serviços
            </button>
            <button
              onClick={() => handleTabChange('cliente')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'cliente'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cliente/Marca
            </button>
          </div>
        </div>

        {/* Plano PRO Badge */}
        <div className="flex justify-end mb-6">
          <div className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center">
            <span className="mr-2">✓</span>
            <span className="font-medium">Plano PRO</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Procurar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {activeTab === 'prestador' ? (
            // Filtros para Prestador de Serviços
            <>
              <select 
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setSelectedArea(''); // Limpar área quando serviço mudar
                  setSelectedSpecialty(''); // Limpar especialidade quando serviço mudar
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                <option value="">Tipo de Serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedArea}
                onChange={(e) => {
                  setSelectedArea(e.target.value);
                  setSelectedSpecialty(''); // Limpar especialidade quando área mudar
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading || !selectedService}
              >
                <option value="">Área de Atuação</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading || !selectedArea}
              >
                <option value="">Especialidade</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            // Filtros para Cliente/Marca
            <>
              <select 
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                <option value="">Especialidade</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
              <select 
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity(''); // Limpar cidade quando estado mudar
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading}
              >
                <option value="">Estado</option>
                {states.map((state) => (
                  <option key={state.id} value={state.sigla}>
                    {state.nome}
                  </option>
                ))}
              </select>
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={isLoading || !selectedState}
              >
                <option value="">Cidade</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.nome}>
                    {city.nome}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Cards Dinâmicos */}
        {activeTab === 'cliente' ? (
          // Cards de Clientes/Marca
          <div className="overflow-x-auto">
            <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
              {isLoadingClients ? (
                <div className="flex items-center justify-center w-full py-12">
                  <div className="text-gray-500">Carregando clientes...</div>
                </div>
              ) : clients.length > 0 ? (
                clients.map((client) => (
                  <div key={client.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow min-w-[320px] flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {formatField(client.nome, 'Nome não informado')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {formatField(client.razao_social, 'Razão social não informada')}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-pink-500 rounded"></div>
                        </div>
                        <span>{formatField(client.especialidade, 'Especialidade não informada')}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-3 text-pink-500" />
                        <span>
                          {formatField(client.cidade, 'Cidade não informada')} – {formatField(client.estado, 'Estado não informado')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-4 h-4 mr-3 bg-blue-100 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-500 rounded"></div>
                        </div>
                        <span>{client.total_demandas} demanda{client.total_demandas !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-4 h-4 mr-3 bg-green-100 rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded"></div>
                        </div>
                        <span>{client.trabalhos_concluidos} trabalho{client.trabalhos_concluidos !== 1 ? 's' : ''} concluído{client.trabalhos_concluidos !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleRegister}
                      className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium"
                    >
                      Entrar em contato
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full py-12">
                  <div className="text-gray-500">Nenhum cliente encontrado com os filtros selecionados.</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Cards de Prestadores (mantém o layout original)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nome do Prestador de Serviço
                </h3>
                <p className="text-gray-600 mb-4">Tipo de Serviço</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-pink-500 rounded"></div>
                    </div>
                    <span>Confecção sob medida</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-pink-500 rounded"></div>
                    </div>
                    <span>Moda Feminina</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-4 h-4 mr-3 bg-pink-100 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-pink-500 rounded"></div>
                    </div>
                    <span>Vestidos de festa</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-3 text-pink-500" />
                    <span>Belo Horizonte – MG</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-3 text-pink-500" />
                    <span>(31) 9 9999-9999</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-3 text-pink-500" />
                    <span>contato@profissional.com</span>
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  className="w-full bg-pink-500 text-white py-3 rounded-lg hover:bg-pink-600 transition-colors font-medium"
                >
                  Entrar em contato
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button
            onClick={handleRegister}
            className="bg-pink-500 text-white px-8 py-4 rounded-lg hover:bg-pink-600 transition-colors font-semibold text-lg"
          >
            Quero me cadastrar agora
          </button>
        </div>
      </div>
    </section>
  );
}