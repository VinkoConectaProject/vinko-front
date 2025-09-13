import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Toast } from '../UI/Toast';

import { userService } from '../../services/userService';
import { BRAZILIAN_STATES } from '../../data/locations';
import { LocationService } from '../../services/locationService';

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
  birthDate: string;
  cpf: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  uf: string;
  
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
  commercialUf: string;
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

  // Estados para cidades
  const [cities, setCities] = useState<{ [key: string]: { id: number; nome: string }[] }>({
    personal: [],
    commercial: [],
  });
  const [loadingCities, setLoadingCities] = useState<{ [key: string]: boolean }>({
    personal: false,
    commercial: false,
  });

  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Estados para opções filtradas
  const [filteredServices, setFilteredServices] = useState<ServiceOption[]>([]);
  const [filteredServiceAreas, setFilteredServiceAreas] = useState<ServiceOption[]>([]);

  // Estado para controlar dropdowns abertos
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Estados para validação e controle
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Estados para toast
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

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

  const [formData, setFormData] = useState<FormData>({
    // Dados Pessoais
    fullName: '',
    birthDate: '',
    cpf: '',
      phone: '',
      email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    uf: '',
    
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
    commercialUf: '',
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
      setLoading(true);
      const userId = state.djangoUser?.id;
      if (!userId) {
        return;
      }

      const userData = await userService.getUserById();
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
      
      // Aplicar filtros será feito após carregar todos os dados


      
      // Definir data de última atualização
      if (userData.updated_at) {
        setLastUpdated(formatDate(userData.updated_at));
      }
      
      // Mapear dados da API para o formulário
      const newFormData = {
        // Dados Pessoais
        fullName: userData.full_name || '',
        birthDate: userData.birth_date || '',
        cpf: formatCpf(userData.cpf || ''),
        phone: formatPhone(userData.cellphone || ''),
        email: userData.email || '',
        cep: formatCep(userData.postal_code || ''),
        address: userData.street || '',
        number: userData.number || '',
        complement: userData.complement || '',
        neighborhood: userData.neighborhood || '',
        city: userData.city || '',
        uf: userData.uf || '',
        
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
        commercialUf: userData.company_uf || '',
        commercialEmail: userData.company_email || '',
        
        // Interesses
        serviceTypes: [],
        operationAreas: [],
        specialties: [],
        machinery: [],
        fabricTypes: mapTecidTypeFromApi(userData.tecid_type),
        experienceYears: userData.year_experience || '',
        dailyProductionCapacity: userData.daily_production_capacity || '',
        minProductionQuantity: userData.min_required_production || '',
        maxProductionQuantity: userData.max_required_production || '',
        availabilityStart: '',
      };

      setFormData(newFormData);

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

      if (userData.areas && userData.areas.length > 0) {
        const areaNames = await Promise.all(
          userData.areas.map(async (areaId: number) => {
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

      // Carregar cidades se os estados já estiverem preenchidos
      if (newFormData.uf) {
        await loadCitiesByState(newFormData.uf, 'personal');
      }
      if (newFormData.commercialUf) {
        await loadCitiesByState(newFormData.commercialUf, 'commercial');
      }

      // Definir dados originais após carregar todos os dados
      setFormData(prev => {
        const finalData = {...prev};
        setOriginalFormData(finalData);
        
        // Aplicar filtros após carregar todos os dados usando as variáveis locais
        
        // Aplicar filtros usando as variáveis locais em vez do estado
        if (finalData.serviceTypes.length === 0) {
          setFilteredServiceAreas(serviceAreas);
        } else {
          const areasFromSelectedServices = services
            .filter(service => finalData.serviceTypes.includes(service.name))
            .flatMap(service => service.areas || []);
          
          const uniqueAreas = areasFromSelectedServices.filter((area, index, self) => 
            index === self.findIndex(a => a.id === area.id)
          );
          
          if (uniqueAreas.length === 0) {
            setFilteredServiceAreas(serviceAreas);
          } else {
            setFilteredServiceAreas(uniqueAreas);
          }
        }
        
        setFilteredServices(services);
        
        return finalData;
      });

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
    if (state.djangoUser?.id) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [state.djangoUser?.id]);

  // Função para carregar cidades baseado no estado selecionado
  const loadCitiesByState = async (stateCode: string, type: 'personal' | 'commercial') => {
    if (!stateCode) {
      setCities(prev => ({ ...prev, [type]: [] }));
      return;
    }

    setLoadingCities(prev => ({ ...prev, [type]: true }));
    
    try {
      const citiesData = await LocationService.getCitiesByState(stateCode);
      setCities(prev => ({ ...prev, [type]: citiesData }));
    } catch (error) {
      console.error(`Erro ao carregar cidades do estado ${stateCode}:`, error);
      setCities(prev => ({ ...prev, [type]: [] }));
    } finally {
      setLoadingCities(prev => ({ ...prev, [type]: false }));
    }
  };




  // Verificar mudanças no formulário
  useEffect(() => {
    if (originalFormData) {
      // Comparar cada campo individualmente para detectar mudanças
      const hasAnyChanges = Object.keys(formData).some(key => {
        const formValue = formData[key as keyof FormData];
        const originalValue = originalFormData[key as keyof FormData];
        
        // Para arrays, comparar conteúdo
        if (Array.isArray(formValue) && Array.isArray(originalValue)) {
          if (formValue.length !== originalValue.length) return true;
          return formValue.some((item, index) => item !== originalValue[index]);
        }
        
        // Para strings e outros tipos, comparação direta
        return formValue !== originalValue;
      });
      
      setHasChanges(hasAnyChanges);
    }
  }, [formData, originalFormData]);

  // Função para validar campos obrigatórios
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validações obrigatórias sempre
    if (!formData.fullName.trim()) {
      errors.fullName = 'Campo obrigatório';
    }

    if (!formData.birthDate.trim()) {
      errors.birthDate = 'Campo obrigatório';
    }

    if (!formData.cpf.trim()) {
      errors.cpf = 'Campo obrigatório';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      errors.cpf = 'CPF deve ter 11 dígitos';
    } else if (!validateCpf(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Campo obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (!formData.experienceYears || String(formData.experienceYears).trim() === '') {
      errors.experienceYears = 'Campo obrigatório';
    }

    if (!formData.dailyProductionCapacity || String(formData.dailyProductionCapacity).trim() === '') {
      errors.dailyProductionCapacity = 'Campo obrigatório';
    }

    if (!formData.minProductionQuantity || String(formData.minProductionQuantity).trim() === '') {
      errors.minProductionQuantity = 'Campo obrigatório';
    }

    if (!formData.maxProductionQuantity || String(formData.maxProductionQuantity).trim() === '') {
      errors.maxProductionQuantity = 'Campo obrigatório';
    }

    // Validar se máxima não é menor que mínima
    if (formData.minProductionQuantity && formData.maxProductionQuantity) {
      const min = parseInt(String(formData.minProductionQuantity));
      const max = parseInt(String(formData.maxProductionQuantity));
      if (!isNaN(min) && !isNaN(max) && max < min) {
        errors.maxProductionQuantity = 'Quantidade máxima não pode ser menor que a mínima';
      }
    }

    if (!formData.availabilityStart.trim()) {
      errors.availabilityStart = 'Campo obrigatório';
    }

    // Validações condicionais para empresas (CNPJ, MEI, LTDA, ME)
    if (['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize)) {
      if (!formData.cnpj.trim()) {
        errors.cnpj = 'Campo obrigatório';
      } else if (formData.cnpj.replace(/\D/g, '').length !== 14) {
        errors.cnpj = 'CNPJ deve ter 14 dígitos';
      } else if (!validateCnpj(formData.cnpj)) {
        errors.cnpj = 'CNPJ inválido';
      }

      if (!formData.corporateName.trim()) {
        errors.corporateName = 'Campo obrigatório';
      }

      if (!formData.commercialCep.trim()) {
        errors.commercialCep = 'Campo obrigatório';
      } else if (formData.commercialCep.replace(/\D/g, '').length !== 8) {
        errors.commercialCep = 'CEP deve ter 8 dígitos';
      }

      if (!formData.commercialAddress.trim()) {
        errors.commercialAddress = 'Campo obrigatório';
      }

      if (!formData.commercialNumber.trim()) {
        errors.commercialNumber = 'Campo obrigatório';
      }

      if (!formData.commercialNeighborhood.trim()) {
        errors.commercialNeighborhood = 'Campo obrigatório';
      }

      if (!formData.commercialCity.trim()) {
        errors.commercialCity = 'Campo obrigatório';
      }

      if (!formData.commercialUf.trim()) {
        errors.commercialUf = 'Campo obrigatório';
      }

      if (!formData.commercialEmail.trim()) {
        errors.commercialEmail = 'Campo obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.commercialEmail)) {
        errors.commercialEmail = 'Email comercial deve ser válido';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Funções para toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  // Função para cancelar alterações
  const handleCancel = () => {
    if (originalFormData) {
      setFormData({...originalFormData});
      setValidationErrors({});
      setHasChanges(false);
    }
  };

  // Função para verificar se um campo comercial deve estar desabilitado
  const isCommercialFieldDisabled = (): boolean => {
    return formData.companySize === 'CPF';
  };

  // Função para validar CPF
  const validateCpf = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanCpf.charAt(9)) !== digit1) return false;
    
    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cleanCpf.charAt(10)) === digit2;
  };

  // Função para validar CNPJ
  const validateCnpj = (cnpj: string): boolean => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
    
    // Validar primeiro dígito verificador
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanCnpj.charAt(12)) !== digit1) return false;
    
    // Validar segundo dígito verificador
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cleanCnpj.charAt(13)) === digit2;
  };

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    // Limpar erro do campo quando o usuário começa a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Limpar campos de empresa quando CPF for selecionado
      if (field === 'companySize' && value === 'CPF') {
        newData.cnpj = '';
        newData.corporateName = '';
        newData.tradeName = '';
        newData.commercialCep = '';
        newData.commercialAddress = '';
        newData.commercialNumber = '';
        newData.commercialComplement = '';
        newData.commercialNeighborhood = '';
        newData.commercialCity = '';
        newData.commercialUf = '';
        newData.commercialEmail = '';
      }

      // Aplicar filtros quando serviços ou áreas são alterados
      if (field === 'serviceTypes') {
        filterServiceAreas(value as string[]);
        // Limpar áreas inválidas quando serviços são alterados
        const { cleanedAreas } = cleanInvalidSelections(value as string[], newData.operationAreas);
        newData.operationAreas = cleanedAreas;
        // Atualizar lista de serviços baseado nas áreas restantes
        filterServices();
      } else if (field === 'operationAreas') {
        filterServices();
      }

      // Carregar cidades quando estado for alterado
      if (field === 'uf' && typeof value === 'string') {
        loadCitiesByState(value, 'personal');
        newData.city = ''; // Limpar cidade quando estado mudar
      } else if (field === 'commercialUf' && typeof value === 'string') {
        loadCitiesByState(value, 'commercial');
        newData.commercialCity = ''; // Limpar cidade comercial quando estado mudar
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
        filterServices();
      } else if (field === 'operationAreas') {
        filterServices();
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
      
      // Se não encontrou áreas para os serviços selecionados, mostrar todas
      if (uniqueAreas.length === 0) {
        setFilteredServiceAreas(options.serviceAreas);
      } else {
        setFilteredServiceAreas(uniqueAreas);
      }
    }
  };

  const filterServices = () => {
    // Sempre mostrar todos os serviços, independente das áreas selecionadas
    // O filtro de áreas já garante que apenas áreas válidas sejam selecionadas
    setFilteredServices(options.services);
  };

  // Função para limpar seleções inválidas
  const cleanInvalidSelections = (selectedServices: string[], selectedAreas: string[]) => {
    // Se não há serviços selecionados, limpar todas as áreas
    if (selectedServices.length === 0) {
      return { cleanedAreas: [] };
    }
    
    // Limpar áreas que não pertencem mais aos serviços selecionados
    const validAreas = options.services
      .filter(service => selectedServices.includes(service.name))
      .flatMap(service => service.areas || [])
      .map(area => area.name);
    
    const cleanedAreas = selectedAreas.filter(area => 
      validAreas.includes(area)
    );
    
    return { cleanedAreas };
  };

  // Função para mapear tipo de tecido da API para frontend
  const mapTecidTypeFromApi = (apiValue: string | null): string => {
    if (!apiValue) return '';
    
    switch (apiValue.toUpperCase()) {
      case 'PLANO':
        return 'Plano';
      case 'MALHA':
        return 'Malha';
      case 'AMBOS':
        return 'Ambos';
      default:
        return '';
    }
  };

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        // Primeiro carregar as cidades do estado
        if (data.uf) {
          await loadCitiesByState(data.uf, 'personal');
        }

        // Depois atualizar os dados do formulário
        setFormData(prev => ({
          ...prev,
          city: data.localidade || '',
          uf: data.uf || '',
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  // Função para buscar endereço comercial pelo CEP
  const fetchCommercialAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        // Primeiro carregar as cidades do estado
        if (data.uf) {
          await loadCitiesByState(data.uf, 'commercial');
        }

        // Depois atualizar os dados do formulário
        setFormData(prev => ({
          ...prev,
          commercialCity: data.localidade || '',
          commercialUf: data.uf || '',
          commercialAddress: data.logradouro || '',
          commercialNeighborhood: data.bairro || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP comercial:', error);
    }
  };

  // Função para mapear tipo de tecido do frontend para API
  const mapTecidTypeToApi = (frontendValue: string): string => {
    switch (frontendValue) {
      case 'Plano':
        return 'PLANO';
      case 'Malha':
        return 'MALHA';
      case 'Ambos':
        return 'AMBOS';
      default:
        return '';
    }
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
    // Limpar erro do campo quando o usuário começa a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

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

    // Buscar endereço automaticamente quando CEP é alterado
    if (maskType === 'cep') {
      const cleanCep = maskedValue.replace(/\D/g, '');
      
      // Verificar se o CEP está completo (8 dígitos) ou se tem a máscara completa (9 caracteres)
      if (cleanCep.length === 8 || maskedValue.length === 9) {
        if (field === 'cep') {
          fetchAddressByCep(maskedValue);
        } else if (field === 'commercialCep') {
          fetchCommercialAddressByCep(maskedValue);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário antes de enviar
    if (!validateForm()) {
      // Apenas mostrar os erros visuais (sem alert)
      return;
    }
    
    try {
      setSaving(true);
      const userId = state.djangoUser?.id;
      if (!userId) return;

      // Preparar dados para enviar à API
      const updateData = {
        full_name: formData.fullName,
        birth_date: formData.birthDate,
        cpf: formData.cpf.replace(/\D/g, ''),
        cellphone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        postal_code: formData.cep.replace(/\D/g, ''),
        street: formData.address,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        uf: formData.uf,
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
        company_uf: formData.commercialUf,
        company_email: formData.commercialEmail,
        tecid_type: mapTecidTypeToApi(formData.fabricTypes),
        year_experience: formData.experienceYears,
        daily_production_capacity: formData.dailyProductionCapacity,
        min_required_production: formData.minProductionQuantity,
        max_required_production: formData.maxProductionQuantity,
        services_ids: formData.serviceTypes.map(name => 
          options.services.find(s => s.name === name)?.id
        ).filter(id => id !== undefined) as number[],
        areas_ids: formData.operationAreas.map(name => 
          options.serviceAreas.find(a => a.name === name)?.id
        ).filter(id => id !== undefined) as number[],
        specialties_ids: formData.specialties.map(name => 
          options.specialties.find(s => s.name === name)?.id
        ).filter(id => id !== undefined) as number[],
        machines_ids: formData.machinery.map(name => 
          options.machines.find(m => m.name === name)?.id
        ).filter(id => id !== undefined) as number[],
        availability_id: options.availabilities.find(a => a.name === formData.availabilityStart)?.id || null,
      };

      await userService.updateUserById(userId, updateData);
      
      // Atualizar dados originais após salvar com sucesso
      setOriginalFormData({...formData});
      setHasChanges(false);
      setValidationErrors({});
      
      // Atualizar data de última atualização
      const now = new Date();
      const formattedDate = formatDate(now.toISOString());
      setLastUpdated(formattedDate);
      
      // Mostrar toast de sucesso
      showToast('Perfil salvo com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showToast('Erro ao salvar perfil. Tente novamente.', 'error');
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

  const renderSelectField = (field: keyof FormData, placeholder: string, options: string[], disabled: boolean = false) => {
    const currentValues = formData[field] as string[];
    const isOpen = openDropdowns[field] || false;

    const handleOptionClick = (option: string) => {
      if (currentValues.includes(option)) {
        // Se já está selecionado, remove
        handleInputChange(field, currentValues.filter(value => value !== option));
      } else {
        // Se não está selecionado, adiciona
        handleInputChange(field, [...currentValues, option]);
      }
    };

    const toggleDropdown = () => {
      if (disabled) return;
      setOpenDropdowns(prev => ({
        ...prev,
        [field]: !prev[field]
      }));
    };

    return (
      <div className="relative dropdown-container">
        <div
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none ${
            disabled 
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400' 
              : 'border-gray-300 bg-white cursor-pointer focus:ring-pink-500'
          }`}
          onClick={toggleDropdown}
        >
          <span className={currentValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
            {disabled 
              ? 'Selecione um serviço primeiro' 
              : currentValues.length === 0 
                ? placeholder 
                : `${currentValues.length} selecionado(s)`
            }
          </span>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
                disabled ? 'text-gray-300' : 'text-gray-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map(option => {
              const isSelected = currentValues.includes(option);
              return (
                <div
                  key={option}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected 
                      ? 'bg-pink-50 text-pink-700 border-l-4 border-pink-500' 
                      : 'text-gray-700'
                  }`}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {isSelected && (
                      <svg className="h-4 w-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                  name="fullName"
                  data-field="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.fullName 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento <span className="text-red-500">*</span>
              </label>
                <input
                  type="date"
                  name="birthDate"
                  data-field="birthDate"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.birthDate 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.birthDate && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.birthDate}</p>
                )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF <span className="text-red-500">*</span>
            </label>
                <input
                  type="text"
                  name="cpf"
                  data-field="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleMaskedInputChange('cpf', e.target.value, 'cpf')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.cpf 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                  placeholder="000.000.000-00"
                />
                {validationErrors.cpf && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.cpf}</p>
                )}
          </div>

              <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone <span className="text-red-500">*</span>
            </label>
                <input
                  type="text"
                  name="phone"
                  data-field="phone"
                  value={formData.phone}
                  onChange={(e) => handleMaskedInputChange('phone', e.target.value, 'phone')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.phone 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                  placeholder="(00) 00000-0000"
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado (UF)</label>
                <select
                  value={formData.uf}
                  onChange={(e) => handleInputChange('uf', e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  disabled={!formData.uf || loadingCities.personal}
                >
                  <option value="">
                    {!formData.uf ? 'Primeiro selecione o estado' : 
                     loadingCities.personal ? 'Carregando cidades...' : 
                     'Selecione a cidade'}
                  </option>
                  {cities.personal.map(city => (
                    <option key={city.id} value={city.nome}>
                      {city.nome}
                    </option>
                  ))}
                </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleMaskedInputChange('cnpj', e.target.value, 'cnpj')}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.cnpj 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                  placeholder="00.000.000/0000-00"
                />
                {validationErrors.cnpj && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.cnpj}</p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                  value={formData.corporateName}
                  onChange={(e) => handleInputChange('corporateName', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.corporateName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.corporateName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.corporateName}</p>
                )}
            </div>
          </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Fantasia {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-gray-500">(opcional)</span>}
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={(e) => handleInputChange('tradeName', e.target.value)}
                disabled={isCommercialFieldDisabled()}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  isCommercialFieldDisabled()
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
              />
        </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.commercialCep}
                  onChange={(e) => handleMaskedInputChange('commercialCep', e.target.value, 'cep')}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialCep 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                  placeholder="00000-000"
                />
                {validationErrors.commercialCep && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialCep}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.commercialAddress}
                  onChange={(e) => handleInputChange('commercialAddress', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialAddress 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.commercialAddress && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialAddress}</p>
                )}
          </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.commercialNumber}
                  onChange={(e) => handleInputChange('commercialNumber', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialNumber 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.commercialNumber && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialNumber}</p>
                )}
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={formData.commercialComplement}
                  onChange={(e) => handleInputChange('commercialComplement', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
              </div>
              
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
              </label>
              <input
                  type="text"
                  value={formData.commercialNeighborhood}
                  onChange={(e) => handleInputChange('commercialNeighborhood', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialNeighborhood 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.commercialNeighborhood && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialNeighborhood}</p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado (UF) {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.commercialUf}
                  onChange={(e) => handleInputChange('commercialUf', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialUf 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                >
                  <option value="">Selecione o estado</option>
                  {BRAZILIAN_STATES.map(state => (
                    <option key={state.code} value={state.code}>
                      {state.code}
                    </option>
                  ))}
                </select>
                {validationErrors.commercialUf && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialUf}</p>
                )}
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
              </label>
              <select
                  value={formData.commercialCity}
                  onChange={(e) => handleInputChange('commercialCity', e.target.value)}
                  disabled={isCommercialFieldDisabled() || !formData.commercialUf || loadingCities.commercial}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialCity 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                >
                  <option value="">
                    {isCommercialFieldDisabled() ? 'Campo desabilitado' :
                     !formData.commercialUf ? 'Primeiro selecione o estado' : 
                     loadingCities.commercial ? 'Carregando cidades...' : 
                     'Selecione a cidade'}
                  </option>
                  {cities.commercial.map(city => (
                    <option key={city.id} value={city.nome}>
                      {city.nome}
                    </option>
                  ))}
                </select>
                {validationErrors.commercialCity && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialCity}</p>
                )}
            </div>
              
              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail comercial {['CNPJ', 'MEI', 'LTDA', 'ME'].includes(formData.companySize) && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                  value={formData.commercialEmail}
                  onChange={(e) => handleInputChange('commercialEmail', e.target.value)}
                  disabled={isCommercialFieldDisabled()}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    isCommercialFieldDisabled()
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : validationErrors.commercialEmail 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.commercialEmail && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.commercialEmail}</p>
                )}
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
                  {renderSelectField('serviceTypes', 'Selecione o tipo de serviço', (filteredServices || []).map(s => s.name))}
                  <div className="mt-2">
                    {formData.serviceTypes.map(tag => renderTag(tag, 'serviceTypes'))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área de Atuação</label>
                  {renderSelectField('operationAreas', 'Selecione a área de atuação', (filteredServiceAreas || []).map(s => s.name), formData.serviceTypes.length === 0)}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anos de Experiência <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="experienceYears"
                  data-field="experienceYears"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.experienceYears 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.experienceYears && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.experienceYears}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade de produção diária <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="dailyProductionCapacity"
                  data-field="dailyProductionCapacity"
                  value={formData.dailyProductionCapacity}
                  onChange={(e) => handleInputChange('dailyProductionCapacity', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    validationErrors.dailyProductionCapacity 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-pink-500'
                  }`}
                />
                {validationErrors.dailyProductionCapacity && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.dailyProductionCapacity}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade de produção requerida <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mínima</label>
                  <input
                    type="text"
                    name="minProductionQuantity"
                    data-field="minProductionQuantity"
                    value={formData.minProductionQuantity}
                    onChange={(e) => handleInputChange('minProductionQuantity', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.minProductionQuantity 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                    }`}
                  />
                  {validationErrors.minProductionQuantity && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.minProductionQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Máxima</label>
                  <input
                    type="text"
                    name="maxProductionQuantity"
                    data-field="maxProductionQuantity"
                    value={formData.maxProductionQuantity}
                    onChange={(e) => handleInputChange('maxProductionQuantity', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      validationErrors.maxProductionQuantity 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-pink-500'
                    }`}
                  />
                  {validationErrors.maxProductionQuantity && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.maxProductionQuantity}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8" data-field="availabilityStart">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Disponibilidade para Início: <span className="text-red-500">*</span>
              </label>
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
              {validationErrors.availabilityStart && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.availabilityStart}</p>
              )}
        </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}