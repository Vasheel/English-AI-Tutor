// Environment configuration for development and production
import { getPasswordResetUrl } from '@/utils/networkUtils';

export const config = {
  // Network configuration for mobile testing
  NETWORK_URL: 'http://192.168.100.4:8080',
  LOCAL_URL: 'http://localhost:8080',
  
  // Check if we're in development mode
  isDevelopment: import.meta.env.DEV,
  
  // Get the appropriate redirect URL based on environment
  getRedirectUrl: () => {
    return getPasswordResetUrl();
  }
};
