import { useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { authService } from '../services/authService';
import { DjangoUser } from '../types';

export const useAuth = () => {
  const { state, dispatch } = useApp();
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const isInitializing = useRef(false);

  // Verificar e renovar tokens automaticamente
  const checkAndRefreshTokens = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return false;
    }

    try {
      // Usar o novo método do AuthService
      const success = await authService.checkAndRefreshTokens();
      
      if (success) {
        // Buscar dados atualizados do usuário
        const currentUser = await authService.getCurrentUser();
        
        // Atualizar contexto
        dispatch({ type: 'SET_DJANGO_USER', payload: currentUser });
      }
      
      return success;
    } catch (error) {
      console.error('Erro ao renovar tokens:', error);
      logout();
      return false;
    }
  }, [dispatch]);

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated() && !isInitializing.current) {
        isInitializing.current = true;
        
        try {
          // Primeiro, carregar dados do localStorage para exibição imediata
          const storedUser = authService.getUser();
          if (storedUser) {
            dispatch({ type: 'SET_DJANGO_USER', payload: storedUser });
          }

          // Sempre buscar dados atualizados do usuário via API
          // Isso garante que temos os dados mais recentes e tokens renovados
          try {
            const currentUser = await authService.getCurrentUser();
            dispatch({ type: 'SET_DJANGO_USER', payload: currentUser });
          } catch (error) {
            console.error('Erro ao buscar dados atualizados do usuário:', error);
            // Se falhar ao buscar dados atualizados, manter os dados do localStorage
            // mas tentar renovar tokens se necessário
            const isAuthenticated = await checkAndRefreshTokens();
            if (!isAuthenticated) {
              logout();
            }
          }
        } catch (error) {
          console.error('Erro ao inicializar autenticação:', error);
          logout();
        } finally {
          isInitializing.current = false;
        }
      }
    };

    initializeAuth();
  }, []); // Removida dependência checkAndRefreshTokens

  // Configurar verificação periódica de tokens
  useEffect(() => {
    if (authService.isAuthenticated()) {
      // Verificar a cada 5 minutos
      tokenCheckInterval.current = setInterval(async () => {
        await checkAndRefreshTokens();
      }, 5 * 60 * 1000); // 5 minutos
    }

    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, [checkAndRefreshTokens]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    dispatch({ type: 'SET_AUTH_ERROR', payload: null });

    try {
      const authData = await authService.login({ email, password });
      
      // Verificar se o email foi verificado
      if (!authData.user.is_email_verified) {
        throw new Error('E-mail não verificado. Por favor, verifique sua caixa de entrada e ative sua conta.');
      }

      // Salvar dados de autenticação
      authService.saveAuthData(authData.token.access, authData.token.refresh, authData.user);
      
      // Atualizar contexto
      dispatch({ type: 'SET_DJANGO_USER', payload: authData.user });
      
      return { success: true, user: authData.user };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno. Tente novamente.';
      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [dispatch]);

  const register = useCallback(async (email: string, password: string, password2: string, userType: string) => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    dispatch({ type: 'SET_AUTH_ERROR', payload: null });

    try {
      // Mapear os tipos do frontend para os valores da API
      const typeMapping: Record<string, string> = {
        'professional': 'PROFISSIONAL',
        'client': 'CLIENTE'
      };

      const apiUserType = typeMapping[userType];
      
      if (!apiUserType) {
        throw new Error('Tipo de usuário inválido');
      }

      // Registrar usuário
      await authService.register({
        email: email.toLowerCase(),
        password,
        password2,
        user_type: apiUserType,
      });

      return { success: true, message: 'Conta criada! Verifique seu e-mail para ativar sua conta.' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno. Tente novamente.';
      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [dispatch]);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    dispatch({ type: 'SET_AUTH_ERROR', payload: null });

    try {
      const authData = await authService.verifyEmail({ email, code });
      
      // Salvar dados de autenticação
      authService.saveAuthData(authData.token.access, authData.token.refresh, authData.user);
      
      // Atualizar contexto
      dispatch({ type: 'SET_DJANGO_USER', payload: authData.user });
      
      return { success: true, user: authData.user };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno. Tente novamente.';
      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [dispatch]);

  const resendVerificationCode = useCallback(async (email: string) => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    dispatch({ type: 'SET_AUTH_ERROR', payload: null });

    try {
      await authService.resendVerificationCode({ email });
      return { success: true, message: 'Código reenviado com sucesso!' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro interno. Tente novamente.';
      dispatch({ type: 'SET_AUTH_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_AUTH_LOADING', payload: false });
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    // Limpar intervalo de verificação
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }
    
    // Fazer logout no contexto
    dispatch({ type: 'LOGOUT' });
    
    // Fazer logout no serviço (que limpa localStorage e redireciona)
    authService.logout();
  }, [dispatch]);

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  const getCurrentUser = useCallback((): DjangoUser | null => {
    return state.djangoUser;
  }, [state.djangoUser]);

  const getUserType = useCallback((): string | null => {
    return authService.getUserType();
  }, []);

  const getUserId = useCallback((): string | null => {
    return authService.getUserId();
  }, []);

  return {
    // Estado
    user: state.djangoUser,
    isLoading: state.authLoading,
    error: state.authError,
    isAuthenticated: isAuthenticated(),
    
    // Ações
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    logout,
    getCurrentUser,
    getUserType,
    getUserId,
    checkAndRefreshTokens,
  };
};
