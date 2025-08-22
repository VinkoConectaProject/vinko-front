import React, { useState, useMemo } from 'react';
import { Briefcase, Calendar, User, MessageSquare, CheckCircle, Clock, Star, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function MyJobsPage() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('active');

  // 1. AJUSTE: Prestador que foi trocado deve voltar para candidaturas
  const myActiveJobs = state.demands.filter(d => 
    d.selectedProfessional === state.currentUser?.id && d.status === 'in_progress'
  );
  const myCompletedJobs = state.demands.filter(d => 
    d.selectedProfessional === state.currentUser?.id && d.status === 'completed'
  );
  
  // Candidaturas: prestador interessado mas não selecionado OU foi selecionado mas depois trocado
  const interestedJobs = state.demands.filter(d => 
    d.interestedProfessionals.includes(state.currentUser?.id || '') &&
    d.selectedProfessional !== state.currentUser?.id && // Não está atualmente selecionado
    d.status !== 'cancelled' // Não foi cancelada
  );

  const activeJobs = myActiveJobs;
  const completedJobs = myCompletedJobs;

  // 2. AJUSTE: Total = soma de candidaturas + ativos + concluídos (sem duplicar por jobId)
  const totalJobs = useMemo(() => {
    const allJobIds = new Set();
    
    // Adicionar candidaturas
    interestedJobs.forEach(job => allJobIds.add(job.id));
    
    // Adicionar ativos  
    activeJobs.forEach(job => allJobIds.add(job.id));
    
    // Adicionar concluídos
    completedJobs.forEach(job => allJobIds.add(job.id));
    
    return allJobIds.size;
  }, [interestedJobs, activeJobs, completedJobs]);

  const handleCompleteJob = (jobId: string) => {
    const job = state.demands.find(d => d.id === jobId);
    if (job) {
      const updatedJob = { ...job, status: 'completed' as const, updatedAt: new Date() };
      dispatch({ type: 'UPDATE_DEMAND', payload: updatedJob });
      
      // Update professional's completed jobs count
      const profile = state.professionalProfiles.find(p => p.userId === state.currentUser?.id);
      if (profile) {
        const updatedProfile = { ...profile, completedJobs: profile.completedJobs + 1 };
        dispatch({ type: 'UPDATE_PROFESSIONAL_PROFILE', payload: updatedProfile });
      }
    }
  };

  const getClientName = (clientId: string) => {
    const client = state.clientProfiles.find(c => c.userId === clientId);
    return client?.name || 'Cliente';
  };

  const getClientContact = (clientId: string) => {
    const client = state.clientProfiles.find(c => c.userId === clientId);
    return client?.contact || { phone: '', email: '' };
  };

  const handleContactClient = (clientId: string) => {
    const contact = getClientContact(clientId);
    if (contact.phone) {
      const message = `Olá! Sou o profissional selecionado para seu projeto na VINKO. Vamos conversar sobre os detalhes?`;
      const whatsappUrl = `https://wa.me/55${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      alert('Informações de contato não disponíveis');
    }
  };

  const stats = [
    { label: 'Trabalhos Ativos', value: activeJobs.length, color: 'text-blue-600', bg: 'bg-blue-100', icon: Briefcase },
    { label: 'Concluídos', value: completedJobs.length, color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
    { label: 'Candidaturas', value: interestedJobs.length, color: 'text-purple-600', bg: 'bg-purple-100', icon: Clock },
    { label: 'Total', value: totalJobs, color: 'text-gray-600', bg: 'bg-gray-100', icon: Star },
  ];

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Trabalhos</h1>
        <p className="text-gray-600">
          Gerencie seus projetos em andamento e histórico de trabalhos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'active', label: 'Ativos', count: activeJobs.length },
              { id: 'completed', label: 'Concluídos', count: completedJobs.length },
              { id: 'interested', label: 'Candidaturas', count: interestedJobs.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'active' && (
            <div className="space-y-6">
              {activeJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum trabalho ativo no momento</p>
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div key={job.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Cliente: {getClientName(job.clientId)}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            R$ {job.budget.min.toLocaleString()} - R$ {job.budget.max.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Prazo: {new Date(job.deadline).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleContactClient(job.clientId)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Conversar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-6">
              {completedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum trabalho concluído ainda</p>
                </div>
              ) : (
                completedJobs.map((job) => (
                  <div key={job.id} className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Concluído
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Cliente: {getClientName(job.clientId)}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            R$ {job.budget.min.toLocaleString()} - R$ {job.budget.max.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Concluído em: {new Date(job.updatedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'interested' && (
            <div className="space-y-6">
              {interestedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma candidatura ativa</p>
                </div>
              ) : (
                interestedJobs.map((job) => (
                  <div key={job.id} className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Aguardando
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Cliente: {getClientName(job.clientId)}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            R$ {job.budget.min.toLocaleString()} - R$ {job.budget.max.toLocaleString()}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Prazo: {new Date(job.deadline).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <p className="text-sm text-gray-500 mb-2">
                          {job.interestedProfessionals.length} profissionais interessados
                        </p>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Interesse demonstrado
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}