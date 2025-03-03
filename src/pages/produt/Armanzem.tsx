import {
  Collapse,
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
  Grid,
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
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText,
  Alert,
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 980 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 500 },
  maxHeight: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  p: 4,
  overflowY: 'auto',
};

interface FormErrors {
  name: string;
  custoAqui: string;
  quantidade: string;
  validade: string;
  prico: string;
  categoria: string;
}

const ProductManager: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openProduct, setOpenProduct] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [editProductId, setEditProductId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState('');

  const handleOpen = (productId?: number) => {
    if (productId) {
      const productToEdit = products.find((p) => p.id === productId);
      if (productToEdit) {
        setForm(productToEdit);
        setEditProductId(productId);
      }
    } else {
      setForm({
        name: '',
        categoria: '',
        custoAqui: 0,
        detalhes: '',
        fornecedor: '',
        validade: '',
        prico: 0,
        quantidade: 0,
      });
      setEditProductId(null);
    }
    setOpenProduct(true);
  };

  const handleClose = () => {
    setOpenProduct(false);
    setEditProductId(null);
    setForm({
      name: '',
      categoria: '',
      custoAqui: 0,
      detalhes: '',
      fornecedor: '',
      validade: '',
      prico: 0,
      quantidade: 0,
    });
    setFormErrors({
      name: '',
      custoAqui: '',
      quantidade: '',
      validade: '',
      prico: '',
      categoria: '',
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const [form, setForm] = React.useState({
    name: '',
    categoria: '',
    custoAqui: 0,
    detalhes: '',
    fornecedor: '',
    validade: '',
    prico: 0,
    quantidade: 0,
  });

  const [formErrors, setFormErrors] = React.useState<FormErrors>({
    name: '',
    custoAqui: '',
    quantidade: '',
    validade: '',
    prico: '',
    categoria: '',
  });

  const [products, setProducts] = React.useState<
    {
      id: number;
      name: string;
      categoria: string;
      custoAqui: number;
      detalhes: string;
      fornecedor: string;
      validade: string;
      prico: number;
      quantidade: number;
    }[]
  >(() => {
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });

  const [categories] = React.useState<{ id: number; name: string }[]>(() => {
    const savedCategories = localStorage.getItem('categoria');
    return savedCategories ? JSON.parse(savedCategories) : [];
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'custoAqui' || name === 'prico' || name === 'quantidade' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const errors: FormErrors = {
      name: '',
      custoAqui: '',
      quantidade: '',
      validade: '',
      prico: '',
      categoria: '',
    };
    if (!form.name) errors.name = 'Nome do produto é obrigatório';
    else if (
      products.some(
        (p) =>
          p.name.toLowerCase() === form.name.toLowerCase() &&
          (!editProductId || p.id !== editProductId),
      )
    )
      errors.name = 'Este produto já existe';
    if (form.custoAqui <= 0) errors.custoAqui = 'O custo de aquisição deve ser maior que 0';
    if (form.quantidade <= 0) errors.quantidade = 'A quantidade deve ser maior que 0';
    if (form.prico <= 0) errors.prico = 'O preço deve ser maior que 0';
    if (!form.categoria) errors.categoria = 'A categoria é obrigatória';
    if (!form.validade || isNaN(new Date(form.validade).getTime()))
      errors.validade = 'A validade é inválida';

    setFormErrors(errors);
    return Object.values(errors).every((error) => error === '');
  };

  const handleAddProduct = () => {
    if (validateForm()) {
      if (editProductId) {
        const updatedProducts = products.map((product) =>
          product.id === editProductId ? { ...form, id: editProductId } : product,
        );
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
      } else {
        const newProduct = {
          id: products.length + 1,
          ...form,
        };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
      }

      handleClose();
      setTimeout(() => setAlert(null), 3000);
    } else {
      setAlert({
        severity: 'error',
        message:
          formErrors.name === 'Este produto já existe'
            ? 'Erro: Este produto já existe!'
            : 'Erro: Preencha todos os campos corretamente!',
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  // Filter products based on search input
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.categoria.toLowerCase().includes(search.toLowerCase()) ||
      product.fornecedor.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Cadastrar Produto No Armazém</Typography>
            <TextField
              label="Pesquisar"
              variant="outlined"
              size="small"
              value={search}
              onChange={handleSearch}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleOpen()}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              <Typography variant="body2">Adicionar Produto</Typography>
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openProduct} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 8 }}
          >
            <Typography id="modal-modal-title" variant="h5" component="h2">
              Cadastrar Produtos
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>
          <Stack sx={{ width: '100%' }} spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="name"
                  label="Nome do Produto"
                  type="text"
                  sx={{ width: '100%' }}
                  value={form.name}
                  onChange={handleChange}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="custoAqui"
                  label="Custo de Aquisição"
                  type="number"
                  sx={{ width: '100%' }}
                  value={form.custoAqui}
                  onChange={handleChange}
                  error={Boolean(formErrors.custoAqui)}
                  helperText={formErrors.custoAqui}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantidade"
                  label="Quantidade do Produto"
                  type="number"
                  sx={{ width: '100%' }}
                  value={form.quantidade}
                  onChange={handleChange}
                  error={Boolean(formErrors.quantidade)}
                  helperText={formErrors.quantidade}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="validade"
                  label="Validade do Produto"
                  type="date"
                  sx={{ width: '100%' }}
                  value={form.validade}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formErrors.validade)}
                  helperText={formErrors.validade}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="prico"
                  label="Preço do Produto"
                  type="number"
                  sx={{ width: '100%' }}
                  value={form.prico}
                  onChange={handleChange}
                  error={Boolean(formErrors.prico)}
                  helperText={formErrors.prico}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="detalhes"
                  label="Detalhes do Produto"
                  type="text"
                  sx={{ width: '100%' }}
                  value={form.detalhes}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleSelectChange}
                  displayEmpty
                  error={Boolean(formErrors.categoria)}
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Selecione uma Categoria
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.categoria && (
                  <FormHelperText error>{formErrors.categoria}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="fornecedor"
                  label="Fornecedor do Produto"
                  type="text"
                  sx={{ width: '100%' }}
                  value={form.fornecedor}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button variant="contained" color="secondary" onClick={handleAddProduct}>
              Cadastrar
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    'ID',
                    'Nome do Produto',
                    'Categoria',
                    'Preço',
                    'Validade',
                    'Custo de Aquisição',
                    'Fornecedor',
                    'Quantidade',
                    'Ações',
                  ].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.categoria}</TableCell>
                    <TableCell>{product.prico}</TableCell>
                    <TableCell>
                      {product.validade && !isNaN(new Date(product.validade).getTime())
                        ? new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(product.validade))
                        : 'Data inválida'}
                    </TableCell>
                    <TableCell>{product.custoAqui}</TableCell>
                    <TableCell>{product.fornecedor}</TableCell>
                    <TableCell>{product.quantidade}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(product.id)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductManager;
