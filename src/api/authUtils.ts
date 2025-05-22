interface UserData {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  numeroBI?: string;
  role?: string;
  permissoes: string[];
}

export const getUserData = (): UserData | null => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (!token || !user) {
    console.error('Token ou dados do usuário não encontrados no localStorage');
    return null;
  }

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    const parsedUser = JSON.parse(user);

    return {
      id: decodedPayload.userId || decodedPayload.sub || '',
      nome: parsedUser.nome || decodedPayload.nome || '',
      email: parsedUser.email || decodedPayload.email || '',
      telefone: parsedUser.telefone || decodedPayload.telefone || '',
      numeroBI: parsedUser.numeroBI || decodedPayload.numeroBI || '',
      role: parsedUser.role || decodedPayload.role || undefined,
      permissoes: parsedUser.permissoes || [],
    };
  } catch (error) {
    console.error('Erro ao processar dados do usuário:', error);
    return null;
  }
};

export const hasPermission = (requiredPermission: string): boolean => {
  const user = getUserData();
  return user?.permissoes.includes(requiredPermission) || false;
};

export const hasAnyPermission = (requiredPermissions: string[]): boolean => {
  const user = getUserData();
  return user?.permissoes.some((permissao) => requiredPermissions.includes(permissao)) || false;
};

export const hasRole = (requiredRole: string): boolean => {
  const user = getUserData();
  return user?.role === requiredRole || false;
};

export const hasAnyRole = (requiredRoles: string[]): boolean => {
  const user = getUserData();
  return user?.role ? requiredRoles.includes(user.role) : false;
};
