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
  console.log(`[authUtils] ${message}`, ...args);
};

// Mapeamento de id_funcao para role (ajuste com os valores reais do backend)
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
    return [];
  }
};
// ... (outras importações e interfaces permanecem iguais)

// Removendo o fallback para 'Admin' e ajustando a lógica
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
        log('User parseado do localStorage:', parsedUser);
      } catch (error) {
        log('Erro ao parsear user do localStorage:', error);
        parsedUser = null;
      }
    }

    const userId = decodedPayload.userId || decodedPayload.sub || '';
    const userName = decodedPayload.nome || parsedUser?.nome || '';
    const userFunctionId = decodedPayload.id_funcao || parsedUser?.id_funcao || '';
    let userRole = decodedPayload.role || parsedUser?.role || '';

    // Mapeia id_funcao para role se role não estiver presente
    if (!userRole && userFunctionId) {
      userRole = roleMap[userFunctionId] || '';
      log('Role mapeado de id_funcao:', { id_funcao: userFunctionId, userRole });
    }

    // Se não houver role, retornar null (sem fallback para 'Admin')
    if (!userRole) {
      log('Erro: Nenhum role encontrado para o usuário', { userId, decodedPayload, parsedUser });
      return null;
    }

    if (!userId || !userName) {
      log('ID ou nome do usuário não encontrado', { userId, userName });
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

    log('UserData retornado:', userData);
    return userData;
  } catch (error) {
    console.error('Erro ao processar dados do usuário:', error);
    return null;
  }
};
interface Item {
  id: number;
  title: string;
  path?: string;
  active?: boolean;
  requiredRoles?: string[];
}

export interface SubItem {
  id: number;
  title: string;
  path?: string;
  active?: boolean;
  requiredRoles?: string[];
}

export interface DrawerItem extends Item {
  collapsible: boolean;
  subList?: SubItem[];
}

// Função revisada para filtrar itens do menu
// authUtils.ts

export const filterDrawerItems = async (items: DrawerItem[]): Promise<DrawerItem[]> => {
  // 1. Obtenha os dados do usuário DIRETAMENTE do localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // 2. Extraia a role de forma definitiva
  let userRole = user?.role;

  if (!userRole && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = payload.role || payload.id_funcao;
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
    }
  }

  // 3. Fallback seguro
  userRole = userRole || 'guest';

  console.log('🛡️ Role ativa:', userRole); // DEBUG ESSENCIAL

  // 4. Filtro à prova de erros
  return items.filter((item) => {
    // Itens sem requiredRoles são públicos
    if (!item.requiredRoles) return true;

    // Verificação robusta
    const hasAccess = item.requiredRoles.includes(userRole);

    if (!hasAccess) {
      console.log(`⛔ Acesso negado a ${item.title}. Requer:`, item.requiredRoles);
    }

    return hasAccess;
  });
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

export const logout = (): void => {
  log('Executando logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  permissionCache.clear();
};
