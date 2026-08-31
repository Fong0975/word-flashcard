import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { apiService } from '../lib/api';

/**
 * How often to re-check for new log entries while the app is open.
 *
 * The backend's unread endpoint stops scanning at the read watermark, so
 * this poll is cheap; five minutes is about the resolution that is useful
 * for an indicator nobody is watching continuously.
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000;

interface LogUnreadContextValue {
  /** Entries newer than the watermark at or above LOG_NOTIFY_LEVEL. */
  unreadCount: number;
  /** Advances the server-side watermark and clears the indicator. */
  markRead: () => Promise<void>;
}

const LogUnreadContext = createContext<LogUnreadContextValue>({
  unreadCount: 0,
  markRead: async () => {},
});

/**
 * Tracks how many unread backend log entries are waiting, so the settings
 * menu can show an indicator.
 *
 * The watermark lives on the server (not in browser storage), so the
 * indicator agrees across devices.
 */
export const LogUnreadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const { count } = await apiService.getUnreadLogsCount();
      setUnreadCount(count);
    } catch (error) {
      // Non-critical: the indicator just keeps its last known value rather
      // than surfacing an error for something nobody explicitly asked for.
      // eslint-disable-next-line no-console
      console.error('Failed to fetch unread log count:', error);
    }
  }, []);

  useEffect(() => {
    refresh();

    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const markRead = useCallback(async (): Promise<void> => {
    try {
      await apiService.markLogsRead();
      setUnreadCount(0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark logs as read:', error);
    }
  }, []);

  const value = useMemo(
    () => ({ unreadCount, markRead }),
    [unreadCount, markRead],
  );

  return (
    <LogUnreadContext.Provider value={value}>
      {children}
    </LogUnreadContext.Provider>
  );
};

export const useLogUnread = () => useContext(LogUnreadContext);
