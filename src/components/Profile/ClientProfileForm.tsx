import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, Mail, Building, Save } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ClientProfile } from '../../types';

export function ClientProfileForm() {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState<Partial<ClientProfile>>({
    name: '',
    company: '',
    city: '',
    state: '',
    contact: {
      phone: '',
      email: '',
    },
  });

  const existingProfile = state.clientProfiles.find(p => p.userId === state.currentUser?.id);

  useEffect(() => {
    if (existingProfile) {
      setFormData(existingProfile);
    }
  }, [existingProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData: ClientProfile = {
      id: existingProfile?.id || Date.now().toString(),
      userId: state.currentUser?.id || '',
      name: formData.name || '',
      company: formData.company || '',
      city: formData.city || '',
      state: formData.state || '',
      contact: formData.contact || { phone: '', email: '' },
      createdAt: existingProfile?.createdAt || new Date(),
    };

    if (existingProfile) {
      dispatch({ type: 'UPDATE_CLIENT_PROFILE', payload: profileData });
    } else {
      dispatch({ type: 'ADD_CLIENT_PROFILE', payload: profileData });
    }

    // Show success message (you can implement a toast notification here)
    alert('Perfil salvo com sucesso!');
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil Cliente</h1>
        <p className="text-gray-600">
          Complete suas informações para uma melhor experiência na plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
                Empresa (opcional)
              </label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Nome da empresa"
              />
            </div>
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

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Informações de Contato
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Contato
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
                required
              />
            </div>
          </div>
        </div>

        {/* Company Information */}
        {formData.company && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Informações da Empresa
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                <strong>Empresa:</strong> {formData.company}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Essas informações aparecerão em suas demandas publicadas
              </p>
            </div>
          </div>
        )}

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