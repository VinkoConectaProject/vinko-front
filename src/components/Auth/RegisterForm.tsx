import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { authService } from '../../services/authService';
import { useApiMessage } from '../../hooks/useApiMessage';
import { ApiMessage } from '../UI/ApiMessage';
import { ERROR_MESSAGES } from '../../config/errorMessages';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onBackToLanding: () => void;
  onShowEmailVerification: (email: string) => void;
}

export function RegisterForm({ onSwitchToLogin, onBackToLanding, onShowEmailVerification }: RegisterFormProps) {
  const { apiMessage, handleApiError, handleApiSuccess, hideMessage } = useApiMessage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: '' as 'professional' | 'client' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      handleApiError(ERROR_MESSAGES.PASSWORDS_DONT_MATCH);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      handleApiError(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
      setIsLoading(false);
      return;
    }

    try {
      // Mapear os tipos do frontend para os valores da API
      const typeMapping: Record<string, string> = {
        'professional': 'PROFISSIONAL',
        'client': 'CLIENTE'
      };

      const apiUserType = typeMapping[formData.userType];
      
      if (!apiUserType) {
        handleApiError(ERROR_MESSAGES.BAD_REQUEST);
        setIsLoading(false);
        return;
      }

      // Registrar usuário via API
      const result = await authService.register({
        email: formData.email.toLowerCase(),
        password: formData.password,
        password2: formData.confirmPassword,
        user_type: apiUserType,
      });

      // Mostrar mensagem de sucesso
      handleApiSuccess(result.message);

      // Mostrar tela de verificação de email
      onShowEmailVerification(formData.email.toLowerCase());

    } catch (error: unknown) {
      console.error('Erro no cadastro:', error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeSelect = (type: 'professional' | 'client') => {
    setFormData(prev => ({ ...prev, userType: type }));
    setStep(2);
  };

  if (step === 1) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Escolha seu perfil</h1>
          <p className="text-gray-600">Como você quer usar a VINKO?</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleUserTypeSelect('professional')}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sou Profissional</h3>
                <p className="text-gray-600 text-sm">Costureira, modelista, facção, designer...</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleUserTypeSelect('client')}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sou Cliente/Marca</h3>
                <p className="text-gray-600 text-sm">Quero contratar profissionais da moda</p>
              </div>
            </div>
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Entre aqui
            </button>
          </p>
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-gray-500 hover:text-gray-700 text-sm mt-2 block mx-auto"
          >
            ← Voltar para página inicial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">V</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar conta</h1>
        <p className="text-gray-600">
          {formData.userType === 'professional' ? 'Perfil Profissional da Moda' : 'Perfil Cliente/Marca'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mensagens de erro */}
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
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Confirme sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              Entre aqui
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