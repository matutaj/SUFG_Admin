import {
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Collapse,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React, { useCallback, useMemo } from 'react';
import { DadosEntradaEstoque, DadosEstoque, Produto, Fornecedor, Funcionario } from 'types/models';
import {
  getAllStock,
  createStockEntry,
  updateStockEntry,
  getAllProducts,
  getAllSuppliers,
  getAllEmployees,
  getAllStockEntries,
  createStock,
  updateStock,
  deleteStock,
} from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  maxHeight: '80vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2,
};

const Stock: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [manageEntryModal, setManageEntryModal] = React.useState(false);
  const [editStockModal, setEditStockModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editRef, setEditRef] = React.useState<string | null>(null);
  const [editStockRef, setEditStockRef] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<DadosEntradaEstoque>>({
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
  const [stockForm, setStockForm] = React.useState<Partial<DadosEstoque>>({
    id_produto: '',
    quantidadeAtual: 0,
    lote: '',
    dataValidadeLote: new Date(),
  });
  const [stockEntries, setStockEntries] = React.useState<DadosEntradaEstoque[]>([]);
  const [currentStock, setCurrentStock] = React.useState<DadosEstoque[]>([]);
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [suppliers, setSuppliers] = React.useState<Fornecedor[]>([]);
  const [employees, setEmployees] = React.useState<Funcionario[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [filterStartDate, setFilterStartDate] = React.useState<string>('');
  const [filterEndDate, setFilterEndDate] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [stockEntriesData, stockData, productsData, suppliersData, employeesData] =
        await Promise.all([
          getAllStockEntries(),
          getAllStock(),
          getAllProducts(),
          getAllSuppliers(),
          getAllEmployees(),
        ]);

      setStockEntries(stockEntriesData);
      setCurrentStock(stockData);
      setProducts(productsData);
      setSuppliers(suppliersData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setFetchError('Erro ao carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = useCallback(() => {
    setIsEditing(false);
    setEditRef(null);
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
    setErrors({});
    setOpenModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpenModal(false);
    setErrors({});
    setSuccessMessage(null);
  }, []);

  const handleManageEntryClose = useCallback(() => {
    setManageEntryModal(false);
    setFilterStartDate('');
    setFilterEndDate('');
  }, []);

  const handleEditStockClose = useCallback(() => {
    setEditStockModal(false);
    setEditStockRef(null);
    setStockForm({
      id_produto: '',
      quantidadeAtual: 0,
      lote: '',
      dataValidadeLote: new Date(),
    });
    setErrors({});
    setSuccessMessage(null);
  }, []);

  const handleTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'custoUnitario' || name === 'quantidadeRecebida' ? Number(value) || 0 : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleStockTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({
      ...prev,
      [name]: name === 'quantidadeAtual' ? Number(value) || 0 : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, []);

  const handleStockSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setStockForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.id_produto) newErrors.id_produto = 'Produto é obrigatório';
    if (!form.id_fornecedor) newErrors.id_fornecedor = 'Fornecedor é obrigatório';
    if (!form.id_funcionario) newErrors.id_funcionario = 'Funcionário é obrigatório';
    if (form.quantidadeRecebida === undefined || form.quantidadeRecebida <= 0)
      newErrors.quantidadeRecebida = 'Quantidade deve ser maior que 0';
    if (!form.dataEntrada || isNaN(new Date(form.dataEntrada).getTime()))
      newErrors.dataEntrada = 'Data de entrada é inválida';
    if (form.custoUnitario === undefined || form.custoUnitario <= 0)
      newErrors.custoUnitario = 'Custo unitário deve ser maior que 0';
    if (!form.lote?.trim()) newErrors.lote = 'Lote é obrigatório';
    if (!form.dataValidadeLote || isNaN(new Date(form.dataValidadeLote).getTime()))
      newErrors.dataValidadeLote = 'Data de validade é inválida';
    else if (new Date(form.dataValidadeLote) <= new Date(new Date().setHours(0, 0, 0, 0)))
      newErrors.dataValidadeLote = 'Data de validade deve ser futura';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const validateStockForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!stockForm.id_produto) newErrors.id_produto = 'Produto é obrigatório';
    if (stockForm.quantidadeAtual === undefined || stockForm.quantidadeAtual < 0)
      newErrors.quantidadeAtual = 'Quantidade não pode ser negativa';
    if (!stockForm.lote?.trim()) newErrors.lote = 'Lote é obrigatório';
    if (!stockForm.dataValidadeLote || isNaN(new Date(stockForm.dataValidadeLote).getTime()))
      newErrors.dataValidadeLote = 'Data de validade é inválida';
    else if (new Date(stockForm.dataValidadeLote) <= new Date(new Date().setHours(0, 0, 0, 0)))
      newErrors.dataValidadeLote = 'Data de validade deve ser futura';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [stockForm]);

  const onSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setFetchError(null);
      const entryData: DadosEntradaEstoque = {
        id_fornecedor: form.id_fornecedor!,
        id_produto: form.id_produto!,
        id_funcionario: form.id_funcionario!,
        quantidadeRecebida: form.quantidadeRecebida!,
        adicionado: form.adicionado || false,
        dataEntrada: new Date(form.dataEntrada!).toISOString().split('T')[0],
        custoUnitario: form.custoUnitario!,
        lote: form.lote!,
        dataValidadeLote: new Date(form.dataValidadeLote!).toISOString().split('T')[0],
      };
      console.log('Submitting stock entry:', entryData);
      if (isEditing && editRef) {
        const updatedEntry = await updateStockEntry(editRef, entryData);
        setStockEntries((prev) =>
          prev.map((item) => (item.lote === editRef ? updatedEntry : item)),
        );
        setSuccessMessage('Entrada atualizada com sucesso!');
      } else {
        const newEntry = await createStockEntry(entryData);
        setStockEntries((prev) => [...prev, newEntry]);
        setSuccessMessage('Entrada criada com sucesso!');
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar entrada de estoque:', error);
      setFetchError('Erro ao salvar entrada de estoque. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [form, isEditing, editRef, validateForm, handleClose]);

  const onStockSubmit = useCallback(async () => {
    if (!validateStockForm()) return;

    try {
      setLoading(true);
      setFetchError(null);
      const stockData: DadosEstoque = {
        id_produto: stockForm.id_produto!,
        quantidadeAtual: stockForm.quantidadeAtual!,
        lote: stockForm.lote!,
        dataValidadeLote: new Date(stockForm.dataValidadeLote!),
      };

      if (editStockRef) {
        const updatedStock = await updateStock(editStockRef, stockData);
        setCurrentStock((prev) =>
          prev.map((item) => (item.lote === editStockRef ? updatedStock : item)),
        );
        setSuccessMessage('Estoque atualizado com sucesso!');
      } else {
        const newStock = await createStock(stockData);
        setCurrentStock((prev) => [...prev, newStock]);
        setSuccessMessage('Estoque criado com sucesso!');
      }
      handleEditStockClose();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      setFetchError('Erro ao atualizar estoque. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [stockForm, editStockRef, validateStockForm, handleEditStockClose]);

  const handleEditStock = useCallback((stock: DadosEstoque) => {
    setEditStockRef(stock.id!);
    setStockForm({
      id_produto: stock.id_produto,
      quantidadeAtual: stock.quantidadeAtual,
      lote: stock.lote,
      dataValidadeLote:
        stock.dataValidadeLote instanceof Date ? stock.dataValidadeLote : stock.dataValidadeLote,
    });
    setEditStockModal(true);
    setErrors({});
  }, []);

  const handleDeleteStock = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setFetchError(null);
      await deleteStock(id);
      setCurrentStock((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage('Estoque excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir estoque:', error);
      setFetchError('Erro ao excluir estoque. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddToStock = useCallback(
    async (entry: DadosEntradaEstoque) => {
      // Validate expiration date
      const dataValidade = new Date(entry.dataValidadeLote);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dataValidade <= today) {
        setErrors({ dataValidadeLote: 'Data de validade deve ser futura' });
        return;
      }

      try {
        setLoading(true);
        setFetchError(null);

        // Normalize dates for consistency
        const entryDataValidade = new Date(entry.dataValidadeLote).toISOString().split('T')[0];
        const entryDataEntrada = new Date(entry.dataEntrada).toISOString().split('T')[0];

        // Check for existing stock with same id_produto, lote, and dataValidadeLote
        const existingStock = currentStock.find(
          (item) =>
            item.id_produto === entry.id_produto &&
            item.lote === entry.lote &&
            new Date(item.dataValidadeLote).toISOString().split('T')[0] === entryDataValidade,
        );

        if (existingStock) {
          // Update existing stock
          const updatedQuantity = existingStock.quantidadeAtual + entry.quantidadeRecebida;
          const stockData: DadosEstoque = {
            id_produto: existingStock.id_produto,
            quantidadeAtual: updatedQuantity,
            lote: existingStock.lote,
            dataValidadeLote: new Date(existingStock.dataValidadeLote),
          };
          const updatedStock = await updateStock(existingStock.id!, stockData);
          setCurrentStock((prev) =>
            prev.map((item) =>
              item.id_produto === existingStock.id_produto ? updatedStock : item,
            ),
          );
        } else {
          // Create new stock
          const stockData: DadosEstoque = {
            id_produto: entry.id_produto,
            quantidadeAtual: entry.quantidadeRecebida,
            lote: entry.lote,
            dataValidadeLote: new Date(entry.dataValidadeLote),
          };

          const newStock = await createStock(stockData);
          setCurrentStock((prev) => [...prev, newStock]);
        }

        // Update stock entry to set adicionado: true
        const updatedEntry: DadosEntradaEstoque = {
          ...entry,
          adicionado: true,
          dataEntrada: entryDataEntrada,
          dataValidadeLote: entryDataValidade,
        };

        // Log for debugging
        console.log('Updating stock entry with:', { id: entry.id!, data: updatedEntry });

        await updateStockEntry(entry.id!, updatedEntry);
        setStockEntries((prev) => prev.map((item) => (item.id === entry.id ? updatedEntry : item)));

        // Show success message and clear after 3 seconds
        setSuccessMessage('Adicionado ao estoque com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Erro ao adicionar ao estoque:', error);
        setStockEntries((prev) =>
          prev.map((item) => (item.id === entry.id ? { ...item, adicionado: false } : item)),
        );
      } finally {
        setLoading(false);
      }
    },
    [currentStock, updateStock, createStock, updateStockEntry],
  );
  const handleManageEntries = useCallback(() => {
    setManageEntryModal(true);
  }, []);

  const filteredEntries = useMemo(() => {
    return stockEntries.filter((entry) => {
      const entryDate = new Date(entry.dataEntrada);
      const startDate = filterStartDate ? new Date(filterStartDate) : null;
      const endDate = filterEndDate ? new Date(filterEndDate) : null;
      return (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
    });
  }, [stockEntries, filterStartDate, filterEndDate]);

  return (
    <>
      {(fetchError || successMessage) && (
        <Alert severity={fetchError ? 'error' : 'success'} sx={{ mb: 2 }}>
          {fetchError || successMessage}
        </Alert>
      )}
      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Gestão de Estoque</Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpen}
                disabled={loading}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                aria-label="Adicionar nova entrada de estoque"
              >
                Adicionar Entrada
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleManageEntries}
                disabled={loading}
                startIcon={<IconifyIcon icon="heroicons-solid:eye" />}
                aria-label="Gerenciar entradas de estoque"
              >
                Gerenciar Entradas
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openModal} onClose={handleClose} aria-labelledby="modal-entrada-estoque">
        <Grid sx={modalStyle} component="form" noValidate>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-entrada-estoque" variant="h5">
              {isEditing ? 'Editar Entrada' : 'Nova Entrada'}
            </Typography>
            <Button
              onClick={handleClose}
              variant="outlined"
              color="error"
              disabled={loading}
              aria-label="Fechar modal"
            >
              Fechar
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_produto} disabled={loading}>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={form.id_produto || ''}
                  onChange={handleSelectChange}
                  aria-label="Selecionar produto"
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
                type="number"
                fullWidth
                value={form.quantidadeRecebida}
                onChange={handleTextFieldChange}
                error={!!errors.quantidadeRecebida}
                helperText={errors.quantidadeRecebida}
                disabled={loading}
                inputProps={{ min: 1 }}
                aria-label="Quantidade recebida"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataEntrada"
                label="Data de Entrada"
                type="date"
                fullWidth
                value={form.dataEntrada}
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataEntrada}
                helperText={errors.dataEntrada}
                disabled={loading}
                aria-label="Data de entrada"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="custoUnitario"
                label="Custo Unitário"
                type="number"
                fullWidth
                value={form.custoUnitario}
                onChange={handleTextFieldChange}
                error={!!errors.custoUnitario}
                helperText={errors.custoUnitario}
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
                aria-label="Custo unitário"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_fornecedor} disabled={loading}>
                <InputLabel>Fornecedor</InputLabel>
                <Select
                  name="id_fornecedor"
                  value={form.id_fornecedor || ''}
                  onChange={handleSelectChange}
                  aria-label="Selecionar fornecedor"
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
              <FormControl fullWidth error={!!errors.id_funcionario} disabled={loading}>
                <InputLabel>Funcionário</InputLabel>
                <Select
                  name="id_funcionario"
                  value={form.id_funcionario || ''}
                  onChange={handleSelectChange}
                  aria-label="Selecionar funcionário"
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
                fullWidth
                value={form.lote}
                onChange={handleTextFieldChange}
                error={!!errors.lote}
                helperText={errors.lote}
                disabled={loading}
                aria-label="Lote"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataValidadeLote"
                label="Validade do Lote"
                type="date"
                fullWidth
                value={form.dataValidadeLote}
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataValidadeLote}
                helperText={errors.dataValidadeLote}
                disabled={loading}
                aria-label="Validade do lote"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onSubmit}
                disabled={loading}
                aria-label={isEditing ? 'Salvar entrada' : 'Cadastrar entrada'}
              >
                {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Modal>

      <Modal
        open={editStockModal}
        onClose={handleEditStockClose}
        aria-labelledby="modal-editar-estoque"
      >
        <Grid sx={modalStyle} component="form" noValidate>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-editar-estoque" variant="h5">
              Editar Estoque
            </Typography>
            <Button
              onClick={handleEditStockClose}
              variant="outlined"
              color="error"
              disabled={loading}
              aria-label="Fechar modal"
            >
              Fechar
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_produto} disabled>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={stockForm.id_produto || ''}
                  onChange={handleStockSelectChange}
                  aria-label="Selecionar produto"
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
                type="number"
                fullWidth
                value={stockForm.quantidadeAtual}
                onChange={handleStockTextFieldChange}
                error={!!errors.quantidadeAtual}
                helperText={errors.quantidadeAtual}
                disabled={loading}
                inputProps={{ min: 0 }}
                aria-label="Quantidade atual"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lote"
                label="Lote"
                fullWidth
                value={stockForm.lote}
                onChange={handleStockTextFieldChange}
                error={!!errors.lote}
                helperText={errors.lote}
                disabled={loading}
                aria-label="Lote"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataValidadeLote"
                label="Validade do Lote"
                type="date"
                fullWidth
                value={stockForm.dataValidadeLote}
                onChange={handleStockTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataValidadeLote}
                helperText={errors.dataValidadeLote}
                disabled={loading}
                aria-label="Validade do lote"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onStockSubmit}
                disabled={loading}
                aria-label="Salvar estoque"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Modal>

      <Modal
        open={manageEntryModal}
        onClose={handleManageEntryClose}
        aria-labelledby="modal-gerenciar-entradas"
      >
        <Grid sx={modalStyle}>
          {/* ... other modal content ... */}
          <TableContainer component={Paper}>
            <Table aria-label="Tabela de entradas de estoque">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Produto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Quanti.</strong>
                  </TableCell>
                  <TableCell>
                    <strong>D. Entrada</strong>
                  </TableCell>
                  <TableCell>
                    <strong>C. Unitário</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Lote</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Validade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredEntries.length > 0 ? (
                  filteredEntries.map((entry) => {
                    const product = products.find((p) => p.id === entry.id_produto);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{product?.nomeProduto || entry.id_produto}</TableCell>
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
                            disabled={entry.adicionado || loading}
                            aria-label={`Adicionar entrada ${entry.lote} ao estoque`}
                          >
                            Adicionar ao Estoque
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nenhuma entrada encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6">Estoque Atual</Typography>
          <TableContainer component={Paper}>
            <Table aria-label="Tabela de estoque atual">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Produto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Quantidade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Lote</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Validade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : currentStock.length > 0 ? (
                  currentStock.map((item) => {
                    const product = products.find((p) => p.id === item.id_produto);
                    return (
                      <TableRow key={item.lote}>
                        <TableCell>{product?.nomeProduto || item.id_produto}</TableCell>
                        <TableCell>{item.quantidadeAtual}</TableCell>
                        <TableCell>{item.lote}</TableCell>
                        <TableCell>
                          {new Date(item.dataValidadeLote).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditStock(item)}
                            disabled={loading}
                            aria-label={`Editar estoque ${item.id}`}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteStock(item.id!)}
                            disabled={loading}
                            aria-label={`Excluir estoque ${item.id}`}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum produto no estoque.
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
