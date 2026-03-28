import React, { createContext, useContext, useEffect, useState } from 'react';

import { apiService } from '../lib/api';

const SESSION_KEY = 'api_version';

interface ApiVersionContextValue {
  apiVersion: string | null;
}

const ApiVersionContext = createContext<ApiVersionContextValue>({
  apiVersion: null,
});

export const ApiVersionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [apiVersion, setApiVersion] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_KEY),
  );

  useEffect(() => {
    if (apiVersion !== null) {
      return;
    }

    apiService
      .getInformation()
      .then(({ version }) => {
        sessionStorage.setItem(SESSION_KEY, version);
        setApiVersion(version);
      })
      .catch(() => {});
  }, [apiVersion]);

  return (
    <ApiVersionContext.Provider value={{ apiVersion }}>
      {children}
    </ApiVersionContext.Provider>
  );
};

export const useApiVersion = () => useContext(ApiVersionContext);
