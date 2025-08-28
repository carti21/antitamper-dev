import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export const mapErrorToUserMessage = (error: Error | AxiosError): string => {
  if (!error) return 'An unexpected error occurred';

  // Handle Axios errors
  if ('isAxiosError' in error && error.isAxiosError) {
    const status = error.response?.status;
    const backendError = error.response?.data as { error?: string; message?: string };
    const errorMessage = backendError?.error || backendError?.message;

    // Map specific HTTP status codes
    switch (status) {
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return errorMessage || 'Invalid input. Please check your data and try again.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return errorMessage || 'An error occurred while processing your request.';
    }
  }

  // Handle non-Axios errors
  return error.message || 'An unexpected error occurred';
};

export const handleApiError = (error: Error | AxiosError, setError: (msg: string) => void): void => {
  const userMessage = mapErrorToUserMessage(error);
  setError(userMessage);
  console.error('API Error:', error);
};

// Utility to check if user has required role/level
export const hasRequiredAccess = (
  userRole: string, 
  userLevel: string, 
  requiredRoles?: string[], 
  requiredLevels?: string[]
): boolean => {
  if (!requiredRoles && !requiredLevels) return true;
  
  const hasRole = !requiredRoles || requiredRoles.includes(userRole);
  const hasLevel = !requiredLevels || requiredLevels.includes(userLevel);
  
  return hasRole && hasLevel;
};
