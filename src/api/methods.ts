import api from './index';
import {
  Cliente,
  Funcionario,
  CategoriaProduto,
  Produto,
  Fornecedor,
  DadosEntradaEstoque,
  Caixa,
  Venda,
  VendaProduto,
  Seccao,
  Corredor,
  Prateleira,
  Localizacao,
  ProdutoLocalizacao,
  Transferencia,
  FuncionarioCaixa,
  Alerta,
  Funcao,
  Permissao,
  FuncionarioFuncao,
  VendaComFuncionario,
  FuncionarioPermissao,
  FuncaoPermissao,
  ProdutoMaisVendido,
  FaturamentoPorPeriodo,
  QuantidadeFaturadaPorCaixa,
  EntradaEstoqueComFuncionario,
  TransferenciaComFuncionario,
  ProdutoAbaixoMinimo,
  FuncionarioCaixaComNome,
  PeriodoMaisVendidoPorProduto,
  DadosEstoque,
  Tarefa,
  DadosWrapper,
  AtividadeDoDia,
} from '../types/models';
// import { hasPermission, hasAnyRole } from './authUtils';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
export class AppError {
  public readonly message: string;
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    this.message = message;
    this.statusCode = statusCode;
  }
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface LoginResponse {
  message: string;
  result: {
    token: string;
    nome: string;
    email: string;
    telefone: string;
    numeroBI: string;
    roles: string[];
    permissoes: string[];
  };
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api.post('/login', credentials);
    const { token, nome, email, telefone, numeroBI, roles, permissoes } = response.data.result;

    localStorage.setItem('token', token);
    localStorage.setItem(
      'user',
      JSON.stringify({ nome, email, telefone, numeroBI, roles, permissoes }),
    );

    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao fazer login');
  }
};

export const getAllStockEntries = async (): Promise<DadosEntradaEstoque[]> => {
  try {
    const response = await api.get('/entradaEstoque');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar entradas de estoque');
  }
};

export const createStockEntry = async (data: DadosEntradaEstoque): Promise<DadosEntradaEstoque> => {
  try {
    const response = await api.post('/entradaEstoque', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar entrada de estoque');
  }
};

export const updateStockEntry = async (
  id: string,
  data: Partial<DadosEntradaEstoque>,
): Promise<DadosEntradaEstoque> => {
  try {
    const response = await api.put(`/entradaEstoque/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar entrada de estoque com lote ${id}`);
  }
};

export const deleteStockEntry = async (id: string): Promise<void> => {
  try {
    await api.delete(`/entradaEstoque/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar entrada de estoque com id ${id}`);
  }
};

export const getAllStock = async (): Promise<DadosEstoque[]> => {
  try {
    const response = await api.get('/estoque');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar registros de estoque');
  }
};

export const createStock = async (data: DadosEstoque): Promise<DadosEstoque> => {
  try {
    const response = await api.post('/estoque', {
      ...data,
      dataValidadeLote:
        data.dataValidadeLote instanceof Date
          ? data.dataValidadeLote.toISOString()
          : data.dataValidadeLote,
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar registro de estoque');
  }
};

export const updateStock = async (
  lote: string,
  data: Partial<DadosEstoque>,
): Promise<DadosEstoque> => {
  try {
    const response = await api.put(`/estoque/${lote}`, {
      ...data,
      dataValidadeLote:
        data.dataValidadeLote instanceof Date
          ? data.dataValidadeLote.toISOString()
          : data.dataValidadeLote,
    });
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar registro de estoque com lote ${lote}`);
  }
};

export const deleteStock = async (lote: string): Promise<void> => {
  try {
    await api.delete(`/estoque/${lote}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar registro de estoque com lote ${lote}`);
  }
};

export const getStockByProduct = async (referenciaProduto: string): Promise<DadosEstoque> => {
  try {
    const response = await api.get(`/estoque/produto/${referenciaProduto}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao buscar estoque para produto ${referenciaProduto}`);
  }
};

export const getTotalStockByProduct = async (referenciaProduto: string): Promise<number> => {
  try {
    const response = await api.get(`/estoque/produto/${referenciaProduto}`);
    const stockData = Array.isArray(response.data) ? response.data : [response.data];
    const totalQuantity = stockData.reduce(
      (sum: number, stock: DadosEstoque) => sum + (stock.quantidadeAtual || 0),
      0,
    );
    return totalQuantity;
  } catch (error) {
    throw new ApiError(
      `Falha ao buscar quantidade total de estoque para produto ${referenciaProduto}`,
    );
  }
};

export const getAllProducts = async (): Promise<Produto[]> => {
  try {
    const response = await api.get('/produto');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar produtos');
  }
};

export const createProduct = async (data: Produto): Promise<Produto> => {
  try {
    const response = await api.post('/produto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar produto');
  }
};

export const updateProduct = async (id: string, data: Partial<Produto>): Promise<Produto> => {
  try {
    const response = await api.put(`/produto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar produto com referência ${id}`);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/produto/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar produto com referência ${id}`);
  }
};

export const getAllSuppliers = async (): Promise<Fornecedor[]> => {
  try {
    const response = await api.get('/fornecedor');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar fornecedores');
  }
};

export const createSupplier = async (data: Fornecedor): Promise<Fornecedor> => {
  try {
    const response = await api.post('/fornecedor', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar fornecedor');
  }
};

export const updateSupplier = async (
  nif: string,
  data: Partial<Fornecedor>,
): Promise<Fornecedor> => {
  try {
    const response = await api.put(`/fornecedor/${nif}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar fornecedor com NIF ${nif}`);
  }
};

export const deleteSupplier = async (nif: string): Promise<void> => {
  try {
    await api.delete(`/fornecedor/${nif}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar fornecedor com NIF ${nif}`);
  }
};

export const getAllEmployees = async (): Promise<Funcionario[]> => {
  try {
    const response = await api.get('/funcionario');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar funcionários');
  }
};

export const createEmployee = async (data: Funcionario): Promise<Funcionario> => {
  try {
    const response = await api.post('/funcionario', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar funcionário');
  }
};

export const updateEmployee = async (
  id: string,
  data: Partial<Funcionario>,
): Promise<Funcionario> => {
  try {
    const response = await api.put(`/funcionario/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar funcionário com BI ${id}`);
  }
};

export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionario/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar funcionário com BI ${id}`);
  }
};

export const getAllFunctionPermissions = async (): Promise<FuncaoPermissao[]> => {
  try {
    const response = await api.get('/funcaoPermissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar permissões de funções');
  }
};

export const getAllFunctionPermissionsByFunction = async (
  id_funcao: string,
): Promise<FuncaoPermissao[]> => {
  try {
    const response = await api.get(`/funcaoPermissao/funcao/${id_funcao}`);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar permissões de funções');
  }
};

export const createFunctionPermission = async (data: FuncaoPermissao): Promise<FuncaoPermissao> => {
  try {
    const response = await api.post('/funcaoPermissao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar permissão de função');
  }
};

export const updateFunctionPermission = async (
  id: string,
  data: Partial<FuncaoPermissao>,
): Promise<FuncaoPermissao> => {
  try {
    const response = await api.put(`/funcaoPermissao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar permissão de função com id ${id}`);
  }
};

export const deleteFunctionPermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcaoPermissao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar permissão de função com id ${id}`);
  }
};

export const getAllEmployeeFunctions = async (): Promise<FuncionarioFuncao[]> => {
  try {
    const response = await api.get('/funcionarioFuncao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar funções de funcionários');
  }
};

export const createEmployeeFunction = async (
  data: FuncionarioFuncao,
): Promise<FuncionarioFuncao> => {
  try {
    const response = await api.post('/funcionarioFuncao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar função de funcionário');
  }
};

export const updateEmployeeFunction = async (
  id: string,
  data: Partial<FuncionarioFuncao>,
): Promise<FuncionarioFuncao> => {
  try {
    const response = await api.put(`/funcionarioFuncao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar função de funcionário com id ${id}`);
  }
};

export const deleteEmployeeFunction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioFuncao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar função de funcionário com id ${id}`);
  }
};

export const getAllEmployeePermissions = async (): Promise<FuncionarioPermissao[]> => {
  try {
    const response = await api.get('/funcionarioPermissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar permissões de funcionários');
  }
};

export const createEmployeePermission = async (
  data: FuncionarioPermissao,
): Promise<FuncionarioPermissao> => {
  try {
    const response = await api.post('/funcionarioPermissao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar permissão de funcionário');
  }
};

export const updateEmployeePermission = async (
  id: string,
  data: Partial<FuncionarioPermissao>,
): Promise<FuncionarioPermissao> => {
  try {
    const response = await api.put(`/funcionarioPermissao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar permissão de funcionário com id ${id}`);
  }
};

export const deleteEmployeePermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioPermissao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar permissão de funcionário com id ${id}`);
  }
};

export const getAllFunctions = async (): Promise<Funcao[]> => {
  try {
    const response = await api.get('/funcao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar funções');
  }
};
export const getAllFunctionsByName = async (nameFuncao: string): Promise<Funcao> => {
  try {
    const response = await api.get(`/funcao/${nameFuncao}`);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar funções');
  }
};

export const createFunction = async (data: Funcao): Promise<Funcao> => {
  try {
    const response = await api.post('/funcao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar função');
  }
};

export const updateFunction = async (id: string, data: Partial<Funcao>): Promise<Funcao> => {
  try {
    const response = await api.put(`/funcao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar função com id ${id}`);
  }
};

export const deleteFunction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar função com id ${id}`);
  }
};

export const getAllTransfers = async (): Promise<Transferencia[]> => {
  try {
    const response = await api.get('/transferencia');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar transferências');
  }
};

export const createTransfer = async (data: Transferencia): Promise<Transferencia> => {
  try {
    const response = await api.post('/transferencia', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar transferência');
  }
};

export const updateTransfer = async (
  id: string,
  data: Partial<Transferencia>,
): Promise<Transferencia> => {
  try {
    const response = await api.put(`/transferencia/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar transferência com id ${id}`);
  }
};

export const deleteTransfer = async (id: string): Promise<void> => {
  try {
    await api.delete(`/transferencia/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar transferência com id ${id}`);
  }
};

export const getAllSales = async (): Promise<Venda[]> => {
  try {
    const response = await api.get('/venda');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar vendas');
  }
};

export const createSale = async (data: DadosWrapper): Promise<Venda> => {
  try {
    const response = await api.post('/venda', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar fatura');
  }
};

export const updateSale = async (id: string, data: Partial<Venda>): Promise<Venda> => {
  try {
    const response = await api.put(`/venda/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar venda com id ${id}`);
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    await api.delete(`/venda/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar venda com id ${id}`);
  }
};

export const getAllClients = async (): Promise<Cliente[]> => {
  try {
    const response = await api.get('/cliente');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar clientes');
  }
};

export const createClient = async (data: Cliente): Promise<Cliente> => {
  try {
    const response = await api.post('/cliente', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar cliente');
  }
};

export const updateClient = async (id: string, data: Partial<Cliente>): Promise<Cliente> => {
  try {
    const response = await api.put(`/cliente/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar cliente com id ${id}`);
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await api.delete(`/cliente/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar cliente com id ${id}`);
  }
};

export const getAllCorridors = async (): Promise<Corredor[]> => {
  try {
    const response = await api.get('/corredor');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar corredores');
  }
};

export const createCorridor = async (data: Corredor): Promise<Corredor> => {
  try {
    const response = await api.post('/corredor', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar corredor');
  }
};

export const updateCorridor = async (id: string, data: Partial<Corredor>): Promise<Corredor> => {
  try {
    const response = await api.put(`/corredor/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar corredor com id ${id}`);
  }
};

export const deleteCorridor = async (id: string): Promise<void> => {
  try {
    await api.delete(`/corredor/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar corredor com id ${id}`);
  }
};

export const getAllProductCategories = async (): Promise<CategoriaProduto[]> => {
  try {
    const response = await api.get('/categoriaProduto');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar categorias de produtos');
  }
};

export const createProductCategory = async (data: CategoriaProduto): Promise<CategoriaProduto> => {
  try {
    const response = await api.post('/categoriaProduto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar categoria de produto');
  }
};

export const updateProductCategory = async (
  id: string,
  data: Partial<CategoriaProduto>,
): Promise<CategoriaProduto> => {
  try {
    const response = await api.put(`/categoriaProduto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar categoria de produto com id ${id}`);
  }
};

export const deleteProductCategory = async (id: string): Promise<void> => {
  try {
    await api.delete(`/categoriaProduto/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar categoria de produto com id ${id}`);
  }
};

export const getAllShelves = async (): Promise<Prateleira[]> => {
  try {
    const response = await api.get('/prateleira');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar prateleiras');
  }
};

export const createShelf = async (data: Prateleira): Promise<Prateleira> => {
  try {
    const response = await api.post('/prateleira', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar prateleira');
  }
};

export const updateShelf = async (id: string, data: Partial<Prateleira>): Promise<Prateleira> => {
  try {
    const response = await api.put(`/prateleira/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar prateleira com id ${id}`);
  }
};

export const deleteShelf = async (id: string): Promise<void> => {
  try {
    await api.delete(`/prateleira/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar prateleira com id ${id}`);
  }
};

export const getAllSections = async (): Promise<Seccao[]> => {
  try {
    const response = await api.get('/seccao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar seções');
  }
};

export const createSection = async (data: Seccao): Promise<Seccao> => {
  try {
    const response = await api.post('/seccao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar seção');
  }
};

export const updateSection = async (id: string, data: Partial<Seccao>): Promise<Seccao> => {
  try {
    console.log('Enviando para updateSection:', data);
    const response = await api.put(`/seccao/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar seção:', error);
    throw new ApiError(`Falha ao atualizar seção com id ${id}`);
  }
};

export const deleteSection = async (id: string): Promise<void> => {
  try {
    await api.delete(`/seccao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar seção com id ${id}`);
  }
};

export const getAllCashRegisters = async (): Promise<Caixa[]> => {
  try {
    const response = await api.get('/caixa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar caixas');
  }
};

export const createCashRegister = async (data: Caixa): Promise<Caixa> => {
  try {
    const response = await api.post('/caixa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar caixa');
  }
};

export const updateCashRegister = async (id: string, data: Partial<Caixa>): Promise<Caixa> => {
  try {
    const response = await api.put(`/caixa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar caixa com id ${id}`);
  }
};

export const deleteCashRegister = async (id: string): Promise<void> => {
  try {
    await api.delete(`/caixa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar caixa com id ${id}`);
  }
};

export const getAllEmployeeCashRegisters = async (): Promise<FuncionarioCaixa[]> => {
  try {
    const response = await api.get('/funcionarioCaixa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relações funcionário-caixa');
  }
};

export const createEmployeeCashRegister = async (
  data: FuncionarioCaixa,
): Promise<FuncionarioCaixa> => {
  try {
    const response = await api.post('/funcionarioCaixa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao abrir caixa');
  }
};

export const updateEmployeeCashRegister = async (
  id: string,
  data: Partial<FuncionarioCaixa>,
): Promise<FuncionarioCaixa> => {
  try {
    const response = await api.put(`/funcionarioCaixa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar relação funcionário-caixa com id ${id}`);
  }
};

export const deleteEmployeeCashRegister = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioCaixa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar relação funcionário-caixa com id ${id}`);
  }
};

export const getAllLocations = async (): Promise<Localizacao[]> => {
  try {
    const response = await api.get('/localizacao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar localizações');
  }
};

export const createLocation = async (data: Localizacao): Promise<Localizacao> => {
  try {
    const response = await api.post('/localizacao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar localização');
  }
};

export const updateLocation = async (
  id: string,
  data: Partial<Localizacao>,
): Promise<Localizacao> => {
  try {
    const response = await api.put(`/localizacao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar localização com id ${id}`);
  }
};

export const deleteLocation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/localizacao/${id}`);
  } catch (error: any) {
    console.log('Erro ao excluir localização:', {
      id,
      status: error.response?.status,
      data: error.response?.data,
      details: error.response?.data?.details || error.response?.data?.message || 'Sem detalhes',
      message: error.message,
    });
    throw new ApiError(`Falha ao deletar localização com id ${id}`);
  }
};

export const getAllPermissions = async (): Promise<Permissao[]> => {
  try {
    const response = await api.get('/permissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar permissões');
  }
};

export const createPermission = async (data: Permissao): Promise<Permissao> => {
  try {
    const response = await api.post('/permissao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar permissão');
  }
};

export const updatePermission = async (
  id: string,
  data: Partial<Permissao>,
): Promise<Permissao> => {
  try {
    const response = await api.put(`/permissao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar permissão com id ${id}`);
  }
};

export const deletePermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/permissao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar permissão com id ${id}`);
  }
};

export const getAllProductLocations = async (): Promise<ProdutoLocalizacao[]> => {
  try {
    const response = await api.get('/produtoLocalizacao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar localizações de produtos');
  }
};

export const createProductLocation = async (
  data: ProdutoLocalizacao,
): Promise<ProdutoLocalizacao> => {
  try {
    const response = await api.post('/produtoLocalizacao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar localização de produto');
  }
};

export const updateProductLocation = async (
  id: string,
  data: Partial<ProdutoLocalizacao>,
): Promise<ProdutoLocalizacao> => {
  try {
    const response = await api.put(`/produtoLocalizacao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar localização de produto com id ${id}`);
  }
};

export const deleteProductLocation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/produtoLocalizacao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar localização de produto com id ${id}`);
  }
};

export const getAllSaleProducts = async (): Promise<VendaProduto[]> => {
  try {
    const response = await api.get('/vendaProduto');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar produtos de vendas');
  }
};

export const createSaleProduct = async (data: VendaProduto): Promise<VendaProduto> => {
  try {
    const response = await api.post('/vendaProduto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar produto de venda');
  }
};

export const updateSaleProduct = async (
  id: string,
  data: Partial<VendaProduto>,
): Promise<VendaProduto> => {
  try {
    const response = await api.put(`/vendaProduto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar produto de venda com id ${id}`);
  }
};

export const deleteSaleProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/vendaProduto/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar produto de venda com id ${id}`);
  }
};

export const getAllAlerts = async (): Promise<Alerta[]> => {
  try {
    const response = await api.get('/alertas');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar alertas');
  }
};

export const createAlert = async (data: Alerta): Promise<Alerta> => {
  try {
    const response = await api.post('/alertas', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar alerta');
  }
};

export const updateAlert = async (id: string, data: Partial<Alerta>): Promise<Alerta> => {
  try {
    const response = await api.put(`/alertas/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar alerta com id ${id}`);
  }
};

export const deleteAlert = async (id: string): Promise<void> => {
  try {
    await api.delete(`/alertas/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar alerta com id ${id}`);
  }
};

export const getAllTasks = async (): Promise<Tarefa[]> => {
  try {
    const response = await api.get('/tarefa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar tarefas');
  }
};

export const createTask = async (data: Tarefa): Promise<Tarefa> => {
  try {
    const response = await api.post('/tarefa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar tarefa');
  }
};

export const updateTask = async (id: string, data: Partial<Tarefa>): Promise<Tarefa> => {
  try {
    const response = await api.put(`/tarefa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar tarefa com id ${id}`);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tarefa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar tarefa com id ${id}`);
  }
};

export const getAllDailyActivities = async (): Promise<AtividadeDoDia[]> => {
  try {
    const response = await api.get('/funcionarioTarefa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar atividades do dia');
  }
};

export const createDailyActivity = async (data: AtividadeDoDia): Promise<AtividadeDoDia> => {
  try {
    const response = await api.post('/funcionarioTarefa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar atividade do dia');
  }
};

export const updateDailyActivity = async (
  id: string,
  data: Partial<AtividadeDoDia>,
): Promise<AtividadeDoDia> => {
  try {
    const response = await api.put(`/funcionarioTarefa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar atividade do dia com id ${id}`);
  }
};

export const deleteDailyActivity = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioTarefa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar atividade do dia com id ${id}`);
  }
};

export const assignTaskToEmployees = async (
  tarefaId: string,
  funcionarioIds: string[],
  funcaoIds: string[],
): Promise<void> => {
  try {
    await api.post(`/funcionarioTarefa`, {
      funcionarioIds,
      funcaoIds,
    });
  } catch (error) {
    throw new ApiError(`Falha ao atribuir tarefa ${tarefaId}`);
  }
};

export const getTaskAssignments = async (
  tarefaId: string,
): Promise<{ funcionarios: Funcionario[]; funcoes: Funcao[] }> => {
  try {
    const response = await api.get(`/funcionarioTarefa/${tarefaId}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao buscar atribuições para tarefa ${tarefaId}`);
  }
};

export const removeTaskAssignment = async (
  tarefaId: string,
  funcionarioId: string,
  funcaoId: string,
): Promise<void> => {
  try {
    await api.delete(`funcionarioTarefa/${tarefaId}`, {
      data: { funcionarioId, funcaoId },
    });
  } catch (error) {
    throw new ApiError(`Falha ao remover atribuição para tarefa ${tarefaId}`);
  }
};

export const getReportData = async (endpoint: string, queryParams: string): Promise<any> => {
  try {
    const response = await api.get(`/relatorio/${endpoint}?${queryParams}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao buscar dados do relatório ${endpoint}`);
  }
};

export const getSalesByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<FaturamentoPorPeriodo[]> => {
  try {
    const response = await api.get(
      `/relatorio/faturamentoPorPeriodo?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar faturamento por período');
  }
};
