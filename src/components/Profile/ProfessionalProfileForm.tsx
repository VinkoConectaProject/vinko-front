import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ProfessionalProfile } from '../../types';

type TabType = 'personal' | 'commercial' | 'interests';

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
  fabricTypes: string[];
  experienceYears: string;
  dailyProductionCapacity: string;
  minProductionQuantity: string;
  maxProductionQuantity: string;
  availabilityStart: string;
}

export function ProfessionalProfileForm() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [formData, setFormData] = useState<FormData>({
    // Dados Pessoais
    fullName: 'Maria Paula',
    cpf: '',
    phone: '(82) 98848-8525',
    email: 'emailregistrado@gmail.com',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Maceió',
    state: 'Alagoas',
    
    // Dados Comerciais
    companySize: 'LTDA',
    cnpj: 'XX.XXX.XXX/0001-XX',
    corporateName: 'Vinko Conecta',
    tradeName: '',
    commercialCep: '',
    commercialAddress: '',
    commercialNumber: 'XXX',
    commercialComplement: '',
    commercialNeighborhood: '',
    commercialCity: '',
    commercialState: '',
    commercialEmail: 'emailregistrado@gmail.com',
    
    // Interesses
    serviceTypes: [],
    operationAreas: [],
    specialties: [],
    machinery: [],
    fabricTypes: [],
    experienceYears: '',
    dailyProductionCapacity: '',
    minProductionQuantity: '',
    maxProductionQuantity: '',
    availabilityStart: '',
  });

  const existingProfile = state.professionalProfiles.find(p => p.userId === state.currentUser?.id);

  useEffect(() => {
    if (existingProfile) {
      // Carregar dados existentes se houver
      setFormData(prev => ({
        ...prev,
        fullName: existingProfile.name || prev.fullName,
        city: existingProfile.city || prev.city,
        state: existingProfile.state || prev.state,
      }));
    }
  }, [existingProfile]);

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funções de máscara
  const applyPhoneMask = (value: string) => {
    const numbers = value.replace(/\D/g, '');
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

  const handleTagRemove = (field: keyof FormData, tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData: ProfessionalProfile = {
      id: existingProfile?.id || Date.now().toString(),
      userId: state.currentUser?.id || '',
      name: formData.fullName,
      services: formData.serviceTypes,
      specialty: formData.specialties.join(', '),
      city: formData.city,
      state: formData.state,
      portfolio: [],
      availability: 'available',
      contact: {
        phone: formData.phone,
        whatsapp: formData.phone,
        email: formData.email,
      },
      description: '',
      experience: formData.experienceYears,
      rating: existingProfile?.rating || 0,
      completedJobs: existingProfile?.completedJobs || 0,
      createdAt: existingProfile?.createdAt || new Date(),
      isApproved: true,
    };

    if (existingProfile) {
      dispatch({ type: 'UPDATE_PROFESSIONAL_PROFILE', payload: profileData });
    } else {
      dispatch({ type: 'ADD_PROFESSIONAL_PROFILE', payload: profileData });
    }

    alert('Perfil salvo com sucesso!');
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

  return (
    <div className="w-full py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maria Paula - Prestador de Serviços</h1>
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar className="h-4 w-4 mr-2" />
          Última atualização em 22 de Abril
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
                  {renderSelectField('serviceTypes', 'Selecione o tipo de serviço', ['Costura', 'Bordado', 'Modelagem', 'Alfaiataria'])}
                  <div className="mt-2">
                    {formData.serviceTypes.map(tag => renderTag(tag, 'serviceTypes'))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área de Atuação</label>
                  {renderSelectField('operationAreas', 'Selecione a área de atuação', ['Moda Feminina', 'Moda Masculina', 'Moda Infantil', 'Alta Costura'])}
                  <div className="mt-2">
                    {formData.operationAreas.map(tag => renderTag(tag, 'operationAreas'))}
                  </div>
                </div>
              </div>
              
              {/* Segunda linha: Especialidade e Maquinário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                  {renderSelectField('specialties', 'Selecione a especialidade', ['Vestidos de Festa', 'Roupas Casuais', 'Uniformes', 'Trajes Sociais'])}
                  <div className="mt-2">
                    {formData.specialties.map(tag => renderTag(tag, 'specialties'))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maquinário</label>
                  {renderSelectField('machinery', 'Selecione o maquinário', ['Máquina de Costura', 'Overlock', 'Máquina de Bordar', 'Máquina de Cortar'])}
                  <div className="mt-2">
                    {formData.machinery.map(tag => renderTag(tag, 'machinery'))}
                  </div>
                </div>
              </div>
              
              {/* Terceira linha: Tipo de Tecido (linha única) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Tecido</label>
                {renderSelectField('fabricTypes', 'Selecione o tipo de tecido', ['Algodão', 'Seda', 'Linho', 'Poliéster', 'Viscose'])}
                <div className="mt-2">
                  {formData.fabricTypes.map(tag => renderTag(tag, 'fabricTypes'))}
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
            {[
                  'Imediata',
                  'Em até 7 dias',
                  'Em até 15 dias',
                  'Em até 30 dias',
                  'A combinar'
            ].map((option) => (
                  <label key={option} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                      name="availabilityStart"
                      value={option}
                      checked={formData.availabilityStart === option}
                      onChange={(e) => handleInputChange('availabilityStart', e.target.value)}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    {option}
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
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}