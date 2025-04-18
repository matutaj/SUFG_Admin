import { Outlet, createBrowserRouter } from 'react-router-dom';
import paths, { rootPaths } from './paths';
import { Suspense, lazy } from 'react';
import Progress from 'components/loading/Progress';
import LinearLoader from 'components/loading/LinearLoader';
import Stock from 'pages/stock/Stock';
import Funcionario from 'pages/funcionario/Funcionario';
import Fornecedor from 'pages/fornecedor/Fornecedor';
import Cliente from 'pages/cliente/Cliente';
import Faturacao from 'pages/faturacao/Faturacao';
import Relatorio from 'pages/relatorio/Relatorio';
import Loja from 'pages/produt';
import Corredor from 'pages/corredor/Corredor';
import Prateleira from 'pages/prateleira/Prateleira';
import LocalProduto from 'pages/produt/ProdutoLocalizacao';
import Tarefa from 'pages/tarefa/tarefa';
import Secao from 'pages/seccao/Seccao';
import Caixas from 'pages/caixa/caixa';
import { StockProvider } from 'pages/stock/StockContext';

const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const Categoria = lazy(() => import('pages/categoria/Categoria'));
const AuthLayout = lazy(() => import('layouts/auth-layout'));
const Dashboard = lazy(() => import('pages/dashboard/Dashboard'));
const Armazem = lazy(() => import('pages/localizacao/Localizacao'));
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
        path: '/',
        element: <Login />, // Redireciona "/" para o login
      },
      {
        path: rootPaths.authRoot,
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <Login />,
          },
          {
            path: paths.signup,
            element: <Signup />,
          },
        ],
      },
      {
        path: rootPaths.pagesRoot,
        element: (
          <MainLayout>
            <StockProvider>
              <Suspense fallback={<LinearLoader />}>
                <Outlet />
              </Suspense>
            </StockProvider>
          </MainLayout>
        ),
        children: [
          {
            path: paths.dashboard,
            element: <Dashboard />,
          },
          {
            path: paths.tarefa,
            element: <Tarefa />,
          },

          {
            path: paths.loja,
            element: <Loja open={true} />,
          },

          {
            path: paths.localizacao,
            element: <Armazem open={true} />,
          },
          {
            path: paths.categorias,
            element: <Categoria open={true} />,
          },
          {
            path: paths.caixa,
            element: <Caixas open={true} />,
          },
          {
            path: paths.estoque,
            element: <Stock open={true} />,
          },
          {
            path: paths.corredor,
            element: <Corredor open={true} />,
          },
          {
            path: paths.prateleira,
            element: <Prateleira open={true} />,
          },
          {
            path: paths.seccao,
            element: <Secao open={true} />,
          },
          {
            path: paths.funcionarios,
            element: <Funcionario open={true} />,
          },
          {
            path: paths.vendas,
            element: <Fornecedor open={true} />,
          },
          {
            path: paths.localProduto,
            element: <LocalProduto open={true} />,
          },
          {
            path: paths.relatorio,
            element: <Relatorio />,
          },
          {
            path: paths.cliente,
            element: <Cliente open={true} />,
          },
          {
            path: paths.faturacao,
            element: <Faturacao subItems={undefined} open={true} />,
          },
        ],
      },
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: '/' });

export default router;
