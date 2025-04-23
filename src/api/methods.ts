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

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
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
  // if (!hasPermission('listar_entrada_estoque')) {
  //   throw new ApiError('Você não tem permissão para listar entradas de estoque.');
  // }
  try {
    const response = await api.get('/entradaEstoque');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar entradas de estoque');
  }
};

export const createStockEntry = async (data: DadosEntradaEstoque): Promise<DadosEntradaEstoque> => {
  // if (!hasPermission('criar_entrada_estoque')) {
  //   throw new ApiError('Você não tem permissão para criar entradas de estoque.');
  // }
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
  // if (!hasPermission('atualizar_entrada_estoque')) {
  //   throw new ApiError('Você não tem permissão para atualizar entradas de estoque.');
  // }
  try {
    const response = await api.put(`/entradaEstoque/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar entrada de estoque com lote ${id}`);
  }
};

export const deleteStockEntry = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_entrada_estoque')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar entradas de estoque.',
  //   );
  // }
  try {
    await api.delete(`/entradaEstoque/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar entrada de estoque com id ${id}`);
  }
};

export const getAllStock = async (): Promise<DadosEstoque[]> => {
  // if (!hasPermission('listar_estoque')) {
  //   throw new ApiError('Você não tem permissão para listar registros de estoque.');
  // }
  try {
    const response = await api.get('/estoque');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar registros de estoque');
  }
};

export const createStock = async (data: DadosEstoque): Promise<DadosEstoque> => {
  // if (!hasPermission('criar_estoque')) {
  //   throw new ApiError('Você não tem permissão para criar registros de estoque.');
  // }
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
  // if (!hasPermission('atualizar_estoque')) {
  //   throw new ApiError('Você não tem permissão para atualizar registros de estoque.');
  // }
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
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_estoque')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar registros de estoque.',
  //   );
  // }
  try {
    await api.delete(`/estoque/${lote}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar registro de estoque com lote ${lote}`);
  }
};

export const getStockByProduct = async (referenciaProduto: string): Promise<DadosEstoque> => {
  // if (!hasPermission('listar_estoque')) {
  //   throw new ApiError('Você não tem permissão para listar estoque por produto.');
  // }
  try {
    const response = await api.get(`/estoque/produto/${referenciaProduto}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao buscar estoque para produto ${referenciaProduto}`);
  }
};

export const getAllProducts = async (): Promise<Produto[]> => {
  // if (!hasPermission('listar_produtos')) {
  //   throw new ApiError('Você não tem permissão para listar produtos.');
  // }
  try {
    const response = await api.get('/produto');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar produtos');
  }
};

export const createProduct = async (data: Produto): Promise<Produto> => {
  // if (!hasPermission('criar_produtos') && !hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem permissão para criar produtos.');
  // }
  try {
    const response = await api.post('/produto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar produto');
  }
};

export const updateProduct = async (id: string, data: Partial<Produto>): Promise<Produto> => {
  // if (!hasPermission('atualizar_produtos')) {
  //   throw new ApiError('Você não tem permissão para atualizar produtos.');
  // }
  try {
    const response = await api.put(`/produto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar produto com referência ${id}`);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_produtos')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar produtos.');
  // }
  try {
    await api.delete(`/produto/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar produto com referência ${id}`);
  }
};

export const getAllSuppliers = async (): Promise<Fornecedor[]> => {
  // if (!hasPermission('listar_fornecedores')) {
  //   throw new ApiError('Você não tem permissão para listar fornecedores.');
  // }
  try {
    const response = await api.get('/fornecedor');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar fornecedores');
  }
};

export const createSupplier = async (data: Fornecedor): Promise<Fornecedor> => {
  // if (!hasPermission('criar_fornecedores')) {
  //   throw new ApiError('Você não tem permissão para criar fornecedores.');
  // }
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
  // if (!hasPermission('atualizar_fornecedores')) {
  //   throw new ApiError('Você não tem permissão para atualizar fornecedores.');
  // }
  try {
    const response = await api.put(`/fornecedor/${nif}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar fornecedor com NIF ${nif}`);
  }
};

export const deleteSupplier = async (nif: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_fornecedores')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar fornecedores.');
  // }
  try {
    await api.delete(`/fornecedor/${nif}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar fornecedor com NIF ${nif}`);
  }
};

export const getAllEmployees = async (): Promise<Funcionario[]> => {
  // if (!hasPermission('listar_funcionarios')) {
  //   throw new ApiError('Você não tem permissão para listar funcionários.');
  // }
  try {
    const response = await api.get('/funcionario');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar funcionários');
  }
};

export const createEmployee = async (data: Funcionario): Promise<Funcionario> => {
  // if (!hasAnyRole(['Gerente', 'RH']) || !hasPermission('criar_funcionarios')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para criar funcionários.');
  // }
  try {
    const response = await api.post('/funcionario', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar funcionário');
  }
};

export const updateEmployee = async (
  numeroBI: string,
  data: Partial<Funcionario>,
): Promise<Funcionario> => {
  // if (!hasAnyRole(['Gerente', 'RH']) || !hasPermission('atualizar_funcionarios')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para atualizar funcionários.',
  //   );
  // }
  try {
    const response = await api.put(`/funcionario/${numeroBI}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar funcionário com BI ${numeroBI}`);
  }
};

export const deleteEmployee = async (numeroBI: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'RH']) || !hasPermission('eliminar_funcionarios')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar funcionários.');
  // }
  try {
    await api.delete(`/funcionario/${numeroBI}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar funcionário com BI ${numeroBI}`);
  }
};

export const getAllFunctionPermissions = async (): Promise<FuncaoPermissao[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para listar permissões de funções.');
  // }
  try {
    const response = await api.get('/funcaoPermissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar permissões de funções');
  }
};

export const createFunctionPermission = async (data: FuncaoPermissao): Promise<FuncaoPermissao> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('criar_funcionario_permissao')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para criar permissões de funções.',
  //   );
  // }
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
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para atualizar permissões de funções.');
  // }
  try {
    const response = await api.put(`/funcaoPermissao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar permissão de função com id ${id}`);
  }
};

export const deleteFunctionPermission = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para deletar permissões de funções.');
  // }
  try {
    await api.delete(`/funcaoPermissao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar permissão de função com id ${id}`);
  }
};

export const getAllEmployeeFunctions = async (): Promise<FuncionarioFuncao[]> => {
  // if (!hasAnyRole(['Gerente', 'RH']) || !hasPermission('listar_funcionario_funcao')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para listar funções de funcionários.',
  //   );
  // }
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
  // if (!hasAnyRole(['Gerente', 'RH']) || !hasPermission('criar_funcionario_funcao')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para criar funções de funcionários.',
  //   );
  // }
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
  // if (!hasAnyRole(['Gerente', 'RH'])) {
  //   throw new ApiError('Você não tem a função necessária para atualizar funções de funcionários.');
  // }
  try {
    const response = await api.put(`/funcionarioFuncao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar função de funcionário com id ${id}`);
  }
};

export const deleteEmployeeFunction = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'RH'])) {
  //   throw new ApiError('Você não tem a função necessária para deletar funções de funcionários.');
  // }
  try {
    await api.delete(`/funcionarioFuncao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar função de funcionário com id ${id}`);
  }
};

export const getAllEmployeePermissions = async (): Promise<FuncionarioPermissao[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_funcionario_permissao')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para listar permissões de funcionários.',
  //   );
  // }
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
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('criar_funcionario_permissao')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para criar permissões de funcionários.',
  //   );
  // }
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
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError(
  //     'Você não tem a função necessária para atualizar permissões de funcionários.',
  //   );
  // }
  try {
    const response = await api.put(`/funcionarioPermissao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar permissão de funcionário com id ${id}`);
  }
};

export const deleteEmployeePermission = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para deletar permissões de funcionários.');
  // }
  try {
    await api.delete(`/funcionarioPermissao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar permissão de funcionário com id ${id}`);
  }
};

export const getAllFunctions = async (): Promise<Funcao[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_funcoes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para listar funções.');
  // }
  try {
    const response = await api.get('/funcao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar funções');
  }
};

export const createFunction = async (data: Funcao): Promise<Funcao> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('criar_funcoes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para criar funções.');
  // }
  try {
    const response = await api.post('/funcao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar função');
  }
};

export const updateFunction = async (id: string, data: Partial<Funcao>): Promise<Funcao> => {
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para atualizar funções.');
  // }
  try {
    const response = await api.put(`/funcao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar função com id ${id}`);
  }
};

export const deleteFunction = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para deletar funções.');
  // }
  try {
    await api.delete(`/funcao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar função com id ${id}`);
  }
};

export const getAllTransfers = async (): Promise<Transferencia[]> => {
  // if (!hasPermission('listar_transferencias')) {
  //   throw new ApiError('Você não tem permissão para listar transferências.');
  // }
  try {
    const response = await api.get('/transferencia');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar transferências');
  }
};

export const createTransfer = async (data: Transferencia): Promise<Transferencia> => {
  // if (!hasPermission('criar_transferencias')) {
  //   throw new ApiError('Você não tem permissão para criar transferências.');
  // }
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
  // if (!hasPermission('atualizar_transferencias')) {
  //   throw new ApiError('Você não tem permissão para atualizar transferências.');
  // }
  try {
    const response = await api.put(`/transferencia/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar transferência com id ${id}`);
  }
};

export const deleteTransfer = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_transferencias')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar transferências.',
  //   );
  // }
  try {
    await api.delete(`/transferencia/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar transferência com id ${id}`);
  }
};

export const getAllSales = async (): Promise<Venda[]> => {
  // if (!hasPermission('listar_vendas')) {
  //   throw new ApiError('Você não tem permissão para listar vendas.');
  // }
  try {
    const response = await api.get('/venda');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar vendas');
  }
};

export const createSale = async (data: DadosWrapper): Promise<Venda> => {
  // if (!hasPermission('criar_fatura')) {
  //   throw new ApiError('Você não tem permissão para criar faturas.');
  // }
  try {
    const response = await api.post('/venda', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar fatura');
  }
};

export const updateSale = async (id: string, data: Partial<Venda>): Promise<Venda> => {
  // if (!hasPermission('atualizar_vendas')) {
  //   throw new ApiError('Você não tem permissão para atualizar vendas.');
  // }
  try {
    const response = await api.put(`/venda/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar venda com id ${id}`);
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_vendas')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar vendas.');
  // }
  try {
    await api.delete(`/venda/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar venda com id ${id}`);
  }
};

export const getAllClients = async (): Promise<Cliente[]> => {
  // if (!hasPermission('listar_clientes')) {
  //   throw new ApiError('Você não tem permissão para listar clientes.');
  // }
  try {
    const response = await api.get('/cliente');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar clientes');
  }
};

export const createClient = async (data: Cliente): Promise<Cliente> => {
  // if (!hasPermission('criar_clientes')) {
  //   throw new ApiError('Você não tem permissão para criar clientes.');
  // }
  try {
    const response = await api.post('/cliente', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar cliente');
  }
};

export const updateClient = async (id: string, data: Partial<Cliente>): Promise<Cliente> => {
  // if (!hasPermission('atualizar_clientes')) {
  //   throw new ApiError('Você não tem permissão para atualizar clientes.');
  // }
  try {
    const response = await api.put(`/cliente/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar cliente com id ${id}`);
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_clientes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar clientes.');
  // }
  try {
    await api.delete(`/cliente/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar cliente com id ${id}`);
  }
};

export const getAllCorridors = async (): Promise<Corredor[]> => {
  // if (!hasPermission('listar_corredores')) {
  //   throw new ApiError('Você não tem permissão para listar corredores.');
  // }
  try {
    const response = await api.get('/corredor');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar corredores');
  }
};

export const createCorridor = async (data: Corredor): Promise<Corredor> => {
  // if (!hasPermission('criar_corredores')) {
  //   throw new ApiError('Você não tem permissão para criar corredores.');
  // }
  try {
    const response = await api.post('/corredor', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar corredor');
  }
};

export const updateCorridor = async (id: string, data: Partial<Corredor>): Promise<Corredor> => {
  // if (!hasPermission('atualizar_corredores')) {
  //   throw new ApiError('Você não tem permissão para atualizar corredores.');
  // }
  try {
    const response = await api.put(`/corredor/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar corredor com id ${id}`);
  }
};

export const deleteCorridor = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_corredores')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar corredores.');
  // }
  try {
    await api.delete(`/corredor/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar corredor com id ${id}`);
  }
};

export const getAllProductCategories = async (): Promise<CategoriaProduto[]> => {
  // if (!hasPermission('listar_categoria_produto') && !hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem permissão para listar categorias de produtos.');
  // }
  try {
    const response = await api.get('/categoriaProduto');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar categorias de produtos');
  }
};

export const createProductCategory = async (data: CategoriaProduto): Promise<CategoriaProduto> => {
  // if (!hasPermission('criar_categoria_produto') && !hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem permissão para criar categorias de produtos.');
  // }
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
  // if (!hasPermission('atualizar_categoria_produto') && !hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem permissão para atualizar categorias de produtos.');
  // }
  try {
    const response = await api.put(`/categoriaProduto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar categoria de produto com id ${id}`);
  }
};

export const deleteProductCategory = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_categoria_produto')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar categorias de produtos.',
  //   );
  // }
  try {
    await api.delete(`/categoriaProduto/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar categoria de produto com id ${id}`);
  }
};

export const getAllShelves = async (): Promise<Prateleira[]> => {
  // if (!hasPermission('listar_prateleiras')) {
  //   throw new ApiError('Você não tem permissão para listar prateleiras.');
  // }
  try {
    const response = await api.get('/prateleira');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar prateleiras');
  }
};

export const createShelf = async (data: Prateleira): Promise<Prateleira> => {
  // if (!hasPermission('criar_prateleira')) {
  //   throw new ApiError('Você não tem permissão para criar prateleiras.');
  // }
  try {
    const response = await api.post('/prateleira', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar prateleira');
  }
};

export const updateShelf = async (id: string, data: Partial<Prateleira>): Promise<Prateleira> => {
  // if (!hasPermission('atualizar_prateleiras')) {
  //   throw new ApiError('Você não tem permissão para atualizar prateleiras.');
  // }
  try {
    const response = await api.put(`/prateleira/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar prateleira com id ${id}`);
  }
};

export const deleteShelf = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_prateleiras')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar prateleiras.');
  // }
  try {
    await api.delete(`/prateleira/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar prateleira com id ${id}`);
  }
};

export const getAllSections = async (): Promise<Seccao[]> => {
  // if (!hasPermission('listar_seccoes') && !hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem permissão para listar seções.');
  // }
  try {
    const response = await api.get('/seccao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar seções');
  }
};

export const createSection = async (data: Seccao): Promise<Seccao> => {
  // if (!hasPermission('criar_seccao')) {
  //   throw new ApiError('Você não tem permissão para criar seções.');
  // }
  try {
    const response = await api.post('/seccao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar seção');
  }
};

export const updateSection = async (id: string, data: Partial<Seccao>): Promise<Seccao> => {
  // if (!hasPermission('atualizar_seccoes')) {
  //   throw new ApiError('Você não tem permissão para atualizar seções.');
  // }
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
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_seccoes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar seções.');
  // }
  try {
    await api.delete(`/seccao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar seção com id ${id}`);
  }
};

export const getAllCashRegisters = async (): Promise<Caixa[]> => {
  // if (!hasPermission('listar_caixas')) {
  //   throw new ApiError('Você não tem permissão para listar caixas.');
  // }
  try {
    const response = await api.get('/caixa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar caixas');
  }
};

export const createCashRegister = async (data: Caixa): Promise<Caixa> => {
  // if (!hasPermission('criar_caixas')) {
  //   throw new ApiError('Você não tem permissão para criar caixas.');
  // }
  try {
    const response = await api.post('/caixa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar caixa');
  }
};

export const updateCashRegister = async (id: string, data: Partial<Caixa>): Promise<Caixa> => {
  // if (!hasPermission('atualizar_caixas')) {
  //   throw new ApiError('Você não tem permissão para atualizar caixas.');
  // }
  try {
    const response = await api.put(`/caixa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar caixa com id ${id}`);
  }
};

export const deleteCashRegister = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_caixas')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar caixas.');
  // }
  try {
    await api.delete(`/caixa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar caixa com id ${id}`);
  }
};

export const getAllEmployeeCashRegisters = async (): Promise<FuncionarioCaixa[]> => {
  // if (!hasPermission('listar_funcionario_caixa')) {
  //   throw new ApiError('Você não tem permissão para listar relações funcionário-caixa.');
  // }
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
  // if (!hasPermission('abrir_caixa')) {
  //   throw new ApiError('Você não tem permissão para abrir caixas.');
  // }
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
  // if (!hasPermission('atualizar_funcionario_caixa')) {
  //   throw new ApiError('Você não tem permissão para atualizar relações funcionário-caixa.');
  // }
  try {
    const response = await api.put(`/funcionarioCaixa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar relação funcionário-caixa com id ${id}`);
  }
};

export const deleteEmployeeCashRegister = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_funcionario_caixa')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar relações funcionário-caixa.',
  //   );
  // }
  try {
    await api.delete(`/funcionarioCaixa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar relação funcionário-caixa com id ${id}`);
  }
};

export const getAllLocations = async (): Promise<Localizacao[]> => {
  // if (!hasPermission('listar_localizacoes')) {
  //   throw new ApiError('Você não tem permissão para listar localizações.');
  // }
  try {
    const response = await api.get('/localizacao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar localizações');
  }
};

export const createLocation = async (data: Localizacao): Promise<Localizacao> => {
  // if (!hasPermission('criar_localizacoes')) {
  //   throw new ApiError('Você não tem permissão para criar localizações.');
  // }
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
  // if (!hasPermission('atualizar_localizacoes')) {
  //   throw new ApiError('Você não tem permissão para atualizar localizações.');
  // }
  try {
    const response = await api.put(`/localizacao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar localização com id ${id}`);
  }
};

export const deleteLocation = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_localizacoes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar localizações.');
  // }
  try {
    await api.delete(`/localizacao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar localização com id ${id}`);
  }
};

export const getAllPermissions = async (): Promise<Permissao[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_permissoes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para listar permissões.');
  // }
  try {
    const response = await api.get('/permissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar permissões');
  }
};

export const createPermission = async (data: Permissao): Promise<Permissao> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('criar_permissoes')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para criar permissões.');
  // }
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
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para atualizar permissões.');
  // }
  try {
    const response = await api.put(`/permissao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar permissão com id ${id}`);
  }
};

export const deletePermission = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin'])) {
  //   throw new ApiError('Você não tem a função necessária para deletar permissões.');
  // }
  try {
    await api.delete(`/permissao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar permissão com id ${id}`);
  }
};

export const getAllProductLocations = async (): Promise<ProdutoLocalizacao[]> => {
  // if (!hasPermission('listar_produto_localizacao')) {
  //   throw new ApiError('Você não tem permissão para listar localizações de produtos.');
  // }
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
  // if (!hasPermission('criar_produto_localizacao')) {
  //   throw new ApiError('Você não tem permissão para criar localizações de produtos.');
  // }
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
  // if (!hasPermission('atualizar_produto_localizacao')) {
  //   throw new ApiError('Você não tem permissão para atualizar localizações de produtos.');
  // }
  try {
    const response = await api.put(`/produtoLocalizacao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar localização de produto com id ${id}`);
  }
};

export const deleteProductLocation = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_produto_localizacao')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar localizações de produtos.',
  //   );
  // }
  try {
    await api.delete(`/produtoLocalizacao/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar localização de produto com id ${id}`);
  }
};

export const getAllSaleProducts = async (): Promise<VendaProduto[]> => {
  // if (!hasPermission('listar_venda_produto')) {
  //   throw new ApiError('Você não tem permissão para listar produtos de vendas.');
  // }
  try {
    const response = await api.get('/vendaProduto');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar produtos de vendas');
  }
};

export const createSaleProduct = async (data: VendaProduto): Promise<VendaProduto> => {
  // if (!hasPermission('criar_vendas_produtos')) {
  //   throw new ApiError('Você não tem permissão para criar produtos de vendas.');
  // }
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
  // if (!hasPermission('atualizar_vendas_produtos')) {
  //   throw new ApiError('Você não tem permissão para atualizar produtos de vendas.');
  // }
  try {
    const response = await api.put(`/vendaProduto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar produto de venda com id ${id}`);
  }
};

export const deleteSaleProduct = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_venda_produto')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar produtos de vendas.',
  //   );
  // }
  try {
    await api.delete(`/vendaProduto/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar produto de venda com id ${id}`);
  }
};

export const getAllAlerts = async (): Promise<Alerta[]> => {
  // if (!hasPermission('listar_alertas')) {
  //   throw new ApiError('Você não tem permissão para listar alertas.');
  // }
  try {
    const response = await api.get('/alertas');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar alertas');
  }
};

export const createAlert = async (data: Alerta): Promise<Alerta> => {
  // if (!hasPermission('criar_alertas')) {
  //   throw new ApiError('Você não tem permissão para criar alertas.');
  // }
  try {
    const response = await api.post('/alertas', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar alerta');
  }
};

export const updateAlert = async (id: string, data: Partial<Alerta>): Promise<Alerta> => {
  // if (!hasPermission('atualizar_alertas')) {
  //   throw new ApiError('Você não tem permissão para atualizar alertas.');
  // }
  try {
    const response = await api.put(`/alertas/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar alerta com id ${id}`);
  }
};

export const deleteAlert = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_alertas')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar alertas.');
  // }
  try {
    await api.delete(`/alertas/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar alerta com id ${id}`);
  }
};

export const getAllTasks = async (): Promise<Tarefa[]> => {
  // if (!hasPermission('listar_tarefas')) {
  //   throw new ApiError('Você não tem permissão para listar tarefas.');
  // }
  try {
    const response = await api.get('/tarefa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar tarefas');
  }
};

export const createTask = async (data: Tarefa): Promise<Tarefa> => {
  // if (!hasPermission('criar_tarefas')) {
  //   throw new ApiError('Você não tem permissão para criar tarefas.');
  // }
  try {
    const response = await api.post('/tarefa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao criar tarefa');
  }
};

export const updateTask = async (id: string, data: Partial<Tarefa>): Promise<Tarefa> => {
  // if (!hasPermission('atualizar_tarefas')) {
  //   throw new ApiError('Você não tem permissão para atualizar tarefas.');
  // }
  try {
    const response = await api.put(`/tarefa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar tarefa com id ${id}`);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_tarefas')) {
  //   throw new ApiError('Você não tem a função ou permissão necessária para deletar tarefas.');
  // }
  try {
    await api.delete(`/tarefa/${id}`);
  } catch (error) {
    throw new ApiError(`Falha ao deletar tarefa com id ${id}`);
  }
};

export const getAllDailyActivities = async (): Promise<AtividadeDoDia[]> => {
  // if (!hasPermission('listar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para listar atividades do dia.');
  // }
  try {
    const response = await api.get('/funcionarioTarefa');
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar atividades do dia');
  }
};

export const createDailyActivity = async (data: AtividadeDoDia): Promise<AtividadeDoDia> => {
  // if (!hasPermission('criar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para criar atividades do dia.');
  // }
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
  // if (!hasPermission('atualizar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para atualizar atividades do dia.');
  // }
  try {
    const response = await api.put(`/funcionarioTarefa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao atualizar atividade do dia com id ${id}`);
  }
};

export const deleteDailyActivity = async (id: string): Promise<void> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('eliminar_funcionario_tarefa')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para deletar atividades do dia.',
  //   );
  // }
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
  // if (!hasPermission('criar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para atribuir tarefas.');
  // }
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
  // if (!hasPermission('listar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para listar atribuições de tarefas.');
  // }
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
  // if (!hasPermission('eliminar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para remover atribuições de tarefas.');
  // }
  try {
    await api.delete(`funcionarioTarefa/${tarefaId}`, {
      data: { funcionarioId, funcaoId },
    });
  } catch (error) {
    throw new ApiError(`Falha ao remover atribuição para tarefa ${tarefaId}`);
  }
};

// Updated and new methods for /relatorio/ routes
export const getSalesByPeriod = async (
  startDate: string,
  endDate: string,
  limit?: number,
): Promise<VendaComFuncionario[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_vendas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de vendas.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/vendas-periodo', {
      params: { dataInicio: startDate, dataFim: endDate, limite: limit },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar vendas por período');
  }
};

export const getSalesByClient = async (
  idCliente: string,
  startDate: string,
  endDate: string,
  limit?: number,
): Promise<VendaComFuncionario[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_vendas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de vendas por cliente.',
  //   );
  // }
  try {
    const response = await api.get(`/relatorio/vendas-cliente/${idCliente}`, {
      params: { dataInicio: startDate, dataFim: endDate, limite: limit },
    });
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao buscar vendas para cliente ${idCliente}`);
  }
};

export const getTopSellingProducts = async (
  startDate: string,
  endDate: string,
  limit?: number,
): Promise<ProdutoMaisVendido[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_produtos')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de produtos mais vendidos.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/produtos-mais-vendidos', {
      params: { dataInicio: startDate, dataFim: endDate, limite: limit },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar produtos mais vendidos');
  }
};

export const getRevenueByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<FaturamentoPorPeriodo> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_vendas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de faturamento.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/faturamento-periodo', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar faturamento por período');
  }
};

export const getRevenueByCashRegister = async (
  startDate: string,
  endDate: string,
): Promise<QuantidadeFaturadaPorCaixa[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_caixas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de faturamento por caixa.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/faturamento-caixa', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar faturamento por caixa');
  }
};

export const getCurrentStock = async (
  startDate: string,
  endDate: string,
): Promise<DadosEstoque[]> => {
  // if (!hasPermission('listar_estoque_atual')) {
  //   throw new ApiError('Você não tem permissão para listar estoque atual.');
  // }
  try {
    const response = await api.get('/relatorio/estoque-atual', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar estoque atual');
  }
};

export const getStockEntriesByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<EntradaEstoqueComFuncionario[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_entrada_estoque')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de entradas de estoque.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/entradas-estoque', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar entradas de estoque por período');
  }
};

export const getTransfersByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<TransferenciaComFuncionario[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_transferencias')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de transferências.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/transferencias', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar transferências por período');
  }
};

export const getProductsBelowMinimum = async (
  startDate: string,
  endDate: string,
): Promise<ProdutoAbaixoMinimo[]> => {
  // if (!hasPermission('listar_produtos_abaixo_minimo')) {
  //   throw new ApiError('Você não tem permissão para listar produtos abaixo do mínimo.');
  // }
  try {
    const response = await api.get('/relatorio/produtos-abaixo-minimo', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar produtos abaixo do mínimo');
  }
};

export const getCashierActivity = async (
  startDate: string,
  endDate: string,
): Promise<FuncionarioCaixaComNome[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_funcionario_caixa')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de atividade de caixa.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/atividade-caixa', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar atividade de caixa');
  }
};

export const getTopSellingPeriodByProduct = async (
  idProduto: string,
  startDate: string,
  endDate: string,
): Promise<PeriodoMaisVendidoPorProduto> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_vendas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de período mais vendido.',
  //   );
  // }
  try {
    const response = await api.get(`/relatorio/periodo-mais-vendido/${idProduto}`, {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError(`Falha ao buscar período mais vendido para produto ${idProduto}`);
  }
};

export const getCashRegistersActivity = async (
  startDate: string,
  endDate: string,
  idProduto?: string,
): Promise<FuncionarioCaixaComNome[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_funcionario_caixa')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de atividades de caixas.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/atividades-caixas', {
      params: { dataInicio: startDate, dataFim: endDate, idProduto },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar atividades de caixas');
  }
};

export const getTasksReport = async (startDate: string, endDate: string): Promise<Tarefa[]> => {
  // if (!hasPermission('listar_tarefas')) {
  //   throw new ApiError('Você não tem permissão para listar tarefas.');
  // }
  try {
    const response = await api.get('/relatorio/tarefas', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de tarefas');
  }
};

export const getSalesReport = async (
  startDate: string,
  endDate: string,
  idProduto?: string,
): Promise<VendaComFuncionario[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_vendas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de vendas.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/relatorio-vendas', {
      params: { dataInicio: startDate, dataFim: endDate, idProduto },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de vendas');
  }
};

export const getStockReport = async (
  startDate: string,
  endDate: string,
  idProduto?: string,
): Promise<DadosEstoque[]> => {
  // if (!hasPermission('listar_estoque')) {
  //   throw new ApiError('Você não tem permissão para listar estoque.');
  // }
  try {
    const response = await api.get('/relatorio/relatorio-estoque', {
      params: { dataInicio: startDate, dataFim: endDate, idProduto },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de estoque');
  }
};

export const getStockEntriesReport = async (
  startDate: string,
  endDate: string,
  idProduto?: string,
): Promise<EntradaEstoqueComFuncionario[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_entrada_estoque')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de entradas de estoque.',
  //   );
  // }
  try {
    const response = await api.get('/relatorio/relatorio-entradas-estoque', {
      params: { dataInicio: startDate, dataFim: endDate, idProduto },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de entradas de estoque');
  }
};

export const getProductsReport = async (startDate: string, endDate: string): Promise<Produto[]> => {
  // if (!hasPermission('listar_produtos')) {
  //   throw new ApiError('Você não tem permissão para listar produtos.');
  // }
  try {
    const response = await api.get('/relatorio/relatorio-produtos', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de produtos');
  }
};

export const getProductLocationReport = async (
  startDate: string,
  endDate: string,
  idProduto?: string,
): Promise<ProdutoLocalizacao[]> => {
  // if (!hasPermission('listar_produto_localizacao')) {
  //   throw new ApiError('Você não tem permissão para listar localizações de produtos.');
  // }
  try {
    const response = await api.get('/relatorio/relatorio-produto-localizacao', {
      params: { dataInicio: startDate, dataFim: endDate, idProduto },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de localização de produtos');
  }
};

export const getDailyActivitiesReport = async (date: string): Promise<AtividadeDoDia[]> => {
  // if (!hasPermission('listar_funcionario_tarefa')) {
  //   throw new ApiError('Você não tem permissão para listar atividades do dia.');
  // }
  try {
    const response = await api.get('/relatorio/atividades-do-dia', {
      params: { data: date },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de atividades do dia');
  }
};

export const getCashRegistersReport = async (
  startDate?: string,
  endDate?: string,
  idCaixa?: string,
): Promise<Caixa[]> => {
  // if (!hasAnyRole(['Gerente', 'Admin']) || !hasPermission('listar_caixas')) {
  //   throw new ApiError(
  //     'Você não tem a função ou permissão necessária para acessar relatórios de caixas.',
  //   );
  // }
  try {
    const endpoint = idCaixa ? `/relatorio/caixas/${idCaixa}` : '/relatorio/caixas';
    const response = await api.get(endpoint, {
      params: { dataInicio: startDate, dataFim: endDate, idCaixa },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Falha ao buscar relatório de caixas');
  }
};
