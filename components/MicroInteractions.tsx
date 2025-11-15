import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Heart, Star, ThumbsUp, Bookmark, Bell, Share2, Copy, Check } from 'lucide-react';

// Like Button with heart animation
export const LikeButton: React.FC<{
  initialLiked?: boolean;
  count?: number;
  onLike?: (liked: boolean) => void;
}> = ({ initialLiked = false, count = 0, onLike }) => {
  const [liked, setLiked] = useState(initialLiked);
  const [showParticles, setShowParticles] = useState(false);

  const handleClick = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setShowParticles(newLikedState);
    onLike?.(newLikedState);

    if (newLikedState) {
      setTimeout(() => setShowParticles(false), 1000);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <motion.div
        animate={
          liked
            ? {
                scale: [1, 1.2, 0.9, 1.1, 1],
                rotate: [0, -10, 10, -10, 0],
              }
            : {}
        }
        transition={{ duration: 0.4 }}
      >
        <Heart
          size={20}
          className={`transition-colors ${
            liked ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'
          }`}
        />
      </motion.div>

      {count > 0 && (
        <AnimatePresence mode="wait">
          <motion.span
            key={count}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {count + (liked ? 1 : 0)}
          </motion.span>
        </AnimatePresence>
      )}

      {/* Particle effects */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full"
              initial={{ x: 0, y: 0 }}
              animate={{
                x: Math.cos((i * 60 * Math.PI) / 180) * 30,
                y: Math.sin((i * 60 * Math.PI) / 180) * 30,
                opacity: [1, 0],
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </button>
  );
};

// Star Rating Component
export const StarRating: React.FC<{
  rating: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}> = ({ rating, maxRating = 5, onChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="inline-flex gap-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= (hoverRating || rating);

        return (
          <motion.button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverRating(starValue)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            whileHover={!readonly ? { scale: 1.2 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              size={24}
              className={`transition-colors ${
                filled ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
};

// Copy to Clipboard Button
export const CopyButton: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check size={16} className="text-green-500" />
          </motion.div>
        ) : (
          <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Copy size={16} className="text-gray-600 dark:text-gray-400" />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
    </motion.button>
  );
};

// Notification Bell with Badge
export const NotificationBell: React.FC<{
  count: number;
  onClick?: () => void;
}> = ({ count, onClick }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (count > 0) {
      controls.start({
        rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [count, controls]);

  return (
    <motion.button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      animate={controls}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Bell size={24} className="text-gray-600 dark:text-gray-400" />

      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </motion.button>
  );
};

// Floating Action Button
export const FloatingActionButton: React.FC<{
  icon: React.ElementType;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}> = ({ icon: Icon, onClick, position = 'bottom-right' }) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg flex items-center justify-center z-50`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Icon size={24} />
    </motion.button>
  );
};

// Progress Button
export const ProgressButton: React.FC<{
  onClick: () => Promise<void>;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClick = async () => {
    setLoading(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      await onClick();
      setProgress(100);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={loading}
      className="relative px-6 py-3 bg-blue-500 text-white rounded-lg overflow-hidden"
      whileHover={!loading ? { scale: 1.05 } : {}}
      whileTap={!loading ? { scale: 0.95 } : {}}
    >
      {loading && (
        <motion.div
          className="absolute inset-0 bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      )}
      <span className="relative z-10">{loading ? `${progress}%` : children}</span>
    </motion.button>
  );
};

export default {
  LikeButton,
  StarRating,
  CopyButton,
  NotificationBell,
  FloatingActionButton,
  ProgressButton,
};
