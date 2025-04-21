interface UserData {
  nome: string;
  email: string;
  telefone: string;
  numeroBI: string;
  roles: string[];
  permissoes: string[];
}

export const getUserData = (): UserData | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const hasPermission = (requiredPermission: string): boolean => {
  const user = getUserData();
  return user?.permissoes.includes(requiredPermission) ?? false;
};

export const hasAnyPermission = (requiredPermissions: string[]): boolean => {
  const user = getUserData();
  return user?.permissoes.some((permissao) => requiredPermissions.includes(permissao)) ?? false;
};

export const hasRole = (requiredRole: string): boolean => {
  const user = getUserData();
  return user?.roles.includes(requiredRole) ?? false;
};

export const hasAnyRole = (requiredRoles: string[]): boolean => {
  const user = getUserData();
  return user?.roles.some((role) => requiredRoles.includes(role)) ?? false;
};
