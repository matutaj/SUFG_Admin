// src/types/models.ts

export enum TipoDocumento {
  FATURA = 'FATURA',
  RECIBO = 'RECIBO',
  FATURA_PROFORMA = 'FATURA_PROFORMA',
  FATURA_RECIBO = 'FATURA_RECIBO',
}

export interface Cliente {
  id?: string;
  numeroContribuinte?: string | null;
  nomeCliente?: string | null;
  moradaCliente?: string | null;
  telefoneCliente?: string | null;
  emailCliente?: string | null;
  vendas?: Venda[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Funcionario {
  id?: string;
  numeroBI: string;
  nomeFuncionario: string;
  senha: string;
  moradaFuncionario: string;
  telefoneFuncionario: string;
  emailFuncionario: string;
  createdAt?: string;
  updatedAt?: string;
  funcionariosPermissoes?: FuncionarioPermissao[];
  funcionariosFuncoes?: FuncionarioFuncao[];
  entradasEstoque?: EntradaEstoque[];
  transferencias?: Transferencia[];
  funcionariosCaixa?: FuncionarioCaixa[];
}

export interface CategoriaProduto {
  id?: string;
  nomeCategoria: string;
  descricao?: string | null;
  produtos?: Produto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Produto {
  id?: string;
  id_categoriaProduto: string;
  referenciaProduto: string;
  nomeProduto: string;
  custoAquisicao: string;
  precoVenda: number;
  quantidadeEstoque: number;
  unidadeMedida: string;
  unidadeConteudo: string;
  codigoBarras: string;
  entradasEstoque?: EntradaEstoque[];
  produtosLocalizacoes?: ProdutoLocalizacao[];
  alertas?: Alerta[];
  transferencias?: Transferencia[];
  vendasProdutos?: VendaProduto[];
  createdAt?: string;
  updatedAt?: string;
  categoriasProdutos?: CategoriaProduto;
}

export interface Fornecedor {
  id?: string;
  nif: string;
  nomeFornecedor: string;
  moradaFornecedor: string;
  telefoneFornecedor: number;
  emailFornecedor: string;
  entradasEstoque?: EntradaEstoque[];
  funcionariosCaixa?: FuncionarioCaixa[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EntradaEstoque {
  id?: string;
  id_fornecedor: string;
  id_produto: string;
  id_funcionario: string;
  quantidadeRecebida: string;
  dataEntrada: string;
  custoUnitario: number;
  lote: string;
  dataValidadeLote: string;
  createdAt?: string;
  updatedAt?: string;
  fornecedores?: Fornecedor;
  produtos?: Produto;
  funcionarios?: Funcionario;
}

export interface Caixa {
  id?: string;
  nomeCaixa: string;
  descricao?: string | null;
  funcionariosCaixa?: FuncionarioCaixa[];
  alertas?: Alerta[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Venda {
  id?: string;
  id_cliente: string;
  id_funcionarioCaixa: string;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  dataEmissao: string;
  dataValidade: string;
  valorTotal: number;
  clientes?: Cliente;
  funcionariosCaixa?: FuncionarioCaixa;
  vendasProdutos?: VendaProduto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VendaProduto {
  id?: string;
  id_produto: string;
  id_venda: string;
  quantidadeVendida: number;
  produtos?: Produto;
  vendas?: Venda;
}

export interface Seccao {
  id?: string;
  nomeSeccao: string;
  descricao?: string | null;
  produtosLocalizacoes?: ProdutoLocalizacao[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Corredor {
  id?: string;
  nomeCorredor: string;
  descricao?: string | null;
  produtosLocalizacoes?: ProdutoLocalizacao[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Prateleira {
  id?: string;
  nomePrateleira: string;
  descricao?: string | null;
  produtosLocalizacoes?: ProdutoLocalizacao[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Localizacao {
  id?: string;
  nomeLocalizacao: string;
  descricao?: string | null;
  produtosLocalizacoes?: ProdutoLocalizacao[];
  transferencias?: Transferencia[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProdutoLocalizacao {
  id?: string;
  id_produto: string;
  id_localizacao: string;
  id_seccao: string;
  id_prateleira: string;
  id_corredor: string;
  quantidadeProduto: number;
  quantidadeMinimaProduto: number;
  produtos?: Produto;
  localizacoes?: Localizacao;
  seccoes?: Seccao;
  prateleiras?: Prateleira;
  corredores?: Corredor;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transferencia {
  id?: string;
  id_produto: string;
  id_funcionario: string;
  id_localizacao: string;
  dataTransferencia: string;
  quantidadeTransferida: number;
  funcionarios?: Funcionario;
  produtos?: Produto;
  localizacoes?: Localizacao;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuncionarioCaixa {
  id?: string;
  id_caixa: string;
  id_funcionario: string;
  estadoCaixa: boolean;
  quantidadaFaturada: number;
  horarioAbertura: string;
  horarioFechamento: string | null;
  caixas?: Caixa;
  funcionarios?: Funcionario;
  vendas?: Venda[];
  fornecedores?: Fornecedor[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Estoque {
  id?: string;
  id_produto: string;
  quantidadeAtual: string;
  lote: string;
  dataValidadeLote: Date;
}
export interface Alerta {
  id?: string;
  id_caixa: string;
  id_produto: string;
  nomeAlerta: string;
  descricao?: string | null;
  caixas?: Caixa;
  produtos?: Produto;
  createdAt?: string;
  updatedAt?: string;
}

export interface Funcao {
  id?: string;
  nome: string;
  descricao?: string | null;
  funcionariosFuncoes?: FuncionarioFuncao[];
  funcoesPermissoes?: FuncaoPermissao[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Permissao {
  id?: string;
  nome: string;
  descricao?: string | null;
  funcionariosPermissoes?: FuncionarioPermissao[];
  funcoesPermissoes?: FuncaoPermissao[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FuncionarioFuncao {
  id?: string;
  id_funcionario: string;
  id_funcao: string;
  funcionarios?: Funcionario;
  funcoes?: Funcao;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuncionarioPermissao {
  id?: string;
  id_funcionario: string;
  id_permissao: string;
  funcionarios?: Funcionario;
  permissoes?: Permissao;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuncaoPermissao {
  id?: string;
  id_funcao: string;
  id_permissao: string;
  funcoes?: Funcao;
  permissoes?: Permissao;
  createdAt?: string;
  updatedAt?: string;
}

// src/types/models.ts

// Interface para vendas com nome do funcionário
export interface VendaComFuncionario {
  id: string;
  idCliente?: string;
  idFuncionario?: string;
  data: string;
  valorTotal: number;
  quantidade?: number;
  status?: string;
  funcionarioNome: string;
  produto?: { nomeProduto: string };
  cliente?: { nome: string };
}

// Interface para produtos mais vendidos
export interface ProdutoMaisVendido {
  id_produto: string;
  nomeProduto: string;
  quantidadeVendida: number;
  valorTotal: number;
}

// Interface para faturamento por período
export interface FaturamentoPorPeriodo {
  totalFaturado: number;
  vendas: VendaComFuncionario[];
}

// Interface para quantidade faturada por caixa
export interface QuantidadeFaturadaPorCaixa {
  idCaixa: string;
  nomeCaixa: string;
  quantidadeFaturada: number;
  funcionarios: string[];
}

// Interface para estoque atual
export interface EstoqueAtual {
  id_produto: string;
  nomeProduto: string;
  quantidadeEstoque: number;
  localizacoes: { id: string; nome: string }[];
}

// Interface para entradas de estoque com nome do funcionário
export interface EntradaEstoqueComFuncionario {
  id: string;
  idProduto?: string;
  quantidade: number;
  data: string;
  funcionarioNome: string;
  produto?: { nomeProduto: string };
}

// Interface para transferências com nome do funcionário
export interface TransferenciaComFuncionario {
  id: string;
  idProduto?: string;
  quantidade: number;
  data: string;
  funcionarioNome: string;
  produto?: { nomeProduto: string };
}

// Interface para produtos abaixo do mínimo
export interface ProdutoAbaixoMinimo {
  id_produto: string;
  nomeProduto: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  localizacao: string;
}

// Interface para atividade de funcionários no caixa
export interface FuncionarioCaixaComNome {
  id: string;
  idFuncionario?: string;
  idCaixa?: string;
  data: string;
  funcionarioNome: string;
  caixa?: { nome: string };
}

// Interface para período mais vendido por produto
export interface PeriodoMaisVendidoPorProduto {
  id_produto: string;
  nomeProduto: string;
  periodo: string;
  quantidadeVendida: number;
  valorTotal: number;
}

// ... (outras interfaces existentes como Cliente, Produto, etc., se já estiverem no arquivo)
