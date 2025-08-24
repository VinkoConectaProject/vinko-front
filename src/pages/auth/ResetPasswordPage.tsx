import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { PasswordResetConfirmRequest } from '../../types';
import { ApiMessage } from '../../components/UI/ApiMessage';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface ResetPasswordPageProps {
  code: string;
  onSuccess: () => void;
  onBack: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ code, onSuccess, onBack }) => {
  const [formData, setFormData] = useState<PasswordResetConfirmRequest>({
    code: code,
    password: '',
    password2: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  useEffect(() => {
    if (code) {
      setFormData(prev => ({ ...prev, code }));
    }
  }, [code]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password2) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authService.confirmPasswordReset(formData);
      setMessage({ type: 'success', text: response.message });
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao redefinir senha. Tente novamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-25 to-pink-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
          <p className="text-gray-600">
            Digite sua nova senha para continuar
          </p>
        </div>

        {message && (
          <div className="mb-6">
            <ApiMessage
              type={message.type}
              message={message.text}
              onClose={() => setMessage(null)}
            />
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Digite sua nova senha"
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
            <label htmlFor="password2" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password2"
                name="password2"
                type={showPassword2 ? 'text' : 'password'}
                required
                value={formData.password2}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Confirme sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword2(!showPassword2)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
