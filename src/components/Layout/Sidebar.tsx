import React from 'react';
import { 
  Home, 
  User, 
  Briefcase, 
  Search, 
  MessageSquare, 
  Settings,
  Users,
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ isOpen, currentPage, onPageChange }: SidebarProps) {
  const { state } = useApp();
  const { getUserType } = useAuth();

  const professionalMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'opportunities', label: 'Oportunidades', icon: Briefcase },
    { id: 'my-jobs', label: 'Meus Trabalhos', icon: FileText },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const clientMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'find-professionals', label: 'Buscar Profissionais', icon: Search },
    { id: 'my-demands', label: 'Minhas Demandas', icon: Briefcase },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard Admin', icon: Home },
    { id: 'manage-users', label: 'Gerenciar Usuários', icon: Users },
    { id: 'manage-demands', label: 'Gerenciar Demandas', icon: Briefcase },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'moderation', label: 'Moderação', icon: Shield },
  ];

  const userType = getUserType();
  let menuItems = userType === 'PROFISSIONAL' ? professionalMenuItems : clientMenuItems;
  
  // Add admin menu if user is admin (you can add admin detection logic here)
  if (state.djangoUser?.email === 'admin@vinko.com') {
    menuItems = [...menuItems, ...adminMenuItems];
  }

  return (
    <aside className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out w-64
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:relative md:h-full flex-shrink-0
    `}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {userType === 'PROFISSIONAL' ? 'Profissional' : 'Cliente'}
            </p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`
                w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                ${currentPage === item.id
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}