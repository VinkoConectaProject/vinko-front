import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { authService } from '../../services/authService';
import { useApiMessage } from '../../hooks/useApiMessage';
import { ApiMessage } from '../UI/ApiMessage';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onLogin: (user: any) => void;
  onBackToLanding: () => void;
  onShowEmailVerification: (email: string) => void;
}

export function LoginForm({ onSwitchToRegister, onForgotPassword, onLogin, onBackToLanding, onShowEmailVerification }: LoginFormProps) {
  const { dispatch } = useApp();
  const { apiMessage, handleApiError, handleApiSuccess, hideMessage } = useApiMessage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Fazer login via API
      const authData = await authService.login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      // Verificar se o email foi verificado
      if (!authData.user.is_email_verified) {
        // Se não foi verificado, mostrar tela de verificação
        onShowEmailVerification(formData.email.toLowerCase().trim());
        return;
      }

      // Salvar dados de autenticação
      authService.saveAuthData(authData.token.access, authData.token.refresh, authData.user);
      
      // Mostrar mensagem de sucesso
      handleApiSuccess(authData.message);
      
      // Atualizar contexto com o usuário Django
      dispatch({ type: 'SET_DJANGO_USER', payload: authData.user });
      
      // Fazer login
      onLogin(authData.user);

    } catch (error: unknown) {
      
      // Verificar se é o erro específico de email não verificado
      if (error instanceof Error && (error.message.includes('não verificado') || error.message.includes('verificado'))) {
        // Redirecionar para verificação de email
        onShowEmailVerification(formData.email.toLowerCase().trim());
        return;
      }
      
      // Tratar outros erros
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo à <span className="text-pink-500">Vinko conecta</span></h1>
        <p className="text-gray-600">Conectando profissionais da moda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {apiMessage.show && (
          <div className="mb-6">
            <ApiMessage
              message={apiMessage.message}
              type={apiMessage.type}
              onClose={hideMessage}
            />
          </div>
          )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
          >
            Esqueceu sua senha?
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Cadastre-se
            </button>
          </p>
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-gray-500 hover:text-gray-700 text-sm mt-2"
          >
            ← Voltar para página inicial
          </button>
        </div>
      </form>
    </div>
  );
}