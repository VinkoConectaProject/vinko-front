import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { StarRating } from './StarRating';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: number;
  professionalName: string;
  existingRating?: {
    id: number;
    score: number;
    comment?: string;
  } | null;
  onRatingSubmit: (rating: number, comment: string) => Promise<void>;
  onRatingDelete: () => Promise<void>;
}

export function RatingModal({
  isOpen,
  onClose,
  professionalId,
  professionalName,
  existingRating,
  onRatingSubmit,
  onRatingDelete
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating?.score || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.score);
      setComment(existingRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingRating, isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onRatingSubmit(rating, comment);
      onClose();
    } catch (error) {
      // Erro ao enviar avaliação
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRating) return;

    setIsDeleting(true);
    try {
      await onRatingDelete();
      onClose();
    } catch (error) {
      // Erro ao remover avaliação
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full p-8">
        {/* Header */}
        <div className="mb-8 relative">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center pr-8">
            Avaliar Profissional - {professionalName}
          </h3>
        </div>

        {/* Estrelas Centralizadas */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <StarRating
              rating={rating}
              size="lg"
              interactive={true}
              onRatingChange={setRating}
            />
          </div>
        </div>

        {/* Campo de Comentário */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comentário (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Deixe um comentário sobre o profissional..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={255}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/255 caracteres
          </p>
        </div>

        {/* Botões Centralizados */}
        <div className="flex flex-col space-y-3">
          {existingRating ? (
            // Dois botões na mesma linha quando há avaliação existente
            <div className="flex space-x-3">
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting || isDeleting}
                className="flex-1 bg-pink-500 text-white py-3 px-6 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Avaliação'
                )}
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-2"></div>
                    Removendo...
                  </>
                ) : (
                  'Remover Avaliação'
                )}
              </button>
            </div>
          ) : (
            // Botão único quando não há avaliação existente
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting || isDeleting}
              className="w-full bg-pink-500 text-white py-3 px-6 rounded-lg hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
