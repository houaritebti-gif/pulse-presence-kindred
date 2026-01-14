import { useGlobalNetworkError } from '@/hooks/useNetworkError';
import { NetworkErrorToast } from './NetworkErrorInline';

export const GlobalNetworkErrorToast = () => {
  const { hasError, isRetrying, dismissError, retry } = useGlobalNetworkError();

  return (
    <NetworkErrorToast
      show={hasError}
      onDismiss={dismissError}
      onRetry={retry}
      isRetrying={isRetrying}
    />
  );
};

export default GlobalNetworkErrorToast;
