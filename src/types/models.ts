export enum TipoDocumento {
  FATURA = 'FATURA',
  RECIBO = 'RECIBO',
  FATURA_PROFORMA = 'FATURA_PROFORMA',
  FATURA_RECIBO = 'FATURA_RECIBO',
}

export interface DadosVenda {
  id_cliente?: string;
  dataEmissao: Date;
  dataValidade: Date;
  id_funcionarioCaixa: string;
  metodoPagamento: string;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  valorTotal: number;
  vendasProdutos: { id_produto: string; quantidade: number; valorTotal?: number }[];
}

export interface Cliente {
  id?: string;
  emailCliente?: string;
  moradaCliente?: string;
  nomeCliente?: string;
  telefoneCliente?: string;
  numeroContribuinte?: string;
}

export interface DadosWrapper {
  Dados: {
    dadosVenda: DadosVenda;
    cliente?: Cliente[] | undefined;
  };
}

export interface Funcionario {
  role: string;
  isAdmin: boolean;
  id?: string;
  id_funcao: string;
  numeroBI: string;
  nomeFuncionario: string;
  senha: string;
  moradaFuncionario: string;
  telefoneFuncionario: string;
  emailFuncionario: string;
  profilePic?: string;
}

export interface CategoriaProduto {
  id?: string;
  nomeCategoria: string;
  descricao?: string | null;
}

export interface Produto {
  id?: string;
  id_categoriaProduto: string;
  referenciaProduto: string;
  nomeProduto: string;
  precoVenda: number;
  quantidadePorUnidade?: number;
  unidadeMedida: string;
  unidadeConteudo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fornecedor {
  id?: string;
  nif: string;
  nomeFornecedor: string;
  moradaFornecedor: string;
  telefoneFornecedor: number;
  emailFornecedor: string;
}

export interface DadosEntradaEstoque {
  id?: string;
  id_fornecedor: string;
  id_produto: string;
  id_funcionario: string;
  quantidadeRecebida: number;
  dataEntrada: Date | string;
  adicionado: boolean;
  custoUnitario: number;
  lote: string;
  dataValidadeLote: Date;
}

export interface Caixa {
  id?: string;
  nomeCaixa: string;
  descricao?: string | null;
  mac: string;
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
  metodoPagamento: string;
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
export enum tipo {
  Armazem = 'Armazem',
  Loja = 'Loja',
}

export interface Localizacao {
  id?: string;
  nomeLocalizacao: string;
  descricao?: string | null;
  tipo: tipo;
  produtosLocalizacoes?: ProdutoLocalizacao[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AlertState {
  severity: 'success' | 'error' | 'info' | 'warning';
  message: string;
  unread?: boolean; // Propriedade para indicar se o alerta não foi lido
}
export interface ProdutoLocalizacao {
  id?: string;
  id_produto: string;
  id_localizacao: string;
  id_seccao: string;
  id_prateleira: string;
  id_corredor: string;
  lote?: string;
  dataValidadeLote?: Date;
  quantidadeProduto: number;
  quantidadeMinimaProduto: number;
  transferencias?: Transferencia[];
  produtos?: Produto;
  localizacoes?: Localizacao;
  seccoes?: Seccao;
  prateleiras?: Prateleira;
  corredores?: Corredor;
  createdAt?: string;
  updatedAt?: string;
  id_estoque?: string;
}

export interface Transferencia {
  id?: string;
  id_produto: string;
  id_funcionario: string;
  id_produtoLocalizacao?: string;
  dataTransferencia: Date;
  quantidadeTransferida: number;
  funcionarios?: Funcionario;
  produtos?: Produto;
  produtosLocalizacoes?: ProdutoLocalizacao;
  createdAt?: string;
  updatedAt?: string;
}

export interface FuncionarioCaixa {
  id?: string;
  id_caixa: string;
  id_funcionario: string;
  estadoCaixa: boolean;
  quantidadaFaturada: number;
  valorInicial: number;
  horarioAbertura: Date;
  horarioFechamento: Date | null;
  caixas?: Caixa;
  Funcionarios?: Funcionario;
  vendas?: Venda[];
  fornecedores?: Fornecedor[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DadosEstoque {
  id?: string;
  id_produto: string;
  quantidadeAtual: number;
  lote: string;
  dataValidadeLote: Date;
  produtos?: Produto;
  createdAt?: string;
  updatedAt?: string;
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
  Funcoes?: Funcao;
  Permissoes?: Permissao;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface ProdutoMaisVendido {
  id_produto: string;
  nomeProduto: string;
  quantidadeVendida: number;
  valorTotal: number;
}

export interface FaturamentoPorPeriodo {
  totalFaturado: number;
  vendas: VendaComFuncionario[];
}

export interface QuantidadeFaturadaPorCaixa {
  idCaixa: string;
  nomeCaixa: string;
  quantidadeFaturada: number;
  funcionarios: string[];
}

export interface EstoqueAtual {
  id_produto: string;
  nomeProduto: string;
  quantidadeEstoque: number;
  localizacoes: { id: string; nome: string }[];
}

export interface EntradaEstoqueComFuncionario {
  id: string;
  idProduto?: string;
  quantidade: number;
  data: string;
  funcionarioNome: string;
  produto?: { nomeProduto: string };
}

export interface TransferenciaComFuncionario {
  id: string;
  idProduto?: string;
  quantidade: number;
  data: string;
  funcionarioNome: string;
  produto?: { nomeProduto: string };
}

export interface ProdutoAbaixoMinimo {
  id_produto: string;
  nomeProduto: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  localizacao: string;
}

export interface FuncionarioCaixaComNome {
  id: string;
  idFuncionario?: string;
  idCaixa?: string;
  data: string;
  funcionarioNome: string;
  caixa?: { nome: string };
}

export interface PeriodoMaisVendidoPorProduto {
  id_produto: string;
  nomeProduto: string;
  periodo: string;
  quantidadeVendida: number;
  valorTotal: number;
}
export interface Tarefa {
  id?: string;
  nome: string;
  descricao: string;
}

export interface AtividadeDoDia {
  tarefa?: any;
  funcionarios?: any;
  id?: string;
  id_funcionario: string;
  id_tarefa: string;
  status: 'Concluída' | 'Em Andamento' | 'Pendente';
  createdAt?: Date;
}
