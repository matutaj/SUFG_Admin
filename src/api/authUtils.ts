import { FuncaoPermissao } from 'types/models';
import { getAllFunctionPermissions } from './methods';

interface UserData {
  nome: string;
  email: string;
  telefone?: string;
  numeroBI?: string;
  roles: string[];
  permissoes: string[];
}

const permissionCache: Record<string, string[]> = {};

const fetchPermissionsForRole = async (role: string): Promise<string[]> => {
  try {
    // Verificar cache primeiro
    if (permissionCache[role]) {
      return permissionCache[role];
    }

    // Buscar permissões da API
    const functionPermissions = await getAllFunctionPermissions();

    // Filtrar permissões para a função específica
    const permissions = functionPermissions
      .filter((fp: FuncaoPermissao) => fp.funcoes?.nome === role || fp.id_funcao === role)
      .map((fp: FuncaoPermissao) => fp.permissoes?.nome || fp.id_permissao);

    // Armazenar no cache
    permissionCache[role] = permissions;

    return permissions;
  } catch (error) {
    console.error(`Erro ao buscar permissões para a função ${role}:`, error);
    return [];
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  const user = localStorage.getItem('user');
  if (!user) return null;

  const parsedUser = JSON.parse(user);

  // Determinar a função (role ou roles)
  const roles = parsedUser.role ? [parsedUser.role] : parsedUser.roles || [];

  // Buscar permissões para a primeira (e única) função
  const permissoes = roles.length > 0 ? await fetchPermissionsForRole(roles[0]) : [];

  return {
    nome: parsedUser.nome || '',
    email: parsedUser.email || '',
    telefone: parsedUser.telefone || '',
    numeroBI: parsedUser.numeroBI || '',
    roles,
    permissoes,
  };
};

export const hasPermission = async (requiredPermission: string): Promise<boolean> => {
  const user = await getUserData();
  return user?.permissoes.includes(requiredPermission) ?? false;
};

export const hasAnyPermission = async (requiredPermissions: string[]): Promise<boolean> => {
  const user = await getUserData();
  return user?.permissoes.some((permissao) => requiredPermissions.includes(permissao)) ?? false;
};

export const hasRole = async (requiredRole: string): Promise<boolean> => {
  const user = await getUserData();
  return user?.roles.includes(requiredRole) ?? false;
};

export const hasAnyRole = async (requiredRoles: string[]): Promise<boolean> => {
  const user = await getUserData();
  return user?.roles.some((role) => requiredRoles.includes(role)) ?? false;
};
