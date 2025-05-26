import React, { useEffect, useState, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getUserData, hasAnyRole, UserData } from '../api/authUtils';
import paths from './paths';
import LinearLoader from 'components/loading/LinearLoader';

interface ProtectedRouteProps {
  requiredRoles?: string[];
  redirectTo?: string;
  children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRoles,
  redirectTo = '/login',
  children,
}) => {
  const [user, setUser] = useState<UserData | null>(null); // Melhoria: tipar como UserData
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkUserAndRole = async () => {
      if (!token) {
        console.log('[ProtectedRoute] Token não encontrado, redirecionando para login');
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserData();
        setUser(userData);

        if (requiredRoles) {
          const roleCheck = await hasAnyRole(requiredRoles);
          setHasRole(roleCheck);
        } else {
          setHasRole(true);
        }
      } catch (error) {
        console.error('[ProtectedRoute] Erro ao verificar usuário ou papel:', error);
        setUser(null);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndRole();
  }, [requiredRoles, token]);

  if (loading) {
    return <LinearLoader />;
  }

  if (!token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRoles && !hasRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
