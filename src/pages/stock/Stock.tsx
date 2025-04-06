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
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { EntradaEstoque, Produto, Fornecedor, Funcionario } from 'types/models';
import {
  getStockEntries,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry,
  getProducts,
  getSuppliers,
  getEmployees,
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
  const [isEditing, setIsEditing] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<EntradaEstoque>>({
    id_fornecedor: '',
    id_produto: '',
    id_funcionario: '',
    quantidadeRecebida: '0',
    dataEntrada: new Date().toISOString().split('T')[0],
    custoUnitario: 0,
    lote: '',
    dataValidadeLote: '',
  });
  const [stockEntries, setStockEntries] = React.useState<EntradaEstoque[]>([]);
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [suppliers, setSuppliers] = React.useState<Fornecedor[]>([]);
  const [employees, setEmployees] = React.useState<Funcionario[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Iniciando busca de dados...');

      // Busca de entradas de estoque
      const entries = await getStockEntries();
      console.log('Entradas de Estoque:', entries);
      setStockEntries(entries);

      // Busca de produtos (já funcionando)
      const productsData = await getProducts();
      console.log('Produtos retornados:', productsData);
      setProducts(productsData);

      // Busca de fornecedores (foco da depuração)
      try {
        const suppliersData = await getSuppliers();
        console.log('Fornecedores retornados (raw):', suppliersData);
        console.log('Número de fornecedores:', suppliersData.length);
        if (suppliersData.length > 0) {
          console.log('Estrutura do primeiro fornecedor:', suppliersData[0]);
          console.log('Campo nomeFornecedor presente?', 'nomeFornecedor' in suppliersData[0]);
        }
        // Verifica se os dados têm a estrutura esperada
        const mappedSuppliers = suppliersData.map((s) => ({
          ...s,
          nomeFornecedor: s.nomeFornecedor || s.nomeFornecedor || 'Fornecedor sem nome', // Fallback para 'name'
        }));
        console.log('Fornecedores mapeados:', mappedSuppliers);
        setSuppliers(mappedSuppliers);
      } catch (supplierError) {
        console.error('Erro específico ao buscar fornecedores:', supplierError);
        setFetchError('Erro ao carregar fornecedores. Verifique o console.');
      }

      // Busca de funcionários (já funcionando)
      const employeesData = await getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro geral ao buscar dados:', error);
      setFetchError('Erro ao carregar os dados. Verifique o console para mais detalhes.');
    }
  };

  const handleOpen = () => {
    console.log('Abrindo modal...');
    console.log('Produtos no estado:', products);
    console.log('Fornecedores no estado:', suppliers);
    console.log('Funcionários no estado:', employees);
    setIsEditing(false);
    setEditId(null);
    setForm({
      id_fornecedor: '',
      id_produto: '',
      id_funcionario: '',
      quantidadeRecebida: '0',
      dataEntrada: new Date().toISOString().split('T')[0],
      custoUnitario: 0,
      lote: '',
      dataValidadeLote: '',
    });
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

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

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
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
        quantidadeRecebida: '0',
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrada de estoque?')) {
      try {
        await deleteStockEntry(id);
        setStockEntries((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting stock entry:', error);
      }
    }
  };

  const handleEdit = (entry: EntradaEstoque) => {
    setIsEditing(true);
    setEditId(entry.id || null);
    setForm({
      id_fornecedor: entry.id_fornecedor,
      id_produto: entry.id_produto,
      id_funcionario: entry.id_funcionario,
      quantidadeRecebida: entry.quantidadeRecebida,
      dataEntrada: entry.dataEntrada,
      custoUnitario: entry.custoUnitario,
      lote: entry.lote,
      dataValidadeLote: entry.dataValidadeLote,
    });
    setOpenModal(true);
  };

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
            <Typography variant="h5">Entradas de Estoque</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
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
                  {products.length > 0 ? (
                    products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.nomeProduto}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Nenhum produto disponível</MenuItem>
                  )}
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
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.nomeFornecedor}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Nenhum fornecedor disponível</MenuItem>
                  )}
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
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.nomeFuncionario}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Nenhum funcionário disponível</MenuItem>
                  )}
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

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    'Produto',
                    'Quantidade',
                    'Data de Entrada',
                    'Custo Unitário',
                    'Fornecedor',
                    'Funcionário',
                    'Ações',
                  ].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {stockEntries.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {products.find((p) => p.id === item.id_produto)?.nomeProduto ||
                        item.id_produto}
                    </TableCell>
                    <TableCell>{item.quantidadeRecebida}</TableCell>
                    <TableCell>{new Date(item.dataEntrada).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{item.custoUnitario}</TableCell>
                    <TableCell>
                      {suppliers.find((s) => s.id === item.id_fornecedor)?.nomeFornecedor ||
                        item.id_fornecedor}
                    </TableCell>
                    <TableCell>
                      {employees.find((e) => e.id === item.id_funcionario)?.nomeFuncionario ||
                        item.id_funcionario}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEdit(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(item.id!)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {stockEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Nenhuma entrada de estoque encontrada.
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
