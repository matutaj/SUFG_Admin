import { Navigate, Outlet } from 'react-router-dom';
import { getUserData, hasAnyRole } from '../api/authUtils';
import paths from './paths';

interface ProtectedRouteProps {
  requiredRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  requiredRoles,
  redirectTo = paths.dashboard,
}: ProtectedRouteProps) => {
  const user = getUserData();
  const token = localStorage.getItem('token');

  // Sem token ou usuário, redirecionar para login
  if (!token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Se a rota exige funções específicas, verificar com hasAnyRole
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to={paths.notFound} replace />;
  }

  // Renderizar a rota protegida
  return <Outlet />;
};
