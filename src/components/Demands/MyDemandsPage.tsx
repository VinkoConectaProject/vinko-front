import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  MessageSquare, 
  Heart, 
  X, 
  Clock, 
  CheckCircle,
  Star,
  Award,
  MessageCircle,
  Phone
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { BRAZILIAN_STATES } from '../../data/locations';
import { Demand, CreateDemandRequest, UpdateDemandRequest, InterestedProfessional, ProfessionalSearchResult } from '../../types';
import { demandService } from '../../services/demandService';
import { useApiMessage } from '../../hooks/useApiMessage';
import { userService } from '../../services/userService';
import { Toast } from '../UI/Toast';
import { ApiMessage } from '../UI/ApiMessage';
import { LocationService } from '../../services/locationService';
import { ProfessionalProfileModal } from '../UI/ProfessionalProfileModal';
import { ratingService } from '../../services/ratingService';

interface MyDemandsPageProps {
  showCreateForm?: boolean;
  selectedDemandId?: string | null;
  onCloseForm?: () => void;
  onStartConversation?: (otherUserId: string, demandId?: string, initialMessage?: string) => void;
}

export function MyDemandsPage({ showCreateForm, selectedDemandId, onCloseForm, onStartConversation }: MyDemandsPageProps) {
  const { state } = useApp();
  const { apiMessage, showMessage, hideMessage } = useApiMessage();
  
  // Funções para toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemandForm, setShowDemandForm] = useState(showCreateForm || false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showRatingModal, setShowRatingModal] = useState<{ demandId: string; professionalId: string; professionalName?: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ demandId: string; demandTitle: string } | null>(null);
  const [showDeleteFileModal, setShowDeleteFileModal] = useState<{ fileId: number; fileName: string } | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState<boolean>(false);
  const [selectedProfessionalData, setSelectedProfessionalData] = useState<{
    id: number;
    full_name: string;
    services: string[];
    areas: string[];
    specialties: string[];
    tecid_type: string;
    uf: string;
    city: string;
    email: string;
    availability: string;
    cellphone: string;
    rating_avg: number;
    rating_count: number;
    work_count: number;
    about_me?: string;
    year_experience: number;
    company_cellphone?: string;
  } | null>(null);
  const [showProfessionalRatingModal, setShowProfessionalRatingModal] = useState<boolean>(false);
  const [professionalRatingRefresh, setProfessionalRatingRefresh] = useState<number>(0);
  const [selectedProfessionalsData, setSelectedProfessionalsData] = useState<Record<string, {
    id: number;
    rating_avg: number;
    work_count: number;
    full_name: string;
  }>>({});
  const [pendingFinalization, setPendingFinalization] = useState<string | null>(null);
  
  // Estado para toast
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [showCandidatesModal, setShowCandidatesModal] = useState<boolean>(false);
  const [selectedDemandForCandidates, setSelectedDemandForCandidates] = useState<Demand | null>(null);
  const [apiDemands, setApiDemands] = useState<Demand[]>([]);
  const [demandCounters, setDemandCounters] = useState({
    total: 0,
    abertas: 0,
    emAndamento: 0,
    concluidas: 0,
  });
  const [isLoadingDemands, setIsLoadingDemands] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    service: '',
    area: '',
    specialty: '',
    tecidType: '',
    availability: '',
    deadline: '',
    budgetMin: '',
    budgetMax: '',
    city: '',
    uf: '',
  });

  // Estados para validação visual
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    description?: string;
    service?: string;
    area?: string;
    specialty?: string;
    availability?: string;
    budget?: string;
  }>({});

  // Estados para notificação

  // Estados para upload de arquivos
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<{id: number; file: string; created_at: string; updated_at: string; demand: number}[]>([]);
  const [originalFiles, setOriginalFiles] = useState<{id: number; file: string; created_at: string; updated_at: string; demand: number}[]>([]);

  // Estados para opções dos dropdowns
  const [options, setOptions] = useState({
    services: [] as { id: number; name: string; areas?: { id: number; name: string }[] }[],
    serviceAreas: [] as { id: number; name: string }[],
    specialties: [] as { id: number; name: string }[],
    availabilities: [] as { id: number; name: string }[],
  });

  // Estados para cidades
  const [cities, setCities] = useState<{ id: number; nome: string }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);


  // Estados para opções filtradas
  const [filteredServiceAreas, setFilteredServiceAreas] = useState<{ id: number; name: string }[]>([]);


  // Usar demandas da API em vez do estado local
  const userDemands = apiDemands;
  
  // Filtrar demandas baseado na aba ativa (busca agora é feita na API)
  const filteredDemands = userDemands.filter(demand => {
    const matchesTab = activeTab === 'all' || demand.status === activeTab;
    return matchesTab;
  });

  const loadSelectedProfessionalsData = useCallback(async (demands: Demand[]) => {
    const professionalsData: Record<string, {
      id: number;
      rating_avg: number;
      work_count: number;
      full_name: string;
    }> = {};

    // Carregar dados de cada profissional selecionado
    for (const demand of demands) {
      if (demand.selectedProfessional) {
        try {
          const professionalData = await demandService.getChosenProfessional(parseInt(demand.id));
          professionalsData[demand.id] = {
            id: professionalData.id,
            rating_avg: professionalData.rating_avg || 0,
            work_count: professionalData.work_count || 0,
            full_name: professionalData.full_name
          };
        } catch (error) {
          console.error(`Erro ao carregar dados do profissional da demanda ${demand.id}:`, error);
          // Se não conseguir carregar, usar dados básicos
          professionalsData[demand.id] = {
            id: 0,
            rating_avg: 0,
            work_count: 0,
            full_name: 'Profissional'
          };
        }
      }
    }

    setSelectedProfessionalsData(professionalsData);
  }, []);

  // Função para carregar demandas da API
  const loadDemands = useCallback(async (searchTerm?: string) => {
    try {
      setIsLoadingDemands(true);
      const { demands, counters } = await demandService.getDemands(searchTerm);
      setApiDemands(demands);
      setDemandCounters(counters);
      
      // Carregar dados dos profissionais selecionados
      await loadSelectedProfessionalsData(demands);
    } catch (error) {
      console.error('Erro ao carregar demandas:', error);
      showMessage('Erro ao carregar demandas. Tente novamente.', 'error');
    } finally {
      setIsLoadingDemands(false);
    }
  }, [showMessage, loadSelectedProfessionalsData]);

  // Carregar demandas quando o componente montar
  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  // Carregar opções dos dropdowns
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [services, serviceAreas, specialties, availabilities] = await Promise.all([
          userService.getServices(),
          userService.getServiceAreas(),
          userService.getSpecialties(),
          userService.getAvailabilities(),
        ]);

        setOptions({
          services,
          serviceAreas,
          specialties,
          availabilities,
        });

        // Inicializar opções filtradas
        setFilteredServiceAreas(serviceAreas);
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      }
    };

    loadOptions();
  }, []);


  // Função para carregar cidades baseado no estado selecionado
  const loadCitiesByState = async (stateCode: string) => {
    if (!stateCode) {
      setCities([]);
      return;
    }

    setLoadingCities(true);
    
    try {
      const citiesData = await LocationService.getCitiesByState(stateCode);
      setCities(citiesData);
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };


  const stats = [
    { label: 'Total', value: demandCounters.total, status: 'all' },
    { label: 'Abertas', value: demandCounters.abertas, status: 'open' },
    { label: 'Em Andamento', value: demandCounters.emAndamento, status: 'in_progress' },
    { label: 'Concluídas', value: demandCounters.concluidas, status: 'completed' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit chamado', formData);
    
    // Limpar erros anteriores
    setValidationErrors({});
    
    try {
      // Validar campos obrigatórios
      const errors: typeof validationErrors = {};
      
      if (!formData.title) errors.title = 'Título é obrigatório';
      if (!formData.description) errors.description = 'Descrição é obrigatória';
      if (!formData.service) errors.service = 'Tipo de serviço é obrigatório';
      if (!formData.area) errors.area = 'Área de atuação é obrigatória';
      if (!formData.specialty) errors.specialty = 'Especialidade é obrigatória';
      if (!formData.availability || formData.availability === '') errors.availability = 'Disponibilidade é obrigatória';
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      // Função para converter valor formatado para número
      const parseCurrency = (value: string): number => {
        if (!value) return 0;
        const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      };

      // Validação de orçamento
      const minBudget = parseCurrency(formData.budgetMin);
      const maxBudget = parseCurrency(formData.budgetMax);
      console.log('Validação de orçamento:', { minBudget, maxBudget, budgetMin: formData.budgetMin, budgetMax: formData.budgetMax });
      
      if (minBudget > 0 && maxBudget > 0 && minBudget > maxBudget) {
        console.log('Erro: orçamento mínimo maior que máximo');
        setValidationErrors({ budget: 'O orçamento mínimo não pode ser maior que o máximo.' });
        return;
      }

      // Preparar dados para a API
      const demandData: CreateDemandRequest = {
      title: formData.title,
      description: formData.description,
        amount: parseInt(formData.amount) || 1,
        availability: parseInt(formData.availability),
        service: parseInt(formData.service),
        area: parseInt(formData.area),
        specialty: parseInt(formData.specialty),
        tecid_type: formData.tecidType as "AMBOS" | "MALHA" | "PLANO",
        deadline: formData.deadline || null,
        city: formData.city,
        uf: formData.uf,
        min_budget: parseCurrency(formData.budgetMin),
        max_budget: parseCurrency(formData.budgetMax),
        remote_work_accepted: false,
      };

      if (editingDemand) {
        // Atualizar demanda existente
        await demandService.updateDemand(parseInt(editingDemand.id), demandData);
        
        // Upload de arquivos novos se houver
        if (uploadedFiles.length > 0) {
          try {
            for (const file of uploadedFiles) {
              await demandService.uploadDemandFiles(parseInt(editingDemand.id), [file]);
            }
          } catch (uploadError) {
            console.error('Erro ao fazer upload dos novos arquivos:', uploadError);
            showToast('Demanda atualizada, mas houve erro no upload dos novos arquivos.', 'error');
          }
        }
        
        // Deletar arquivos que foram removidos
        const originalFileIds = originalFiles.map(f => f.id);
        const currentFileIds = existingFiles.map(f => f.id);
        const filesToDelete = originalFileIds.filter(id => !currentFileIds.includes(id));
        
        if (filesToDelete.length > 0) {
          try {
            for (const fileId of filesToDelete) {
              await demandService.deleteDemandFile(fileId);
            }
          } catch (deleteError) {
            console.error('Erro ao deletar arquivos:', deleteError);
            showToast('Demanda atualizada, mas houve erro ao remover alguns arquivos.', 'error');
          }
        }
        
        // Recarregar lista de demandas
        await loadDemands();
        
        // Fechar formulário e limpar dados
        setShowDemandForm(false);
        setEditingDemand(null);
        setFormData({
          title: '',
          description: '',
          amount: '',
          service: '',
          area: '',
          specialty: '',
          tecidType: '',
          availability: '',
          deadline: '',
          budgetMin: '',
          budgetMax: '',
          city: '',
          uf: '',
        });
        
        // Limpar erros e mostrar sucesso
        setValidationErrors({});
        setUploadedFiles([]);
        setFilePreviews([]);
        setExistingFiles([]);
        showToast('Demanda atualizada com sucesso!', 'success');
      } else {
        // Criar nova demanda
      const createdDemand = await demandService.createDemand(demandData);
      
        // Upload de arquivos se houver - um por vez
      if (uploadedFiles.length > 0) {
        try {
            for (const file of uploadedFiles) {
              await demandService.uploadDemandFiles(createdDemand.id, [file]);
            }
        } catch (uploadError) {
          console.error('Erro ao fazer upload dos arquivos:', uploadError);
            showToast('Demanda criada, mas houve erro no upload dos arquivos.', 'error');
        }
      }
      
      // Recarregar lista de demandas
      await loadDemands();
      
      // Fechar formulário e limpar dados
    setShowDemandForm(false);
    setFormData({
      title: '',
      description: '',
        amount: '',
        service: '',
        area: '',
        specialty: '',
        tecidType: '',
        availability: '',
      deadline: '',
      budgetMin: '',
      budgetMax: '',
      city: '',
      uf: '',
    });
      
      // Limpar erros e mostrar sucesso
      setValidationErrors({});
      setUploadedFiles([]);
      setFilePreviews([]);
        showToast('Demanda criada com sucesso!', 'success');
      }
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      showToast('Erro ao criar demanda. Tente novamente.', 'error');
    }
  };



  const handleDeleteDemand = (demandId: string) => {
    const demand = apiDemands.find(d => d.id === demandId);
    if (demand) {
      setShowDeleteModal({ demandId, demandTitle: demand.title });
    }
  };

  const handleEditDemand = async (demand: Demand) => {
    try {
      // Buscar dados completos da demanda
      const fullDemandData = await demandService.getDemand(parseInt(demand.id));
      
      setEditingDemand(demand);
      
      // Preencher o formulário com os dados da demanda
      setFormData({
        title: fullDemandData.title,
        description: fullDemandData.description,
        amount: fullDemandData.amount.toString(),
        service: fullDemandData.service.toString(),
        area: fullDemandData.area.toString(),
        specialty: fullDemandData.specialty.toString(),
        tecidType: fullDemandData.tecid_type,
        availability: fullDemandData.availability.toString(),
        deadline: fullDemandData.deadline ? new Date(fullDemandData.deadline).toISOString().split('T')[0] : '',
        budgetMin: fullDemandData.min_budget ? `R$ ${parseFloat(fullDemandData.min_budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
        budgetMax: fullDemandData.max_budget ? `R$ ${parseFloat(fullDemandData.max_budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
        city: fullDemandData.city,
        uf: fullDemandData.uf,
      });
      
      // Filtrar áreas baseado no serviço selecionado
      if (fullDemandData.service) {
        const selectedService = options.services.find(s => s.id === fullDemandData.service);
        if (selectedService && selectedService.areas) {
          setFilteredServiceAreas(selectedService.areas);
        } else {
          setFilteredServiceAreas(options.serviceAreas);
        }
      }
      
      // Carregar cidades se necessário
      if (fullDemandData.uf) {
        await loadCitiesByState(fullDemandData.uf);
      }
      
      // Carregar arquivos existentes da demanda
      try {
        const files = await demandService.getDemandFiles(parseInt(demand.id));
        setExistingFiles(files);
        setOriginalFiles(files); // Salvar cópia dos arquivos originais
      } catch (error) {
        console.error('Erro ao carregar arquivos da demanda:', error);
        setExistingFiles([]);
        setOriginalFiles([]);
      }
      
      setShowDemandForm(true);
    } catch (error) {
      console.error('Erro ao carregar dados da demanda:', error);
      showMessage('Erro ao carregar dados da demanda. Tente novamente.', 'error');
    }
  };

  const confirmDeleteDemand = async () => {
    if (!showDeleteModal) return;
    
    try {
      await demandService.deleteDemand(parseInt(showDeleteModal.demandId));
      await loadDemands(searchTerm);
      setShowDeleteModal(null);
      showMessage('Demanda excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir demanda:', error);
      showMessage('Erro ao excluir demanda. Tente novamente.', 'error');
    }
  };

  // Função para confirmar exclusão de arquivo
  const confirmDeleteFile = async () => {
    if (!showDeleteFileModal) return;
    
    try {
      await demandService.deleteDemandFile(showDeleteFileModal.fileId);
      
      // Remover arquivo da lista local
      setExistingFiles((prev: {id: number; file: string; created_at: string; updated_at: string; demand: number}[]) => 
        prev.filter((file: {id: number; file: string; created_at: string; updated_at: string; demand: number}) => file.id !== showDeleteFileModal.fileId)
      );
      
      // Também remover dos arquivos originais se estiver editando
      if (editingDemand) {
        setOriginalFiles((prev: {id: number; file: string; created_at: string; updated_at: string; demand: number}[]) => 
          prev.filter((file: {id: number; file: string; created_at: string; updated_at: string; demand: number}) => file.id !== showDeleteFileModal.fileId)
        );
      }
      
      setShowDeleteFileModal(null);
      showToast('Arquivo excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      showToast('Erro ao excluir arquivo. Tente novamente.', 'error');
    }
  };

  const handleSubmitRating = async () => {
    if (!showRatingModal) return;
    
    try {
      // Finalizar demanda via API
      await handleFinalizeAfterRating(showRatingModal.demandId);
      setShowRatingModal(null);
    } catch (error) {
      console.error('Erro ao finalizar demanda:', error);
      showMessage('Erro ao finalizar demanda. Tente novamente.', 'error');
    }
  };


  const handleViewProfessional = async (demandId: string) => {
    try {
      const professionalData = await demandService.getChosenProfessional(parseInt(demandId));
      setSelectedProfessionalData(professionalData);
      setShowProfessionalModal(true);
    } catch (error) {
      console.error('Erro ao carregar dados do profissional:', error);
      showMessage('Erro ao carregar dados do profissional. Tente novamente.', 'error');
    }
  };

  const refreshProfessionalData = async () => {
    if (!selectedProfessionalData) return;
    
    try {
      // Em vez de tentar recarregar os dados do profissional (que pode dar 404),
      // vamos carregar as avaliações e calcular a média diretamente
      const ratingsResponse = await ratingService.getRatingsByProfessional(selectedProfessionalData.id);
      if (ratingsResponse.status === 'success' && ratingsResponse.data) {
        const ratings = ratingsResponse.data;
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length 
          : 0;
        
        // Atualizar apenas os campos de rating mantendo o resto dos dados
        setSelectedProfessionalData(prev => prev ? {
          ...prev,
          rating_avg: averageRating,
          rating_count: ratings.length
        } : null);

        // Atualizar também os dados do card
        updateCardProfessionalData(selectedProfessionalData.id, averageRating, selectedProfessionalData.work_count || 0);
      }
    } catch (ratingError) {
      console.error('Erro ao carregar avaliações para atualização:', ratingError);
      // Se não conseguir carregar as avaliações, não fazemos nada
      // Os dados permanecem como estavam
    }
  };

  const updateCardProfessionalData = (professionalId: number, newRatingAvg: number, newWorkCount: number) => {
    setSelectedProfessionalsData(prev => {
      const updated = { ...prev };
      // Encontrar a demanda que tem este profissional
      const demandId = Object.keys(updated).find(id => updated[id].id === professionalId);
      if (demandId) {
        updated[demandId] = {
          ...updated[demandId],
          rating_avg: newRatingAvg,
          work_count: newWorkCount
        };
      }
      return updated;
    });
  };

  const handleRateProfessional = () => {
    setShowProfessionalRatingModal(true);
  };

  const handleStartConversation = (demandId: string, selectedProfessionalUserId: string) => {
    if (onStartConversation) {
      onStartConversation(selectedProfessionalUserId, demandId);
    }
  };

  const handleFinalizeDemand = async (demandId: string) => {
    try {
      // Primeiro, carregar dados do profissional selecionado para avaliar
      const professionalData = await demandService.getChosenProfessional(parseInt(demandId));
      
      // Marcar que esta demanda está pendente de finalização
      setPendingFinalization(demandId);
      
      // Abrir o modal de avaliação
      setShowRatingModal({ 
        demandId: demandId, 
        professionalId: professionalData.id.toString(),
        professionalName: professionalData.full_name
      });
    } catch (error) {
      console.error('Erro ao carregar dados do profissional para finalização:', error);
      showMessage('Erro ao carregar dados do profissional. Tente novamente.', 'error');
    }
  };

  const handleFinalizeAfterRating = async (demandId: string) => {
    try {
      // Obter data atual no formato 'yyyy-mm-dd'
      const currentDate = new Date().toISOString().split('T')[0];
      
      const response = await demandService.updateDemand(parseInt(demandId), {
        status: 'CONCLUÍDA',
        finalized_at: currentDate
      } as UpdateDemandRequest & { finalized_at: string });

      if (response.status === 'success') {
        showMessage('Demanda finalizada com sucesso!', 'success');
        // Recarregar demandas para atualizar o frontend
        await loadDemands();
    } else {
        showMessage('Erro ao finalizar demanda. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao finalizar demanda:', error);
      showMessage('Erro ao finalizar demanda. Tente novamente.', 'error');
    } finally {
      // Limpar pendência de finalização
      setPendingFinalization(null);
    }
  };

  const handleProfessionalRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedProfessionalData) return;
    
    try {
      // Verificar se já existe uma avaliação do usuário para este profissional
      const currentUserId = state.currentUser?.id ? parseInt(state.currentUser.id) : null;
      if (!currentUserId) {
        showMessage('Erro: usuário não identificado.', 'error');
        return;
      }

      // Buscar avaliação existente
      const existingRatingResponse = await ratingService.getRatingByClientProfessional(
        currentUserId,
        selectedProfessionalData.id
      );

      let response;
      if (existingRatingResponse.status === 'success' && existingRatingResponse.data?.id) {
        // Atualizar avaliação existente (PATCH)
        response = await ratingService.updateRating(existingRatingResponse.data.id, {
          score: rating,
          comment: comment || undefined
        });
    } else {
        // Criar nova avaliação (POST)
        response = await ratingService.createRating({
          professional: selectedProfessionalData.id,
          score: rating,
          comment: comment || undefined
        });
      }

      if (response.status === 'success') {
        showMessage('Avaliação enviada com sucesso!', 'success');
        setShowProfessionalRatingModal(false);
        
        // Forçar refresh das avaliações
        setProfessionalRatingRefresh(prev => prev + 1);
        
        // Recarregar dados do profissional para atualizar rating_avg e rating_count
        await refreshProfessionalData();
      } else {
        showMessage('Erro ao enviar avaliação. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      showMessage('Erro ao enviar avaliação. Tente novamente.', 'error');
    }
  };

  const handleProfessionalRatingDelete = async () => {
    if (!selectedProfessionalData) return;
    
    try {
      // Verificar se já existe uma avaliação do usuário para este profissional
      const currentUserId = state.currentUser?.id ? parseInt(state.currentUser.id) : null;
      if (!currentUserId) {
        showMessage('Erro: usuário não identificado.', 'error');
        return;
      }

      // Buscar avaliação existente
      const existingRatingResponse = await ratingService.getRatingByClientProfessional(
        currentUserId,
        selectedProfessionalData.id
      );

      if (existingRatingResponse.status === 'success' && existingRatingResponse.data?.id) {
        // Deletar avaliação existente (DELETE)
        const response = await ratingService.deleteRating(existingRatingResponse.data.id);
        
        if (response.status === 'success') {
          showMessage('Avaliação removida com sucesso!', 'success');
          setShowProfessionalRatingModal(false);
          
          // Forçar refresh das avaliações
          setProfessionalRatingRefresh(prev => prev + 1);
          
          // Recarregar dados do profissional para atualizar rating_avg e rating_count
          await refreshProfessionalData();
    } else {
          showMessage('Erro ao remover avaliação. Tente novamente.', 'error');
        }
      } else {
        showMessage('Nenhuma avaliação encontrada para remover.', 'error');
      }
    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      showMessage('Erro ao remover avaliação. Tente novamente.', 'error');
    }
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
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconhecido';
    }
  };

  React.useEffect(() => {
    if (selectedDemandId) {
      const demand = state.demands.find(d => d.id === selectedDemandId);
      setSelectedDemand(demand || null);
    }
  }, [selectedDemandId, state.demands]);

  React.useEffect(() => {
    setShowDemandForm(showCreateForm || false);
  }, [showCreateForm]);

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Demandas</h1>
            <p className="text-gray-600">Gerencie suas solicitações e acompanhe o progresso dos projetos</p>
          </div>
          <button
            onClick={() => {
              // Limpar formulário ao abrir modal
              setFormData({
                title: '',
                description: '',
                amount: '',
                service: '',
                area: '',
                specialty: '',
                tecidType: '',
                availability: '',
                deadline: '',
                budgetMin: '',
                budgetMax: '',
                city: '',
                uf: '',
              });
              setValidationErrors({});
              setShowDemandForm(true);
            }}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Demanda
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(stat.status)}
            className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-colors ${
              activeTab === stat.status 
                ? 'border-pink-500 bg-pink-50' 
                : 'border-gray-200 hover:border-pink-300'
            }`}
          >
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar demandas..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  loadDemands(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                loadDemands('');
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </button>
        </div>
      </div>

      {/* Demands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoadingDemands ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
            <p className="text-gray-500 text-lg">Carregando demandas...</p>
          </div>
        ) : filteredDemands.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              {activeTab === 'all' 
                ? 'Nenhuma demanda encontrada'
                : `Nenhuma demanda ${getStatusLabel(activeTab).toLowerCase()}`
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {userDemands.length === 0 
                ? 'Crie sua primeira demanda para começar'
                : 'Tente ajustar os filtros ou escolha outra categoria'
              }
            </p>
            {userDemands.length === 0 && (
              <button
                onClick={() => {
                  // Limpar formulário ao abrir modal
                  setFormData({
                    title: '',
                    description: '',
                    amount: '',
                    service: '',
                    area: '',
                    specialty: '',
                    tecidType: '',
                    availability: '',
                    deadline: '',
                    budgetMin: '',
                    budgetMax: '',
                    city: '',
                    uf: '',
                  });
                  setValidationErrors({});
                  setShowDemandForm(true);
                }}
                className="mt-4 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeira Demanda
              </button>
            )}
          </div>
        ) : (
          filteredDemands.map((demand) => {

            return (
              <div
                key={demand.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedDemand(demand)}
              >
                {/* Header */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 
                      className="font-semibold text-gray-900 text-lg leading-tight pr-2 truncate" 
                      title={demand.title}
                    >
                      {demand.title}
                    </h3>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(demand.status)}`}>
                      {getStatusLabel(demand.status)}
                    </span>
                  </div>
                  <p 
                    className="text-gray-600 text-sm leading-relaxed truncate" 
                    title={demand.description}
                  >
                    {demand.description}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                    <span 
                      className="font-medium text-green-600 truncate"
                      title={demand.budget.min > 0 || demand.budget.max > 0 
                        ? (() => {
                            const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString()}` : '';
                            const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString()}` : '';
                            if (min && max) {
                              return `Mín: ${min} - Máx: ${max}`;
                            } else if (min) {
                              return `Mín: ${min}`;
                            } else if (max) {
                              return `Máx: ${max}`;
                            }
                            return '-';
                          })()
                        : '-'
                      }
                    >
                      {demand.budget.min > 0 || demand.budget.max > 0 
                        ? (() => {
                            const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString()}` : '';
                            const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString()}` : '';
                            if (min && max) {
                              return `Mín: ${min} - Máx: ${max}`;
                            } else if (min) {
                              return `Mín: ${min}`;
                            } else if (max) {
                              return `Máx: ${max}`;
                            }
                            return '-';
                          })()
                        : '-'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                    <span 
                      className="truncate"
                      title={`Prazo: ${demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : '-'}`}
                    >
                      Prazo: {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-purple-600 flex-shrink-0" />
                    <span 
                      className="truncate"
                      title={(() => {
                        const { city, state } = demand.location;
                        if (city && state) {
                          return `${city}, ${state}`;
                        } else if (city) {
                          return city;
                        } else if (state) {
                          return state;
                        }
                        return '-';
                      })()}
                    >
                      {(() => {
                        const { city, state } = demand.location;
                        if (city && state) {
                          return `${city}, ${state}`;
                        } else if (city) {
                          return city;
                        } else if (state) {
                          return state;
                        }
                        return '-';
                      })()}
                    </span>
                  </div>

                  {demand.serviceType && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                      <span 
                        className="truncate"
                        title={demand.serviceType}
                      >
                        {demand.serviceType}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <Heart className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                    <span 
                      className="truncate"
                      title={`${demand.interestedProfessionals.length} profissionais interessados`}
                    >
                      {demand.interestedProfessionals.length} profissionais interessados
                    </span>
                  </div>
                </div>

                {/* Selected Professional */}
                {demand.selectedProfessional && (
                  <div 
                    className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewProfessional(demand.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 text-sm">profissional</p>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(selectedProfessionalsData[demand.id]?.rating_avg || 0)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-green-700">
                              ({selectedProfessionalsData[demand.id]?.work_count || 0} trabalhos)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Novos botões para demanda com profissional selecionado */}
                {demand.selectedProfessional && demand.status === 'in_progress' && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartConversation(demand.id, demand.selectedProfessional!);
                      }}
                      className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Conversar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFinalizeDemand(demand.id);
                      }}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Finalizar
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  {demand.status === 'open' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDemandForCandidates(demand);
                        setShowCandidatesModal(true);
                      }}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Gerenciar ({demand.interestedProfessionals.length} candidatos)
                    </button>
                  )}

                  {demand.status === 'in_progress' && !demand.selectedProfessional && (
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDemandForCandidates(demand);
                        setShowCandidatesModal(true);
                      }}
                      className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Gerenciar ({demand.interestedProfessionals.length} candidatos)
                      </button>
                  )}


                  {demand.status === 'completed' && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-blue-900">Projeto Concluído</p>
                      <p className="text-xs text-blue-700">
                        Finalizado em {demand.finalizedAt ? demand.finalizedAt.toLocaleDateString('pt-BR') : new Date(demand.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDemand(demand);
                      }}
                      className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center justify-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDemand(demand.id);
                      }}
                      className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p 
                    className="text-xs text-gray-500 truncate"
                    title={`Criada em ${new Date(demand.createdAt).toLocaleDateString('pt-BR')}`}
                  >
                    Criada em {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Demand Modal */}
      {showDemandForm && (
        <CreateDemandModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowDemandForm(false);
            setEditingDemand(null);
            setValidationErrors({});
            setUploadedFiles([]);
            setFilePreviews([]);
            setExistingFiles([]);
            setOriginalFiles([]);
            onCloseForm?.();
          }}
          editingDemand={editingDemand}
          options={options}
          filteredServiceAreas={filteredServiceAreas}
          setFilteredServiceAreas={setFilteredServiceAreas}
          cities={cities}
          loadingCities={loadingCities}
          loadCitiesByState={loadCitiesByState}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          filePreviews={filePreviews}
          setFilePreviews={setFilePreviews}
          existingFiles={existingFiles}
          onDeleteFile={(fileId, fileName) => setShowDeleteFileModal({ fileId, fileName })}
        />
      )}

      {/* Demand Details Modal */}
      {selectedDemand && (
        <DemandDetailsModal
          demand={selectedDemand}
          updatedDemand={state.demands.find(d => d.id === selectedDemand.id) || selectedDemand}
          onClose={() => setSelectedDemand(null)}
          onManageCandidates={(demand) => {
            setSelectedDemandForCandidates(demand);
            setShowCandidatesModal(true);
          }}
          onEdit={(demand) => {
            setSelectedDemand(null);
            handleEditDemand(demand);
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          professionalId={showRatingModal.professionalId}
          demandId={showRatingModal.demandId}
          demandTitle={apiDemands.find(d => d.id === showRatingModal.demandId)?.title || ''}
          professionalName={showRatingModal.professionalName}
          onSubmit={handleSubmitRating}
          onRatingSuccess={() => {
            // Avaliação foi salva com sucesso, agora o botão Finalizar está habilitado
            console.log('Avaliação salva com sucesso, botão Finalizar habilitado');
          }}
          onClose={() => {
            setShowRatingModal(null);
            // Cancelar finalização pendente se o modal for fechado sem avaliar
            if (pendingFinalization) {
              setPendingFinalization(null);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          demandTitle={showDeleteModal.demandTitle}
          onConfirm={confirmDeleteDemand}
          onCancel={() => setShowDeleteModal(null)}
        />
      )}

      {/* Delete File Confirmation Modal */}
      {showDeleteFileModal && (
        <DeleteFileConfirmationModal
          fileName={showDeleteFileModal.fileName}
          onConfirm={confirmDeleteFile}
          onCancel={() => setShowDeleteFileModal(null)}
        />
      )}
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Modal de Gerenciar Candidatos */}
      {showCandidatesModal && selectedDemandForCandidates && (
        <CandidatesModal
          demand={selectedDemandForCandidates}
          onClose={() => {
            setShowCandidatesModal(false);
            setSelectedDemandForCandidates(null);
          }}
          onProfessionalSelectionChange={(demandId, selectedProfessionalId) => {
            // Atualizar o estado das demandas para refletir a mudança
            setApiDemands((prevDemands: Demand[]) => 
              prevDemands.map((demand: Demand) => 
                demand.id === demandId 
                  ? {
                      ...demand,
                      selectedProfessional: selectedProfessionalId ? selectedProfessionalId.toString() : undefined,
                      status: selectedProfessionalId ? 'in_progress' : 'open'
                    }
                  : demand
              )
            );
          }}
        />
      )}

      {/* Modal do Profissional Selecionado */}
      {showProfessionalModal && selectedProfessionalData && (
        <ProfessionalProfileModal
          key={`${selectedProfessionalData.id}-${selectedProfessionalData.rating_avg}-${selectedProfessionalData.rating_count}`}
          isOpen={showProfessionalModal}
          onClose={() => {
            setShowProfessionalModal(false);
            setSelectedProfessionalData(null);
          }}
          professional={{
            id: selectedProfessionalData.id,
            full_name: selectedProfessionalData.full_name,
            services: selectedProfessionalData.services,
            areas: selectedProfessionalData.areas,
            specialties: selectedProfessionalData.specialties,
            tecid_type: selectedProfessionalData.tecid_type,
            availability: typeof selectedProfessionalData.availability === 'string' 
              ? parseInt(selectedProfessionalData.availability) || 1 
              : selectedProfessionalData.availability, // Manter como número para o tipo
            uf: selectedProfessionalData.uf,
            city: selectedProfessionalData.city,
            email: selectedProfessionalData.email,
            cellphone: selectedProfessionalData.cellphone,
            company_cellphone: selectedProfessionalData.company_cellphone,
            about_me: selectedProfessionalData.about_me,
            year_experience: selectedProfessionalData.year_experience.toString(),
            rating_avg: selectedProfessionalData.rating_avg,
            rating_count: selectedProfessionalData.rating_count,
          }}
          onStartConversation={(professionalId) => {
            // Implementar conversa se necessário
            console.log('Iniciar conversa com profissional:', professionalId);
          }}
          onRateProfessional={handleRateProfessional}
          showRatingModal={showProfessionalRatingModal}
          onCloseRatingModal={() => setShowProfessionalRatingModal(false)}
          onRatingSubmit={handleProfessionalRatingSubmit}
          onRatingDelete={handleProfessionalRatingDelete}
          refreshTrigger={professionalRatingRefresh}
          currentUserId={state.currentUser?.id ? parseInt(state.currentUser.id) : undefined}
        />
      )}

      {/* ApiMessage para mostrar notificações */}
      {apiMessage.show && (
        <ApiMessage
          message={apiMessage.message}
          type={apiMessage.type}
          onClose={hideMessage}
        />
      )}
    </div>
  );
}

// Candidates Modal Component
interface CandidatesModalProps {
  demand: Demand;
  onClose: () => void;
  onProfessionalSelectionChange?: (demandId: string, selectedProfessionalId: number | null) => void;
}

function CandidatesModal({ demand, onClose, onProfessionalSelectionChange }: CandidatesModalProps) {
  const [interestedProfessionals, setInterestedProfessionals] = useState<InterestedProfessional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState<{professionalName: string} | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const [isUpdatingSelection, setIsUpdatingSelection] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [selectedProfessionalData, setSelectedProfessionalData] = useState<{
    id: number;
    full_name: string;
    services: string[];
    areas: string[];
    specialties: number[];
    tecid_type: string;
    uf: string;
    city: string;
    email: string;
    availability: string | number;
    cellphone: string;
    company_cellphone: string;
    about_me: string;
    year_experience: number;
    rating_avg: number;
    rating_count: number;
    work_count: number;
  } | null>(null);
  const [showProfessionalRatingModal, setShowProfessionalRatingModal] = useState(false);
  const [professionalRatingRefresh, setProfessionalRatingRefresh] = useState(0);
  const [candidateCardsRefresh, setCandidateCardsRefresh] = useState(0);
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // Funções para gerenciar toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Função para lidar com avaliação de profissional
  const handleRateProfessional = () => {
    setShowProfessionalRatingModal(true);
  };

  // Função para submeter avaliação
  const handleProfessionalRatingSubmit = async (rating: number, comment: string) => {
    if (!selectedProfessionalData) return;
    
    try {
      // Verificar se já existe uma avaliação do usuário para este profissional
      const currentUserId = parseInt(demand.clientId); // ID do cliente que criou a demanda
      if (!currentUserId) {
        showToast('Erro: usuário não identificado.', 'error');
        return;
      }

      // Buscar avaliação existente
      const existingRatingResponse = await ratingService.getRatingByClientProfessional(
        currentUserId,
        selectedProfessionalData.id
      );

      let response;
      if (existingRatingResponse.status === 'success' && existingRatingResponse.data?.id) {
        // Atualizar avaliação existente (PATCH)
        response = await ratingService.updateRating(existingRatingResponse.data.id, {
          score: rating,
          comment: comment
        });
      } else {
        // Criar nova avaliação (POST)
        response = await ratingService.createRating({
          professional: selectedProfessionalData.id,
          score: rating,
          comment: comment
        });
      }

      if (response.status === 'success') {
        showToast('Avaliação enviada com sucesso!', 'success');
        setShowProfessionalRatingModal(false);
        // Forçar refresh das avaliações
        setProfessionalRatingRefresh(prev => prev + 1);
        // Forçar refresh dos cards dos candidatos
        setCandidateCardsRefresh(prev => prev + 1);
        // Recarregar dados do profissional para atualizar rating_avg e rating_count
        await refreshProfessionalData();
      } else {
        showToast('Erro ao enviar avaliação. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      showToast('Erro ao enviar avaliação. Tente novamente.', 'error');
    }
  };

  // Função para atualizar dados do profissional após mudança nas avaliações
  const refreshProfessionalData = async () => {
    if (!selectedProfessionalData) return;
    
    try {
      // Carregar as avaliações e calcular a média diretamente
      const ratingsResponse = await ratingService.getRatingsByProfessional(selectedProfessionalData.id);
      if (ratingsResponse.status === 'success' && ratingsResponse.data) {
        const ratings = ratingsResponse.data;
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length 
          : 0;
        
        // Atualizar os dados do profissional
        setSelectedProfessionalData(prev => prev ? {
          ...prev,
          rating_avg: averageRating,
          rating_count: ratings.length
        } : null);

        // Atualizar também o card do candidato correspondente
        updateCandidateCardRating(selectedProfessionalData.id, averageRating, ratings.length);
      }
    } catch (ratingError) {
      console.error('Erro ao carregar avaliações para atualização:', ratingError);
    }
  };

  // Função para atualizar as estrelas do card do candidato
  const updateCandidateCardRating = (professionalId: number, newRatingAvg: number, newRatingCount: number) => {
    setInterestedProfessionals(prev => 
      prev.map(professional => 
        professional.id === professionalId 
          ? {
              ...professional,
              rating_avg: newRatingAvg,
              rating_count: newRatingCount
            }
          : professional
      )
    );
  };

  // Função para deletar avaliação
  const handleProfessionalRatingDelete = async () => {
    if (!selectedProfessionalData) return;
    
    try {
      // Verificar se já existe uma avaliação do usuário para este profissional
      const currentUserId = parseInt(demand.clientId); // ID do cliente que criou a demanda
      if (!currentUserId) {
        showToast('Erro: usuário não identificado.', 'error');
        return;
      }

      // Buscar avaliação existente
      const existingRatingResponse = await ratingService.getRatingByClientProfessional(
        currentUserId,
        selectedProfessionalData.id
      );

      if (existingRatingResponse.status === 'success' && existingRatingResponse.data?.id) {
        // Deletar avaliação existente (DELETE)
        const response = await ratingService.deleteRating(existingRatingResponse.data.id);
        
        if (response.status === 'success') {
          showToast('Avaliação removida com sucesso!', 'success');
          setShowProfessionalRatingModal(false);
          // Forçar refresh das avaliações
          setProfessionalRatingRefresh(prev => prev + 1);
          // Forçar refresh dos cards dos candidatos
          setCandidateCardsRefresh(prev => prev + 1);
          // Recarregar dados do profissional para atualizar rating_avg e rating_count
          await refreshProfessionalData();
        } else {
          showToast('Erro ao remover avaliação. Tente novamente.', 'error');
        }
      } else {
        showToast('Nenhuma avaliação encontrada para remover.', 'error');
      }
          } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      showToast('Erro ao remover avaliação. Tente novamente.', 'error');
    }
  };

  // Função para lidar com clique no card do profissional
  const handleProfessionalCardClick = async (professional: InterestedProfessional) => {
    try {
      // Converter os dados do profissional para o formato esperado pelo modal
      const professionalData = {
        id: professional.id,
        full_name: professional.full_name,
        services: professional.services,
        areas: professional.areas,
        specialties: professional.specialties || [],
        tecid_type: professional.tecid_type || '',
        uf: professional.uf || '',
        city: professional.city || '',
        email: professional.email,
        availability: typeof professional.availability === 'string' 
          ? parseInt(professional.availability) || 1 
          : professional.availability || 1,
        cellphone: professional.cellphone || '',
        company_cellphone: professional.company_cellphone || '',
        about_me: professional.about_me || '',
        year_experience: professional.year_experience || 0,
        rating_avg: professional.rating_avg || 0,
        rating_count: professional.rating_count || 0,
        work_count: professional.work_count || 0
      };
      
      setSelectedProfessionalData(professionalData);
      setShowProfessionalModal(true);
    } catch (error) {
      console.error('Erro ao abrir modal do profissional:', error);
    }
  };

  // Função para verificar qual profissional está selecionado
  const checkSelectedProfessional = useCallback(async () => {
    try {
      const selectedProfessional = await demandService.getChosenProfessional(parseInt(demand.id));
      setSelectedProfessionalId(selectedProfessional.id);
    } catch {
      // Se não há profissional selecionado, o endpoint retorna 404
      setSelectedProfessionalId(null);
    }
  }, [demand.id]);

  // Carregar profissionais interessados atualizados
  useEffect(() => {
    const loadInterestedProfessionals = async () => {
      try {
        setLoadingProfessionals(true);
        const professionals = await demandService.getInterestedProfessionals(parseInt(demand.id));
        setInterestedProfessionals(professionals);
      } catch (error) {
        console.error('Erro ao carregar profissionais interessados:', error);
        // Em caso de erro, usar os dados da demanda original
        setInterestedProfessionals(demand.interestedProfessionals);
      } finally {
        setLoadingProfessionals(false);
      }
    };

    loadInterestedProfessionals();
  }, [demand.id, demand.interestedProfessionals]);

  // Verificar profissional selecionado quando o modal abrir
  useEffect(() => {
    checkSelectedProfessional();
  }, [checkSelectedProfessional]);


  // Função para renderizar estrelas com meia estrela
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        // Estrela cheia
        stars.push(
          <Star
            key={i}
            className="w-4 h-4 fill-yellow-400 text-yellow-400"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Meia estrela
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        // Estrela vazia
        stars.push(
          <Star
            key={i}
            className="w-4 h-4 text-gray-300"
          />
        );
      }
    }
    return stars;
  };

  // Função para lidar com contato via WhatsApp
  const handleWhatsAppContact = (professional: InterestedProfessional) => {
    const professionalName = professional.full_name || 'Profissional';
    const professionalPhone = professional.cellphone;
    
    console.log('Tentando contato WhatsApp:', {
      name: professionalName,
      phone: professionalPhone,
      hasPhone: !!professionalPhone,
      phoneLength: professionalPhone ? professionalPhone.length : 0
    });
    
    // Verificar se tem telefone válido (não null, undefined ou string vazia)
    if (professionalPhone && professionalPhone.trim() !== '') {
      // Abrir WhatsApp
      const message = `Olá ${professionalName}! Vi seu perfil na VINKO e gostaria de conversar sobre um projeto.`;
      const whatsappUrl = `https://wa.me/55${professionalPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      console.log('Abrindo WhatsApp:', whatsappUrl);
      window.open(whatsappUrl, '_blank');
    } else {
      // Mostrar modal de telefone não cadastrado
      console.log('Mostrando modal - sem telefone:', professionalName);
      setShowPhoneModal({ professionalName });
    }
  };

  // Função para selecionar profissional
  const handleSelectProfessional = async (professionalId: number) => {
    if (isUpdatingSelection) return;
    
    setIsUpdatingSelection(true);
    try {
      const response = await demandService.updateDemand(parseInt(demand.id), {
        chosen_professional_id: professionalId,
        status: "EM ANDAMENTO"
      });
      
      if (response.status === 'success') {
        setSelectedProfessionalId(professionalId);
        showToast('Profissional selecionado com sucesso!', 'success');
        // Notificar o componente pai sobre a mudança
        onProfessionalSelectionChange?.(demand.id, professionalId);
      } else {
        showToast('Erro ao selecionar profissional. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao selecionar profissional:', error);
      showToast('Erro ao selecionar profissional. Tente novamente.', 'error');
    } finally {
      setIsUpdatingSelection(false);
    }
  };

  // Função para remover seleção do profissional
  const handleRemoveSelection = async () => {
    if (isUpdatingSelection) return;
    
    setIsUpdatingSelection(true);
    try {
      const response = await demandService.updateDemand(parseInt(demand.id), {
        chosen_professional_id: null,
        status: "ABERTA"
      });
      
      if (response.status === 'success') {
        setSelectedProfessionalId(null);
        showToast('Profissional removido com sucesso!', 'success');
        // Notificar o componente pai sobre a mudança
        onProfessionalSelectionChange?.(demand.id, null);
      } else {
        showToast('Erro ao remover profissional. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao remover seleção:', error);
      showToast('Erro ao remover profissional. Tente novamente.', 'error');
    } finally {
      setIsUpdatingSelection(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Candidatos Interessados ({interestedProfessionals.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loadingProfessionals ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
              <p className="text-gray-500 text-lg">Carregando candidatos...</p>
            </div>
          ) : interestedProfessionals.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum candidato interessado ainda</p>
              <p className="text-gray-400 text-sm mt-2">
                Os profissionais interessados aparecerão aqui quando demonstrarem interesse na sua demanda.
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {interestedProfessionals.map((professional) => (
                <div
                  key={`${professional.id}-${professional.rating_avg}-${professional.rating_count}-${candidateCardsRefresh}`}
                  onClick={() => handleProfessionalCardClick(professional)}
                  className={`flex-shrink-0 border rounded-lg p-4 w-80 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    selectedProfessionalId === professional.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Header com Avatar e Nome */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {professional.full_name || '-'}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center">
                          {renderStars(professional.rating_avg)}
                        </div>
                        <span className="text-sm text-gray-500 ml-1">
                          ({professional.work_count} trabalhos)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Profissional */}
                  <div className="space-y-3 mb-4 mt-6">
                    {/* Serviços */}
                    <div className="h-8 flex items-center">
                      {professional.services && professional.services.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full">
                          {(professional.services as string[]).map((serviceName: string, index: number) => (
                            <span
                              key={index}
                              className="flex-shrink-0 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium"
                            >
                              {serviceName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">-</p>
                      )}
                    </div>
                    
                    {/* Localização */}
                    <div className="h-6 flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {professional.city && professional.uf 
                          ? `${professional.city}, ${professional.uf}`
                          : '-'
                        }
                      </span>
                    </div>

                    {/* Telefone */}
                    <div className="h-6 flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {professional.cellphone || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2">
                    {selectedProfessionalId === professional.id ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelection();
                        }}
                        disabled={isUpdatingSelection}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingSelection ? 'Removendo...' : 'Remover'}
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProfessional(professional.id);
                        }}
                        disabled={isUpdatingSelection || selectedProfessionalId !== null}
                        className="flex-1 bg-pink-600 text-white px-3 py-2 rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingSelection ? 'Selecionando...' : 'Selecionar'}
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsAppContact(professional);
                      }}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implementar funcionalidade de chat
                        console.log('Chat com profissional:', professional.id);
                      }}
                      className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Telefone Não Cadastrado */}
      {showPhoneModal && (
        <PhoneNotRegisteredModal
          professionalName={showPhoneModal.professionalName}
          onClose={() => setShowPhoneModal(null)}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Modal do Profissional Selecionado */}
      {showProfessionalModal && selectedProfessionalData && (
        <ProfessionalProfileModal
          isOpen={showProfessionalModal}
          onClose={() => setShowProfessionalModal(false)}
          professional={{
            ...selectedProfessionalData,
            specialties: selectedProfessionalData.specialties.map(String),
            availability: typeof selectedProfessionalData.availability === 'number' 
              ? selectedProfessionalData.availability 
              : 1,
            year_experience: selectedProfessionalData.year_experience.toString()
          } as ProfessionalSearchResult}
          onStartConversation={(professionalId) => {
            console.log('Iniciar conversa com profissional:', professionalId);
          }}
          onRateProfessional={handleRateProfessional}
          showRatingModal={showProfessionalRatingModal}
          onCloseRatingModal={() => setShowProfessionalRatingModal(false)}
          onRatingSubmit={handleProfessionalRatingSubmit}
          onRatingDelete={handleProfessionalRatingDelete}
          refreshTrigger={professionalRatingRefresh}
          currentUserId={parseInt(demand.clientId)}
        />
      )}
    </div>
  );
}

// Create Demand Modal Component
interface DemandFormData {
  title: string;
  description: string;
  amount: string;
  service: string;
  area: string;
  specialty: string;
  tecidType: string;
  availability: string;
  deadline: string;
  budgetMin: string;
  budgetMax: string;
  city: string;
  uf: string;
}

interface CreateDemandModalProps {
  formData: DemandFormData;
  setFormData: (data: (prev: DemandFormData) => DemandFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  editingDemand?: Demand | null;
  options: {
    services: { id: number; name: string; areas?: { id: number; name: string }[] }[];
    serviceAreas: { id: number; name: string }[];
    specialties: { id: number; name: string }[];
    availabilities: { id: number; name: string }[];
  };
  filteredServiceAreas: { id: number; name: string }[];
  setFilteredServiceAreas: (areas: { id: number; name: string }[]) => void;
  cities: { id: number; nome: string }[];
  loadingCities: boolean;
  loadCitiesByState: (stateCode: string) => Promise<void>;
  validationErrors: {
    title?: string;
    description?: string;
    service?: string;
    area?: string;
    specialty?: string;
    availability?: string;
    budget?: string;
  };
  setValidationErrors: (errors: {
    title?: string;
    description?: string;
    service?: string;
    area?: string;
    specialty?: string;
    availability?: string;
    budget?: string;
  }) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  filePreviews: string[];
  setFilePreviews: (previews: string[] | ((prev: string[]) => string[])) => void;
  existingFiles: {id: number; file: string; created_at: string; updated_at: string; demand: number}[];
  onDeleteFile: (fileId: number, fileName: string) => void;
}

function CreateDemandModal({ 
  formData, 
  setFormData, 
  onSubmit, 
  onClose, 
  editingDemand,
  options, 
  filteredServiceAreas, 
  setFilteredServiceAreas,
  cities,
  loadingCities,
  loadCitiesByState,
  validationErrors,
  setValidationErrors,
  uploadedFiles,
  setUploadedFiles,
  filePreviews,
  setFilePreviews,
  existingFiles,
  onDeleteFile
}: CreateDemandModalProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Função para processar arquivos (usada tanto para input quanto drag&drop)
  const processFiles = (files: File[]) => {
    // Validar tamanho dos arquivos (20MB = 20 * 1024 * 1024 bytes)
    const maxSize = 20 * 1024 * 1024;
    const oversizedFiles: string[] = [];
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
        return false;
      }
      return true;
    });

    // Mostrar notificação para arquivos que excedem o limite
    if (oversizedFiles.length > 0) {
      // Mostrar toast de erro para arquivos grandes
      // Note: showToast não está disponível aqui, mas o erro será tratado no handleSubmit
      return; // Não adicionar arquivos grandes
    }

    if (validFiles.length > 0) {
      const newFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newFiles);

      // Criar previews para imagens
      validFiles.forEach((file, fileIndex) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setFilePreviews((prev: string[]) => {
              const newPreviews = [...prev];
              newPreviews[uploadedFiles.length + fileIndex] = result;
              return newPreviews;
            });
          };
          reader.readAsDataURL(file);
        } else {
          // Para arquivos não-imagem, adicionar null no array de previews
          setFilePreviews((prev: string[]) => {
            const newPreviews = [...prev];
            newPreviews[uploadedFiles.length + fileIndex] = '';
            return newPreviews;
          });
        }
      });
    }
  };

  // Função para lidar com upload de arquivos via input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  // Funções para drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Função para remover arquivo
  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              {editingDemand ? 'Editar Demanda' : 'Nova Demanda'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { console.log('Form submit'); onSubmit(e); }} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título - Obrigatório */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.title 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="Ex: Desenvolvimento de site institucional"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 caracteres</p>
              {validationErrors.title && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
              )}
            </div>

            {/* Descrição - Obrigatória */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.description 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="Descreva detalhadamente o que precisa..."
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 caracteres</p>
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>

            {/* Tipo de Serviço e Área de Atuação na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Serviço <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service}
                onChange={(e) => {
                  const serviceId = e.target.value;
                  setFormData((prev: DemandFormData) => ({ ...prev, service: serviceId, area: '' }));
                  
                  // Filtrar áreas baseado no serviço selecionado
                  if (serviceId) {
                    const selectedService = options.services.find(s => s.id === parseInt(serviceId));
                    if (selectedService && selectedService.areas) {
                      setFilteredServiceAreas(selectedService.areas);
                    } else {
                      setFilteredServiceAreas([]);
                    }
                  } else {
                    setFilteredServiceAreas(options.serviceAreas);
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.service 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                required
              >
                <option value="">Selecione...</option>
                {options.services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
              {validationErrors.service && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.service}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área de Atuação <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.area}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, area: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.area 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                disabled={!formData.service}
                required
              >
                <option value="">
                  {!formData.service ? 'Primeiro selecione um serviço' : 'Selecione...'}
                </option>
                {filteredServiceAreas.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              {validationErrors.area && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.area}</p>
              )}
            </div>

            {/* Especialidade - Obrigatória (linha inteira) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Especialidade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, specialty: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.specialty 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                required
              >
                <option value="">Selecione...</option>
                {options.specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                ))}
              </select>
              {validationErrors.specialty && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.specialty}</p>
              )}
            </div>

            {/* Tipo de Tecido - Radio Buttons */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Tecido
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'PLANO', label: 'Plano' },
                  { value: 'MALHA', label: 'Malha' },
                  { value: 'AMBOS', label: 'Ambos' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tecidType"
                      value={option.value}
                      checked={formData.tecidType === option.value}
                      onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, tecidType: e.target.value }))}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>


            {/* Quantidade e Prazo na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="1"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prazo
              </label>
              <input
                type="date"
                value={formData.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Orçamento Mínimo e Máximo na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Mínimo
              </label>
              <input
                type="text"
                value={formData.budgetMin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value ? `R$ ${(parseInt(value) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : '';
                  setFormData((prev: DemandFormData) => ({ ...prev, budgetMin: formatted }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.budget 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orçamento Máximo
              </label>
              <input
                type="text"
                value={formData.budgetMax}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value ? `R$ ${(parseInt(value) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : '';
                  setFormData((prev: DemandFormData) => ({ ...prev, budgetMax: formatted }));
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationErrors.budget 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-pink-500'
                }`}
                placeholder="R$ 0,00"
              />
            </div>
            
            {/* Mensagem de erro do orçamento */}
            {validationErrors.budget && (
              <div className="md:col-span-2">
                <p className="text-red-500 text-sm">{validationErrors.budget}</p>
              </div>
            )}

            {/* Estado e Cidade na mesma linha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF)
              </label>
              <select
                value={formData.uf}
                onChange={(e) => {
                  const uf = e.target.value;
                  setFormData((prev: DemandFormData) => ({ ...prev, uf, city: '' }));
                  loadCitiesByState(uf);
                }}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData((prev: DemandFormData) => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={!formData.uf || loadingCities}
              >
                <option value="">
                  {!formData.uf ? 'Primeiro selecione o estado' : 
                   loadingCities ? 'Carregando cidades...' : 
                   'Selecione a cidade'}
                </option>
                {cities.map(city => (
                  <option key={city.id} value={city.nome}>
                    {city.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload de Arquivos */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexar Arquivos (Opcional)
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-pink-500 bg-pink-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-pink-600 hover:text-pink-500">Clique para fazer upload</span> ou arraste e solte
                    </p>
                    {isDragOver && (
                      <p className="text-sm text-pink-600 font-medium mt-2">
                        Solte os arquivos aqui!
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, DOC até 20MB cada</p>
                  </div>
                </label>
              </div>
              {/* Área para arquivos existentes */}
              {existingFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">Arquivos anexados:</p>
                  <div className="flex flex-wrap gap-1">
                    {existingFiles.map((file) => {
                      const fileName = file.file.split('/').pop() || 'Arquivo';
                      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                      
                      return (
                        <div 
                          key={file.id} 
                          className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer"
                          title={fileName}
                          onClick={() => window.open(file.file, '_blank')}
                        >
                          {isImage ? (
                            <img 
                              src={file.file} 
                              alt={fileName}
                              className="w-full h-full object-cover rounded-lg hover:scale-150 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg hover:scale-150 transition-transform duration-200">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(file.id, fileName);
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm z-20"
                          >
                            <X size={10} />
                          </button>
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate rounded-b-lg"
                            title={fileName}
                          >
                            {fileName.length > 12 ? fileName.substring(0, 12) + '...' : fileName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Área para previews dos arquivos novos */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">Novos arquivos selecionados:</p>
                  <div className="flex flex-wrap gap-1">
                    {uploadedFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer"
                        title={file.name}
                      >
                        {file.type.startsWith('image/') && filePreviews[index] ? (
                          <img 
                            src={filePreviews[index]} 
                            alt={file.name}
                            className="w-full h-full object-cover rounded-lg hover:scale-150 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg hover:scale-150 transition-transform duration-200">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm z-20"
                        >
                          <X size={10} />
                        </button>
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate rounded-b-lg"
                          title={file.name}
                        >
                          {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Disponibilidade - Radio Buttons */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Disponibilidade para Início <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {options.availabilities.map((availability) => (
                  <label key={availability.id} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="availability"
                      value={availability.id}
                      checked={formData.availability === availability.id.toString()}
                      onChange={(e) => {
                        console.log('Disponibilidade selecionada:', e.target.value);
                        setFormData((prev: DemandFormData) => ({ ...prev, availability: e.target.value }));
                        // Limpar erro de disponibilidade ao selecionar
                        if (validationErrors.availability) {
                          setValidationErrors({ ...validationErrors, availability: undefined });
                        }
                      }}
                      className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500 mr-3"
                    />
                    <span className="text-gray-700">{availability.name}</span>
                  </label>
                ))}
              </div>
              {validationErrors.availability && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.availability}</p>
              )}
            </div>

          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={() => console.log('Botão clicado')}
              className="flex-1 px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              {editingDemand ? 'Atualizar Demanda' : 'Publicar Demanda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Demand Details Modal Component
interface DemandDetailsModalProps {
  demand: Demand;
  updatedDemand: Demand;
  onClose: () => void;
  onManageCandidates: (demand: Demand) => void;
  onEdit: (demand: Demand) => void;
}

function DemandDetailsModal({ 
  demand, 
  updatedDemand,
  onClose, 
  onManageCandidates,
  onEdit
}: DemandDetailsModalProps) {
  const [demandFiles, setDemandFiles] = useState<{id: number; file: string; created_at: string; updated_at: string; demand: number}[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Carregar arquivos da demanda
  useEffect(() => {
    const loadDemandFiles = async () => {
      setLoadingFiles(true);
      try {
        const files = await demandService.getDemandFiles(parseInt(demand.id));
        setDemandFiles(files);
      } catch (error) {
        console.error('Erro ao carregar arquivos da demanda:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadDemandFiles();
  }, [demand.id]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
             <div className="flex-1 min-w-0 pr-4">
               <h2 
                 className="text-2xl font-semibold text-gray-900 mb-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
                 title={demand.title}
               >
                 {demand.title}
               </h2>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                demand.status === 'open' ? 'bg-green-100 text-green-800' :
                demand.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                demand.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {demand.status === 'open' ? 'Demanda Aberta' :
                 demand.status === 'in_progress' ? 'Em Andamento' :
                 demand.status === 'completed' ? 'Concluída' : 'Cancelada'}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

          <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Descrição do Projeto</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <p className="text-gray-600 leading-relaxed">{demand.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                    Orçamento
                  </h3>
                  <p className={demand.budget.min > 0 || demand.budget.max > 0 ? "text-sm font-medium text-green-600" : "text-gray-500 text-xs"}>
                    {demand.budget.min > 0 || demand.budget.max > 0 
                      ? (() => {
                          const min = demand.budget.min > 0 ? `R$ ${demand.budget.min.toLocaleString()}` : '';
                          const max = demand.budget.max > 0 ? `R$ ${demand.budget.max.toLocaleString()}` : '';
                          if (min && max) {
                            return `Mín: ${min} - Máx: ${max}`;
                          } else if (min) {
                            return `Mín: ${min}`;
                          } else if (max) {
                            return `Máx: ${max}`;
                          }
                          return 'Nenhum orçamento informado';
                        })()
                      : 'Nenhum orçamento informado'
                    }
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Prazo
                  </h3>
                  <p className={demand.deadline ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.deadline ? new Date(demand.deadline).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Nenhum prazo informado'}
                  </p>
              </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-600" />
                  Localização
                </h3>
                  <p className={demand.location.city || demand.location.state ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {(() => {
                      const { city, state } = demand.location;
                      if (city && state) {
                        return `${city}, ${state}`;
                      } else if (city) {
                        return city;
                      } else if (state) {
                        return state;
                      }
                      return 'Nenhuma localização informada';
                    })()}
                </p>
              </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-purple-600" />
                    Tipo de Serviço
                  </h3>
                  <p className={demand.serviceType ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.serviceType || 'Nenhum tipo de serviço informado'}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Área de Atuação
                  </h3>
                  <p className={demand.area ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.area || 'Nenhuma área de atuação informada'}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Especialidade
                  </h3>
                  <p className={demand.specialty ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.specialty || 'Nenhuma especialidade informada'}
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Tipo de Tecido
                  </h3>
                  <p className={demand.tecidType ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.tecidType || 'Nenhum tipo de tecido informado'}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Quantidade
                  </h3>
                  <p className={demand.amount ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.amount ? demand.amount.toLocaleString('pt-BR') : 'Nenhuma quantidade informada'}
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-red-600" />
                    Disponibilidade
                  </h3>
                  <p className={demand.availability ? "text-sm text-gray-600" : "text-gray-500 text-xs"}>
                    {demand.availability || 'Nenhuma disponibilidade informada'}
                  </p>
                </div>
              </div>

              {/* Arquivos Anexados */}
              <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Arquivos Anexados ({demandFiles.length})
                </h3>
                
                {loadingFiles ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-gray-600">Carregando arquivos...</span>
                  </div>
                ) : demandFiles.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum arquivo anexado</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {demandFiles.map((file) => {
                      const fileName = file.file.split('/').pop() || 'Arquivo';
                      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                      
                      return (
                        <div 
                          key={file.id} 
                          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group flex-shrink-0 w-24"
                          onClick={() => window.open(file.file, '_blank')}
                        >
                          <div className="flex flex-col items-center text-center">
                            {isImage ? (
                              <img 
                                src={file.file} 
                                alt={fileName}
                                className="w-10 h-10 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-pink-200 transition-colors">
                                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 truncate w-full" title={fileName}>
                              {fileName.length > 12 ? fileName.substring(0, 12) + '...' : fileName}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(file.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Criada em {new Date(demand.createdAt).toLocaleDateString('pt-BR')} | Atualizada em {new Date(demand.updatedAt).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onManageCandidates(updatedDemand)}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Gerenciar candidatos ({updatedDemand.interestedProfessionals.length})
              </button>
              <button
                onClick={() => onEdit(updatedDemand)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Editar
              </button>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  demandTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmationModal({ demandTitle, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
              <h3 className="text-lg font-semibold text-gray-900">Excluir Demanda</h3>
              <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
        </div>
      </div>

          <p className="text-gray-700 mb-6">
            Tem certeza que deseja excluir a demanda <strong>"{demandTitle}"</strong>?
          </p>
          
          <div className="flex space-x-3">
          <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
              Cancelar
          </button>
        <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete File Confirmation Modal Component
interface DeleteFileConfirmationModalProps {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteFileConfirmationModal({ fileName, onConfirm, onCancel }: DeleteFileConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Excluir Arquivo</h3>
              <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">
            Tem certeza que deseja excluir o arquivo <strong title={fileName} className="cursor-help">
              "{fileName.length > 50 ? fileName.substring(0, 50) + '...' : fileName}"
            </strong>?
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rating Modal Component
interface RatingModalProps {
  professionalId: string;
  demandId: string;
  demandTitle: string;
  professionalName?: string;
  onSubmit: () => void;
  onClose: () => void;
  onRatingSuccess?: () => void;
}

function RatingModal({ professionalId, demandId, demandTitle, professionalName, onSubmit, onClose, onRatingSuccess }: RatingModalProps) {
  const { state } = useApp();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [existingRating, setExistingRating] = useState<{
    id?: number;
    score?: number;
    comment?: string;
    professional?: number;
    client?: number;
  } | null>(null);
  const [loadingRating, setLoadingRating] = useState(true);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showRatingMessage, setShowRatingMessage] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const professional = state.professionalProfiles.find(p => p.userId === professionalId);

  // Carregar avaliação existente quando o modal abrir
  useEffect(() => {
    const loadExistingRating = async () => {
      try {
        setLoadingRating(true);
        const currentUserId = state.currentUser?.id ? parseInt(state.currentUser.id) : null;
        
        if (currentUserId && professionalId && demandId) {
          const response = await ratingService.getRatingByClientProfessional(
            currentUserId, 
            parseInt(professionalId),
            parseInt(demandId)
          );
          
          if (response.status === 'success' && response.data && Object.keys(response.data).length > 0) {
            // Se há uma avaliação existente
            setExistingRating(response.data);
            setRating(response.data.score || 0);
            setComment(response.data.comment || '');
          } else {
            // Se não há avaliação existente
            setExistingRating(null);
            setRating(0);
            setComment('');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar avaliação existente:', error);
        setExistingRating(null);
        setRating(0);
        setComment('');
      } finally {
        setLoadingRating(false);
      }
    };

    loadExistingRating();
  }, [professionalId, demandId, state.currentUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      // Por favor, selecione uma avaliação
      return;
    }

    try {
      setLoadingRating(true);
      const currentUserId = state.currentUser?.id ? parseInt(state.currentUser.id) : null;
      
      if (!currentUserId) {
        throw new Error('Usuário não logado');
      }

      let response;
      
      if (existingRating && existingRating.id) {
        // Atualizar avaliação existente
        response = await ratingService.updateRating(existingRating.id, {
          score: rating,
          comment: comment
        });
      } else {
        // Criar nova avaliação
        response = await ratingService.createRating({
          professional: parseInt(professionalId),
          score: rating,
          comment: comment,
          demand: parseInt(demandId)
        });
      }

      if (response.status === 'success') {
        // Atualizar estado local
        setExistingRating({
          id: response.data.id,
          score: rating,
          comment: comment,
          professional: parseInt(professionalId),
          client: currentUserId
        });
        setRatingSubmitted(true);
        
        // Chamar callback de sucesso
        onRatingSuccess?.();
        
        // Mostrar popup de sucesso
        setShowRatingMessage({
          show: true,
          message: existingRating ? 'Avaliação atualizada com sucesso!' : 'Avaliação enviada com sucesso!',
          type: 'success'
        });
        
        // Esconder popup após 3 segundos
        setTimeout(() => {
          setShowRatingMessage({ show: false, message: '', type: 'success' });
        }, 3000);
      } else {
        throw new Error(response.message || 'Erro ao salvar avaliação');
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      // Mostrar popup de erro
      setShowRatingMessage({
        show: true,
        message: 'Erro ao salvar avaliação. Tente novamente.',
        type: 'error'
      });
      
      // Esconder popup após 3 segundos
      setTimeout(() => {
        setShowRatingMessage({ show: false, message: '', type: 'success' });
      }, 3000);
    } finally {
      setLoadingRating(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const currentRating = hoveredRating || rating;
      const isHalfStar = currentRating > index && currentRating < starValue;
      const isFullStar = starValue <= currentRating;
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-colors relative"
        >
          <div className="relative">
            {/* Estrela de fundo (sempre vazia) */}
            <Star className="h-8 w-8 text-gray-300" />
            
            {/* Estrela preenchida ou meia estrela */}
            {isFullStar && (
              <Star className="h-8 w-8 text-yellow-500 fill-current absolute top-0 left-0" />
            )}
            
            {isHalfStar && (
              <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                <Star className="h-8 w-8 text-yellow-500 fill-current" />
              </div>
            )}
          </div>
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Popup de mensagem */}
      {showRatingMessage.show && (
        <div className="fixed top-4 right-4 z-60 max-w-sm w-auto">
          <div className={`px-4 py-3 rounded-lg shadow-lg ${
            showRatingMessage.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{showRatingMessage.message}</span>
              <button
                onClick={() => setShowRatingMessage({ show: false, message: '', type: 'success' })}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Avaliar Profissional</h3>
              <p className="text-sm text-gray-600">Como foi sua experiência?</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="font-medium text-gray-900 mb-2">{professionalName || professional?.name || 'Profissional'}</p>
            <p className="text-sm text-gray-600 mb-4" title={demandTitle}>
              <span className="truncate inline-block max-w-xs">{demandTitle}</span>
            </p>
            <div className="flex justify-center space-x-1 mb-4">
              {loadingRating ? (
                <div className="flex items-center space-x-1">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  <span className="text-sm text-gray-500">Carregando...</span>
                </div>
              ) : (
                renderStars()
              )}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi sua experiência com este profissional..."
            rows={3}
            disabled={loadingRating}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm whitespace-nowrap"
              disabled={loadingRating}
            >
              {existingRating ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
            </button>
            <button
              type="button"
              onClick={() => {
                // Finalizar demanda via callback
                onSubmit();
              }}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loadingRating || (!existingRating && !ratingSubmitted)}
            >
              Finalizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Telefone Não Cadastrado
interface PhoneNotRegisteredModalProps {
  professionalName: string;
  onClose: () => void;
}

function PhoneNotRegisteredModal({ professionalName, onClose }: PhoneNotRegisteredModalProps) {
  return (
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
            O profissional <span className="font-medium">{professionalName}</span> não possui telefone cadastrado para WhatsApp.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Você pode tentar entrar em contato através do botão "Chat" ou aguardar até que o profissional atualize suas informações de contato.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors font-medium"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}