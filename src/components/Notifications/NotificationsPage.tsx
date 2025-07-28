import React from 'react';
import { Bell, Check, Clock, X, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function NotificationsPage() {
  const { state, dispatch } = useApp();

  const sortedNotifications = [...state.notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleMarkAsRead = (notificationId: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
  };

  const handleMarkAllAsRead = () => {
    state.notifications.forEach(notification => {
      if (!notification.isRead) {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notification.id });
      }
    });
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_demand':
        return <Bell className="h-5 w-5 text-blue-600" />;
      case 'new_interest':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'selected':
        return <Check className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const unreadCount = state.notifications.filter(n => !n.isRead).length;

  return (
    <div className="py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notificações</h1>
            <p className="text-gray-600">
              Acompanhe todas as atualizações e novidades da plataforma
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{state.notifications.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Não Lidas</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lidas</p>
              <p className="text-2xl font-bold text-gray-900">{state.notifications.length - unreadCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Nenhuma notificação ainda</p>
            <p className="text-gray-400 text-sm mt-2">
              Suas notificações aparecerão aqui quando houver atividade
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className={`text-sm ${
                        !notification.isRead ? 'text-gray-700' : 'text-gray-600'
                      } mb-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDateTime(notification.createdAt)}
                        </span>
                        
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          !notification.isRead 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {!notification.isRead ? 'Não lida' : 'Lida'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Marcar como lida"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}