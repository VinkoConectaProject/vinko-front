import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

import { userService } from '../../services/userService';

type TabType = 'personal' | 'commercial' | 'interests';

interface ServiceOption {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  areas?: ServiceOption[];
}

interface FormData {
  // Dados Pessoais
  fullName: string;
  cpf: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Dados Comerciais
  companySize: string;
  cnpj: string;
  corporateName: string;
  tradeName: string;
  commercialCep: string;
  commercialAddress: string;
  commercialNumber: string;
  commercialComplement: string;
  commercialNeighborhood: string;
  commercialCity: string;
  commercialState: string;
  commercialEmail: string;
  
  // Interesses
  serviceTypes: string[];
  operationAreas: string[];
  specialties: string[];
  machinery: string[];
  fabricTypes: string;
  experienceYears: string;
  dailyProductionCapacity: string;
  minProductionQuantity: string;
  maxProductionQuantity: string;
  availabilityStart: string;
}

export function ProfessionalProfileForm() {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<{
    services: ServiceOption[];
    serviceAreas: ServiceOption[];
    specialties: ServiceOption[];
    machines: ServiceOption[];
    availabilities: ServiceOption[];
  }>({
    services: [],
    serviceAreas: [],
    specialties: [],
    machines: [],
    availabilities: [],
  });

  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Estados para opções filtradas
  const [filteredServices, setFilteredServices] = useState<ServiceOption[]>([]);
  const [filteredServiceAreas, setFilteredServiceAreas] = useState<ServiceOption[]>([]);

  const [formData, setFormData] = useState<FormData>({
    // Dados Pessoais
    fullName: '',
    cpf: '',
    phone: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    
    // Dados Comerciais
    companySize: '',
    cnpj: '',
    corporateName: '',
    tradeName: '',
    commercialCep: '',
    commercialAddress: '',
    commercialNumber: '',
    commercialComplement: '',
    commercialNeighborhood: '',
    commercialCity: '',
    commercialState: '',
    commercialEmail: '',
    
    // Interesses
    serviceTypes: [],
    operationAreas: [],
    specialties: [],
    machinery: [],
    fabricTypes: '',
    experienceYears: '',
    dailyProductionCapacity: '',
    minProductionQuantity: '',
    maxProductionQuantity: '',
    availabilityStart: '',
  });

  // Funções de formatação
  const formatCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCep = (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const formatCnpj = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  // Carregar dados do usuário
  const loadUserData = async () => {
    try {
      console.log('loadUserData started');
      setLoading(true);
      const userId = state.djangoUser?.id;
      console.log('User ID:', userId);
      if (!userId) {
        console.log('No user ID, returning');
        return;
      }

      console.log('Calling getUserById...');
      const userData = await userService.getUserById(userId);
      console.log('User data received:', userData);
      console.log('User data fields:', {
        full_name: userData.full_name,
        cpf: userData.cpf,
        cellphone: userData.cellphone,
        email: userData.email,
        cep: userData.cep,
        street: userData.street,
        city: userData.city,
        state: userData.state
      });
      
      // Verificar todos os campos disponíveis
      console.log('Todos os campos disponíveis:', Object.keys(userData));
      console.log('Valores dos campos:', userData);
      
      console.log('Loading options...');
      // Carregar opções
      const [services, serviceAreas, specialties, machines, availabilities] = await Promise.all([
        userService.getServices(),
        userService.getServiceAreas(),
        userService.getSpecialties(),
        userService.getMachines(),
        userService.getAvailabilities(),
      ]);

      setOptions({
        services,
        serviceAreas,
        specialties,
        machines,
        availabilities,
      });

      // Inicializar opções filtradas
      setFilteredServices(services);
      setFilteredServiceAreas(serviceAreas);

      console.log('Mapping user data to form...');
      
      // Definir data de última atualização
      if (userData.updated_at) {
        setLastUpdated(formatDate(userData.updated_at));
      }
      
      // Mapear dados da API para o formulário
      setFormData({
        // Dados Pessoais
        fullName: userData.full_name || '',
        cpf: formatCpf(userData.cpf || ''),
        phone: formatPhone(userData.cellphone || ''),
        email: userData.email || '',
        cep: formatCep(userData.postal_code || ''),
        address: userData.street || '',
        number: userData.number || '',
        complement: userData.complement || '',
        neighborhood: userData.neighborhood || '',
        city: userData.city || '',
        state: userData.state || '',
        
        // Dados Comerciais
        companySize: userData.company_size || '',
        cnpj: formatCnpj(userData.cnpj || ''),
        corporateName: userData.corporate_name || '',
        tradeName: userData.trade_name || '',
        commercialCep: formatCep(userData.company_cep || ''),
        commercialAddress: userData.company_street || '',
        commercialNumber: userData.company_number || '',
        commercialComplement: userData.company_complement || '',
        commercialNeighborhood: userData.company_neighborhood || '',
        commercialCity: userData.company_city || '',
        commercialState: userData.company_state || '',
        commercialEmail: userData.company_email || '',
        
        // Interesses
        serviceTypes: [],
        operationAreas: [],
        specialties: [],
        machinery: [],
        fabricTypes: userData.tecid_type || '',
        experienceYears: userData.year_experience || '',
        dailyProductionCapacity: userData.daily_production_capacity || '',
        minProductionQuantity: userData.min_required_production || '',
        maxProductionQuantity: userData.max_required_production || '',
        availabilityStart: '',
      });

      // Carregar dados das listas (IDs para nomes)
      if (userData.services && userData.services.length > 0) {
        const serviceNames = await Promise.all(
          userData.services.map(async (serviceId: number) => {
            try {
              const service = await userService.getServiceById(serviceId);
              return service.name;
            } catch {
              return `Serviço ${serviceId}`;
            }
          })
        );
        setFormData(prev => ({ ...prev, serviceTypes: serviceNames }));
      }

      if (userData.services_areas && userData.services_areas.length > 0) {
        const areaNames = await Promise.all(
          userData.services_areas.map(async (areaId: number) => {
            try {
              const area = await userService.getServiceAreaById(areaId);
              return area.name;
            } catch {
              return `Área ${areaId}`;
            }
          })
        );
        setFormData(prev => ({ ...prev, operationAreas: areaNames }));
      }

      if (userData.specialties && userData.specialties.length > 0) {
        const specialtyNames = await Promise.all(
          userData.specialties.map(async (specialtyId: number) => {
            try {
              const specialty = await userService.getSpecialtyById(specialtyId);
              return specialty.name;
            } catch {
              return `Especialidade ${specialtyId}`;
            }
          })
        );
        setFormData(prev => ({ ...prev, specialties: specialtyNames }));
      }

      if (userData.machines && userData.machines.length > 0) {
        const machineNames = await Promise.all(
          userData.machines.map(async (machineId: number) => {
            try {
              const machine = await userService.getMachineById(machineId);
              return machine.name;
            } catch {
              return `Maquinário ${machineId}`;
            }
          })
        );
        setFormData(prev => ({ ...prev, machinery: machineNames }));
      }

      if (userData.availability) {
        try {
          const availabilityId = typeof userData.availability === 'string' ? parseInt(userData.availability) : userData.availability;
          if (!isNaN(availabilityId)) {
            const availability = await userService.getAvailabilityById(availabilityId);
            setFormData(prev => ({ ...prev, availabilityStart: availability.name }));
          }
        } catch {
          setFormData(prev => ({ ...prev, availabilityStart: '' }));
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      
      let errorMessage = 'Erro ao carregar dados do usuário.';
      
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'Rota da API não encontrada. Verifique se o backend está rodando.';
        } else if (error.message.includes('Unexpected token')) {
          errorMessage = 'Resposta inválida da API. Verifique se o backend está funcionando.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered, state.djangoUser:', state.djangoUser);
    if (state.djangoUser?.id) {
      console.log('Loading user data for ID:', state.djangoUser.id);
      loadUserData();
    } else {
      console.log('No user ID found, setting loading to false');
      setLoading(false);
    }
  }, [state.djangoUser?.id]);

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Aplicar filtros quando serviços ou áreas são alterados
      if (field === 'serviceTypes') {
        filterServiceAreas(value as string[]);
        // Limpar áreas inválidas quando serviços são alterados
        const { cleanedAreas } = cleanInvalidSelections(value as string[], newData.operationAreas);
        newData.operationAreas = cleanedAreas;
        // Atualizar lista de serviços baseado nas áreas restantes
        filterServices(newData.operationAreas);
      } else if (field === 'operationAreas') {
        filterServices(value as string[]);
      }

      return newData;
    });
  };

  const handleTagRemove = (field: keyof FormData, tagToRemove: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: (prev[field] as string[]).filter(tag => tag !== tagToRemove)
      };

      // Aplicar filtros quando tags são removidas
      if (field === 'serviceTypes') {
        filterServiceAreas(newData.serviceTypes);
        // Limpar áreas inválidas quando serviços são removidos
        const { cleanedAreas } = cleanInvalidSelections(newData.serviceTypes, newData.operationAreas);
        newData.operationAreas = cleanedAreas;
        // Atualizar lista de serviços baseado nas áreas restantes
        filterServices(newData.operationAreas);
      } else if (field === 'operationAreas') {
        filterServices(newData.operationAreas);
      }

      return newData;
    });
  };

  // Funções para filtrar opções baseado nas seleções
  const filterServiceAreas = (selectedServices: string[]) => {
    if (selectedServices.length === 0) {
      // Se nenhum serviço selecionado, mostrar todas as áreas
      setFilteredServiceAreas(options.serviceAreas);
    } else {
      // Filtrar áreas que pertencem aos serviços selecionados
      const areasFromSelectedServices = options.services
        .filter(service => selectedServices.includes(service.name))
        .flatMap(service => service.areas || []);
      
      // Remover duplicatas baseado no ID
      const uniqueAreas = areasFromSelectedServices.filter((area, index, self) => 
        index === self.findIndex(a => a.id === area.id)
      );
      
      setFilteredServiceAreas(uniqueAreas);
    }
  };

  const filterServices = (selectedAreas: string[]) => {
    if (selectedAreas.length === 0) {
      // Se nenhuma área selecionada, mostrar todos os serviços
      setFilteredServices(options.services);
    } else {
      // Filtrar serviços que têm as áreas selecionadas
      const servicesWithSelectedAreas = options.services.filter(service => 
        service.areas?.some(area => selectedAreas.includes(area.name))
      );
      
      setFilteredServices(servicesWithSelectedAreas);
    }
  };

  // Função para limpar seleções inválidas
  const cleanInvalidSelections = (selectedServices: string[], selectedAreas: string[]) => {
    // Limpar áreas que não pertencem mais aos serviços selecionados
    const validAreas = selectedServices.length === 0 
      ? [] 
      : options.services
          .filter(service => selectedServices.includes(service.name))
          .flatMap(service => service.areas || [])
          .map(area => area.name);
    
    const cleanedAreas = selectedAreas.filter(area => 
      validAreas.length === 0 || validAreas.includes(area)
    );
    
    return { cleanedAreas };
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      
      return date.toLocaleDateString('pt-BR', options);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  // Funções de máscara
  const applyPhoneMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const applyCepMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const applyCpfMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const applyCnpjMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const handleMaskedInputChange = (field: keyof FormData, value: string, maskType: 'phone' | 'cep' | 'cpf' | 'cnpj') => {
    let maskedValue = value;
    
    switch (maskType) {
      case 'phone':
        maskedValue = applyPhoneMask(value);
        break;
      case 'cep':
        maskedValue = applyCepMask(value);
        break;
      case 'cpf':
        maskedValue = applyCpfMask(value);
        break;
      case 'cnpj':
        maskedValue = applyCnpjMask(value);
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: maskedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const userId = state.djangoUser?.id;
      if (!userId) return;

      // Preparar dados para enviar à API
      const updateData = {
        full_name: formData.fullName,
        cpf: formData.cpf.replace(/\D/g, ''),
        cellphone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        postal_code: formData.cep.replace(/\D/g, ''),
        street: formData.address,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        company_size: formData.companySize,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        corporate_name: formData.corporateName,
        trade_name: formData.tradeName,
        company_cep: formData.commercialCep.replace(/\D/g, ''),
        company_street: formData.commercialAddress,
        company_number: formData.commercialNumber,
        company_complement: formData.commercialComplement,
        company_neighborhood: formData.commercialNeighborhood,
        company_city: formData.commercialCity,
        company_state: formData.commercialState,
        company_email: formData.commercialEmail,
        tecid_type: formData.fabricTypes,
        year_experience: formData.experienceYears,
        daily_production_capacity: formData.dailyProductionCapacity,
        min_required_production: formData.minProductionQuantity,
        max_required_production: formData.maxProductionQuantity,
        // TODO: Implementar mapeamento de IDs para services, services_areas, specialties, machines, availability
      };

      await userService.updateUserById(userId, updateData);
      alert('Perfil salvo com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const renderTag = (tag: string, field: keyof FormData) => (
    <div key={tag} className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm mr-2 mb-2">
      {tag}
      <button
        type="button"
        onClick={() => handleTagRemove(field, tag)}
        className="ml-2 text-gray-500 hover:text-gray-700"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );

  const renderSelectField = (field: keyof FormData, placeholder: string, options: string[]) => (
    <div className="relative">
      <select
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
        onChange={(e) => {
          if (e.target.value) {
            const currentValues = formData[field] as string[];
            if (!currentValues.includes(e.target.value)) {
              handleInputChange(field, [...currentValues, e.target.value]);
            }
          }
        }}
        value=""
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  if (!state.djangoUser) {
    return (
      <div className="w-full py-8 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Usuário não autenticado</div>
          <div className="text-gray-600">Faça login para acessar seu perfil</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full py-8 flex justify-center items-center">
        <div className="text-gray-600">Carregando dados do perfil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">Erro ao carregar perfil</div>
          <div className="text-gray-600">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              loadUserData();
            }}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.fullName || state.djangoUser?.full_name || 'Usuário'} - Prestador de Serviços</h1>
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          {lastUpdated ? `Última atualização em ${lastUpdated}` : 'Carregando...'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        {[
          { id: 'personal', label: 'Dados Pessoais' },
          { id: 'commercial', label: 'Dados Comerciais' },
          { id: 'interests', label: 'Interesses' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-pink-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Dados Pessoais Tab */}
        {activeTab === 'personal' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Dados do Administrador</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => handleMaskedInputChange('cpf', e.target.value, 'cpf')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="000.000.000-00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleMaskedInputChange('phone', e.target.value, 'phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleMaskedInputChange('cep', e.target.value, 'cep')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="00000-000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
              <input
                type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dados Comerciais Tab */}
        {activeTab === 'commercial' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Dados da Empresa</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Porte da empresa: <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['MEI', 'LTDA', 'ME', 'CPF'].map((size) => (
                  <label key={size} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="companySize"
                      value={size}
                      checked={formData.companySize === size}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    {size}
            </label>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleMaskedInputChange('cnpj', e.target.value, 'cnpj')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
          </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Razão Social</label>
                <input
                  type="text"
                  value={formData.corporateName}
                  onChange={(e) => handleInputChange('corporateName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome Fantasia</label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => handleInputChange('tradeName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <input
                  type="text"
                  value={formData.commercialCep}
                  onChange={(e) => handleMaskedInputChange('commercialCep', e.target.value, 'cep')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="00000-000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                <input
                  type="text"
                  value={formData.commercialAddress}
                  onChange={(e) => handleInputChange('commercialAddress', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input
                  type="text"
                  value={formData.commercialNumber}
                  onChange={(e) => handleInputChange('commercialNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.commercialComplement}
                  onChange={(e) => handleInputChange('commercialComplement', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                <input
                  type="text"
                  value={formData.commercialNeighborhood}
                  onChange={(e) => handleInputChange('commercialNeighborhood', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <input
                  type="text"
                  value={formData.commercialCity}
                  onChange={(e) => handleInputChange('commercialCity', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <input
                type="text"
                  value={formData.commercialState}
                  onChange={(e) => handleInputChange('commercialState', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail comercial</label>
                <input
                  type="email"
                  value={formData.commercialEmail}
                  onChange={(e) => handleInputChange('commercialEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              </div>
            </div>
          </div>
        )}

        {/* Interesses Tab */}
        {activeTab === 'interests' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Especialidades</h2>
            <p className="text-gray-600 mb-6">Selecione uma opção ou mais!</p>
            
            <div className="space-y-6">
              {/* Primeira linha: Tipo de Serviço e Área de Atuação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Serviço</label>
                  {renderSelectField('serviceTypes', 'Selecione o tipo de serviço', filteredServices.map(s => s.name))}
                  <div className="mt-2">
                    {formData.serviceTypes.map(tag => renderTag(tag, 'serviceTypes'))}
          </div>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área de Atuação</label>
                  {renderSelectField('operationAreas', 'Selecione a área de atuação', filteredServiceAreas.map(s => s.name))}
                  <div className="mt-2">
                    {formData.operationAreas.map(tag => renderTag(tag, 'operationAreas'))}
                  </div>
                </div>
              </div>
              
              {/* Segunda linha: Especialidade e Maquinário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                  {renderSelectField('specialties', 'Selecione a especialidade', options.specialties.map(s => s.name))}
                  <div className="mt-2">
                    {formData.specialties.map(tag => renderTag(tag, 'specialties'))}
          </div>
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maquinário</label>
                  {renderSelectField('machinery', 'Selecione o maquinário', options.machines.map(s => s.name))}
                  <div className="mt-2">
                    {formData.machinery.map(tag => renderTag(tag, 'machinery'))}
                  </div>
                </div>
              </div>
              
              {/* Terceira linha: Tipo de Tecido (linha única) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Tecido</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Plano', 'Malha', 'Ambos'].map((type) => (
                    <label key={type} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="fabricTypes"
                        value={type}
                        checked={formData.fabricTypes === type}
                        onChange={(e) => handleInputChange('fabricTypes', e.target.value)}
                        className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                      />
                      {type}
              </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anos de Experiência</label>
              <input
                  type="text"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacidade de produção diária</label>
              <input
                  type="text"
                  value={formData.dailyProductionCapacity}
                  onChange={(e) => handleInputChange('dailyProductionCapacity', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade de produção requerida</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mínima</label>
                  <input
                    type="text"
                    value={formData.minProductionQuantity}
                    onChange={(e) => handleInputChange('minProductionQuantity', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Máxima</label>
              <input
                    type="text"
                    value={formData.maxProductionQuantity}
                    onChange={(e) => handleInputChange('maxProductionQuantity', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Disponibilidade para Início:</label>
          <div className="space-y-3">
                {options.availabilities.map((option) => (
                  <label key={option.id} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                      name="availabilityStart"
                      value={option.name}
                      checked={formData.availabilityStart === option.name}
                      onChange={(e) => handleInputChange('availabilityStart', e.target.value)}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    {option.name}
              </label>
            ))}
          </div>
        </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}