import { useState } from 'react';

import { getApiErrorMessage } from '../../../lib/apiErrorMessage';
import { useToast, UseToastReturn } from '../../../hooks/ui/useToast';

interface UseRefreshActionReturn {
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
  toasts: UseToastReturn['toasts'];
  removeToast: UseToastReturn['removeToast'];
}

/**
 * Wraps an optional async refresh callback with an in-flight guard and
 * success/error toast notifications.
 */
export const useRefreshAction = (
  onRefresh?: () => Promise<void>,
): UseRefreshActionReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);

      if (onRefresh) {
        await onRefresh();
      }

      showSuccess('Refresh successful!');
    } catch (error) {
      showError(
        getApiErrorMessage(error, 'Refresh failed, please try again later.'),
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return { isRefreshing, handleRefresh, toasts, removeToast };
};
