import { useCallback, useEffect, useState } from 'react';
import { getStoredUserRole } from '../services/session';
import { UserRole } from '../types/auth';

export function useUserRole() {
  const [role, setRole] = useState<UserRole>('UNKNOWN');
  const [loading, setLoading] = useState(true);

  const loadRole = useCallback(async () => {
    try {
      setLoading(true);
      const storedRole = await getStoredUserRole();
      setRole(storedRole);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  return {
    role,
    loading,
    isClient: role === 'CLIENT',
    isFreelancer: role !== 'CLIENT',
    reloadRole: loadRole,
  };
}
