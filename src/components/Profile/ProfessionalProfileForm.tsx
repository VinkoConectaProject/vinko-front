import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Briefcase, Star, Save, Award } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ProfessionalProfile } from '../../types';

export function ProfessionalProfileForm() {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<Partial<ProfessionalProfile>>({
    name: '',
    services: [],
    specialty: '',
    city: '',
    state: '',
    portfolio: [],
    availability: 'available',
    contact: {
      phone: '',
      whatsapp: '',
      email: '',
    },
    description: '',
    experience: '',
  });

  const existingProfile = state.professionalProfiles.find(p => p.userId === state.currentUser?.id);

  useEffect(() => {
    if (existingProfile) {
      setFormData(existingProfile);
    }
  }, [existingProfile]);

  const serviceOptions = [
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
    'Psicologia',
  ];

  const specialtyOptions = [
    'Confecção sob medida',
    'Moda Feminina',
    'Moda Masculina',
    'Moda Infantil',
    'Vestidos de festa',
    'Moda Fitness',
    'Moda Praia',
    'Alfaiataria',
    'Alta Costura',
    'Bordado',
    'Modelagem',
    'Corte e Costura',
    'Facção',
    'Estamparia',
    'Serigrafia',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData: ProfessionalProfile = {
      id: existingProfile?.id || Date.now().toString(),
      userId: state.currentUser?.id || '',
      name: formData.name || '',
      services: formData.services || [],
      specialty: formData.specialty || '',
      city: formData.city || '',
      state: formData.state || '',
      portfolio: formData.portfolio || [],
      availability: formData.availability || 'available',
      contact: formData.contact || { phone: '', whatsapp: '', email: '' },
      description: formData.description || '',
      experience: formData.experience || '',
      rating: existingProfile?.rating || 0,
      completedJobs: existingProfile?.completedJobs || 0,
      createdAt: existingProfile?.createdAt || new Date(),
      isApproved: true, // Auto-approve for demo
    };

    if (existingProfile) {
      dispatch({ type: 'UPDATE_PROFESSIONAL_PROFILE', payload: profileData });
    } else {
      dispatch({ type: 'ADD_PROFESSIONAL_PROFILE', payload: profileData });
    }

    // Show success message (you can implement a toast notification here)
    alert('Perfil salvo com sucesso!');
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...(prev.services || []), service]
    }));
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil Profissional</h1>
        <p className="text-gray-600">
          Complete suas informações para receber mais oportunidades
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experiência Profissional
              </label>
              <select
                value={formData.experience || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                <option value="">Selecione...</option>
                <option value="iniciante">Iniciante (0-2 anos)</option>
                <option value="intermediario">Intermediário (2-5 anos)</option>
                <option value="avancado">Avançado (5-10 anos)</option>
                <option value="expert">Expert (10+ anos)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidade
            </label>
            <select
              value={formData.specialty || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value="">Selecione sua especialidade...</option>
              {specialtyOptions.map((specialty) => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição Profissional
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Descreva brevemente sua experiência e especialidades..."
              required
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Localização
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Sua cidade"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Estado (UF)"
                required
              />
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            Serviços Oferecidos
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {serviceOptions.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => handleServiceToggle(service)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  formData.services?.includes(service)
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Informações de Contato
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.contact?.phone || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contact: { ...prev.contact, phone: e.target.value } 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.contact?.whatsapp || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contact: { ...prev.contact, whatsapp: e.target.value } 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Profissional
              </label>
              <input
                type="email"
                value={formData.contact?.email || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contact: { ...prev.contact, email: e.target.value } 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="contato@email.com"
              />
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Disponibilidade
          </h2>
          
          <div className="space-y-3">
            {[
              { value: 'available', label: 'Disponível para novos projetos', color: 'green' },
              { value: 'busy', label: 'Ocupado, mas aceito alguns projetos', color: 'yellow' },
              { value: 'unavailable', label: 'Indisponível no momento', color: 'red' },
            ].map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  value={option.value}
                  checked={formData.availability === option.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                  className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                />
                <span className="text-gray-700">{option.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  option.color === 'green' ? 'bg-green-100 text-green-800' :
                  option.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {option.color === 'green' ? 'Disponível' :
                   option.color === 'yellow' ? 'Limitado' : 'Indisponível'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 font-medium flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            Salvar Perfil
          </button>
        </div>
      </form>
    </div>
  );
}