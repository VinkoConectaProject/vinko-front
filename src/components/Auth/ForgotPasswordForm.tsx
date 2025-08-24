import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { ApiMessage } from '../UI/ApiMessage';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await authService.requestPasswordReset({ email });
      setMessage({ type: 'success', text: response.message });
      setIsSubmitted(true);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Erro ao enviar email de recuperação. Tente novamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email enviado!</h1>
          <p className="text-gray-600">
            Enviamos um link de recuperação de senha para <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Próximos passos:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Verifique sua caixa de entrada</li>
            <li>• Clique no link recebido</li>
            <li>• Defina uma nova senha</li>
            <li>• Faça login com a nova senha</li>
          </ul>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
          </p>
          
          <button
            onClick={onBack}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h1>
        <p className="text-gray-600">
          Digite seu email e enviaremos um link para redefinir sua senha
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao login
          </button>
        </div>
      </form>
    </div>
  );
}