/**
 * Application-wide constants for feature flags and configuration
 */

// Feature flags
export const ENABLE_PRODUCTBOARD_SYNC = true;
export const ENABLE_AI_SUGGESTIONS = true;
export const ENABLE_ADO_INTEGRATION = true;

// API Endpoints
export const API_BASE_URL = 'http://localhost:8000';
export const PRODUCTBOARD_API_URL = 'http://localhost:3008/pb-api';
export const ADO_API_URL = 'https://dev.azure.com';
export const AI_SERVER_URL = 'http://localhost:3001';

// Story Classification options
export const INVESTMENT_CATEGORIES = [
  'Customer Experience',
  'Technical Debt',
  'Revenue',
  'Growth',
  'Security',
  'Compliance',
  'Platform',
  'Infrastructure'
];

export const COMMITMENT_STATUSES = [
  'not_committed',
  'exploring',
  'planning',
  'committed'
];

export const T_SHIRT_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL'
];

// RICE Score ranges
export const REACH_RANGE = { min: 1, max: 10 };
export const IMPACT_RANGE = { min: 1, max: 10 };
export const CONFIDENCE_RANGE = { min: 1, max: 10 };
export const EFFORT_RANGE = { min: 1, max: 10 };

// Pagination 
export const DEFAULT_PAGE_SIZE = 20;
