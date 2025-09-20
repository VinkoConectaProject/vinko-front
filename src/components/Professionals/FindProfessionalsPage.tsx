import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Star, Phone, MessageSquare, User, Briefcase, CheckCircle, X, Award, Mail, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface FindProfessionalsPageProps {
  onStartConversation?: (userId: string) => void;
}

export function FindProfessionalsPage({ onStartConversation }: FindProfessionalsPageProps) {
  const { state } = useApp();
  
  // Obter perfil do cliente atual
  const currentClientProfile = state.clientProfiles.find(
    profile => profile.userId === state.currentUser?.id
  );
  
  // Definir filtros padrão baseados no perfil do cliente
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(currentClientProfile?.city || '');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);

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

  const availabilityOptions = [
    { value: 'available', label: 'Disponível' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'unavailable', label: 'Indisponível' },
  ];

  const filteredProfessionals = useMemo(() => {
    return state.professionalProfiles.filter(professional => {
      if (!professional.isApproved) return false;
      
      // Filter by search term
      if (searchTerm && !professional.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !professional.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by service
      if (selectedService && !professional.services.includes(selectedService)) {
        return false;
      }
      
      // Filter by location (cidade ou estado)
      if (selectedLocation && 
          professional.city !== selectedLocation && 
          professional.uf !== selectedLocation) {
        return false;
      }
      
      // Filter by availability
      if (selectedAvailability && professional.availability !== selectedAvailability) {
        return false;
      }
      
      return true;
    });
  }, [state.professionalProfiles, searchTerm, selectedService, selectedLocation, selectedAvailability]);

  // Combinar cidades e estados únicos para o filtro de localização
  const uniqueCities = [...new Set(state.professionalProfiles.map(p => p.city))];
  const uniqueStates = [...new Set(state.professionalProfiles.map(p => p.uf))];
  const uniqueLocations = [...uniqueCities, ...uniqueStates].filter(Boolean).sort();

  const handleContact = (professional: any) => {
    if (professional.contact.whatsapp) {
      const message = `Olá ${professional.name}! Vi seu perfil na VINKO e gostaria de conversar sobre um projeto.`;
      const whatsappUrl = `https://wa.me/55${professional.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else if (professional.contact.phone) {
      alert(`Contato: ${professional.contact.phone}`);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-200 text-green-800';
      case 'busy':
        return 'bg-yellow-200 text-yellow-800';
      case 'unavailable':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Disponível';
      case 'busy':
        return 'Ocupado';
      case 'unavailable':
        return 'Indisponível';
      default:
        return 'Não informado';
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buscar Profissionais</h1>
        <p className="text-gray-600">
          Encontre profissionais qualificados para seus projetos
        </p>
        {currentClientProfile?.city && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Filtro automático aplicado:</span> Mostrando profissionais da sua região ({currentClientProfile.city}, {currentClientProfile.uf})
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar profissionais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todos os serviços</option>
            {serviceOptions.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todas as cidades</option>
            {uniqueLocations.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todas as disponibilidades</option>
            {availabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedService('');
              setSelectedLocation(currentClientProfile?.city || '');
              setSelectedAvailability('');
            }}
            className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Redefinir Filtros
          </button>
        </div>
      </div>

      {/* Professionals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProfessionals.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Nenhum profissional encontrado</p>
            <p className="text-gray-400 text-sm mt-2">
              Tente ajustar os filtros ou volte mais tarde
            </p>
          </div>
        ) : (
          filteredProfessionals.map((professional) => {
            const renderStars = (rating: number) => {
              return Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < rating
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ));
            };

            return (
              <div
                key={professional.id}
                onClick={() => setSelectedProfessional(professional)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer overflow-hidden min-h-[420px] flex flex-col"
              >
                {/* Nome do profissional */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 text-base leading-tight">
                    {professional.name}
                  </h3>
                </div>

                {/* Avaliação em estrelas */}
                <div className="flex items-center space-x-1 mb-3">
                  {renderStars(Math.floor(professional.rating))}
                  <span className="text-sm text-gray-600 ml-2">
                    ({professional.completedJobs} trabalhos)
                  </span>
                </div>

                {/* Tipo de serviço */}
                <div className="mb-3">
                  <p className="text-sm text-gray-700">
                    {professional.specialty || 'Serviços Gerais'}
                  </p>
                </div>

                {/* Categorias */}
                <div className="mb-3 flex-grow">
                  <div className="flex flex-wrap gap-2">
                    {professional.services.slice(0, 2).map((service, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                    {professional.services.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{professional.services.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Localização */}
                <div className="mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{professional.city}, {professional.uf}</span>
                  </div>
                </div>

                {/* Contato */}
                <div className="mb-4 flex-shrink-0">
                  <div className="space-y-1">
                    {professional.contact.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{professional.contact.phone}</span>
                      </div>
                    )}
                    {professional.contact.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{professional.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status de disponibilidade */}
                <div className="mb-4 flex-shrink-0">
                  <span className={`inline-block px-4 py-2 text-sm font-medium rounded-full ${getAvailabilityColor(professional.availability)}`}>
                    {getAvailabilityLabel(professional.availability)}
                  </span>
                </div>

                {/* Botões de ação */}
                <div className="space-y-3 mt-auto flex-shrink-0">
                  {/* Botão Conversar - Primário */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartConversation?.(professional.userId);
                    }}
                    className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Conversar
                  </button>

                  {/* Botões secundários */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContact(professional);
                      }}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      WhatsApp
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProfessional(professional);
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver perfil
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedProfessional && (
        <ProfessionalProfileModal
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
          onContact={handleContact}
          onStartConversation={onStartConversation}
        />
      )}
    </div>
  );
}

interface ProfessionalProfileModalProps {
  professional: any;
  onClose: () => void;
  onContact: (professional: any) => void;
  onStartConversation?: (userId: string) => void;
}

function ProfessionalProfileModal({ professional, onClose, onContact, onStartConversation }: ProfessionalProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{professional.name}</h2>
                <div className="flex items-center space-x-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{professional.city}, {professional.uf}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{professional.rating}</span>
                  <span className="text-gray-500">({professional.completedJobs} trabalhos)</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Sobre</h3>
            <p className="text-gray-600">{professional.description}</p>
          </div>

          {professional.specialty && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Especialidade
              </h3>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {professional.specialty}
              </span>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Serviços Oferecidos</h3>
            <div className="flex flex-wrap gap-2">
              {professional.services.map((service: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Experiência</h3>
            <p className="text-gray-600 capitalize">{professional.experience}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Disponibilidade</h3>
            <span className={`px-3 py-1 rounded-full text-sm ${
              professional.availability === 'available' ? 'bg-green-100 text-green-800' :
              professional.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {professional.availability === 'available' ? 'Disponível' :
               professional.availability === 'busy' ? 'Ocupado' : 'Indisponível'}
            </span>
          </div>

          {/* Ratings Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Avaliações dos Clientes
            </h3>
            
            {(() => {
              const { state } = useApp();
              const professionalRatings = state.ratings.filter(r => r.professionalId === professional.userId);
              const averageRating = professionalRatings.length > 0 
                ? professionalRatings.reduce((sum, r) => sum + r.stars, 0) / professionalRatings.length 
                : 0;
              
              const renderStars = (rating: number) => {
                return Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ));
              };

              if (professionalRatings.length === 0) {
                return (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhuma avaliação ainda</p>
                    <p className="text-gray-400 text-sm">Seja o primeiro a avaliar este profissional!</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Average Rating */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {averageRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center mt-1">
                          {renderStars(Math.round(averageRating))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">Média das Avaliações</p>
                        <p className="text-gray-600 text-sm">
                          {professionalRatings.length} avaliação{professionalRatings.length !== 1 ? 'ões' : ''} recebida{professionalRatings.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Individual Ratings */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {professionalRatings
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((rating) => {
                        const client = state.clientProfiles.find(c => c.userId === rating.clientId);
                        const clientName = client?.name || 'Cliente';
                        
                        return (
                          <div key={rating.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-3 w-3 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{clientName}</p>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {renderStars(rating.stars)}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {rating.stars} estrela{rating.stars !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(rating.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            {rating.comment && (
                              <p className="text-gray-600 text-sm mt-2 pl-8">
                                "{rating.comment}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Contato</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {professional.contact.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{professional.contact.phone}</span>
                </div>
              )}
              {professional.contact.whatsapp && (
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span>{professional.contact.whatsapp}</span>
                </div>
              )}
              {professional.contact.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{professional.contact.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => onContact(professional)}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp
            </button>
            
            <button
              onClick={() => {
                onStartConversation?.(professional.userId);
                onClose();
              }}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversar
            </button>
            
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}