import React from 'react';
import { Briefcase, Star, DollarSign, Calendar, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Demand } from '../../types';

interface ProfessionalDashboardProps {
  onPageChange?: (page: string) => void;
  onShowOpportunityDetails?: (demand: Demand) => void;
}

export function ProfessionalDashboard({ onPageChange, onShowOpportunityDetails }: ProfessionalDashboardProps) {
  const { state } = useApp();

  const userProfile = state.professionalProfiles.find(p => p.userId === state.currentUser?.id);
  const userDemands = state.demands.filter(d => d.selectedProfessional === state.currentUser?.id);
  const availableOpportunities = state.demands.filter(d => d.status === 'open');

  const stats = [
    {
      label: 'Trabalhos Ativos',
      value: userDemands.filter(d => d.status === 'in_progress').length,
      icon: Briefcase,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
    {
      label: 'Avaliação',
      value: userProfile?.rating || 0,
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Trabalhos Concluídos',
      value: userProfile?.completedJobs || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Oportunidades Abertas',
      value: availableOpportunities.length,
      icon: Eye,
      color: 'text-pink-600',
      bg: 'bg-pink-100',
    },
  ];

  const recentOpportunities = availableOpportunities.slice(0, 3);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Olá, {userProfile?.name || 'Profissional'}!
        </h1>
        <p className="text-gray-600">
          {userProfile?.isApproved 
            ? 'Seu perfil está aprovado e visível para clientes' 
            : 'Complete seu perfil para começar a receber oportunidades'
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

      {/* Profile Status */}
      {!userProfile?.isApproved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-12">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Complete seu perfil</h3>
              <p className="text-yellow-700">
                Adicione suas informações, portfólio e serviços para começar a receber oportunidades.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Opportunities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Oportunidades Recentes</h2>
        {recentOpportunities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma oportunidade disponível no momento</p>
        ) : (
          <div className="space-y-4">
            {recentOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{opportunity.title}</h3>
                    <p className="text-gray-600 mt-1">{opportunity.description}</p>
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        R$ {opportunity.budget.min} - R$ {opportunity.budget.max}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(opportunity.deadline).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <button className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors">
                    <span onClick={() => onShowOpportunityDetails?.(opportunity)}>Ver Detalhes</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
       {/* Support Card - Footer */}
      <div className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-lg text-white">
        <h3 className="text-xl font-semibold mb-2">Suporte VINKO</h3>
        <p className="text-orange-100 mb-4">
          Precisa de ajuda? Nossa equipe está aqui para você
        </p>

        <a
          href="https://wa.me/5548999585658?text=Olá%2C+preciso+de+ajuda+com+a+plataforma+Vinko."
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Falar com Suporte</span>
          </button>
        </a>
      </div>
    </div>
  );
}