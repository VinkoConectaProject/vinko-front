import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Users, Calendar, MapPin, DollarSign, Clock, CheckCircle, X, Upload, Image, MessageSquare, Tag, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Demand } from '../../types';
import { BRAZILIAN_STATES, MAJOR_CITIES } from '../../data/locations';

interface MyDemandsPageProps {
  showCreateForm?: boolean;
  selectedDemandId?: string | null;
  onCloseForm?: () => void;
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export function MyDemandsPage({ showCreateForm = false, selectedDemandId, onCloseForm, onStartConversation }: MyDemandsPageProps) {
  const { state, dispatch } = useApp();
  const [internalShowCreateForm, setInternalShowCreateForm] = useState(showCreateForm);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(
    selectedDemandId ? state.demands.find(d => d.id === selectedDemandId) || null : null
  );
  const [viewingDemand, setViewingDemand] = useState<Demand | null>(null);

  const userDemands = state.demands.filter(d => d.clientId === state.currentUser?.id);

  // Update internal state when props change
  React.useEffect(() => {
    setInternalShowCreateForm(showCreateForm);
  }, [showCreateForm]);

  React.useEffect(() => {
    if (selectedDemandId) {
      const demand = state.demands.find(d => d.id === selectedDemandId);
      setSelectedDemand(demand || null);
    }
  }, [selectedDemandId, state.demands]);
  const handleDeleteDemand = (demandId: string) => {
    const demand = state.demands.find(d => d.id === demandId);
    if (demand && demand.interestedProfessionals.length > 0) {
      alert('Não é possível excluir uma demanda que já possui profissionais interessados.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta demanda?')) {
      dispatch({ type: 'DELETE_DEMAND', payload: demandId });
    }
  };

  const handleStatusChange = (demandId: string, newStatus: 'open' | 'in_progress' | 'completed') => {
    const demand = state.demands.find(d => d.id === demandId);
    if (demand) {
      const updatedDemand = { ...demand, status: newStatus, updatedAt: new Date() };
      dispatch({ type: 'UPDATE_DEMAND', payload: updatedDemand });
    }
  };

  const handleSelectProfessional = (demandId: string, professionalId: string) => {
    const demand = state.demands.find(d => d.id === demandId);
    if (!demand) return;

    const updatedDemand = {
      ...demand,
      selectedProfessional: professionalId,
      status: 'in_progress' as const,
      updatedAt: new Date(),
    };

    dispatch({ type: 'UPDATE_DEMAND', payload: updatedDemand });

    // Notify selected professional
    const notification = {
      id: Date.now().toString(),
      userId: professionalId,
      type: 'selected' as const,
      title: 'Você foi selecionado!',
      message: `Você foi selecionado para o projeto: ${demand.title}`,
      isRead: false,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Demandas</h1>
          <p className="text-gray-600">
            Gerencie suas demandas e acompanhe o progresso dos projetos
          </p>
        </div>
        
        <button
          onClick={() => setInternalShowCreateForm(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Demanda
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Abertas', value: userDemands.filter(d => d.status === 'open').length, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Em Andamento', value: userDemands.filter(d => d.status === 'in_progress').length, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Concluídas', value: userDemands.filter(d => d.status === 'completed').length, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total', value: userDemands.length, color: 'text-purple-600', bg: 'bg-purple-100' },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <div className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Demands List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {userDemands.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Você ainda não criou nenhuma demanda</p>
            <p className="text-gray-400 text-sm mt-2 mb-6">
              Publique sua primeira demanda para começar a receber propostas
            </p>
            <button
              onClick={() => setInternalShowCreateForm(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira demanda
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userDemands.map((demand) => (
              <div 
                key={demand.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setViewingDemand(demand)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{demand.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(demand.status)}`}>
                        {getStatusLabel(demand.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{demand.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(demand.deadline).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {demand.location.city}, {demand.location.state}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {demand.interestedProfessionals.length} interessados
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDemand(demand);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <select
                      value={demand.status}
                      onChange={(e) => handleStatusChange(demand.id, e.target.value as any)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                      title="Alterar status"
                    >
                      <option value="open">Aberta</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="completed">Concluída</option>
                    </select>
                    
                    {demand.status === 'open' && demand.interestedProfessionals.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDemand(demand);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    
                    {demand.interestedProfessionals.length === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDemand(demand.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demand View Modal */}
      {viewingDemand && (
        <DemandViewModal
          demand={viewingDemand}
          onClose={() => setViewingDemand(null)}
        />
      )}

      {/* Demand Details Modal */}
      {selectedDemand && (
        <DemandDetailsModal
          demand={selectedDemand}
          onClose={() => setSelectedDemand(null)}
          onSelectProfessional={handleSelectProfessional}
          professionals={state.professionalProfiles}
        />
      )}

      {/* Create/Edit Demand Form */}
      {(internalShowCreateForm || editingDemand) && (
        <DemandForm
          demand={editingDemand}
          onClose={() => {
            setInternalShowCreateForm(false);
            setEditingDemand(null);
            onCloseForm?.();
          }}
          onSave={(demandData) => {
            if (editingDemand) {
              dispatch({ type: 'UPDATE_DEMAND', payload: { ...editingDemand, ...demandData, updatedAt: new Date() } });
            } else {
              const newDemand: Demand = {
                id: Date.now().toString(),
                clientId: state.currentUser?.id || '',
                interestedProfessionals: [],
                status: 'open',
                createdAt: new Date(),
                updatedAt: new Date(),
                ...demandData,
              };
              dispatch({ type: 'ADD_DEMAND', payload: newDemand });
            }
            setInternalShowCreateForm(false);
            setEditingDemand(null);
            onCloseForm?.();
          }}
        />
      )}
    </div>
  );
}

interface DemandViewModalProps {
  demand: Demand;
  onClose: () => void;
}

function DemandViewModal({ demand, onClose }: DemandViewModalProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; index: number } | null>(null);

  const openImageModal = (src: string, index: number) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-semibold text-gray-900">{demand.title}</h2>
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(demand.status)}`}>
                {getStatusLabel(demand.status)}
              </span>
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
          {/* Descrição */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
              Descrição do Projeto
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">{demand.description}</p>
            </div>
          </div>

          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoria */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-purple-600" />
                Categoria
              </h3>
              <span className="inline-block px-3 py-2 bg-purple-100 text-purple-800 rounded-lg">
                {demand.serviceType}
              </span>
            </div>

            {/* Status */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-600" />
                Status Atual
              </h3>
              <span className={`inline-block px-3 py-2 rounded-lg ${getStatusColor(demand.status)}`}>
                {getStatusLabel(demand.status)}
              </span>
            </div>
          </div>

          {/* Orçamento e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Faixa de Preço
              </h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-green-700">
                  R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Data Limite
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700 font-medium">
                  {new Date(demand.deadline).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Localização */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-red-600" />
              Localização
            </h3>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-red-700 font-medium">
                  {demand.location.city}, {demand.location.state}
                </p>
                {demand.location.isRemote && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Trabalho remoto aceito
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interessados */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Users className="h-5 w-5 mr-2 text-orange-600" />
              Profissionais Interessados
            </h3>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-orange-700 font-medium">
                  {demand.interestedProfessionals.length} profissionais demonstraram interesse
                </p>
                {demand.interestedProfessionals.length > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Com interesse
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Imagens Anexadas */}
          {demand.attachments && demand.attachments.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Image className="h-5 w-5 mr-2 text-indigo-600" />
                Imagens do Projeto ({demand.attachments.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        alt={`Imagem ${index + 1} do projeto enviado pelo cliente`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-75 transition-opacity"
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

          {/* Informações de Data */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Criada em:</span>
                <p>{new Date(demand.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              <div>
                <span className="font-medium">Última atualização:</span>
                <p>{new Date(demand.updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
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

interface DemandDetailsModalProps {
  demand: Demand;
  onClose: () => void;
  onSelectProfessional: (demandId: string, professionalId: string) => void;
  professionals: any[];
}

function DemandDetailsModal({ demand, onClose, onSelectProfessional, professionals }: DemandDetailsModalProps) {
  const interestedProfessionals = professionals.filter(p => 
    demand.interestedProfessionals.includes(p.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-gray-900">{demand.title}</h2>
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
            <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
            <p className="text-gray-600">{demand.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Orçamento</h3>
              <p className="text-green-600 font-medium">
                R$ {demand.budget.min.toLocaleString()} - R$ {demand.budget.max.toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Prazo</h3>
              <p className="text-gray-600">{new Date(demand.deadline).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Localização</h3>
            <p className="text-gray-600">
              {demand.location.city}, {demand.location.state}
              {demand.location.isRemote && <span className="ml-2 text-blue-600">(Trabalho remoto aceito)</span>}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">
              Profissionais Interessados ({interestedProfessionals.length})
            </h3>
            {interestedProfessionals.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum profissional demonstrou interesse ainda</p>
            ) : (
              <div className="space-y-3">
                {interestedProfessionals.map((professional) => (
                  <div key={professional.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{professional.name}</p>
                        <p className="text-sm text-gray-500">{professional.city}, {professional.state}</p>
                      </div>
                    </div>
                    
                    {demand.status === 'open' && (
                      <button
                        onClick={() => onSelectProfessional(demand.id, professional.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Selecionar
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        // Start conversation with professional
                        const message = `Olá ${professional.name}! Vi que você tem interesse na minha demanda "${demand.title}". Vamos conversar sobre os detalhes?`;
                        // This would need to be passed as a prop from parent component
                        // For now, we'll use a simple alert
                        alert('Funcionalidade de conversa será implementada em breve');
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Conversar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DemandFormProps {
  demand?: Demand | null;
  onClose: () => void;
  onSave: (demandData: any) => void;
}

function DemandForm({ demand, onClose, onSave }: DemandFormProps) {
  const [formData, setFormData] = useState({
    title: demand?.title || '',
    description: demand?.description || '',
    serviceType: demand?.serviceType || '',
    deadline: demand?.deadline ? new Date(demand.deadline).toISOString().split('T')[0] : '',
    budget: {
      min: demand?.budget.min || 0,
      max: demand?.budget.max || 0,
    },
    location: {
      city: demand?.location.city || '',
      state: demand?.location.state || '',
      isRemote: demand?.location.isRemote || false,
    },
  });

  // State to manage images
  const [imageUrls, setImageUrls] = useState<string[]>(demand?.attachments || []);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const [citySearch, setCitySearch] = useState(demand?.location.city || '');
  const [stateSearch, setStateSearch] = useState(demand?.location.state || '');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingImages(true);

    // Processar arquivos de forma simples
    Promise.all(
      files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    ).then(base64Images => {
      setImageUrls(prev => [...prev, ...base64Images]);
      setIsProcessingImages(false);
      e.target.value = '';
    }).catch(error => {
      console.error('Erro no upload:', error);
      setIsProcessingImages(false);
      e.target.value = '';
    });
  };

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

  // Filter cities based on search
  const filteredCities = MAJOR_CITIES.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 10);

  // Filter states based on search
  const filteredStates = BRAZILIAN_STATES.filter(state =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
    state.code.toLowerCase().includes(stateSearch.toLowerCase())
  ).slice(0, 10);

  const handleCitySelect = (city: string) => {
    setCitySearch(city);
    setFormData(prev => ({ 
      ...prev, 
      location: { ...prev.location, city } 
    }));
    setShowCitySuggestions(false);
  };

  const handleStateSelect = (state: { code: string; name: string }) => {
    setStateSearch(state.code);
    setFormData(prev => ({ 
      ...prev, 
      location: { ...prev.location, state: state.code } 
    }));
    setShowStateSuggestions(false);
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      attachments: imageUrls
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold text-gray-900">
              {demand ? 'Editar Demanda' : 'Nova Demanda'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Projeto
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Criação de logotipo para empresa"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição Detalhada
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descreva detalhadamente o que precisa ser feito..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço
            </label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Selecione um tipo de serviço</option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Mínimo (R$)
              </label>
              <input
                type="number"
                value={formData.budget.min}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budget: { ...prev.budget, min: Number(e.target.value) } 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Máximo (R$)
              </label>
              <input
                type="number"
                value={formData.budget.max}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budget: { ...prev.budget, max: Number(e.target.value) } 
                }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="5000"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo Final
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value } 
                    }));
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite o nome da cidade"
                  required
                />
                {showCitySuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCities.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={stateSearch}
                  onChange={(e) => {
                    setStateSearch(e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, state: e.target.value } 
                    }));
                    setShowStateSuggestions(true);
                  }}
                  onFocus={() => setShowStateSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Digite o estado ou UF"
                  required
                />
                {showStateSuggestions && filteredStates.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStates.map((state, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleStateSelect(state)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        <div className="flex justify-between">
                          <span>{state.name}</span>
                          <span className="text-gray-500 text-sm">{state.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.location.isRemote}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, isRemote: e.target.checked } 
                }))}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Aceito trabalho remoto</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens do Projeto (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isProcessingImages}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`${isProcessingImages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} flex flex-col items-center`}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {isProcessingImages ? 'Processando...' : 'Clique para adicionar imagens ou arraste aqui'}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PNG, JPG até 5MB cada (máximo 10 imagens)
                </span>
              </label>
            </div>
            
            {isProcessingImages && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                  <span className="text-sm text-gray-600">
                    Processando imagens... Isso pode levar alguns segundos.
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Não feche esta janela durante o processamento
                </div>
              </div>
            )}
            
            {imageUrls.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">
                  {imageUrls.length} imagem{imageUrls.length !== 1 ? 's' : ''} adicionada{imageUrls.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <ImageWithFallback
                        src={url}
                        alt={`Preview da imagem ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isProcessingImages}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              {demand ? 'Salvar Alterações' : 'Publicar Demanda'}
            </button>
          </div>
        </form>
      </div>
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

  // Only render img tag if src has a valid value
  if (!src || src.trim() === '') {
    return (
      <div 
        className={`${className} bg-gray-100 flex flex-col items-center justify-center text-gray-500 cursor-pointer`}
        onClick={onClick}
      >
        <Image className="h-8 w-8 mb-2" />
        <span className="text-xs text-center px-2">Sem imagem</span>
      </div>
    );
  }

  if (imageError) {
    return (
      <div 
        className={`${className} bg-gray-100 flex flex-col items-center justify-center text-gray-500 cursor-pointer`}
        onClick={onClick}
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
      className={`${className} cursor-pointer`}
      onClick={onClick}
      onError={handleImageError}
      style={{ objectFit: 'cover' }}
    />
  );
}