// Network utilities for handling mobile access during development
export const getNetworkUrl = () => {
  // In development, we need to use the network IP for mobile access
  if (import.meta.env.DEV) {
    // Get the current hostname and port
    const { hostname, port } = window.location;
    
    // If we're on localhost, try to use the network IP
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // You can manually set this to your network IP
      // Or we can try to detect it automatically
      return `http://192.168.100.4:${port || '8080'}`;
    }
    
    // If we're already on a network IP, use it
    return window.location.origin;
  }
  
  // In production, use the current origin
  return window.location.origin;
};

export const getPasswordResetUrl = () => {
  const baseUrl = getNetworkUrl();
  return `${baseUrl}/auth`;
};

// Helper to check if we're on mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Helper to get the appropriate URL based on device
export const getAppropriateUrl = () => {
  if (import.meta.env.DEV) {
    // In development, always use network IP for mobile compatibility
    return getNetworkUrl();
  }
  return window.location.origin;
};
