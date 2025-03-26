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
    path: paths.dashboard, // '/'
    collapsible: false,
    active: true,
  },

  {
    id: 3,
    icon: Doughnut,
    title: ' Gestão de Produtos', // '/pages/produtos'
    collapsible: true,
    active: true,
    subList: [
      {
        id: 31,
        title: 'Produtos',
        path: `/${rootPaths.pagesRoot}/produt/loja`,
        active: true,
      },
      /*  {
        id: 32,
        title: 'Localização',
        path: `/${rootPaths.pagesRoot}/produt/localizacao`,
        active: true,
      }, */
      {
        id: 33,
        title: 'Estoque',
        path: `/${rootPaths.pagesRoot}/stock`, // '/pages/estoque'
        active: true,
      },
    ],
  },
  {
    id: 4,
    icon: Categoria,
    title: 'Categoria',
    path: `/${rootPaths.pagesRoot}/categorias`, // '/pages/categorias'
    collapsible: false,
    active: true,
  },
  {
    id: 4,
    icon: Categoria,
    title: 'caixa',
    path: `/${rootPaths.pagesRoot}/caixa`, // '/pages/categorias'
    collapsible: false,
    active: true,
  },
  {
    id: 5,
    icon: ShoppingBag,
    title: 'Zona SCRL',
    collapsible: true,
    active: true,
    subList: [
      {
        id: 31,
        title: 'Secção',
        path: `/${rootPaths.pagesRoot}/seccao`,
        active: true,
      },
      {
        id: 32,
        title: 'Corredor',
        path: `/${rootPaths.pagesRoot}/corredor`,
        active: true,
      },
      {
        id: 32,
        title: 'Prateleira',
        path: `/${rootPaths.pagesRoot}/prateleira`,
        active: true,
      },
      {
        id: 34,
        title: 'Localização',
        path: `/${rootPaths.pagesRoot}/produt/localizacao`,
        active: true,
      },
    ],
  },
  {
    id: 6,
    icon: ShoppingCart,
    title: 'Relatório',
    path: `/${rootPaths.pagesRoot}/relatorio`, // '/pages/estoque'
    collapsible: false,
    active: true,
  },
  {
    id: 7,
    icon: Cliente,
    title: 'Cliente',
    path: `/${rootPaths.pagesRoot}/cliente`, // '/pages/funcionarios'
    collapsible: false,
    active: true,
  },
  {
    id: 7,
    icon: Fencing,
    title: 'Faturação',
    path: `/${rootPaths.pagesRoot}/faturacao`, // '/pages/funcionarios'
    collapsible: false,
    active: true,
  },
  {
    id: 6,
    icon: ShoppingCart,
    title: 'Vendas',
    path: `/${rootPaths.pagesRoot}/venda`, // '/pages/vendas'
    collapsible: false,
    active: true,
  },
  {
    id: 7,
    icon: Car,
    title: 'Funcionários',
    path: `/${rootPaths.pagesRoot}/funcionario`, // '/pages/funcionarios'
    collapsible: false,
    active: true,
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
