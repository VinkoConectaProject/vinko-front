import React, { useState, useContext } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Search, Filter, MapPin, Clock, DollarSign, User, MessageCircle, Heart, Eye, X, Phone, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { Demand } from '../../types';

interface OpportunitiesPageProps {
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export default function OpportunitiesPage({ onStartConversation }: OpportunitiesPageProps) {
  const { state, dispatch } = useApp();
  const { demands, currentUser } = state;
  const [selectedService, setSelectedService] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const serviceTypes = [
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
    'Psicologia'
  ];

  const locations = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília', 'Fortaleza'];
  const budgetRanges = ['Até R$ 500', 'R$ 500 - R$ 1.000', 'R$ 1.000 - R$ 2.000', 'Acima de R$ 2.000'];

  const handleContactWhatsApp = (demand: Demand) => {
    const client = state.clientProfiles.find(c => c.userId === demand.clientId);
    if (client?.contact.phone) {
      const message = `Olá! Vi sua demanda "${demand.title}" na VINKO e tenho interesse em conversar sobre o projeto.`;
      const whatsappUrl = `https://wa.me/55${client.contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Informações de contato não disponíveis');
    }
  };

  const handleStartConversationDemand = (demand: Demand) => {
    if (!state.currentUser || !onStartConversation) return;

    const initialMessage = `Olá! Tenho interesse na sua demanda: "${demand.title}". Gostaria de conversar sobre os detalhes do projeto.`;
    onStartConversation(demand.clientId, demand.id, initialMessage);

    // Send notification to client
    const professional = state.professionalProfiles.find(p => p.userId === state.currentUser!.id);
    const notification = {
      id: Date.now().toString(),
      userId: demand.clientId,
      type: 'new_message' as const,
      title: 'Nova mensagem',
      message: `${professional?.name || 'Um profissional'} enviou uma mensagem sobre sua demanda: ${demand.title}`,
      isRead: false,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

  };

  const filteredDemands = state.demands.filter(demand => {
    const matchesSearch = demand.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demand.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = !selectedService || demand.serviceType === selectedService;
    const matchesLocation = !selectedLocation || demand.location === selectedLocation;
    const matchesBudget = !selectedBudget || demand.budget === selectedBudget;
    const isOpen = demand.status === 'open';
    
    return matchesSearch && matchesService && matchesLocation && matchesBudget && isOpen;
  });

  const handleShowInterest = (demandId: string) => {
    if (state.currentUser) {
      const demand = state.demands.find(d => d.id === demandId);
      if (demand) {
        // Add professional to interested list
        const updatedDemand = {
          ...demand,
          interestedProfessionals: [...demand.interestedProfessionals, state.currentUser.id]
        };
        dispatch({ type: 'UPDATE_DEMAND', payload: updatedDemand });
        
        // Send notification to client
        const professional = state.professionalProfiles.find(p => p.userId === state.currentUser.id);
        const notification = {
          id: Date.now().toString(),
          userId: demand.clientId,
          type: 'new_interest' as const,
          title: 'Novo interesse na sua demanda',
          message: `${professional?.name || 'Um profissional'} demonstrou interesse na demanda: ${demand.title}`,
          isRead: false,
          createdAt: new Date(),
          demandId: demand.id,
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      }
    }
  };

  const isInterestedInDemand = (demandId: string) => {
    const demand = state.demands.find(d => d.id === demandId);
    return demand?.interestedProfessionals?.includes(state.currentUser?.id || '') || false;
  };

  return (
    <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Oportunidades Disponíveis</h1>
          <p className="text-gray-600">Encontre projetos que combinam com seu perfil profissional</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar oportunidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos os serviços</option>
              {serviceTypes.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todas as cidades</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Todos os orçamentos</option>
              {budgetRanges.map(budget => (
                <option key={budget} value={budget}>{budget}</option>
              ))}
            </select>

            <button className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </button>
          </div>
        </div>

        {/* Lista de Oportunidades */}
        <div className="space-y-6">
          {filteredDemands.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma oportunidade encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros para encontrar mais oportunidades.</p>
            </div>
          ) : (
            filteredDemands.map((demand) => (
              <div key={demand.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{demand.title}</h3>
                    <p className="text-gray-600 mb-4">{demand.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {demand.serviceType || 'Não especificado'}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {demand.location.city}, {demand.location.state}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Prazo: {new Date(demand.deadline).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {demand.images && demand.images.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {demand.images.slice(0, 3).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Imagem ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        ))}
                        {demand.images.length > 3 && (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-500">
                            +{demand.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Heart className="h-4 w-4 mr-1" />
                        {demand.interestedProfessionals?.length || 0} interessados
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedDemand(demand)}
                          className="flex items-center px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </button>
                        
                        <button
                          onClick={() => handleContactWhatsApp(demand)}
                          className="flex items-center px-3 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          WhatsApp
                        </button>
                        
                        <button
                          onClick={() => handleStartConversationDemand(demand)}
                          className="flex items-center px-3 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Mensagem
                        </button>
                        
                        {isInterestedInDemand(demand.id) ? (
                          <button
                            disabled
                            className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg cursor-not-allowed text-sm"
                          >
                            <Heart className="h-4 w-4 mr-1 fill-current" />
                            Interessado
                          </button>
                        ) : (
                          <button
                            onClick={() => handleShowInterest(demand.id)}
                            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
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
            ))
          )}
        </div>

        {/* Demand Details Modal */}
        {selectedDemand && (
          <DemandDetailsModal
            demand={selectedDemand}
            onClose={() => setSelectedDemand(null)}
            onContactWhatsApp={handleContactWhatsApp}
            onStartConversation={handleStartConversationDemand}
            onShowInterest={handleShowInterest}
            isInterested={isInterestedInDemand(selectedDemand.id)}
          />
        )}
      </div>
  );
}

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
  const [selectedImage, setSelectedImage] = useState<{ src: string; index: number } | null>(null);

  const openImageModal = (src: string, index: number) => {
    console.log('Abrindo imagem:', src, 'índice:', index);
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
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{demand.title}</h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Demanda Aberta
              </span>
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
            <h3 className="font-semibold text-gray-900 mb-3">Descrição do Projeto</h3>
            <p className="text-gray-600 leading-relaxed">{demand.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Orçamento
              </h3>
              <p className="text-lg font-medium text-green-600">
                R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Prazo
              </h3>
              <p className="text-gray-600">
                {new Date(demand.deadline).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-purple-600" />
              Localização
            </h3>
            <p className="text-gray-600">
              {demand.location.city}, {demand.location.state}
              {demand.location.isRemote && (
                <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Trabalho remoto aceito
                </span>
              )}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Tipo de Serviço</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
              {demand.serviceType}
            </span>
          </div>

          {demand.attachments && demand.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Imagens do Projeto</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {demand.attachments.map((image, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="relative cursor-pointer"
                      onClick={() => {
                        console.log('Clicou na imagem:', image, 'índice:', index);
                        openImageModal(image, index);
                      }}
                    >
                      <img
                        src={image}
                        alt={`Imagem ${index + 1} do projeto`}
                        className="w-full h-32 object-cover rounded-lg border hover:opacity-75 transition-opacity"
                        onError={(e) => {
                          console.log('Erro ao carregar imagem:', image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{demand.attachments.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Clique nas imagens para visualizar em tamanho completo
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Heart className="h-4 w-4 mr-2" />
                <span>{demand.interestedProfessionals.length} profissionais interessados</span>
              </div>
              <div className="text-sm text-gray-500">
                Publicado em {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onContactWhatsApp(demand)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Phone className="h-4 w-4 mr-2" />
              Contatar via WhatsApp
            </button>
            
            <button
              onClick={() => {
                onStartConversation(demand);
                onClose();
              }}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Iniciar Conversa
            </button>
            
            {isInterested ? (
              <button
                disabled
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
              >
                <Heart className="h-4 w-4 mr-2 fill-current" />
                Interesse Demonstrado
              </button>
            ) : (
              <button
                onClick={() => {
                  onShowInterest(demand.id);
                  onClose();
                }}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Heart className="h-4 w-4 mr-2" />
                Demonstrar Interesse
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
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

// Componente para imagem com fallback
interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

function ImageWithFallback({ src, alt, className, onClick }: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

  // Reset states when src changes
  React.useEffect(() => {
    setImageError(false);
  }, [src]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Only render img tag if src has a valid value
  if (!src || src.trim() === '') {
    return (
      <div 
        className={`${className} bg-gray-100 flex flex-col items-center justify-center text-gray-500`}
        onClick={handleClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <Image className="h-8 w-8 mb-2" />
        <span className="text-xs text-center px-2">Sem imagem</span>
      </div>
    );
  }

  if (imageError) {
    return (
      <div 
        className={`${className} bg-gray-100 flex flex-col items-center justify-center text-gray-500`}
        onClick={handleClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <Image className="h-8 w-8 mb-2" />
        <span className="text-xs text-center px-2">Imagem não disponível</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={handleClick}
      onError={handleImageError}
      style={{ objectFit: 'cover', cursor: onClick ? 'pointer' : 'default' }}
    />
  );
}