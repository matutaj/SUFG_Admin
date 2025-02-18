import { Outlet, createBrowserRouter } from 'react-router-dom';
import paths, { rootPaths } from './paths';
import { Suspense, lazy } from 'react';
import Progress from 'components/loading/Progress';
import LinearLoader from 'components/loading/LinearLoader';
import Stock from 'pages/stock/Stock';
import Funcionario from 'pages/funcionario/Funcionario';
import Venda from 'pages/venda/Venda';
import Cliente from 'pages/cliente/Cliente';
import Faturacao from 'pages/faturacao/Faturacao';
import Relatorio from 'pages/relatorio/Relatorio';

const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const Categoria = lazy(() => import('pages/categoria/Categoria'));
const AuthLayout = lazy(() => import('layouts/auth-layout'));
const Dashboard = lazy(() => import('pages/dashboard/Dashboard'));
const Produt = lazy(() => import('pages/produt/Produt'));
const Login = lazy(() => import('pages/authentication/Login'));
const Signup = lazy(() => import('pages/authentication/Signup'));
const ErrorPage = lazy(() => import('pages/errors/ErrorPage'));

export const routes = [
  {
    element: (
      <Suspense fallback={<Progress />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        path: rootPaths.root,
        element: (
          <MainLayout>
            <Suspense fallback={<LinearLoader />}>
              <Outlet />
            </Suspense>
          </MainLayout>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
        ],
      },
      {
        path: rootPaths.authRoot,
        element: <AuthLayout />,
        children: [
          {
            path: paths.login,
            element: <Login />,
          },
          {
            path: paths.signup,
            element: <Signup />,
          },
        ],
      },

      {
        path: '*',
        element: <ErrorPage />,
      },
      {
        path: rootPaths.pagesRoot,
        element: (
          <MainLayout>
            <Suspense fallback={<LinearLoader />}>
              <Outlet />
            </Suspense>
          </MainLayout>
        ),
        children: [
          {
            path: paths.produtos,
            element: <Produt subItems={undefined} open={true} />,
          },
          {
            path: paths.categorias,
            element: <Categoria subItems={undefined} open={true} />,
          },
          {
            path: paths.estoque,
            element: <Stock subItems={undefined} open={true} />,
          },

          {
            path: paths.funcionarios,
            element: <Funcionario subItems={undefined} open={true} />,
          },
          {
            path: paths.vendas,
            element: <Venda subItems={undefined} open={true} />,
          },
          {
            path: paths.relatorio,
            element: <Relatorio />,
          },
          {
            path: paths.cliente,
            element: <Cliente subItems={undefined} open={true} />,
          },
          {
            path: paths.faturacao,
            element: <Faturacao subItems={undefined} open={true} />,
          },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: '/motiv' });

export default router;
