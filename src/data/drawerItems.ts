import Doughnut from 'components/icons/drawer/Doughnut';
import Fencing from 'components/icons/drawer/Fencing';
import Grid from 'components/icons/drawer/Grid';
import ShoppingBag from 'components/icons/drawer/ShoppingBag';
import ShoppingCart from 'components/icons/drawer/ShoppingCart';
import Car from 'components/icons/drawer/Car';
import paths, { rootPaths } from 'routes/paths';
import { SvgIconProps } from '@mui/material';

export interface SubItem {
  id: number;
  title: string;
  path?: string;
  active?: boolean;
  requiredRoles?: string[];
}

export interface DrawerItem {
  id: number;
  icon: (props: SvgIconProps) => JSX.Element;
  title: string;
  path?: string;
  active?: boolean;
  requiredRoles?: string[];
  collapsible: boolean;
  subList?: SubItem[];
}

export const drawerItems: DrawerItem[] = [
  {
    id: 1,
    icon: Grid,
    title: 'Dashboard',
    path: paths.dashboard,
    collapsible: false,
    active: true,
    requiredRoles: ['Admin', 'Gerente'],
  },
  {
    id: 3,
    icon: Doughnut,
    title: 'Gestão de Produtos',
    collapsible: true,
    active: true,
    requiredRoles: ['Admin', 'Gerente', 'Estoquista', 'Repositor'],
    subList: [
      {
        id: 31,
        title: 'Produtos',
        path: `/${rootPaths.pagesRoot}/produt/loja`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista', 'Repositor'],
      },
      {
        id: 33,
        title: 'Estoque',
        path: `/${rootPaths.pagesRoot}/stock`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista', 'Repositor'],
      },
      {
        id: 39,
        title: 'Local. Produto',
        path: `/${rootPaths.pagesRoot}/produt/produtoLocalizacao`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista', 'Repositor'],
      },
      {
        id: 4,
        title: 'Categoria',
        path: `/${rootPaths.pagesRoot}/categorias`,
        active: true,
        requiredRoles: ['Admin', 'Gerente'],
      },
    ],
  },
  {
    id: 5,
    icon: ShoppingBag,
    title: 'Zona SCPL',
    collapsible: true,
    active: true,
    requiredRoles: ['Admin', 'Gerente', 'Estoquista', 'Repositor'],
    subList: [
      {
        id: 31,
        title: 'Secção',
        path: `/${rootPaths.pagesRoot}/seccao`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista'],
      },
      {
        id: 32,
        title: 'Corredor',
        path: `/${rootPaths.pagesRoot}/corredor`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista'],
      },
      {
        id: 32,
        title: 'Prateleira',
        path: `/${rootPaths.pagesRoot}/prateleira`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista'],
      },
      {
        id: 34,
        title: 'Localização',
        path: `/${rootPaths.pagesRoot}/produt/localizacao`,
        active: true,
        requiredRoles: ['Admin', 'Gerente', 'Estoquista'],
      },
    ],
  },
  {
    id: 9,
    icon: Fencing,
    title: 'Faturação',
    collapsible: true,
    active: true,
    requiredRoles: ['Admin', 'Gerente', 'Operador de caixa'],
    subList: [
      {
        id: 7,
        title: 'Venda',
        path: `/${rootPaths.pagesRoot}/faturacao`,
        active: true,
        requiredRoles: ['Admin', 'Operador de caixa'],
      },
      {
        id: 4,
        title: 'Caixa',
        path: `/${rootPaths.pagesRoot}/caixa`,
        active: true,
        requiredRoles: ['Admin', 'Gerente'],
      },
    ],
  },
  {
    id: 6,
    icon: ShoppingCart,
    title: 'Relatório',
    path: `/${rootPaths.pagesRoot}/relatorio`,
    collapsible: false,
    active: true,
    requiredRoles: ['Admin', 'Gerente'],
  },
  {
    id: 5,
    icon: Car,
    title: 'Usuários',
    collapsible: true,
    active: true,
    requiredRoles: ['Admin', 'Gerente'],
    subList: [
      {
        id: 7,
        title: 'Funcionários',
        path: `/${rootPaths.pagesRoot}/funcionario`,
        active: true,
        requiredRoles: ['Admin', 'Gerente'],
      },
      {
        id: 6,
        title: 'Fornecedor',
        path: `/${rootPaths.pagesRoot}/fornecedor`,
        active: true,
        requiredRoles: ['Admin', 'Gerente'],
      },
      {
        id: 7,
        title: 'Cliente',
        path: `/${rootPaths.pagesRoot}/cliente`,
        active: true,
        requiredRoles: ['Admin', 'Gerente'],
      },
    ],
  },
  {
    id: 6,
    icon: ShoppingCart,
    title: 'Tarefa',
    path: `/${rootPaths.pagesRoot}/tarefa`,
    collapsible: false,
    active: true,
    requiredRoles: ['Admin', 'Gerente', 'Estoquista'],
  },
];
