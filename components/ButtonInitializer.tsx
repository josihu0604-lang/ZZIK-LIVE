'use client';

import { useButtonInteractions } from '@/hooks/useButtonInteractions';

/**
 * Client component that initializes button interactions globally
 * Should be included once in the root layout
 */
export default function ButtonInitializer() {
  useButtonInteractions();
  return null;
}
