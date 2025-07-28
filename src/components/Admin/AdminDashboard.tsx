import React, { useState } from 'react';
import { Users, Briefcase, BarChart3, Shield, CheckCircle, XCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function AdminDashboard() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  const totalUsers = state.professionalProfiles.length + state.clientProfiles.length;
  const totalProfessionals = state.professionalProfiles.length;
  const totalClients = state.clientProfiles.length;
  const totalDemands = state.demands.length;
  const activeDemands = state.demands.filter(d => d.status === 'open' || d.status === 'in_progress').length;
  const completedDemands = state.demands.filter(d => d.status === 'completed').length;
  const pendingApprovals = state.professionalProfiles.filter(p => !p.isApproved).length;

  const stats = [
    { label: 'Total de Usuários', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Profissionais', value: totalProfessionals, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Clientes', value: totalClients, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Demandas Ativas', value: activeDemands, icon: Briefcase, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Demandas Concluídas', value: completedDemands, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pendente Aprovação', value: pendingApprovals, icon: Shield, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const handleApproveProfessional = (professionalId: string) => {
    const professional = state.professionalProfiles.find(p => p.id === professionalId);
    if (professional) {
      const updatedProfessional = { ...professional, isApproved: true };
      dispatch({ type: 'UPDATE_PROFESSIONAL_PROFILE', payload: updatedProfessional });
    }
  };

  const handleRejectProfessional = (professionalId: string) => {
    // In a real app, you might want to add a rejection reason
    if (window.confirm('Tem certeza que deseja rejeitar este profissional?')) {
      // Remove from approved list or mark as rejected
      const professional = state.professionalProfiles.find(p => p.id === professionalId);
      if (professional) {
        const updatedProfessional = { ...professional, isApproved: false };
        dispatch({ type: 'UPDATE_PROFESSIONAL_PROFILE', payload: updatedProfessional });
      }
    }
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie usuários, demandas e monitore a plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'demands', label: 'Demandas', icon: Briefcase },
              { id: 'approvals', label: 'Aprovações', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Usuários por Tipo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profissionais</span>
                      <span className="font-medium">{totalProfessionals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Clientes</span>
                      <span className="font-medium">{totalClients}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Status das Demandas</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Abertas</span>
                      <span className="font-medium">{state.demands.filter(d => d.status === 'open').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Em andamento</span>
                      <span className="font-medium">{state.demands.filter(d => d.status === 'in_progress').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Concluídas</span>
                      <span className="font-medium">{completedDemands}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Cidades com Mais Atividade</h3>
                <div className="space-y-2">
                  {Object.entries(
                    [...state.professionalProfiles, ...state.clientProfiles.map(c => ({ city: c.city }))]
                      .reduce((acc, user) => {
                        acc[user.city] = (acc[user.city] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([city, count]) => (
                      <div key={city} className="flex justify-between">
                        <span className="text-gray-600">{city}</span>
                        <span className="font-medium">{count} usuários</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {/* Professionals */}
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900">Profissionais ({totalProfessionals})</h4>
                  </div>
                  {state.professionalProfiles.map((professional) => (
                    <div key={professional.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{professional.name}</p>
                            <p className="text-sm text-gray-500">{professional.city}, {professional.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            professional.isApproved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {professional.isApproved ? 'Aprovado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Clients */}
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium text-gray-900">Clientes ({totalClients})</h4>
                  </div>
                  {state.clientProfiles.map((client) => (
                    <div key={client.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-500">
                              {client.company && `${client.company} - `}
                              {client.city}, {client.state}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Cliente
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demands' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Gerenciar Demandas</h3>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {state.demands.map((demand) => {
                    const client = state.clientProfiles.find(c => c.userId === demand.clientId);
                    return (
                      <div key={demand.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{demand.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                demand.status === 'open' ? 'bg-green-100 text-green-800' :
                                demand.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                demand.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {demand.status === 'open' ? 'Aberta' :
                                 demand.status === 'in_progress' ? 'Em andamento' :
                                 demand.status === 'completed' ? 'Concluída' : 'Cancelada'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{demand.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Cliente: {client?.name || 'Desconhecido'}</span>
                              <span>Interessados: {demand.interestedProfessionals.length}</span>
                              <span>Orçamento: R$ {demand.budget.min} - R$ {demand.budget.max}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Aprovar Profissionais</h3>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {state.professionalProfiles.filter(p => !p.isApproved).length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhum profissional pendente de aprovação</p>
                    </div>
                  ) : (
                    state.professionalProfiles
                      .filter(p => !p.isApproved)
                      .map((professional) => (
                        <div key={professional.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{professional.name}</p>
                                <p className="text-sm text-gray-500">{professional.city}, {professional.state}</p>
                                <p className="text-sm text-gray-600 mt-1">{professional.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  {professional.services.slice(0, 3).map((service, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {service}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleApproveProfessional(professional.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleRejectProfessional(professional.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}