import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { userService } from '../services/userService';

export function useUserRefresh() {
  const { dispatch } = useApp();

  const refreshUserData = useCallback(async () => {
    try {
      const updatedUser = await userService.getUserById();
      dispatch({ type: 'UPDATE_DJANGO_USER', payload: updatedUser });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  return { refreshUserData };
}
