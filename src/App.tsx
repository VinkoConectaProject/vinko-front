import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/landing/LandingPage';
import { AppProvider, useApp } from './contexts/AppContext';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ForgotPasswordForm } from './components/Auth/ForgotPasswordForm';
import { EmailVerification } from './components/Auth/EmailVerification';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { ProfessionalDashboard } from './components/Dashboard/ProfessionalDashboard';
import { ClientDashboard } from './components/Dashboard/ClientDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ProfessionalProfileForm } from './components/Profile/ProfessionalProfileForm';
import { ClientProfileForm } from './components/Profile/ClientProfileForm';
import OpportunitiesPage from './components/Opportunities/OpportunitiesPage';
import { FindProfessionalsPage } from './components/Professionals/FindProfessionalsPage';
import { MyDemandsPage } from './components/Demands/MyDemandsPage';
import { MyJobsPage } from './components/Jobs/MyJobsPage';
import { NotificationsPage } from './components/Notifications/NotificationsPage';
import { MessagesPage } from './components/Messages/MessagesPage';
import { DjangoUser } from './types';

function AppContent() {
  const { state, dispatch } = useApp();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDemandForm, setShowDemandForm] = useState(false);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [appState, setAppState] = useState<'loading' | 'landing' | 'auth' | 'emailVerification' | 'dashboard'>('loading');
  const [verificationEmail, setVerificationEmail] = useState<string>('');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setAppState('landing');
    setCurrentPage('dashboard');
    localStorage.clear();
  };

  // Determine app state based on URL and user status
  useEffect(() => {
    if (state.isLoading) {
      setAppState('loading');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (state.currentUser || state.djangoUser) {
      setAppState('dashboard');
    } else if (authParam) {
      setAppState('auth');
      setAuthMode(authParam === 'register' ? 'register' : authParam === 'forgot' ? 'forgot' : 'login');
    } else {
      setAppState('landing');
    }
  }, [state.isLoading, state.currentUser, state.djangoUser]);

  const handleShowEmailVerification = (email: string) => {
    setVerificationEmail(email);
    setAppState('emailVerification');
  };

  const handleEmailVerificationSuccess = (authData: { user: DjangoUser; token: { access: string; refresh: string } }) => {
    dispatch({ type: 'SET_DJANGO_USER', payload: authData.user });
    setAppState('dashboard');
  };

  const handleBackToAuth = () => {
    setAppState('auth');
  };

  const handleGoToLogin = () => {
    setAuthMode('login');
    setAppState('auth');
  };

  const startConversation = (otherUserId: string, demandId?: string, initialMessage?: string) => {
    // Check if conversation already exists
    const existingConversation = state.conversations.find(conv =>
      conv.participants && Array.isArray(conv.participants) &&
      conv.participants.includes(state.currentUser?.id || '') &&
      conv.participants.includes(otherUserId)
    );

    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      setCurrentPage('messages');
      
      // Send initial message if provided
      if (initialMessage) {
        const message = {
          id: Date.now().toString(),
          conversationId: existingConversation.id,
          senderId: state.currentUser?.id || '',
          content: initialMessage,
          timestamp: new Date(),
          isRead: false,
          type: 'text' as const,
        };
        dispatch({ type: 'ADD_MESSAGE', payload: message });
        
        // Update conversation with last message
        const updatedConversation = {
          ...existingConversation,
          lastMessage: message,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
      }
      return;
    }

    // Create new conversation
    const newConversation = {
      id: Date.now().toString(),
      participants: [state.currentUser?.id || '', otherUserId],
      createdAt: new Date(),
      updatedAt: new Date(),
      demandId,
    };

    dispatch({ type: 'ADD_CONVERSATION', payload: newConversation });
    
    // Send initial message if provided
    if (initialMessage) {
      const message = {
        id: Date.now().toString(),
        conversationId: newConversation.id,
        senderId: state.currentUser?.id || '',
        content: initialMessage,
        timestamp: new Date(),
        isRead: false,
        type: 'text' as const,
      };
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      
      // Update conversation with last message
      const updatedConversation = {
        ...newConversation,
        lastMessage: message,
        updatedAt: new Date(),
      };
      dispatch({ type: 'UPDATE_CONVERSATION', payload: updatedConversation });
    }
    
    setSelectedConversationId(newConversation.id);
    setCurrentPage('messages');
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (appState === 'landing') {
    return (
      <LandingPage
        onNavigateToAuth={(mode) => {
          setAuthMode(mode);
          setAppState('auth');
        }}
      />
    );
  }

  // Auth pages
  if (appState === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-25 to-pink-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          {authMode === 'login' && (
            <LoginForm 
              onSwitchToRegister={() => setAuthMode('register')}
              onForgotPassword={() => setAuthMode('forgot')}
              onBackToLanding={() => setAppState('landing')}
              onLogin={(user) => {
                dispatch({ type: 'SET_USER', payload: user });
                setAppState('dashboard');
              }}
              onShowEmailVerification={handleShowEmailVerification}
            />
          )}
          {authMode === 'register' && (
            <RegisterForm 
              onSwitchToLogin={() => setAuthMode('login')}
              onBackToLanding={() => setAppState('landing')}
              onShowEmailVerification={handleShowEmailVerification}
            />
          )}
          {authMode === 'forgot' && (
            <ForgotPasswordForm onBack={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    );
  }

  // Email Verification
  if (appState === 'emailVerification') {
    return (
      <EmailVerification
        email={verificationEmail}
        onVerificationSuccess={handleEmailVerificationSuccess}
        onBack={handleBackToAuth}
        onGoToLogin={handleGoToLogin}
      />
    );
  }

  // Dashboard (logged in area)
  const renderPage = () => {
    // Admin pages
    if (state.currentUser?.email === 'admin@vinko.com') {
      switch (currentPage) {
        case 'admin-dashboard':
        case 'manage-users':
        case 'manage-demands':
        case 'reports':
        case 'moderation':
          return <AdminDashboard />;
        default:
          return <AdminDashboard />;
      }
    }

    // Professional pages
    if (state.currentUser?.type === 'professional') {
      switch (currentPage) {
        case 'dashboard':
          return (
            <ProfessionalDashboard 
              onPageChange={setCurrentPage}
              onShowOpportunityDetails={() => {
                setCurrentPage('opportunities');
              }}
            />
          );
        case 'profile':
          return <ProfessionalProfileForm />;
        case 'opportunities':
          return <OpportunitiesPage onStartConversation={startConversation} />;
        case 'my-jobs':
          return <MyJobsPage />;
        case 'notifications':
          return <NotificationsPage />;
        case 'messages':
          return (
            <MessagesPage 
              selectedConversationId={selectedConversationId || undefined}
              onStartConversation={startConversation}
            />
          );
        case 'settings':
          return <div className="p-6"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-gray-600">Em desenvolvimento...</p></div>;
        default:
          return <ProfessionalDashboard onPageChange={setCurrentPage} />;
      }
    }

    // Client pages
    if (state.currentUser?.type === 'client') {
      switch (currentPage) {
        case 'dashboard':
          return (
            <ClientDashboard 
              onPageChange={setCurrentPage}
              onShowDemandForm={() => {
                setCurrentPage('my-demands');
                setShowDemandForm(true);
              }}
              onShowDemandDetails={(demandId) => {
                setCurrentPage('my-demands');
                setSelectedDemandId(demandId);
              }}
              onStartConversation={startConversation}
            />
          );
        case 'profile':
          return <ClientProfileForm />;
        case 'find-professionals':
          return <FindProfessionalsPage onStartConversation={startConversation} />;
        case 'my-demands':
          return (
            <MyDemandsPage 
              showCreateForm={showDemandForm}
              selectedDemandId={selectedDemandId}
              onCloseForm={() => {
                setShowDemandForm(false);
                setSelectedDemandId(null);
              }}
              onStartConversation={startConversation}
            />
          );
        case 'notifications':
          return <NotificationsPage />;
        case 'messages':
          return (
            <MessagesPage 
              selectedConversationId={selectedConversationId || undefined}
              onStartConversation={startConversation}
            />
          );
        case 'settings':
          return <div className="p-6"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-gray-600">Em desenvolvimento...</p></div>;
        default:
          return (
            <ClientDashboard 
              onPageChange={setCurrentPage} 
              onShowDemandForm={() => setShowDemandForm(true)} 
              onShowDemandDetails={(id) => setSelectedDemandId(id)} 
              onStartConversation={startConversation} 
            />
          );
      }
    }

    return (
      <div className="py-6">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
      </div>
    );
  };

  const getPageTitle = () => {
    const pageMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'profile': 'Perfil',
      'opportunities': 'Oportunidades',
      'my-jobs': 'Meus Trabalhos',
      'find-professionals': 'Buscar Profissionais',
      'my-demands': 'Minhas Demandas',
      'messages': 'Mensagens',
      'settings': 'Configurações',
      'admin-dashboard': 'Painel Admin',
      'manage-users': 'Gerenciar Usuários',
      'manage-demands': 'Gerenciar Demandas',
      'reports': 'Relatórios',
      'moderation': 'Moderação',
    };
    return pageMap[currentPage] || 'VINKO';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        currentPage={getPageTitle()}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      />
      
      <div className="flex min-h-screen">
        <Sidebar 
          isOpen={sidebarOpen}
          currentPage={currentPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            setSidebarOpen(false);
            // Reset conversation selection when changing pages
            if (page !== 'messages') {
              setSelectedConversationId(null);
            }
          }}
        />
        
        <main className="flex-1 bg-gray-50">
          <div className="w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="w-full">
              {renderPage()}
            </div>
          </div>
        </main>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;