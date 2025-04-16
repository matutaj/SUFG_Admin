export const rootPaths = {
  root: '/',
  pagesRoot: 'pages',
  authRoot: 'authentication',
  errorRoot: 'error',
};

export default {
  // Autenticação
  login: `/${rootPaths.authRoot}/login`,
  signup: `/${rootPaths.authRoot}/sign-up`,

  // Páginas principais
  dashboard: `/${rootPaths.pagesRoot}/dashboard`,
  loja: `/${rootPaths.pagesRoot}/produt/loja`,
  localizacao: `/${rootPaths.pagesRoot}/produt/localizacao`,
  categorias: `/${rootPaths.pagesRoot}/categorias`,
  estoque: `/${rootPaths.pagesRoot}/stock`,
  vendas: `/${rootPaths.pagesRoot}/venda`,
  relatorio: `/${rootPaths.pagesRoot}/relatorio`,
  corredor: `/${rootPaths.pagesRoot}/corredor`,
  caixa: `/${rootPaths.pagesRoot}/caixa`,
  localProduto: `/${rootPaths.pagesRoot}produt/produtoLocalizacao`,
  seccao: `/${rootPaths.pagesRoot}/seccao`,
  prateleira: `/${rootPaths.pagesRoot}/prateleira`,
  faturacao: `/${rootPaths.pagesRoot}/faturacao`,
  cliente: `/${rootPaths.pagesRoot}/cliente`,
  Relatorio: `/${rootPaths.pagesRoot}/relatorio`,
  funcionarios: `/${rootPaths.pagesRoot}/funcionario`,
  calendario: `/${rootPaths.pagesRoot}/calendario`,
  mensagens: `/${rootPaths.pagesRoot}/mensagens`,
  tarefa: `/${rootPaths.pagesRoot}/tarefa`,
  configuracoes: `/${rootPaths.pagesRoot}/configuracoes`,
  logout: `/${rootPaths.pagesRoot}/logout`,

  // Páginas de erro
  notFound: `/${rootPaths.errorRoot}/404`,
  serverError: `/${rootPaths.errorRoot}/500`,
};
