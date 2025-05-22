import { getAllFunctionPermissionsByFunction } from './methods';
import { FuncaoPermissao } from 'types/models';

const permissionCache = new Map<string, string[]>();

interface UserData {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  numeroBI?: string;
  id_funcao?: string;
  role?: string;
  permissoes: string[];
}

interface DecodedToken {
  userId?: string;
  sub?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  numeroBI?: string;
  role?: string;
  id_funcao?: string;
  exp?: number;
}

const log = (message: string, ...args: any[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[authUtils] ${message}`, ...args);
  }
};

const isTokenExpired = (decodedToken: DecodedToken): boolean => {
  if (!decodedToken.exp) {
    log('Token sem campo exp');
    return false;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired = currentTime > decodedToken.exp;
  log('Verificação de expiração:', { currentTime, tokenExp: decodedToken.exp, isExpired });
  return isExpired;
};

const fetchUserPermissionsById = async (id_funcao: string): Promise<string[]> => {
  if (!id_funcao || typeof id_funcao !== 'string') {
    log('id_funcao inválido ou ausente:', id_funcao);
    return [];
  }

  if (permissionCache.has(id_funcao)) {
    log('Permissões recuperadas do cache:', id_funcao);
    return permissionCache.get(id_funcao)!;
  }

  try {
    log('Buscando permissões para id_funcao:', id_funcao);
    const functionPermissions: FuncaoPermissao[] = await getAllFunctionPermissionsByFunction(
      id_funcao!,
    );

    if (!functionPermissions || functionPermissions.length === 0) {
      log('Nenhuma permissão encontrada para id_funcao:', id_funcao);
      return [];
    }

    const permissions = [
      ...new Set(
        functionPermissions
          .map((fp: FuncaoPermissao) => fp.Permissoes?.nome)
          .filter((nome: string | undefined): nome is string => !!nome),
      ),
    ];

    permissionCache.set(id_funcao, permissions);
    log('Permissões encontradas:', permissions);
    return permissions;
  } catch (error) {
    log('Erro ao buscar permissões para id_funcao:', error);
    return [];
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  log('Recuperando dados:', {
    token: token ? 'presente' : 'ausente',
    user: user ? 'presente' : 'ausente',
  });

  if (!token) {
    console.error('Token não encontrado no localStorage');
    return null;
  }

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload: DecodedToken = JSON.parse(atob(payloadBase64));
    log('Payload decodificado:', decodedPayload);

    if (isTokenExpired(decodedPayload)) {
      log('Token expirado, limpando localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }

    let parsedUser: Partial<UserData> | null = null;
    if (user) {
      try {
        parsedUser = JSON.parse(user);
        log('User parseado:', parsedUser);
      } catch (error) {
        log('Erro ao parsear user do localStorage:', error);
        parsedUser = null;
      }
    }

    const userId = decodedPayload.userId || decodedPayload.sub || decodedPayload.userId || '';
    const userName = decodedPayload.nome || parsedUser?.nome || '';
    const userFunctionId = decodedPayload.id_funcao || ''; // Extrai id_funcao do token
    const userRole = decodedPayload.role || parsedUser?.role || '';
    if (!userId || !userName) {
      log('ID ou nome do usuário não encontrado', { userId, userName });
      return null;
    }

    let permissions: string[] = [];
    if (parsedUser?.permissoes?.length) {
      permissions = parsedUser.permissoes;
      log('Permissões obtidas do user:', permissions);
    } else if (userFunctionId) {
      permissions = await fetchUserPermissionsById(userFunctionId);
      log('Permissões obtidas via API com id_funcao:', permissions);
      if (parsedUser) {
        parsedUser.permissoes = permissions;
        localStorage.setItem('user', JSON.stringify(parsedUser));
        log('Permissões salvas no localStorage:', permissions);
      }
    }

    const userData: UserData = {
      id: userId,
      nome: userName,
      email: decodedPayload.email || parsedUser?.email || '',
      telefone: decodedPayload.telefone || parsedUser?.telefone || '',
      numeroBI: decodedPayload.numeroBI || parsedUser?.numeroBI || '',
      id_funcao: userFunctionId || undefined,
      role: userRole || undefined,
      permissoes: permissions,
    };

    log('UserData retornado:', userData);
    return userData;
  } catch (error) {
    console.error('Erro ao processar dados do usuário:', error);
    return null;
  }
};

export const hasPermission = async (requiredPermission: string): Promise<boolean> => {
  const user = await getUserData();
  const hasPerm = user?.permissoes.includes(requiredPermission) || false;
  log(`Verificando permissão "${requiredPermission}":`, {
    hasPerm,
    userPermissoes: user?.permissoes,
  });
  return hasPerm;
};

export const hasAnyPermission = async (requiredPermissions: string[]): Promise<boolean> => {
  const user = await getUserData();
  const hasPerm =
    user?.permissoes.some((permissao) => requiredPermissions.includes(permissao)) || false;
  log(`Verificando qualquer permissão de [${requiredPermissions.join(', ')}]:`, {
    hasPerm,
    userPermissoes: user?.permissoes,
  });
  return hasPerm;
};

export const hasRole = async (requiredRole: string): Promise<boolean> => {
  const user = await getUserData();
  const hasRole = user?.role === requiredRole || false;
  log(`Verificando papel "${requiredRole}":`, { hasRole, userRole: user?.role });
  return hasRole;
};

export const hasAnyRole = async (requiredRoles: string[]): Promise<boolean> => {
  const user = await getUserData();
  const hasRole = user?.role ? requiredRoles.includes(user.role) : false;
  log(`Verificando qualquer papel de [${requiredRoles.join(', ')}]:`, {
    hasRole,
    userRole: user?.role,
  });
  return hasRole;
};

export const logout = (): void => {
  log('Executando logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  permissionCache.clear();
};
