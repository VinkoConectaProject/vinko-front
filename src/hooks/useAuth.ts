import { useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { authService } from '../services/authService';
import { DjangoUser } from '../types';

export const useAuth = () => {
  const { state, dispatch } = useApp();

  // Verificar se o usuário está autenticado ao carregar a aplicação
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Aqui você pode implementar uma chamada para obter dados do usuário
          // Por enquanto, vamos apenas verificar se o token é válido
          const accessToken = authService.getAccessToken();
          if (accessToken) {
            // Token válido, mas precisamos verificar se não expirou
            if (!authService.isTokenExpired()) {
              // Token ainda válido
              return;
            } else {
              // Token expirado, tentar refresh
              const refreshToken = authService.getRefreshToken();
              if (refreshToken) {
                try {
                  const { access } = await authService.refreshToken(refreshToken);
                  authService.saveTokens(access, refreshToken);
                } catch (error) {
                  // Refresh falhou, fazer logout
                  logout();
                }
              } else {
                logout();
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          logout();
        }
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_AUTH_LOADING', payload: true });
    dispatch({ type: 'SET_AUTH_ERROR', payload: null });

    try {
      const authData = await authService.login({ email, password });
      
      // Verificar se o email foi verificado
      if (!authData.user.is_email_verified) {
        throw new Error('E-mail não verificado. Por favor, verifique sua caixa de entrada e ative sua conta.');
      }

      // Salvar tokens
      authService.saveTokens(authData.token.access, authData.token.refresh);
      
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
      // Mapear os tipos do frontend para os nomes da API
      const typeMapping: Record<string, string> = {
        'professional': 'profissional',
        'client': 'cliente'
      };

      const apiTypeName = typeMapping[userType];
      
      // Obter tipos de usuário
      const userTypes = await authService.getUserTypes();
      const selectedUserType = userTypes.find(type => 
        type.name.toLowerCase() === apiTypeName.toLowerCase()
      );

      if (!selectedUserType) {
        throw new Error('Tipo de usuário não encontrado');
      }

      // Registrar usuário
      await authService.register({
        email: email.toLowerCase(),
        password,
        password2,
        user_type_id: selectedUserType.id,
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
      
      // Salvar tokens
      authService.saveTokens(authData.token.access, authData.token.refresh);
      
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
    authService.clearTokens();
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated();
  }, []);

  const getCurrentUser = useCallback((): DjangoUser | null => {
    return state.djangoUser;
  }, [state.djangoUser]);

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
  };
};
