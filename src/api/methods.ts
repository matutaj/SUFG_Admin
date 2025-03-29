import api from './index';
import {
  Cliente,
  Funcionario,
  CategoriaProduto,
  Produto,
  Fornecedor,
  EntradaEstoque,
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
  EstoqueAtual,
  EntradaEstoqueComFuncionario,
  TransferenciaComFuncionario,
  ProdutoAbaixoMinimo,
  FuncionarioCaixaComNome,
  PeriodoMaisVendidoPorProduto,
} from '../types/models';

// Stock Entry
export const getStockEntries = async (): Promise<EntradaEstoque[]> => {
  const response = await api.get(`/entradaEstoque`);
  return response.data;
};

export const createStockEntry = async (data: EntradaEstoque): Promise<EntradaEstoque> => {
  const response = await api.post(`/entradaEstoque`, data);
  return response.data;
};

export const updateStockEntry = async (
  id: string,
  data: EntradaEstoque,
): Promise<EntradaEstoque> => {
  const response = await api.put(`/entradaEstoque/${id}`, data);
  return response.data;
};

export const deleteStockEntry = async (id: string): Promise<void> => {
  const response = await api.delete(`/entradaEstoque/${id}`);
  return response.data;
};

// Function Permissions (Role Permissions)
export const getFunctionPermissions = async (): Promise<FuncaoPermissao[]> => {
  const response = await api.get(`/funcaoPermissao`);
  return response.data;
};

export const createFunctionPermission = async (data: FuncaoPermissao): Promise<FuncaoPermissao> => {
  const response = await api.post(`/funcaoPermissao`, data);
  return response.data;
};

export const updateFunctionPermission = async (
  id: string,
  data: FuncaoPermissao,
): Promise<FuncaoPermissao> => {
  const response = await api.put(`/funcaoPermissao/${id}`, data);
  return response.data;
};

export const deleteFunctionPermission = async (id: string): Promise<void> => {
  const response = await api.delete(`/funcaoPermissao/${id}`);
  return response.data;
};

// Employee Functions (Employee Roles)
export const getEmployeeFunctions = async (): Promise<FuncionarioFuncao[]> => {
  const response = await api.get(`/funcionarioFuncao`);
  return response.data;
};

export const createEmployeeFunction = async (
  data: FuncionarioFuncao,
): Promise<FuncionarioFuncao> => {
  const response = await api.post(`/funcionarioFuncao`, data);
  return response.data;
};

export const updateEmployeeFunction = async (
  id: string,
  data: FuncionarioFuncao,
): Promise<FuncionarioFuncao> => {
  const response = await api.put(`/funcionarioFuncao/${id}`, data);
  return response.data;
};

export const deleteEmployeeFunction = async (id: string): Promise<void> => {
  const response = await api.delete(`/funcionarioFuncao/${id}`);
  return response.data;
};

// Employee Permissions
export const getEmployeePermissions = async (): Promise<FuncionarioPermissao[]> => {
  const response = await api.get(`/funcionarioPermissao`);
  return response.data;
};

export const createEmployeePermission = async (
  data: FuncionarioPermissao,
): Promise<FuncionarioPermissao> => {
  const response = await api.post(`/funcionarioPermissao`, data);
  return response.data;
};

export const updateEmployeePermission = async (
  id: string,
  data: FuncionarioPermissao,
): Promise<FuncionarioPermissao> => {
  const response = await api.put(`/funcionarioPermissao/${id}`, data);
  return response.data;
};

export const deleteEmployeePermission = async (id: string): Promise<void> => {
  const response = await api.delete(`/funcionarioPermissao/${id}`);
  return response.data;
};

// Products
export const getProducts = async (): Promise<Produto[]> => {
  const response = await api.get(`/produto`);
  return response.data;
};

export const createProduct = async (data: Produto): Promise<Produto> => {
  const response = await api.post(`/produto`, data);
  return response.data;
};

export const updateProduct = async (id: string, data: Produto): Promise<Produto> => {
  const response = await api.put(`/produto/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await api.delete(`/produto/${id}`);
  return response.data;
};

// Functions (Roles)
export const getFunctions = async (): Promise<Funcao[]> => {
  const response = await api.get(`/funcao`);
  return response.data;
};

export const createFunction = async (data: Funcao): Promise<Funcao> => {
  const response = await api.post(`/funcao`, data);
  return response.data;
};

export const updateFunction = async (id: string, data: Funcao): Promise<Funcao> => {
  const response = await api.put(`/funcao/${id}`, data);
  return response.data;
};

export const deleteFunction = async (id: string): Promise<void> => {
  const response = await api.delete(`/funcao/${id}`);
  return response.data;
};

// Transfers
export const getTransfers = async (): Promise<Transferencia[]> => {
  const response = await api.get(`/transferencia`);
  return response.data;
};

export const createTransfer = async (data: Transferencia): Promise<Transferencia> => {
  const response = await api.post(`/transferencia`, data);
  return response.data;
};

export const updateTransfer = async (id: string, data: Transferencia): Promise<Transferencia> => {
  const response = await api.put(`/transferencia/${id}`, data);
  return response.data;
};

export const deleteTransfer = async (id: string): Promise<void> => {
  const response = await api.delete(`/transferencia/${id}`);
  return response.data;
};

// Sales
export const getSales = async (): Promise<Venda[]> => {
  const response = await api.get(`/venda`);
  return response.data;
};

export const createSale = async (data: Venda): Promise<Venda> => {
  const response = await api.post(`/venda`, data);
  return response.data;
};

export const updateSale = async (id: string, data: Venda): Promise<Venda> => {
  const response = await api.put(`/venda/${id}`, data);
  return response.data;
};

export const deleteSale = async (id: string): Promise<void> => {
  const response = await api.delete(`/venda/${id}`);
  return response.data;
};

// Clients
export const getClients = async (): Promise<Cliente[]> => {
  const response = await api.get(`/cliente`);
  return response.data;
};

export const createClient = async (data: Cliente): Promise<Cliente> => {
  const response = await api.post(`/cliente`, data);
  return response.data;
};

export const updateClient = async (id: string, data: Cliente): Promise<Cliente> => {
  const response = await api.put(`/cliente/${id}`, data);
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  const response = await api.delete(`/cliente/${id}`);
  return response.data;
};

// Corridors
export const getCorridors = async (): Promise<Corredor[]> => {
  const response = await api.get(`/corredores`);
  return response.data;
};
// Relatórios
export const getSalesByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<VendaComFuncionario[]> => {
  const response = await api.get('/relatorio/vendas-periodo', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getSalesByClient = async (
  idCliente: string,
  startDate: string,
  endDate: string,
): Promise<VendaComFuncionario[]> => {
  const response = await api.get(`/relatorio/vendas-cliente/${idCliente}`, {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getTopSellingProducts = async (
  startDate: string,
  endDate: string,
): Promise<ProdutoMaisVendido[]> => {
  const response = await api.get('/relatorio/produtos-mais-vendidos', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getRevenueByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<FaturamentoPorPeriodo> => {
  const response = await api.get('/relatorio/faturamento-periodo', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getRevenueByCashRegister = async (
  startDate: string,
  endDate: string,
): Promise<QuantidadeFaturadaPorCaixa[]> => {
  const response = await api.get('/relatorio/faturamento-caixa', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getCurrentStock = async (): Promise<EstoqueAtual[]> => {
  const response = await api.get('/relatorio/estoque-atual');
  return response.data;
};

export const getStockEntriesByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<EntradaEstoqueComFuncionario[]> => {
  const response = await api.get('/relatorio/entradas-estoque', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getTransfersByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<TransferenciaComFuncionario[]> => {
  const response = await api.get('/relatorio/transferencias', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getProductsBelowMinimum = async (): Promise<ProdutoAbaixoMinimo[]> => {
  const response = await api.get('/relatorio/produtos-abaixo-minimo');
  return response.data;
};

export const getCashierActivity = async (
  startDate: string,
  endDate: string,
): Promise<FuncionarioCaixaComNome[]> => {
  const response = await api.get('/relatorio/atividade-caixa', {
    params: { dataInicio: startDate, dataFim: endDate },
  });
  return response.data;
};

export const getTopSellingPeriodByProduct = async (
  idProduto: string,
): Promise<PeriodoMaisVendidoPorProduto> => {
  const response = await api.get(`/relatorio/periodo-mais-vendido/${idProduto}`);
  return response.data;
};
export const createCorridor = async (data: Corredor): Promise<Corredor> => {
  const response = await api.post(`/corredores`, data);
  return response.data;
};

export const updateCorridor = async (id: string, data: Corredor): Promise<Corredor> => {
  const response = await api.put(`/corredores/${id}`, data);
  return response.data;
};

export const deleteCorridor = async (id: string): Promise<void> => {
  const response = await api.delete(`/corredores/${id}`);
  return response.data;
};

// Product Categories
export const getProductCategories = async (): Promise<CategoriaProduto[]> => {
  const response = await api.get(`/categoriaProduto`);
  return response.data;
};

export const createProductCategory = async (data: CategoriaProduto): Promise<CategoriaProduto> => {
  const response = await api.post(`/categoriaProduto`, data);
  return response.data;
};

export const updateProductCategory = async (
  id: string,
  data: CategoriaProduto,
): Promise<CategoriaProduto> => {
  const response = await api.put(`/categoriaProduto/${id}`, data);
  return response.data;
};

export const deleteProductCategory = async (id: string): Promise<void> => {
  const response = await api.delete(`/categoriaProduto/${id}`);
  return response.data;
};

// Suppliers
export const getSuppliers = async (): Promise<Fornecedor[]> => {
  const response = await api.get(`/fornecedores`);
  return response.data;
};

export const createSupplier = async (data: Fornecedor): Promise<Fornecedor> => {
  const response = await api.post(`/fornecedores`, data);
  return response.data;
};

export const updateSupplier = async (id: string, data: Fornecedor): Promise<Fornecedor> => {
  const response = await api.put(`/fornecedores/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const response = await api.delete(`/fornecedores/${id}`);
  return response.data;
};

// Shelves
export const getShelves = async (): Promise<Prateleira[]> => {
  const response = await api.get(`/prateleira`);
  return response.data;
};

export const createShelf = async (data: Prateleira): Promise<Prateleira> => {
  const response = await api.post(`/prateleira`, data);
  return response.data;
};

export const updateShelf = async (id: string, data: Prateleira): Promise<Prateleira> => {
  const response = await api.put(`/prateleira/${id}`, data);
  return response.data;
};

export const deleteShelf = async (id: string): Promise<void> => {
  const response = await api.delete(`/prateleira/${id}`);
  return response.data;
};

// Sections
export const getSections = async (): Promise<Seccao[]> => {
  const response = await api.get(`/seccao`);
  return response.data;
};

export const createSection = async (data: Seccao): Promise<Seccao> => {
  const response = await api.post(`/seccao`, data);
  return response.data;
};

export const updateSection = async (id: string, data: Seccao): Promise<Seccao> => {
  const response = await api.put(`/seccao/${id}`, data);
  return response.data;
};

export const deleteSection = async (id: string): Promise<void> => {
  const response = await api.delete(`/seccao/${id}`);
  return response.data;
};

// Cash Registers
export const getCashRegisters = async (): Promise<Caixa[]> => {
  const response = await api.get(`/caixa`);
  return response.data;
};

export const createCashRegister = async (data: Caixa): Promise<Caixa> => {
  const response = await api.post(`/caixa`, data);
  return response.data;
};

export const updateCashRegister = async (id: string, data: Caixa): Promise<Caixa> => {
  const response = await api.put(`/caixa/${id}`, data);
  return response.data;
};

export const deleteCashRegister = async (id: string): Promise<void> => {
  const response = await api.delete(`/caixa/${id}`);
  return response.data;
};

// Employees
export const getEmployees = async (): Promise<Funcionario[]> => {
  const response = await api.get(`/funcionario`);
  return response.data;
};

export const createEmployee = async (data: Funcionario): Promise<Funcionario> => {
  const response = await api.post(`/funcionario`, data);
  return response.data;
};

export const updateEmployee = async (id: string, data: Funcionario): Promise<Funcionario> => {
  const response = await api.put(`/funcionario/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const response = await api.delete(`/funcionario/${id}`);
  return response.data;
};

// Employee-Cash Register Relations
export const getEmployeeCashRegisters = async (): Promise<FuncionarioCaixa[]> => {
  const response = await api.get(`/funcionarioCaixa`);
  return response.data;
};

export const createEmployeeCashRegister = async (
  data: FuncionarioCaixa,
): Promise<FuncionarioCaixa> => {
  const response = await api.post(`/funcionarioCaixa`, data);
  return response.data;
};

export const updateEmployeeCashRegister = async (
  id: string,
  data: FuncionarioCaixa,
): Promise<FuncionarioCaixa> => {
  const response = await api.put(`/funcionarioCaixa/${id}`, data);
  return response.data;
};

export const deleteEmployeeCashRegister = async (id: string): Promise<void> => {
  const response = await api.delete(`/funcionarioCaixa/${id}`);
  return response.data;
};

// Locations
export const getLocations = async (): Promise<Localizacao[]> => {
  const response = await api.get(`/localizacao`);
  return response.data;
};

export const createLocation = async (data: Localizacao): Promise<Localizacao> => {
  const response = await api.post(`/localizacao`, data);
  return response.data;
};

export const updateLocation = async (id: string, data: Localizacao): Promise<Localizacao> => {
  const response = await api.put(`/localizacao/${id}`, data);
  return response.data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  const response = await api.delete(`/localizacao/${id}`);
  return response.data;
};

// Permissions
export const getPermissions = async (): Promise<Permissao[]> => {
  const response = await api.get(`/permissao`);
  return response.data;
};

export const createPermission = async (data: Permissao): Promise<Permissao> => {
  const response = await api.post(`/permissao`, data);
  return response.data;
};

export const updatePermission = async (id: string, data: Permissao): Promise<Permissao> => {
  const response = await api.put(`/permissao/${id}`, data);
  return response.data;
};

export const deletePermission = async (id: string): Promise<void> => {
  const response = await api.delete(`/permissao/${id}`);
  return response.data;
};

// Product Locations
export const getProductLocations = async (): Promise<ProdutoLocalizacao[]> => {
  const response = await api.get(`/produtoLocalizacao`);
  return response.data;
};

export const createProductLocation = async (
  data: ProdutoLocalizacao,
): Promise<ProdutoLocalizacao> => {
  const response = await api.post(`/produtoLocalizacao`, data);
  return response.data;
};

export const updateProductLocation = async (
  id: string,
  data: ProdutoLocalizacao,
): Promise<ProdutoLocalizacao> => {
  const response = await api.put(`/produtoLocalizacao/${id}`, data);
  return response.data;
};

export const deleteProductLocation = async (id: string): Promise<void> => {
  const response = await api.delete(`/produtoLocalizacao/${id}`);
  return response.data;
};

// Sale Products
export const getSaleProducts = async (): Promise<VendaProduto[]> => {
  const response = await api.get(`/vendaProduto`);
  return response.data;
};

export const createSaleProduct = async (data: VendaProduto): Promise<VendaProduto> => {
  const response = await api.post(`/vendaProduto`, data);
  return response.data;
};

export const updateSaleProduct = async (id: string, data: VendaProduto): Promise<VendaProduto> => {
  const response = await api.put(`/vendaProduto/${id}`, data);
  return response.data;
};

export const deleteSaleProduct = async (id: string): Promise<void> => {
  const response = await api.delete(`/vendaProduto/${id}`);
  return response.data;
};

// Alerts
export const getAlerts = async (): Promise<Alerta[]> => {
  const response = await api.get(`/alertas`);
  return response.data;
};

export const createAlert = async (data: Alerta): Promise<Alerta> => {
  const response = await api.post(`/alertas`, data);
  return response.data;
};

export const updateAlert = async (id: string, data: Alerta): Promise<Alerta> => {
  const response = await api.put(`/alertas/${id}`, data);
  return response.data;
};

export const deleteAlert = async (id: string): Promise<void> => {
  const response = await api.delete(`/alertas/${id}`);
  return response.data;
};
