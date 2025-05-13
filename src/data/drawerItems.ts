import Doughnut from 'components/icons/drawer/Doughnut';
import Fencing from 'components/icons/drawer/Fencing';
import Grid from 'components/icons/drawer/Grid';
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

      {
        id: 33,
        title: 'Estoque',
        path: `/${rootPaths.pagesRoot}/stock`, // '/pages/estoque'
        active: true,
      },
      {
        id: 39,
        title: 'Local. Produto',
        path: `/${rootPaths.pagesRoot}/produt/produtoLocalizacao`, // '/pages/estoque'
        active: true,
      },
      {
        id: 4,
        title: 'Categoria',
        path: `/${rootPaths.pagesRoot}/categorias`, // '/pages/categorias'
        active: true,
      },
    ],
  },

  {
    id: 5,
    icon: ShoppingBag,
    title: 'Zona SCPL',
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
    id: 9,
    icon: Fencing,
    title: 'Faturação',
    collapsible: true,
    active: true,
    subList: [
      {
        id: 7,
        title: 'Venda',
        path: `/${rootPaths.pagesRoot}/faturacao`,
        active: true,
      },

      {
        id: 4,
        title: 'Caixa',
        path: `/${rootPaths.pagesRoot}/caixa`, // '/pages/categorias'
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
    id: 5,
    icon: Car,
    title: 'Usuários',
    collapsible: true,
    active: true,
    subList: [
      {
        id: 7,

        title: 'Funcionários',
        path: `/${rootPaths.pagesRoot}/funcionario`,
        active: true,
      },
      {
        id: 6,
        title: 'Fornecedor',
        path: `/${rootPaths.pagesRoot}/venda`,
        active: true,
      },
      {
        id: 7,
        title: 'Cliente',
        path: `/${rootPaths.pagesRoot}/cliente`,
        active: true,
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
  },
  {
    id: 10,
    icon: Settings,
    title: 'Settings',
    path: `/${rootPaths.pagesRoot}/configuracoes`,
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
