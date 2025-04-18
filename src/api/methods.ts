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

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getAllStockEntries = async (): Promise<DadosEntradaEstoque[]> => {
  try {
    const response = await api.get('/entradaEstoque');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch stock entries');
  }
};

export const createStockEntry = async (data: DadosEntradaEstoque): Promise<DadosEntradaEstoque> => {
  try {
    const response = await api.post('/entradaEstoque', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create stock entry');
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
    throw new ApiError(`Failed to update stock entry with lote ${id}`);
  }
};

export const deleteStockEntry = async (lote: string): Promise<void> => {
  try {
    await api.delete(`/entradaEstoque/${lote}`);
  } catch (error) {
    throw new ApiError(`Failed to delete stock entry with lote ${lote}`);
  }
};

export const getAllStock = async (): Promise<DadosEstoque[]> => {
  try {
    const response = await api.get('/estoque');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch stock records');
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
    throw new ApiError('Failed to create stock record');
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
    throw new ApiError(`Failed to update stock record with lote ${lote}`);
  }
};

export const deleteStock = async (lote: string): Promise<void> => {
  try {
    await api.delete(`/estoque/${lote}`);
  } catch (error) {
    throw new ApiError(`Failed to delete stock record with lote ${lote}`);
  }
};

export const getStockByProduct = async (referenciaProduto: string): Promise<DadosEstoque> => {
  try {
    const response = await api.get(`/estoque/produto/${referenciaProduto}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to fetch stock for product ${referenciaProduto}`);
  }
};

export const getAllProducts = async (): Promise<Produto[]> => {
  try {
    const response = await api.get('/produto');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch products');
  }
};

export const createProduct = async (data: Produto): Promise<Produto> => {
  try {
    const response = await api.post('/produto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create product');
  }
};

export const updateProduct = async (id: string, data: Partial<Produto>): Promise<Produto> => {
  try {
    const response = await api.put(`/produto/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update product with referencia ${id}`);
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/produto/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete product with referencia ${id}`);
  }
};

export const getAllSuppliers = async (): Promise<Fornecedor[]> => {
  try {
    const response = await api.get('/fornecedor');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch suppliers');
  }
};

export const createSupplier = async (data: Fornecedor): Promise<Fornecedor> => {
  try {
    const response = await api.post('/fornecedor', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create supplier');
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
    throw new ApiError(`Failed to update supplier with NIF ${nif}`);
  }
};

export const deleteSupplier = async (nif: string): Promise<void> => {
  try {
    await api.delete(`/fornecedor/${nif}`);
  } catch (error) {
    throw new ApiError(`Failed to delete supplier with NIF ${nif}`);
  }
};

export const getAllEmployees = async (): Promise<Funcionario[]> => {
  try {
    const response = await api.get('/funcionario');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch employees');
  }
};

export const createEmployee = async (data: Funcionario): Promise<Funcionario> => {
  try {
    const response = await api.post('/funcionario', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create employee');
  }
};

export const updateEmployee = async (
  numeroBI: string,
  data: Partial<Funcionario>,
): Promise<Funcionario> => {
  try {
    const response = await api.put(`/funcionario/${numeroBI}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update employee with BI ${numeroBI}`);
  }
};

export const deleteEmployee = async (numeroBI: string): Promise<void> => {
  try {
    const response = await api.delete(`/funcionario/${numeroBI}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to delete employee with BI ${numeroBI}`);
  }
};

export const getAllFunctionPermissions = async (): Promise<FuncaoPermissao[]> => {
  try {
    const response = await api.get('/funcaoPermissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch function permissions');
  }
};

export const createFunctionPermission = async (data: FuncaoPermissao): Promise<FuncaoPermissao> => {
  try {
    const response = await api.post('/funcaoPermissao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create function permission');
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
    throw new ApiError(`Failed to update function permission with id ${id}`);
  }
};

export const deleteFunctionPermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcaoPermissao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete function permission with id ${id}`);
  }
};

export const getAllEmployeeFunctions = async (): Promise<FuncionarioFuncao[]> => {
  try {
    const response = await api.get('/funcionarioFuncao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch employee functions');
  }
};

export const createEmployeeFunction = async (
  data: FuncionarioFuncao,
): Promise<FuncionarioFuncao> => {
  try {
    const response = await api.post('/funcionarioFuncao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create employee function');
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
    throw new ApiError(`Failed to update employee function with id ${id}`);
  }
};

export const deleteEmployeeFunction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioFuncao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete employee function with id ${id}`);
  }
};

export const getAllEmployeePermissions = async (): Promise<FuncionarioPermissao[]> => {
  try {
    const response = await api.get('/funcionarioPermissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch employee permissions');
  }
};

export const createEmployeePermission = async (
  data: FuncionarioPermissao,
): Promise<FuncionarioPermissao> => {
  try {
    const response = await api.post('/funcionarioPermissao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create employee permission');
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
    throw new ApiError(`Failed to update employee permission with id ${id}`);
  }
};

export const deleteEmployeePermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioPermissao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete employee permission with id ${id}`);
  }
};

export const getAllFunctions = async (): Promise<Funcao[]> => {
  try {
    const response = await api.get('/funcao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch functions');
  }
};

export const createFunction = async (data: Funcao): Promise<Funcao> => {
  try {
    const response = await api.post('/funcao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create function');
  }
};

export const updateFunction = async (id: string, data: Partial<Funcao>): Promise<Funcao> => {
  try {
    const response = await api.put(`/funcao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update function with id ${id}`);
  }
};

export const deleteFunction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete function with id ${id}`);
  }
};

export const getAllTransfers = async (): Promise<Transferencia[]> => {
  try {
    const response = await api.get('/transferencia');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch transfers');
  }
};

export const createTransfer = async (data: Transferencia): Promise<Transferencia> => {
  try {
    const response = await api.post('/transferencia', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create transfer');
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
    throw new ApiError(`Failed to update transfer with id ${id}`);
  }
};

export const deleteTransfer = async (id: string): Promise<void> => {
  try {
    await api.delete(`/transferencia/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete transfer with id ${id}`);
  }
};

export const getAllSales = async (): Promise<Venda[]> => {
  try {
    const response = await api.get('/venda');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch sales');
  }
};

export const createSale = async (data: DadosWrapper): Promise<Venda> => {
  try {
    const response = await api.post('/venda', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create sale');
  }
};

export const updateSale = async (id: string, data: Partial<Venda>): Promise<Venda> => {
  try {
    const response = await api.put(`/venda/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update sale with id ${id}`);
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    await api.delete(`/venda/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete sale with id ${id}`);
  }
};

export const getAllClients = async (): Promise<Cliente[]> => {
  try {
    const response = await api.get('/cliente');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch clients');
  }
};

export const createClient = async (data: Cliente): Promise<Cliente> => {
  try {
    const response = await api.post('/cliente', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create client');
  }
};

export const updateClient = async (id: string, data: Partial<Cliente>): Promise<Cliente> => {
  try {
    const response = await api.put(`/cliente/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update client with id ${id}`);
  }
};

export const deleteClient = async (id: string): Promise<void> => {
  try {
    await api.delete(`/cliente/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete client with id ${id}`);
  }
};

export const getAllCorridors = async (): Promise<Corredor[]> => {
  try {
    const response = await api.get('/corredor');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch corridors');
  }
};

export const createCorridor = async (data: Corredor): Promise<Corredor> => {
  try {
    const response = await api.post('/corredor', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create corridor');
  }
};

export const updateCorridor = async (id: string, data: Partial<Corredor>): Promise<Corredor> => {
  try {
    const response = await api.put(`/corredor/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update corridor with id ${id}`);
  }
};

export const deleteCorridor = async (id: string): Promise<void> => {
  try {
    await api.delete(`/corredor/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete corridor with id ${id}`);
  }
};

export const getAllProductCategories = async (): Promise<CategoriaProduto[]> => {
  try {
    const response = await api.get('/categoriaProduto');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch product categories');
  }
};

export const createProductCategory = async (data: CategoriaProduto): Promise<CategoriaProduto> => {
  try {
    const response = await api.post('/categoriaProduto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create product category');
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
    throw new ApiError(`Failed to update product category with id ${id}`);
  }
};

export const deleteProductCategory = async (id: string): Promise<void> => {
  try {
    await api.delete(`/categoriaProduto/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete product category with id ${id}`);
  }
};

export const getAllShelves = async (): Promise<Prateleira[]> => {
  try {
    const response = await api.get('/prateleira');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch shelves');
  }
};

export const createShelf = async (data: Prateleira): Promise<Prateleira> => {
  try {
    const response = await api.post('/prateleira', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create shelf');
  }
};

export const updateShelf = async (id: string, data: Partial<Prateleira>): Promise<Prateleira> => {
  try {
    const response = await api.put(`/prateleira/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update shelf with id ${id}`);
  }
};

export const deleteShelf = async (id: string): Promise<void> => {
  try {
    await api.delete(`/prateleira/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete shelf with id ${id}`);
  }
};

export const getAllSections = async (): Promise<Seccao[]> => {
  try {
    const response = await api.get('/seccao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch sections');
  }
};

export const createSection = async (data: Seccao): Promise<Seccao> => {
  try {
    const response = await api.post('/seccao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create section');
  }
};

export const updateSection = async (id: string, data: Partial<Seccao>): Promise<Seccao> => {
  try {
    const response = await api.put(`/seccao/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update section with id ${id}`);
  }
};

export const deleteSection = async (id: string): Promise<void> => {
  try {
    await api.delete(`/seccao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete section with id ${id}`);
  }
};

export const getAllCashRegisters = async (): Promise<Caixa[]> => {
  try {
    const response = await api.get('/caixa');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch cash registers');
  }
};

export const createCashRegister = async (data: Caixa): Promise<Caixa> => {
  try {
    const response = await api.post('/caixa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create cash register');
  }
};

export const updateCashRegister = async (id: string, data: Partial<Caixa>): Promise<Caixa> => {
  try {
    const response = await api.put(`/caixa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update cash register with id ${id}`);
  }
};

export const deleteCashRegister = async (id: string): Promise<void> => {
  try {
    await api.delete(`/caixa/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete cash register with id ${id}`);
  }
};

export const getAllEmployeeCashRegisters = async (): Promise<FuncionarioCaixa[]> => {
  try {
    const response = await api.get('/funcionarioCaixa');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch employee-cash register relations');
  }
};

export const createEmployeeCashRegister = async (
  data: FuncionarioCaixa,
): Promise<FuncionarioCaixa> => {
  try {
    const response = await api.post('/funcionarioCaixa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create employee-cash register relation');
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
    throw new ApiError(`Failed to update employee-cash register relation with id ${id}`);
  }
};

export const deleteEmployeeCashRegister = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioCaixa/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete employee-cash register relation with id ${id}`);
  }
};

export const getAllLocations = async (): Promise<Localizacao[]> => {
  try {
    const response = await api.get('/localizacao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch locations');
  }
};

export const createLocation = async (data: Localizacao): Promise<Localizacao> => {
  try {
    const response = await api.post('/localizacao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create location');
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
    throw new ApiError(`Failed to update location with id ${id}`);
  }
};

export const deleteLocation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/localizacao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete location with id ${id}`);
  }
};

export const getAllPermissions = async (): Promise<Permissao[]> => {
  try {
    const response = await api.get('/permissao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch permissions');
  }
};

export const createPermission = async (data: Permissao): Promise<Permissao> => {
  try {
    const response = await api.post('/permissao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create permission');
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
    throw new ApiError(`Failed to update permission with id ${id}`);
  }
};

export const deletePermission = async (id: string): Promise<void> => {
  try {
    await api.delete(`/permissao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete permission with id ${id}`);
  }
};

export const getAllProductLocations = async (): Promise<ProdutoLocalizacao[]> => {
  try {
    const response = await api.get('/produtoLocalizacao');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch product locations');
  }
};

export const createProductLocation = async (
  data: ProdutoLocalizacao,
): Promise<ProdutoLocalizacao> => {
  try {
    const response = await api.post('/produtoLocalizacao', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create product location');
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
    throw new ApiError(`Failed to update product location with id ${id}`);
  }
};

export const deleteProductLocation = async (id: string): Promise<void> => {
  try {
    await api.delete(`/produtoLocalizacao/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete product location with id ${id}`);
  }
};

export const getAllSaleProducts = async (): Promise<VendaProduto[]> => {
  try {
    const response = await api.get('/vendaProduto');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch sale products');
  }
};

export const createSaleProduct = async (data: VendaProduto): Promise<VendaProduto> => {
  try {
    const response = await api.post('/vendaProduto', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create sale product');
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
    throw new ApiError(`Failed to update sale product with id ${id}`);
  }
};

export const deleteSaleProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/vendaProduto/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete sale product with id ${id}`);
  }
};

export const getAllAlerts = async (): Promise<Alerta[]> => {
  try {
    const response = await api.get('/alertas');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch alerts');
  }
};

export const createAlert = async (data: Alerta): Promise<Alerta> => {
  try {
    const response = await api.post('/alertas', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create alert');
  }
};

export const updateAlert = async (id: string, data: Partial<Alerta>): Promise<Alerta> => {
  try {
    const response = await api.put(`/alertas/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update alert with id ${id}`);
  }
};

export const deleteAlert = async (id: string): Promise<void> => {
  try {
    await api.delete(`/alertas/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete alert with id ${id}`);
  }
};

export const getAllTasks = async (): Promise<Tarefa[]> => {
  try {
    const response = await api.get('/tarefa');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch tasks');
  }
};

export const createTask = async (data: Tarefa): Promise<Tarefa> => {
  try {
    const response = await api.post('/tarefa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create task');
  }
};

export const updateTask = async (id: string, data: Partial<Tarefa>): Promise<Tarefa> => {
  try {
    const response = await api.put(`/tarefa/${id}`, data);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to update task with id ${id}`);
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  try {
    await api.delete(`/tarefa/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete task with id ${id}`);
  }
};

export const getAllDailyActivities = async (): Promise<AtividadeDoDia[]> => {
  try {
    const response = await api.get('/funcionarioTarefa');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch daily activities');
  }
};

export const createDailyActivity = async (data: AtividadeDoDia): Promise<AtividadeDoDia> => {
  try {
    const response = await api.post('/funcionarioTarefa', data);
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to create daily activity');
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
    throw new ApiError(`Failed to update daily activity with id ${id}`);
  }
};

export const deleteDailyActivity = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarioTarefa/${id}`);
  } catch (error) {
    throw new ApiError(`Failed to delete daily activity with id ${id}`);
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
    throw new ApiError(`Failed to assign task ${tarefaId}`);
  }
};

export const getTaskAssignments = async (
  tarefaId: string,
): Promise<{ funcionarios: Funcionario[]; funcoes: Funcao[] }> => {
  try {
    const response = await api.get(`/funcionarioTarefa/${tarefaId}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to fetch assignments for task ${tarefaId}`);
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
    throw new ApiError(`Failed to remove assignment for task ${tarefaId}`);
  }
};

export const getSalesByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<VendaComFuncionario[]> => {
  try {
    const response = await api.get('/relatorio/vendas-periodo', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch sales by period');
  }
};

export const getSalesByClient = async (
  idCliente: string,
  startDate: string,
  endDate: string,
): Promise<VendaComFuncionario[]> => {
  try {
    const response = await api.get(`/relatorio/vendas-cliente/${idCliente}`, {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to fetch sales for client ${idCliente}`);
  }
};

export const getTopSellingProducts = async (
  startDate: string,
  endDate: string,
): Promise<ProdutoMaisVendido[]> => {
  try {
    const response = await api.get('/relatorio/produtos-mais-vendidos', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch top-selling products');
  }
};

export const getRevenueByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<FaturamentoPorPeriodo> => {
  try {
    const response = await api.get('/relatorio/faturamento-periodo', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch revenue by period');
  }
};

export const getRevenueByCashRegister = async (
  startDate: string,
  endDate: string,
): Promise<QuantidadeFaturadaPorCaixa[]> => {
  try {
    const response = await api.get('/relatorio/faturamento-caixa', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch revenue by cash register');
  }
};

export const getCurrentStock = async (): Promise<DadosEstoque[]> => {
  try {
    const response = await api.get('/relatorio/estoque-atual');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch current stock');
  }
};

export const getStockEntriesByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<EntradaEstoqueComFuncionario[]> => {
  try {
    const response = await api.get('/relatorio/entradas-estoque', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch stock entries by period');
  }
};

export const getTransfersByPeriod = async (
  startDate: string,
  endDate: string,
): Promise<TransferenciaComFuncionario[]> => {
  try {
    const response = await api.get('/relatorio/transferencias', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch transfers by period');
  }
};

export const getProductsBelowMinimum = async (): Promise<ProdutoAbaixoMinimo[]> => {
  try {
    const response = await api.get('/relatorio/produtos-abaixo-minimo');
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch products below minimum stock');
  }
};

export const getCashierActivity = async (
  startDate: string,
  endDate: string,
): Promise<FuncionarioCaixaComNome[]> => {
  try {
    const response = await api.get('/relatorio/atividade-caixa', {
      params: { dataInicio: startDate, dataFim: endDate },
    });
    return response.data;
  } catch (error) {
    throw new ApiError('Failed to fetch cashier activity');
  }
};

export const getTopSellingPeriodByProduct = async (
  referenciaProduto: string,
): Promise<PeriodoMaisVendidoPorProduto> => {
  try {
    const response = await api.get(`/relatorio/periodo-mais-vendido/${referenciaProduto}`);
    return response.data;
  } catch (error) {
    throw new ApiError(`Failed to fetch top-selling period for product ${referenciaProduto}`);
  }
};
