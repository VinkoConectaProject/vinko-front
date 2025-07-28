import React from 'react';
import { Bell, User, LogOut, Search, Menu } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface HeaderProps {
  onMenuToggle: () => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

export function Header({ onMenuToggle, currentPage, onPageChange, onLogout }: HeaderProps) {
  const { state, dispatch } = useApp();
  const unreadNotifications = state.notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = () => {
    onPageChange('notifications');
  };

  const handleProfileClick = () => {
    onPageChange('profile');
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-pink-50 transition-colors md:hidden"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vinko <span className="font-normal text-pink-500">conecta</span></h1>
                <p className="text-xs text-gray-500 -mt-1">{currentPage}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <button 
              onClick={handleNotificationClick}
              className="relative p-2 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {state.currentUser?.type === 'professional' ? 'Profissional' : 'Cliente'}
                </p>
                <p className="text-xs text-gray-500">{state.currentUser?.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleProfileClick}
                  className="p-2 rounded-lg hover:bg-pink-50 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600" />
                </button>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-pink-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}