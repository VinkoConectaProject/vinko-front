import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, ProfessionalProfile, ClientProfile, Demand, Notification, AppState, Conversation, Message, Rating, DjangoUser } from '../types';

type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_DJANGO_USER'; payload: DjangoUser | null }
  | { type: 'UPDATE_DJANGO_USER'; payload: DjangoUser }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_ERROR'; payload: string | null }
  | { type: 'ADD_PROFESSIONAL_PROFILE'; payload: ProfessionalProfile }
  | { type: 'ADD_CLIENT_PROFILE'; payload: ClientProfile }
  | { type: 'UPDATE_PROFESSIONAL_PROFILE'; payload: ProfessionalProfile }
  | { type: 'UPDATE_CLIENT_PROFILE'; payload: ClientProfile }
  | { type: 'ADD_DEMAND'; payload: Demand }
  | { type: 'UPDATE_DEMAND'; payload: Demand }
  | { type: 'DELETE_DEMAND'; payload: string }
  | { type: 'SELECT_PROFESSIONAL'; payload: { demandId: string; professionalId: string } }
  | { type: 'CHANGE_PROFESSIONAL'; payload: { demandId: string; oldProfessionalId: string; newProfessionalId: string } }
  | { type: 'COMPLETE_DEMAND'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'MARK_MESSAGES_READ'; payload: { conversationId: string; userId: string } }
  | { type: 'CLEANUP_OLD_DATA'; payload: { messages: Message[]; conversations: Conversation[] } }
  | { type: 'ADD_RATING'; payload: Rating }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'LOGOUT' }
  | { type: 'RESET_ALL' };

const initialState: AppState = {
  currentUser: null,
  djangoUser: null,
  users: [],
  professionalProfiles: [],
  clientProfiles: [],
  demands: [],
  notifications: [],
  conversations: [],
  messages: [],
  ratings: [],
  isLoading: true,
  authLoading: false,
  authError: null,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER': {
  // se trocou de usuário, zera o resto do estado para não vazar dados do anterior
  console.log('[VINKO] SET_USER chamado', { prevId, nextId });
  const prevId = state.currentUser?.id?.toString();
  const nextId = action.payload?.id?.toString();

  if (prevId && nextId && prevId !== nextId) {
    return {
      ...initialState,                 // limpa tudo
      currentUser: action.payload,     // coloca o novo usuário
      isLoading: false,
      authLoading: false,
      authError: null,
    };
  }

  // mesmo usuário? só atualiza
  return { ...state, currentUser: action.payload };
}
    case 'SET_DJANGO_USER':
      return { ...state, djangoUser: action.payload };
    case 'UPDATE_DJANGO_USER':
      return { ...state, djangoUser: action.payload };
    case 'ADD_USER':
      return { 
        ...state, 
        users: [...state.users, action.payload] 
      };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_PROFESSIONAL_PROFILE':
      return { 
        ...state, 
        professionalProfiles: [...state.professionalProfiles, action.payload] 
      };
    case 'ADD_CLIENT_PROFILE':
      return { 
        ...state, 
        clientProfiles: [...state.clientProfiles, action.payload] 
      };
    case 'UPDATE_PROFESSIONAL_PROFILE':
      return {
        ...state,
        professionalProfiles: state.professionalProfiles.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'UPDATE_CLIENT_PROFILE':
      return {
        ...state,
        clientProfiles: state.clientProfiles.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'ADD_DEMAND':
      return { 
        ...state, 
        demands: [...state.demands, action.payload] 
      };
    case 'UPDATE_DEMAND':
      return {
        ...state,
        demands: state.demands.map(d =>
          d.id === action.payload.id ? action.payload : d
        )
      };
    case 'DELETE_DEMAND':
      return {
        ...state,
        demands: state.demands.filter(d => d.id !== action.payload)
      };
    case 'SELECT_PROFESSIONAL':
      return {
        ...state,
        demands: state.demands.map(d =>
          d.id === action.payload.demandId 
            ? { ...d, selectedProfessional: action.payload.professionalId, status: 'in_progress' as const, updatedAt: new Date() }
            : d
        )
      };
    case 'CHANGE_PROFESSIONAL':
      return {
        ...state,
        demands: state.demands.map(d =>
          d.id === action.payload.demandId 
            ? { ...d, selectedProfessional: action.payload.newProfessionalId, updatedAt: new Date() }
            : d
        )
      };
    case 'COMPLETE_DEMAND':
      return {
        ...state,
        demands: state.demands.map(d =>
          d.id === action.payload 
            ? { ...d, status: 'completed' as const, updatedAt: new Date() }
            : d
        )
      };
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true } : n
        )
      };
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [...state.conversations, action.payload] 
      };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.payload.id ? action.payload : c
        )
      };
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload] 
      };
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.conversationId === action.payload.conversationId && 
          m.senderId !== action.payload.userId
            ? { ...m, isRead: true } : m
        )
      };
    case 'CLEANUP_OLD_DATA':
      return {
        ...state,
        messages: action.payload.messages,
        conversations: action.payload.conversations,
      };
    case 'ADD_RATING':
      return { 
        ...state, 
        ratings: [...state.ratings, action.payload] 
      };
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.payload };
    case 'SET_AUTH_ERROR':
      return { ...state, authError: action.payload };
    case 'LOGOUT':
      return { 
        ...initialState,
        isLoading: false,
        authLoading: false,
        authError: null 
      };
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'RESET_ALL':
      return {
        ...initialState,
        isLoading: false,
        authLoading: false,
        authError: null,
      };

    default:
      return state;
  }
}
function clearLocalData() {
  try {
    console.log('[VINKO] clearLocalData rodou — dados locais apagados');
    localStorage.removeItem('vinko-current-user');
    localStorage.removeItem('vinko-users');
    localStorage.removeItem('vinko-data');
    localStorage.removeItem('vinko:clientDraft');
    localStorage.removeItem('vinko:clientForm');
    sessionStorage.clear();
  } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    (window as any).vinkoReset = () => {
      clearLocalData();
      dispatch({ type: 'RESET_ALL' });
    };
  }, []);


  // Reviver function to convert ISO date strings back to Date objects
  const dateReviver = (_key: string, value: unknown) => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Inicialização única e estável
  useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      try {
        // VALIDAÇÃO: Verificar se há um usuário autenticado
        const storedUserId = localStorage.getItem('user_id');
        const accessToken = localStorage.getItem('access_token');
        
        // Se não há usuário autenticado, limpar todos os dados e não carregar nada
        if (!storedUserId || !accessToken) {
          console.log('[VINKO] loadData -> RESET_ALL (sem usuário autenticado)');
          clearLocalData();
        if (isMounted) {
          dispatch({ type: 'RESET_ALL' });
        }
        return;
        }

        
        // Carregar usuários cadastrados
        const usersData = localStorage.getItem('vinko-users');
        let users: User[] = [];
        if (usersData) {
          users = JSON.parse(usersData, dateReviver);
        }
        
        // Carregar outros dados primeiro
        let parsedData = {};
        try {
          const savedData = localStorage.getItem('vinko-data');
          if (savedData && savedData !== 'undefined' && isMounted) {
            parsedData = JSON.parse(savedData, dateReviver);
          }
        } catch (err) {
          // Erro ao fazer parse do vinko-data - limpar dados corrompidos
          console.error('Erro ao carregar vinko-data. Limpando...', err);
          localStorage.removeItem('vinko-data');
        }
        
        // Carregar usuário atual
        const currentUserData = localStorage.getItem('vinko-current-user');
        let currentUser = null;
        if (currentUserData) {
          currentUser = JSON.parse(currentUserData, dateReviver);
        }
        
        // VALIDAÇÃO DE INTEGRIDADE: Verificar se os dados pertencem ao usuário atual
        
          // Se o currentUser no localStorage não corresponde ao user_id autenticado, limpar dados
          if (currentUser && currentUser.id.toString() !== storedUserId) {
            console.warn('Dados de outro usuário detectados. Limpando...');
            clearLocalData();
            if (isMounted) {
              dispatch({ type: 'RESET_ALL' });
            }
            return;
          }

        
        // VALIDAÇÃO ADICIONAL: Verificar se há dados de usuário sem correspondência
        if (!currentUser && (users.length > 0 || Object.keys(parsedData).length > 0)) {
          console.warn('Dados órfãos detectados (sem usuário atual). Limpando...');
          clearLocalData();
          if (isMounted) {
            dispatch({ type: 'RESET_ALL' });
          }
          return;
        }

        
        // Combinar dados
        const finalData = {
          ...parsedData,
          users,
          currentUser
        };
        
        if (isMounted) {
          dispatch({ type: 'LOAD_DATA', payload: finalData });
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        // Em caso de erro, limpeza segura
        clearLocalData();
      } finally {

        if (isMounted) {
          // Delay maior para evitar piscamento
          setTimeout(() => {
            dispatch({ type: 'SET_LOADING', payload: false });
          }, 200);
        }
      }
    };

    // Delay para evitar piscamento
    const timer = setTimeout(loadData, 150);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Salvar dados quando mudarem (de forma controlada)
  useEffect(() => {
    if (!state.isLoading) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('vinko-users', JSON.stringify(state.users));
          localStorage.setItem('vinko-data', JSON.stringify({
            professionalProfiles: state.professionalProfiles,
            clientProfiles: state.clientProfiles,
            demands: state.demands,
            notifications: state.notifications,
            conversations: state.conversations,
            messages: state.messages,
            ratings: state.ratings,
          }));
          
          if (state.currentUser) {
            localStorage.setItem('vinko-current-user', JSON.stringify(state.currentUser));
          }
        } catch {
          // Erro ao salvar dados
        }
      }, 1000); // Debounce de 1 segundo
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.users, state.currentUser, state.professionalProfiles, state.clientProfiles, state.demands, state.notifications, state.conversations, state.messages, state.ratings, state.isLoading]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
