import React, { useState, useEffect } from 'react';
import { X, MapPin, Star, Phone, Mail, MessageSquare, User, Award, Layers, Calendar, Target, Building2, Zap, Contact } from 'lucide-react';
import { StarRating } from './StarRating';
import { RatingModal } from './RatingModal';
import { ratingService } from '../../services/ratingService';
import { demandService } from '../../services/demandService';
import { ProfessionalSearchResult } from '../../types';

interface ProfessionalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: ProfessionalSearchResult;
  onStartConversation?: (professionalId: number) => void;
  onRateProfessional?: (professional: ProfessionalSearchResult) => void;
  showRatingModal?: boolean;
  onCloseRatingModal?: () => void;
  onRatingSubmit?: (rating: number, comment: string) => Promise<void>;
  onRatingDelete?: () => Promise<void>;
  refreshTrigger?: number; // Para forçar refresh das avaliações
  currentUserId?: number; // ID do usuário logado para permitir edição de avaliações
}

interface Rating {
  id: number;
  created_at: string;
  updated_at: string;
  score: number;
  comment?: string;
  professional: number;
  client: number;
  client_full_name?: string;
}

export function ProfessionalProfileModal({
  isOpen,
  onClose,
  professional,
  onStartConversation,
  onRateProfessional,
  showRatingModal = false,
  onCloseRatingModal,
  onRatingSubmit,
  onRatingDelete,
  refreshTrigger,
  currentUserId
}: ProfessionalProfileModalProps) {
  // Função para obter o nome da disponibilidade
  const getAvailabilityName = (availabilityId: number): string => {
    const availabilities: Record<number, string> = {
      1: 'Imediato',
      2: '1 semana',
      3: '2 semanas',
      4: '1 mês',
      5: '2 meses',
      6: '3 meses',
    };
    
    return availabilities[availabilityId] || '-';
  };
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [existingRating, setExistingRating] = useState<{
    id: number;
    score: number;
    comment?: string;
  } | null>(null);
  const [showNoPhoneModal, setShowNoPhoneModal] = useState(false);

  // Carregar avaliações quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadRatings();
    }
  }, [isOpen, professional.id]);

  // Recarregar avaliações quando refreshTrigger mudar
  useEffect(() => {
    if (isOpen && refreshTrigger !== undefined) {
      loadRatings();
    }
  }, [refreshTrigger, isOpen]);

  const loadRatings = async () => {
    setLoadingRatings(true);
    try {
      const response = await ratingService.getRatingsByProfessional(professional.id);
      if (response.status === 'success') {
        setRatings(response.data || []);
      }
    } catch (error) {
      setRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = professional.cellphone || professional.telephone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = `Olá ${professional.full_name}! Vi seu perfil na VINKO e gostaria de conversar sobre um projeto.`;
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      setShowNoPhoneModal(true);
    }
  };




  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{professional.full_name}</h2>
                  <div className="flex items-center space-x-2 text-gray-500 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{professional.city}, {professional.uf}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <StarRating 
                      rating={professional.rating_avg || 0} 
                      size="sm"
                    />
                    <span className="text-sm text-gray-600">
                      {professional.rating_avg ? professional.rating_avg.toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Sobre */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Sobre</h3>
                <div className="max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <p className="text-gray-600 break-words whitespace-pre-wrap">
                    {professional.about_me || 'Nenhuma informação disponível.'}
                  </p>
                </div>
              </div>

            {/* Serviços */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Award className="h-4 w-4 mr-2 text-gray-500" />
                Serviços Oferecidos
              </h3>
              {professional.services && professional.services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {professional.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhum serviço informado.</p>
              )}
            </div>

            {/* Áreas */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2 text-gray-500" />
                Áreas de Atuação
              </h3>
              {professional.areas && professional.areas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {professional.areas.map((area, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma área informada.</p>
              )}
            </div>

            {/* Especialidades */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-2 text-gray-500" />
                Especialidades
              </h3>
              {professional.specialties && professional.specialties.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {professional.specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma especialidade informada.</p>
              )}
            </div>

            {/* Tipo de Tecido */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Layers className="h-4 w-4 mr-2 text-gray-500" />
                Tipo de Tecido
              </h3>
              {professional.tecid_type ? (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {professional.tecid_type}
                </span>
              ) : (
                <p className="text-gray-500 text-sm">Tipo de tecido não informado.</p>
              )}
            </div>

            {/* Anos de Experiência */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-gray-500" />
                Anos de Experiência
              </h3>
              {professional.year_experience ? (
                <p className="text-gray-600">{professional.year_experience} anos</p>
              ) : (
                <p className="text-gray-500 text-sm">Anos de experiência não informados.</p>
              )}
            </div>

            {/* Disponibilidade */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                Disponibilidade
              </h3>
              {professional.availability ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {typeof professional.availability === 'number' 
                    ? getAvailabilityName(professional.availability)
                    : professional.availability}
                </span>
              ) : (
                <p className="text-gray-500 text-sm">Disponibilidade não informada.</p>
              )}
            </div>

            {/* Avaliações dos Clientes */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-500" />
                Avaliações dos Clientes
              </h3>
              
              {loadingRatings ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Carregando avaliações...</p>
                </div>
              ) : ratings.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhuma avaliação ainda</p>
                  <p className="text-gray-400 text-sm">Ainda não há avaliações para este profissional</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {ratings.map((rating) => {
                    const isCurrentUserRating = currentUserId && rating.client === currentUserId;
                    
                    return (
                      <div 
                        key={rating.id} 
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isCurrentUserRating ? 'bg-pink-100' : 'bg-blue-100'
                            }`}>
                              <User className={`h-3 w-3 ${
                                isCurrentUserRating ? 'text-pink-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {rating.client_full_name || `Cliente #${rating.client}`}
                                {isCurrentUserRating && (
                                  <span className="ml-2 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                                    Você
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center space-x-2">
                                <StarRating rating={rating.score} size="sm" />
                                <span className="text-xs text-gray-600">
                                  {rating.score} estrela{rating.score !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(rating.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {rating.comment && rating.comment.trim() ? (
                          <p className="text-gray-600 text-sm mt-2 pl-8">
                            "{rating.comment}"
                          </p>
                        ) : (
                          <p className="text-gray-500 text-sm mt-2 pl-8 italic">
                            Sem comentário
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contato</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>
                    {professional.cellphone && professional.cellphone.trim() 
                      ? professional.cellphone 
                      : 'Telefone pessoal não informado'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>
                    {professional.company_cellphone && professional.company_cellphone.trim() 
                      ? `${professional.company_cellphone} (Empresa)` 
                      : 'Telefone da empresa não informado'
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>
                    {professional.email && professional.email.trim() 
                      ? professional.email 
                      : 'E-mail não informado'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={handleWhatsApp}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </button>
              
              <button
                onClick={() => {
                  onStartConversation?.(professional.id);
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

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            if (onCloseRatingModal) {
              onCloseRatingModal();
            }
          }}
          professionalId={professional.id}
          professionalName={professional.full_name}
          existingRating={existingRating}
          onRatingSubmit={async (rating, comment) => {
            if (onRatingSubmit) {
              await onRatingSubmit(rating, comment);
            }
          }}
          onRatingDelete={async () => {
            if (onRatingDelete) {
              await onRatingDelete();
            }
          }}
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
                O profissional <span className="font-medium">{professional.full_name}</span> não possui telefone cadastrado para WhatsApp.
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
    </>
  );
}
