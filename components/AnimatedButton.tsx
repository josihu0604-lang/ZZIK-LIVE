import React, { forwardRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import styles from './Button.module.css';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  animationType?: 'scale' | 'rotate' | 'slide' | 'glow' | 'morph';
}

const buttonVariants: Record<string, Variants> = {
  scale: {
    initial: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  },
  rotate: {
    initial: { rotate: 0 },
    hover: {
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
    tap: {
      rotate: 0,
      scale: 0.95,
    },
  },
  slide: {
    initial: { x: 0 },
    hover: {
      x: [0, -5, 5, 0],
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    tap: {
      x: 0,
      scale: 0.95,
    },
  },
  glow: {
    initial: {
      boxShadow: '0 0 0 rgba(79, 70, 229, 0)',
    },
    hover: {
      boxShadow: [
        '0 0 0 rgba(79, 70, 229, 0)',
        '0 0 20px rgba(79, 70, 229, 0.5)',
        '0 0 40px rgba(79, 70, 229, 0.3)',
        '0 0 20px rgba(79, 70, 229, 0.5)',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    tap: {
      scale: 0.95,
    },
  },
  morph: {
    initial: {
      borderRadius: '8px',
      scale: 1,
    },
    hover: {
      borderRadius: ['8px', '20px', '8px'],
      scale: [1, 1.05, 1.02],
      transition: {
        duration: 0.4,
        ease: 'easeInOut',
      },
    },
    tap: {
      scale: 0.95,
      borderRadius: '12px',
    },
  },
};

const iconVariants: Variants = {
  initial: { rotate: 0 },
  hover: {
    rotate: 360,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      loading = false,
      disabled = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      animationType = 'scale',
      className = '',
      ...props
    },
    ref
  ) => {
    const isIconOnly = Icon && !children;
    const currentVariants = buttonVariants[animationType];

    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      loading && styles.loading,
      fullWidth && styles.fullWidth,
      isIconOnly && styles.iconOnly,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Extract framer-motion conflicting props
    const {
      onDrag,
      onDragStart,
      onDragEnd,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...restProps
    } = props;

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        variants={currentVariants}
        initial="initial"
        whileHover={!disabled && !loading ? 'hover' : undefined}
        whileTap={!disabled && !loading ? 'tap' : undefined}
        aria-busy={loading}
        {...restProps}
      >
        {!loading && Icon && iconPosition === 'left' && (
          <motion.span
            variants={iconVariants}
            initial="initial"
            whileHover={!disabled ? 'hover' : undefined}
          >
            <Icon className={styles.icon} aria-hidden="true" />
          </motion.span>
        )}
        {!loading && children && <span>{children}</span>}
        {!loading && Icon && iconPosition === 'right' && (
          <motion.span
            variants={iconVariants}
            initial="initial"
            whileHover={!disabled ? 'hover' : undefined}
          >
            <Icon className={styles.icon} aria-hidden="true" />
          </motion.span>
        )}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton;
