import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { User as UserType } from '../../types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onRegister: (user: any) => void;
  onBackToLanding: () => void;
}

export function RegisterForm({ onSwitchToLogin, onRegister, onBackToLanding }: RegisterFormProps) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '' as 'professional' | 'client' | '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setIsLoading(true);

    console.log('=== DEBUG CADASTRO ===');
    console.log('Username para cadastro:', formData.username);
    console.log('Email para cadastro:', formData.email);

    if (formData.password !== formData.confirmPassword) {
      setErrors(['As senhas não conferem']);
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setErrors(['O username deve ter pelo menos 3 caracteres']);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrors(['A senha deve ter pelo menos 6 caracteres']);
      setIsLoading(false);
      return;
    }

    try {
      // Check if user already exists in context state
      const users = state.users;
      console.log('Total de usuários existentes:', users.length);
      console.log('Usuários existentes:', users.map(u => ({ email: u.email, type: u.type })));
      
      const emailToCheck = formData.email.toLowerCase().trim();
      const usernameToCheck = formData.username.toLowerCase().trim();
      console.log('Email normalizado para verificação:', emailToCheck);
      console.log('Username normalizado para verificação:', usernameToCheck);
      
      const userExists = users.find((u: UserType) => 
        u.email.toLowerCase().trim() === emailToCheck || u.username.toLowerCase().trim() === usernameToCheck
      );

      console.log('Usuário já existe:', userExists ? 'SIM' : 'NÃO');
      
      if (userExists) {
        console.log('Tentativa de cadastro com email/username existente:', userExists.email, userExists.username);
        if (userExists.email.toLowerCase().trim() === emailToCheck) {
          setErrors(['Este email já está cadastrado']);
        } else {
          setErrors(['Este username já está em uso']);
        }
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser: UserType = {
        id: Date.now().toString(),
        username: formData.username.toLowerCase(),
        email: formData.email.toLowerCase(),
        password: formData.password,
        type: formData.userType,
        createdAt: new Date(),
        isActive: true,
      };

      // Add user to context state
      dispatch({ type: 'ADD_USER', payload: newUser });
      dispatch({ type: 'SET_USER', payload: newUser });
      
      console.log('Novo usuário criado:', { username: newUser.username, email: newUser.email, type: newUser.type });
      console.log('Total de usuários após cadastro:', users.length + 1);
      console.log('=== FIM DEBUG CADASTRO ===');

      // Call onRegister callback
      onRegister(newUser);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrors(['Erro interno. Tente novamente.']);
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
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            {errors.map((error, index) => (
              <p key={index} className="text-red-700 text-sm">{error}</p>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="seu_username"
              required
            />
          </div>
        </div>

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
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Confirme sua senha"
              required
            />
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