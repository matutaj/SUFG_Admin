import {
  Collapse,
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Modal,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React from 'react';
import { EntradaEstoque, Produto, Fornecedor, Funcionario, Estoque } from 'types/models';
import {
  getStockEntries,
  createStockEntry,
  updateStockEntry,
  getProducts,
  getSuppliers,
  getEmployees,
  getStock,
  createStock,
  updateStock,
  deleteStock,
} from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 650 },
  maxHeight: '60%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  p: 4,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#6c63ff #f1f1f1',
};

const Stock: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [manageEntryModal, setManageEntryModal] = React.useState(false);
  const [editStockModal, setEditStockModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editStockId, setEditStockId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<EntradaEstoque>>({
    id_fornecedor: '',
    id_produto: '',
    id_funcionario: '',
    quantidadeRecebida: 0,
    adicionado: false,
    dataEntrada: new Date().toISOString().split('T')[0],
    custoUnitario: 0,
    lote: '',
    dataValidadeLote: '',
  });
  const [stockForm, setStockForm] = React.useState<Partial<Estoque>>({
    id_produto: '',
    quantidadeAtual: 0,
    lote: '',
    dataValidadeLote: new Date(),
  });
  const [stockEntries, setStockEntries] = React.useState<EntradaEstoque[]>([]);
  const [currentStock, setCurrentStock] = React.useState<Estoque[]>([]);
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [suppliers, setSuppliers] = React.useState<Fornecedor[]>([]);
  const [employees, setEmployees] = React.useState<Funcionario[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [filterStartDate, setFilterStartDate] = React.useState<string>('');
  const [filterEndDate, setFilterEndDate] = React.useState<string>('');

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entries, stock, productsData, suppliersData, employeesData] = await Promise.all([
        getStockEntries(),
        getStock(),
        getProducts(),
        getSuppliers(),
        getEmployees(),
      ]);

      const normalizedEntries = entries.map((entry) => ({
        ...entry,
        adicionado:
          entry.adicionado === undefined || entry.adicionado === null ? false : entry.adicionado,
      }));

      const transformedStock: Estoque[] = stock.map((item) => ({
        id: item.id,
        id_produto: item.id_produto,
        quantidadeAtual: Number(item.quantidadeAtual) || 0, // Converte para number
        lote: item.lote || '',
        dataValidadeLote: new Date(item.dataValidadeLote),
      }));

      setStockEntries(normalizedEntries);
      setCurrentStock(transformedStock); // Corrigido de setCurrentStock para setCurrentState
      setProducts(productsData);
      setSuppliers(suppliersData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro geral ao buscar dados:', error);
      setFetchError('Erro ao carregar os dados. Verifique o console para mais detalhes.');
    }
  };

  const handleOpen = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      id_fornecedor: '',
      id_produto: '',
      id_funcionario: '',
      quantidadeRecebida: 0,
      adicionado: false,
      dataEntrada: new Date().toISOString().split('T')[0],
      custoUnitario: 0,
      lote: '',
      dataValidadeLote: '',
    });
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);
  const handleManageEntryClose = () => {
    setManageEntryModal(false);
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleEditStockClose = () => {
    setEditStockModal(false);
    setEditStockId(null);
    setStockForm({
      id_produto: '',
      quantidadeAtual: 0,
      lote: '',
      dataValidadeLote: new Date(),
    });
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'custoUnitario' || name === 'quantidadeRecebida'
          ? value === ''
            ? '0'
            : value
          : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleStockTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({
      ...prev,
      [name]:
        name === 'quantidadeAtual'
          ? value === ''
            ? '0'
            : value
          : name === 'dataValidadeLote'
            ? value
            : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFilterStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterStartDate(e.target.value);
  };

  const handleFilterEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterEndDate(e.target.value);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.id_produto?.trim()) newErrors.id_produto = 'Produto é obrigatório';
    if (!form.id_fornecedor?.trim()) newErrors.id_fornecedor = 'Fornecedor é obrigatório';
    if (!form.id_funcionario?.trim()) newErrors.id_funcionario = 'Funcionário é obrigatório';
    if (!form.quantidadeRecebida || Number(form.quantidadeRecebida) <= 0)
      newErrors.quantidadeRecebida = 'Quantidade deve ser maior que 0';
    if (!form.dataEntrada || isNaN(new Date(form.dataEntrada).getTime()))
      newErrors.dataEntrada = 'Data de entrada é inválida';
    if (form.custoUnitario === undefined || form.custoUnitario < 0)
      newErrors.custoUnitario = 'Custo unitário não pode ser negativo';
    if (!form.dataValidadeLote || new Date(form.dataValidadeLote) <= new Date())
      newErrors.dataValidadeLote = 'A data de validade do lote deve ser futura';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStockForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!stockForm.id_produto?.trim()) newErrors.id_produto = 'Produto é obrigatório';
    if (!stockForm.quantidadeAtual || Number(stockForm.quantidadeAtual) < 0)
      newErrors.quantidadeAtual = 'Quantidade não pode ser negativa';
    if (!stockForm.dataValidadeLote || new Date(stockForm.dataValidadeLote) <= new Date())
      newErrors.dataValidadeLote = 'A data de validade do lote deve ser futura';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && editId) {
        const updatedEntry = await updateStockEntry(editId, form as EntradaEstoque);
        setStockEntries((prev) => prev.map((item) => (item.id === editId ? updatedEntry : item)));
      } else {
        const newEntry = await createStockEntry(form as EntradaEstoque);
        setStockEntries((prev) => [...prev, newEntry]);
      }
      setForm({
        id_fornecedor: '',
        id_produto: '',
        id_funcionario: '',
        quantidadeRecebida: 0,
        adicionado: false,
        dataEntrada: new Date().toISOString().split('T')[0],
        custoUnitario: 0,
        lote: '',
        dataValidadeLote: '',
      });
      setOpenModal(false);
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error('Error submitting stock entry:', error);
      alert('Erro ao salvar entrada de estoque');
    }
  };

  const onStockSubmit = async () => {
    if (!validateStockForm()) return;

    try {
      if (editStockId) {
        const updatedStockData: Estoque = {
          ...stockForm,
          dataValidadeLote: new Date(stockForm.dataValidadeLote!), // Converte para Date
        } as Estoque;
        const updatedStock = await updateStock(editStockId, updatedStockData);
        setCurrentStock((prev) =>
          prev.map((item) => (item.id === editStockId ? updatedStock : item)),
        );
      }
      handleEditStockClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Erro ao atualizar o estoque');
    }
  };
  const handleEditStock = (stock: Estoque) => {
    setEditStockId(stock.id || null);
    setStockForm({
      id_produto: stock.id_produto,
      quantidadeAtual: stock.quantidadeAtual,
      lote: stock.lote,
      dataValidadeLote: stock.dataValidadeLote,
    });
    setEditStockModal(true);
  };

  const handleDeleteStock = async (id_produto: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item do estoque?')) {
      try {
        const stockToDelete = currentStock.find((item) => item.id_produto === id_produto);
        if (stockToDelete?.id) {
          await deleteStock(stockToDelete.id);
          setCurrentStock((prev) => prev.filter((item) => item.id !== stockToDelete.id));
        } else {
          throw new Error('ID do estoque não encontrado');
        }
      } catch (error) {
        console.error('Error deleting stock:', error);
        alert('Erro ao excluir o item do estoque');
      }
    }
  };

  const handleAddToStock = async (entry: EntradaEstoque) => {
    // Validação local antes de enviar ao backend
    const dataValidade = new Date(entry.dataValidadeLote);
    if (dataValidade <= new Date()) {
      setErrors((prev) => ({
        ...prev,
        dataValidadeLote: 'A data de validade do lote deve ser futura',
      }));
      return;
    }

    try {
      // Marcar a entrada como adicionada
      setStockEntries((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, adicionado: true } : item)),
      );

      // Verificar se já existe um estoque para este produto, lote e data de validade
      const existingStock = currentStock.find(
        (item) =>
          item.id_produto === entry.id_produto &&
          item.lote === entry.lote &&
          item.dataValidadeLote.toISOString().split('T')[0] ===
            new Date(entry.dataValidadeLote).toISOString().split('T')[0],
      );

      if (existingStock) {
        // Se o produto com o mesmo lote e data de validade já existe, somar as quantidades
        const updatedQuantity =
          Number(existingStock.quantidadeAtual) + Number(entry.quantidadeRecebida);
        const stockData: Estoque = {
          ...existingStock,
          quantidadeAtual: updatedQuantity,
          dataValidadeLote: new Date(existingStock.dataValidadeLote),
        };

        if (existingStock.id) {
          await updateStock(existingStock.id, stockData);
          setCurrentStock((prev) =>
            prev.map((item) =>
              item.id === existingStock.id ? { ...item, quantidadeAtual: updatedQuantity } : item,
            ),
          );
        } else {
          throw new Error('ID do estoque existente não encontrado');
        }
      } else {
        // Se não existe, criar um novo registro no estoque
        const stockData: Estoque = {
          id_produto: entry.id_produto,
          quantidadeAtual: entry.quantidadeRecebida,
          lote: entry.lote,
          dataValidadeLote: new Date(entry.dataValidadeLote),
        };
        const newStock = await createStock(stockData);
        setCurrentStock((prev) => [...prev, newStock]);
      }

      // Atualizar a entrada de estoque para marcar como adicionada
      if (entry.id) {
        await updateStockEntry(entry.id, { ...entry, adicionado: true });
      } else {
        throw new Error('ID da entrada de estoque não encontrado');
      }

      alert('Produto adicionado ao estoque com sucesso!');
    } catch (error) {
      console.error('Error adding to stock or updating entry:', error);
      alert('Erro ao adicionar ao estoque ou atualizar a entrada');
      setStockEntries((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, adicionado: false } : item)),
      );
    }
  };
  const handleManageEntries = () => {
    setManageEntryModal(true);
  };

  const filteredEntries = stockEntries.filter((entry) => {
    const entryDate = new Date(entry.dataEntrada);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;

    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    return true;
  });

  return (
    <>
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchError}
        </Alert>
      )}
      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">Gestão de Estoque</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpen}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              >
                <Typography variant="body2">Adicionar Entrada</Typography>
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleManageEntries}
                startIcon={<IconifyIcon icon="heroicons-solid:eye" />}
              >
                <Typography variant="body2">Gerenciar Entradas</Typography>
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openModal} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
              {isEditing ? 'Editar Entrada de Estoque' : 'Cadastrar Entrada de Estoque'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <FormControl variant="filled" fullWidth error={!!errors.id_produto}>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={form.id_produto || ''}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="" disabled>
                    Selecione um produto
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.nomeProduto}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_produto && <Typography color="error">{errors.id_produto}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantidadeRecebida"
                label="Quantidade Recebida"
                variant="filled"
                type="number"
                fullWidth
                value={form.quantidadeRecebida}
                onChange={handleTextFieldChange}
                error={!!errors.quantidadeRecebida}
                helperText={errors.quantidadeRecebida}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataEntrada"
                label="Data de Entrada"
                variant="filled"
                type="date"
                fullWidth
                value={form.dataEntrada}
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataEntrada}
                helperText={errors.dataEntrada}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="custoUnitario"
                label="Custo Unitário"
                variant="filled"
                type="number"
                fullWidth
                value={form.custoUnitario}
                onChange={handleTextFieldChange}
                error={!!errors.custoUnitario}
                helperText={errors.custoUnitario}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl variant="filled" fullWidth error={!!errors.id_fornecedor}>
                <InputLabel>Fornecedor</InputLabel>
                <Select
                  name="id_fornecedor"
                  value={form.id_fornecedor || ''}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="" disabled>
                    Selecione um fornecedor
                  </MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.nomeFornecedor}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_fornecedor && (
                  <Typography color="error">{errors.id_fornecedor}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl variant="filled" fullWidth error={!!errors.id_funcionario}>
                <InputLabel>Funcionário</InputLabel>
                <Select
                  name="id_funcionario"
                  value={form.id_funcionario || ''}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="" disabled>
                    Selecione um funcionário
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.nomeFuncionario}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_funcionario && (
                  <Typography color="error">{errors.id_funcionario}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lote"
                label="Lote"
                variant="filled"
                fullWidth
                value={form.lote}
                onChange={handleTextFieldChange}
                error={!!errors.lote}
                helperText={errors.lote}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataValidadeLote"
                label="Validade do Lote"
                variant="filled"
                type="date"
                fullWidth
                value={form.dataValidadeLote}
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataValidadeLote}
                helperText={errors.dataValidadeLote}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onSubmit}
              >
                <Typography variant="body2">{isEditing ? 'Salvar' : 'Cadastrar'}</Typography>
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Modal for Editing Stock */}
      <Modal open={editStockModal} onClose={handleEditStockClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">Editar Estoque</Typography>
            <Button onClick={handleEditStockClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <FormControl variant="filled" fullWidth error={!!errors.id_produto} disabled>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={stockForm.id_produto || ''}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="" disabled>
                    Selecione um produto
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.nomeProduto}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_produto && <Typography color="error">{errors.id_produto}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantidadeAtual"
                label="Quantidade Atual"
                variant="filled"
                type="number"
                fullWidth
                value={stockForm.quantidadeAtual}
                onChange={handleStockTextFieldChange}
                error={!!errors.quantidadeAtual}
                helperText={errors.quantidadeAtual}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lote"
                label="Lote"
                variant="filled"
                fullWidth
                value={stockForm.lote}
                onChange={handleStockTextFieldChange}
                error={!!errors.lote}
                helperText={errors.lote}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataValidadeLote"
                label="Validade do Lote"
                variant="filled"
                type="date"
                fullWidth
                value={
                  stockForm.dataValidadeLote instanceof Date
                    ? stockForm.dataValidadeLote.toISOString().split('T')[0]
                    : stockForm.dataValidadeLote
                }
                onChange={handleStockTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataValidadeLote}
                helperText={errors.dataValidadeLote}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onStockSubmit}
              >
                <Typography variant="body2">Salvar</Typography>
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Modal for Managing All Stock Entries */}
      <Modal open={manageEntryModal} onClose={handleManageEntryClose}>
        <Box sx={style}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">Gerenciar Todas as Entradas</Typography>
            <Button onClick={handleManageEntryClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%', mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data Inicial"
                type="date"
                variant="filled"
                fullWidth
                value={filterStartDate}
                onChange={handleFilterStartDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Data Final"
                type="date"
                variant="filled"
                fullWidth
                value={filterEndDate}
                onChange={handleFilterEndDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ width: '100%' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    'Produto',
                    'Quanti.',
                    'D. Entrada',
                    'C. Unitário',
                    'Lote',
                    'Validade',
                    'Ações',
                  ].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.map((entry) => {
                  const product = products.find((p) => p.id === entry.id_produto);
                  if (!product) return null;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{product.nomeProduto}</TableCell>
                      <TableCell>{entry.quantidadeRecebida}</TableCell>
                      <TableCell>
                        {new Date(entry.dataEntrada).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{entry.custoUnitario}</TableCell>
                      <TableCell>{entry.lote}</TableCell>
                      <TableCell>
                        {new Date(entry.dataValidadeLote).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAddToStock(entry)}
                          disabled={entry.adicionado}
                          sx={{ mr: 1 }}
                        >
                          Adicionar ao Estoque
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nenhuma entrada de estoque encontrada para o período selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Modal>

      {/* Current Stock Table */}
      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6">Estoque Atual</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Produto', 'Quantidade Atual', 'Lote', 'Validade do Lote', 'Ações'].map(
                    (header) => (
                      <TableCell key={header}>
                        <strong>{header}</strong>
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentStock.map((item) => {
                  const product = products.find((p) => p.id === item.id_produto);
                  return (
                    <TableRow key={item.id_produto}>
                      <TableCell>{product?.nomeProduto || item.id_produto}</TableCell>
                      <TableCell>{item.quantidadeAtual}</TableCell>
                      <TableCell>{item.lote}</TableCell>
                      <TableCell>{item.dataValidadeLote.toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEditStock(item)}>
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteStock(item.id_produto)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {currentStock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum produto no estoque encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default Stock;
