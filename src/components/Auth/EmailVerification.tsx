import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { AuthResponse } from '../../types';
import { MessageBox } from '../UI/MessageBox';

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess: (authData: AuthResponse) => void;
  onBack: () => void;
  onGoToLogin: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBack,
  onGoToLogin,
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setMessage('Por favor, insira o código de verificação.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const authData = await authService.verifyEmail({
        email,
        code: code.trim(),
      });

      setMessage('Código verificado com sucesso!');
      setMessageType('success');
      
      // Salvar tokens
      authService.saveTokens(authData.token.access, authData.token.refresh);
      
      // Aguardar um pouco para mostrar a mensagem de sucesso
      setTimeout(() => {
        onVerificationSuccess(authData);
      }, 1500);

    } catch (error: any) {
      setMessage(error.message || 'Erro ao verificar o código. Tente novamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      await authService.resendVerificationCode({ email });
      setMessage('Código reenviado com sucesso! Verifique seu e-mail.');
      setMessageType('success');
      setResendCountdown(60); // 60 segundos de espera
    } catch (error: any) {
      setMessage(error.message || 'Erro ao reenviar o código. Tente novamente.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyCode();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verificar E-mail
          </h2>
          <p className="text-gray-600">
            Enviamos um código de verificação para:
          </p>
          <p className="text-pink-600 font-medium mt-1 break-words">{email}</p>
        </div>

        {/* Código de verificação */}
        <div className="mb-6">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Código de Verificação
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite o código de 5 dígitos"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors"
            maxLength={5}
            disabled={isLoading}
          />
        </div>

        {/* Mensagem */}
        {message && (
          <MessageBox
            type={messageType === 'success' ? 'success' : 'error'}
            message={message}
            className="mb-6"
          />
        )}

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={handleVerifyCode}
            disabled={isLoading || !code.trim()}
            className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Verificar Código'}
          </button>

          <button
            onClick={handleResendCode}
            disabled={isLoading || resendCountdown > 0}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCountdown > 0 
              ? `Reenviar em ${resendCountdown}s` 
              : 'Reenviar Código'
            }
          </button>

          <button
            onClick={onBack}
            disabled={isLoading}
            className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar ao Cadastro
          </button>

          <button
            onClick={onGoToLogin}
            disabled={isLoading}
            className="w-full bg-transparent text-pink-600 py-3 px-4 rounded-lg font-medium hover:bg-pink-50 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ir para o Login
          </button>
        </div>

        {/* Dicas */}
        <div className="mt-8 p-4 bg-pink-50 rounded-lg">
          <h4 className="text-sm font-medium text-pink-800 mb-2">Dicas:</h4>
          <ul className="text-sm text-pink-700 space-y-1">
            <li>• Verifique sua caixa de entrada e spam</li>
            <li>• O código tem 5 dígitos</li>
            <li>• Aguarde alguns minutos antes de reenviar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 
