import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0-5 (pode ser decimal como 3.5)
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showCount?: boolean;
  count?: number;
  className?: string;
}

export function StarRating({ 
  rating, 
  size = 'md', 
  interactive = false, 
  onRatingChange,
  showCount = false,
  count = 0,
  className = ''
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-8 w-8'
  };

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  const handleStarHover = (starIndex: number) => {
    if (interactive && onRatingChange) {
      // Implementar hover effect se necessário
    }
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      stars.push(
        <div key={i} className="relative inline-block mr-1">
          {/* Estrela de fundo (sempre cinza) */}
          <Star className={`${sizeClasses[size]} text-gray-300 fill-gray-200`} />
          
          {/* Estrela preenchida (amarela) */}
          {i < fullStars && (
            <Star className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500 absolute top-0 left-0`} />
          )}
          
          {/* Meia estrela */}
          {i === fullStars && hasHalfStar && (
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`} />
            </div>
          )}
          
          {/* Estrela interativa invisível para cliques */}
          {interactive && (
            <Star
              className={`${sizeClasses[size]} absolute top-0 left-0 opacity-0 cursor-pointer hover:opacity-30 hover:fill-yellow-300 hover:text-yellow-300 transition-all z-10`}
              onClick={() => handleStarClick(i)}
              onMouseEnter={() => handleStarHover(i)}
            />
          )}
        </div>
      );
    }

    return stars;
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showCount && count > 0 && (
        <span className="text-sm text-gray-600 ml-1">
          ({count})
        </span>
      )}
    </div>
  );
}
