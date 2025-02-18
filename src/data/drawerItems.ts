import Authentication from 'components/icons/drawer/Authentication';
import Doughnut from 'components/icons/drawer/Doughnut';
import Fencing from 'components/icons/drawer/Fencing';
import Grid from 'components/icons/drawer/Grid';
import Cliente from 'components/icons/drawer/Cliente';
import Categoria from 'components/icons/drawer/Categoria';
import Settings from 'components/icons/drawer/Settings';
import ShoppingBag from 'components/icons/drawer/ShoppingBag';
import ShoppingCart from 'components/icons/drawer/ShoppingCart';
import SignOut from 'components/icons/drawer/SignOut';
import paths, { rootPaths } from 'routes/paths';
import { DrawerItem } from 'types/types';
import Car from 'components/icons/drawer/Car';

export const drawerItems: DrawerItem[] = [
  {
    id: 1,
    icon: Grid,
    title: 'Dashboard',
    path: rootPaths.root, // '/'
    collapsible: false,
    active: true,
  },
  {
    id: 2,
    icon: Authentication,
    title: 'Authentication',
    active: true,
    collapsible: true,
    subList: [
      { id: 21, title: 'Login', path: paths.login }, // '/authentication/login'
      { id: 22, title: 'Sign Up', path: paths.signup }, // '/authentication/sign-up'
    ],
  },
  {
    id: 3,
    icon: Doughnut,
    title: 'Produtos',
    path: paths.produtos, // '/pages/produtos'
    collapsible: false,
  },
  {
    id: 4,
    icon: Categoria,
    title: 'Categoria',
    path: `/${rootPaths.pagesRoot}/categorias`, // '/pages/categorias'
    collapsible: false,
  },
  {
    id: 5,
    icon: ShoppingBag,
    title: 'Stock',
    path: `/${rootPaths.pagesRoot}/stock`, // '/pages/estoque'
    collapsible: false,
  },
  {
    id: 6,
    icon: ShoppingCart,
    title: 'Relatório',
    path: `/${rootPaths.pagesRoot}/relatorio`, // '/pages/estoque'
    collapsible: false,
  },
  {
    id: 7,
    icon: Cliente,
    title: 'Cliente',
    path: `/${rootPaths.pagesRoot}/cliente`, // '/pages/funcionarios'
    collapsible: false,
  },
  {
    id: 7,
    icon: Fencing,
    title: 'Faturação',
    path: `/${rootPaths.pagesRoot}/faturacao`, // '/pages/funcionarios'
    collapsible: false,
  },
  {
    id: 6,
    icon: ShoppingCart,
    title: 'Vendas',
    path: `/${rootPaths.pagesRoot}/venda`, // '/pages/vendas'
    collapsible: false,
  },
  {
    id: 7,
    icon: Car,
    title: 'Funcionários',
    path: `/${rootPaths.pagesRoot}/funcionario`, // '/pages/funcionarios'
    collapsible: false,
  },
  {
    id: 10,
    icon: Settings,
    title: 'Settings',
    path: `/${rootPaths.pagesRoot}/configuracoes`, // '/pages/configuracoes'
    active: true,
    collapsible: false,
  },
  {
    id: 11,
    icon: SignOut,
    title: 'Log out',
    path: `/${rootPaths.pagesRoot}/logout`, // '/pages/logout'
    active: true,
    collapsible: false,
  },
];
