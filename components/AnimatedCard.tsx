import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import styles from './Card.module.css';

interface AnimatedCardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  animationType?: 'fadeIn' | 'slideUp' | 'slideIn' | 'scale' | 'flip' | '3d';
  delay?: number;
  interactive?: boolean;
  className?: string;
}

const cardVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { 
      opacity: 0 
    },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2
      }
    }
  },
  slideUp: {
    hidden: { 
      opacity: 0,
      y: 50 
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.2
      }
    }
  },
  slideIn: {
    hidden: { 
      opacity: 0,
      x: -50 
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      x: 5,
      transition: {
        duration: 0.2
      }
    }
  },
  scale: {
    hidden: { 
      opacity: 0,
      scale: 0.8 
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    }
  },
  flip: {
    hidden: { 
      opacity: 0,
      rotateY: 90 
    },
    visible: { 
      opacity: 1,
      rotateY: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut'
      }
    },
    hover: {
      rotateY: 10,
      transition: {
        duration: 0.3
      }
    }
  },
  '3d': {
    hidden: { 
      opacity: 0,
      rotateX: -30,
      z: -100
    },
    visible: { 
      opacity: 1,
      rotateX: 0,
      z: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: {
      z: 50,
      rotateX: -5,
      scale: 1.02,
      transition: {
        duration: 0.3
      }
    }
  }
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  animationType = 'fadeIn',
  delay = 0,
  interactive = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const currentVariants = cardVariants[animationType];

  const cardClasses = [
    styles.card,
    styles[variant],
    interactive && styles.interactive,
    padding === 'none' && styles.noPadding,
    padding === 'small' && styles.smallPadding,
    padding === 'medium' && styles.mediumPadding,
    padding === 'large' && styles.largePadding,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className={cardClasses}
      variants={currentVariants}
      initial="hidden"
      animate="visible"
      whileHover={interactive ? "hover" : undefined}
      transition={{ delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        perspective: animationType === '3d' ? 1000 : undefined,
        transformStyle: animationType === '3d' ? 'preserve-3d' : undefined
      }}
    >
      {children}
    </motion.div>
  );
};

interface StaggeredCardsProps {
  children: React.ReactElement[];
  staggerDelay?: number;
}

export const StaggeredCards: React.FC<StaggeredCardsProps> = ({
  children,
  staggerDelay = 0.1
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};

interface ParallaxCardProps {
  children: ReactNode;
  offset?: number;
  className?: string;
}

export const ParallaxCard: React.FC<ParallaxCardProps> = ({
  children,
  offset = 100,
  className = ''
}) => {
  const [scrollY, setScrollY] = useState(0);

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={`${styles.card} ${styles.elevated} ${className}`}
      style={{
        y: scrollY * 0.5
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 30
      }}
    >
      {children}
    </motion.div>
  );
};

interface RevealCardProps {
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export const RevealCard: React.FC<RevealCardProps> = ({
  children,
  threshold = 0.1,
  className = ''
}) => {
  return (
    <motion.div
      className={`${styles.card} ${styles.elevated} ${className}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.6,
          ease: [0.25, 0.1, 0.25, 1]
        }
      }}
      viewport={{ once: true, amount: threshold }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;