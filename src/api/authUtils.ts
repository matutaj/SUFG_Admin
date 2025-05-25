import { DrawerItem } from 'data/drawerItems';
import { getAllFunctionPermissionsByFunction } from './methods';
import { FuncaoPermissao } from 'types/models';

const permissionCache = new Map<string, string[]>();

export interface UserData {
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
  console.log(`[authUtils] ${message}`, ...args);
};

const roleMap: { [key: string]: string } = {
  '1': 'Admin',
  '2': 'Gerente',
  '3': 'Estoquista',
  '4': 'Repositor',
  '5': 'Operador de Caixa',
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
    const functionPermissions: FuncaoPermissao[] =
      await getAllFunctionPermissionsByFunction(id_funcao);

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
    permissionCache.delete(id_funcao); // Limpar cache em caso de erro
    return [];
  }
};

// ... (código anterior do authUtils.tsx mantido)
export const getUserData = async (): Promise<UserData | null> => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const notifications = localStorage.getItem('notifications');
  console.log('[authUtils] Recuperando dados:', {
    token: token ? 'presente' : 'ausente',
    user: user ? 'presente' : 'ausente',
    notifications: notifications ? notifications : 'ausente',
  });

  if (!token) {
    console.error('[authUtils] Token não encontrado no localStorage');
    return null;
  }

  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload: DecodedToken = JSON.parse(atob(payloadBase64));
    console.log('[authUtils] Payload decodificado:', decodedPayload);

    if (isTokenExpired(decodedPayload)) {
      console.log('[authUtils] Token expirado, limpando token e user (mantendo notifications)');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('[authUtils] Após limpeza:', {
        notifications: localStorage.getItem('notifications'),
      });
      return null;
    }

    let parsedUser: Partial<UserData> | null = null;
    if (user) {
      try {
        parsedUser = JSON.parse(user);
        console.log('[authUtils] User parseado do localStorage:', parsedUser);
      } catch (error) {
        console.log('[authUtils] Erro ao parsear user do localStorage:', error);
        parsedUser = null;
      }
    }

    const userId = decodedPayload.userId || decodedPayload.sub || '';
    const userName = decodedPayload.nome || parsedUser?.nome || '';
    const userFunctionId = decodedPayload.id_funcao || parsedUser?.id_funcao || '';
    let userRole = decodedPayload.role || parsedUser?.role || '';

    if (!userRole && userFunctionId) {
      userRole = roleMap[userFunctionId] || '';
      console.log('[authUtils] Role mapeado de id_funcao:', {
        id_funcao: userFunctionId,
        userRole,
      });
    }

    if (!userRole) {
      console.log('[authUtils] Erro: Nenhum role encontrado para o usuário', {
        userId,
        decodedPayload,
        parsedUser,
      });
      return null;
    }

    if (!userId || !userName) {
      console.log('[authUtils] ID ou nome do usuário não encontrado', { userId, userName });
      return null;
    }

    const permissions: string[] = userFunctionId
      ? await fetchUserPermissionsById(userFunctionId)
      : [];

    const userData: UserData = {
      id: userId,
      nome: userName,
      email: decodedPayload.email || parsedUser?.email || '',
      telefone: decodedPayload.telefone || parsedUser?.telefone || '',
      numeroBI: decodedPayload.numeroBI || parsedUser?.numeroBI || '',
      id_funcao: userFunctionId || undefined,
      role: userRole,
      permissoes: permissions,
    };

    console.log('[authUtils] UserData retornado:', userData);
    return userData;
  } catch (error) {
    console.error('[authUtils] Erro ao processar dados do usuário:', error);
    return null;
  }
};

export const logout = (): void => {
  console.log('[authUtils] Executando logout, mantendo notifications');
  console.log('[authUtils] Antes do logout:', {
    notifications: localStorage.getItem('notifications'),
  });
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  permissionCache.clear();
  console.log('[authUtils] Após logout:', {
    notifications: localStorage.getItem('notifications'),
  });
};

export const filterDrawerItems = async (items: DrawerItem[]): Promise<DrawerItem[]> => {
  const userData = await getUserData();

  if (!userData) {
    console.log('Usuário não autenticado - mostrando apenas itens públicos');
    return items.filter((item) => !item.requiredRoles);
  }

  const userRole = roleMap[userData.id_funcao || ''] || userData.role;
  console.log('Role final do usuário:', userRole);

  return items
    .filter((item) => {
      const hasAccess =
        !item.requiredRoles || item.requiredRoles.some((r) => r.trim() === userRole?.trim());

      console.log(
        `Acesso: ${item.title} - ${hasAccess} (Requer: ${item.requiredRoles}, Usuário: ${userRole})`,
      );
      return hasAccess;
    })
    .map((item) => ({
      ...item,
      subList: item.subList?.filter(
        (sub) => !sub.requiredRoles || sub.requiredRoles.some((r) => r.trim() === userRole?.trim()),
      ),
    }))
    .filter((item) => !item.collapsible || (item.subList && item.subList.length > 0));
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
  const hasRole = user?.role === requiredRole;
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


