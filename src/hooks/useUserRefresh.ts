import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { userService } from '../services/userService';

export function useUserRefresh() {
  const { dispatch } = useApp();

  const refreshUserData = useCallback(async () => {
    try {
      console.log('🔄 Atualizando dados do usuário...');
      const updatedUser = await userService.getUserById();
      console.log('✅ Dados atualizados:', updatedUser);
      dispatch({ type: 'UPDATE_DJANGO_USER', payload: updatedUser });
      return updatedUser;
    } catch (error) {
      console.error('❌ Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  }, [dispatch]);

  return { refreshUserData };
}
