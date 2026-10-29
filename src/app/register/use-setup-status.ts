'use client';

import { useEffect, useState } from 'react';

/** Whether the app still needs its first admin account. */
export function useSetupStatus() {
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if this is first run (no admin exists)
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/setup/check');
        const data = await response.json();
        setIsFirstAdmin(data.needsSetup);
      } catch (error) {
        console.error('Failed to check setup status:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, []);

  return { isFirstAdmin, checkingSetup };
}
