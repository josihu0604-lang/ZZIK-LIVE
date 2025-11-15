/**
 * Global test setup
 * Runs before all tests
 */

import { vi } from 'vitest';

// Mock server-only module globally
vi.mock('server-only', () => ({}));

// Suppress console warnings during tests (optional)
// vi.spyOn(console, 'warn').mockImplementation(() => {});
// vi.spyOn(console, 'error').mockImplementation(() => {});
