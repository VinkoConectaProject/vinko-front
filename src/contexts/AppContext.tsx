import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, ProfessionalProfile, ClientProfile, Demand, Notification, AppState, Conversation, Message } from '../types';

type AppAction = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_PROFESSIONAL_PROFILE'; payload: ProfessionalProfile }
  | { type: 'ADD_CLIENT_PROFILE'; payload: ClientProfile }
  | { type: 'UPDATE_PROFESSIONAL_PROFILE'; payload: ProfessionalProfile }
  | { type: 'UPDATE_CLIENT_PROFILE'; payload: ClientProfile }
  | { type: 'ADD_DEMAND'; payload: Demand }
  | { type: 'UPDATE_DEMAND'; payload: Demand }
  | { type: 'DELETE_DEMAND'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'MARK_MESSAGES_READ'; payload: { conversationId: string; userId: string } }
  | { type: 'CLEANUP_OLD_DATA'; payload: { messages: Message[]; conversations: Conversation[] } }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> };

const initialState: AppState = {
  currentUser: null,
  users: [],
  professionalProfiles: [],
  clientProfiles: [],
  demands: [],
  notifications: [],
  conversations: [],
  messages: [],
  isLoading: true,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
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
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Inicialização única e estável
  useEffect(() => {
    let isMounted = true;
    
    const loadData = () => {
      try {
        // Carregar usuários cadastrados
        const usersData = localStorage.getItem('vinko-users');
        let users: User[] = [];
        if (usersData) {
          users = JSON.parse(usersData);
        }
        
        // Carregar usuário atual
        const currentUserData = localStorage.getItem('vinko-current-user');
        let currentUser = null;
        if (currentUserData) {
          currentUser = JSON.parse(currentUserData);
        }
        
       // Carregar outros dados
let parsedData = {};
try {
  const savedData = localStorage.getItem('vinko-data');
  if (savedData && savedData !== 'undefined' && isMounted) {
    parsedData = JSON.parse(savedData);
  }
} catch (error) {
  console.error('Erro ao fazer parse do vinko-data:', error);
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
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
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

  // Salvar dados no localStorage
  useEffect(() => {
    if (!state.isLoading) {
      // Salvar usuários separadamente
      try {
        localStorage.setItem('vinko-users', JSON.stringify(state.users));
      } catch (error) {
        console.error('Erro ao salvar usuários:', error);
      }
      
      // Não salvar currentUser no vinko-data, ele fica separado
      const dataToSave = {
        professionalProfiles: state.professionalProfiles,
        clientProfiles: state.clientProfiles,
        demands: state.demands,
        notifications: state.notifications,
        conversations: state.conversations,
        messages: state.messages,
      };
      
      try {
        localStorage.setItem('vinko-data', JSON.stringify(dataToSave));
        
        // Salvar currentUser separadamente se existir
        if (state.currentUser) {
          localStorage.setItem('vinko-current-user', JSON.stringify(state.currentUser));
        }
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
      }
    }
  }, [state.users, state.currentUser, state.professionalProfiles, state.clientProfiles, state.demands, state.notifications, state.conversations, state.messages, state.isLoading]);

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