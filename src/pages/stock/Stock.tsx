import { useState, useEffect } from 'react';
import {
  Paper,
  TableCell,
  Table,
  TableRow,
  TableHead,
  TableBody,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  useMediaQuery,
  TableContainer,
  Typography,
  Box,
  Stack,
  Modal,
  TextField,
  Grid,
  FormHelperText,
  Alert,
  IconButton,
} from '@mui/material';
import Search from 'components/icons/common/Search';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { SelectChangeEvent } from '@mui/material';

interface Product {
  id: number;
  name: string;
  categoria: string;
  custoAqui: number;
  detalhes: string;
  fornecedor: string;
  validade: string;
  prico: number;
  quantidade: number;
  quantidadeMinima: number;
  warehouseId: number;
  sectionId: number;
  shelfId: number;
  dataCadastro: string;
}

interface Warehouse {
  id: number;
  name: string;
  sections: Section[];
}

interface Section {
  id: number;
  name: string;
  shelves: Shelf[];
}

interface Shelf {
  id: number;
  name: string;
}

interface FormErrors {
  name: string;
  custoAqui: string;
  quantidade: string;
  quantidadeMinima: string;
  validade: string;
  prico: string;
  categoria: string;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 980 },
  maxWidth: '100%',
  height: { xs: '100%', sm: 'auto', md: 500 },
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

const detailsModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '70%', md: 900 },
  maxWidth: '100%',
  maxHeight: '95vh',
  bgcolor: 'background.paper',
  boxShadow: '0 8px 32px rgba(60, 12, 138, 0.15)',
  borderRadius: 3,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  p: 4,
  overflowY: 'auto',
  animation: 'fadeIn 0.3s ease-in-out',
  '@keyframes fadeIn': {
    '0%': { opacity: 0, transform: 'translate(-50%, -45%)' },
    '100%': { opacity: 1, transform: 'translate(-50%, -50%)' },
  },
};

const Stock = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const savedWarehouses = localStorage.getItem('warehouses');
    return savedWarehouses ? JSON.parse(savedWarehouses) : [];
  });
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedShelfId, setSelectedShelfId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>(() => {
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });
  const [openModal, setOpenModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  const [categories] = useState<{ id: number; name: string }[]>(() => {
    const savedCategories = localStorage.getItem('categoria');
    return savedCategories ? JSON.parse(savedCategories) : [];
  });

  const [productForm, setProductForm] = useState<Product>({
    id: 0,
    name: '',
    categoria: '',
    custoAqui: 0,
    detalhes: '',
    fornecedor: '',
    validade: '',
    prico: 0,
    quantidade: 0,
    quantidadeMinima: 0,
    warehouseId: 0,
    sectionId: 0,
    shelfId: 0,
    dataCadastro: new Date().toISOString().split('T')[0],
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: '',
    custoAqui: '',
    quantidade: '',
    quantidadeMinima: '',
    validade: '',
    prico: '',
    categoria: '',
  });

  useEffect(() => {
    const storedWarehouses = localStorage.getItem('warehouses');
    if (storedWarehouses) {
      try {
        const parsedWarehouses: Warehouse[] = JSON.parse(storedWarehouses);
        setWarehouses(parsedWarehouses);
      } catch (error) {
        console.error('Erro ao carregar warehouses do localStorage', error);
      }
    }

    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        const parsedProducts: Product[] = JSON.parse(storedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Erro ao carregar produtos do localStorage', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  const handleWarehouseChange = (event: SelectChangeEvent<number>) => {
    const warehouseId = Number(event.target.value);
    setSelectedWarehouseId(warehouseId);
    setSelectedSectionId(null);
    setSelectedShelfId(null);
  };

  const handleSectionChange = (event: SelectChangeEvent<number>) => {
    const sectionId = Number(event.target.value);
    setSelectedSectionId(sectionId);
    setSelectedShelfId(null);
  };

  const handleShelfChange = (event: SelectChangeEvent<number>) => {
    setSelectedShelfId(Number(event.target.value));
  };

  const handleOpenModal = (productId?: number) => {
    if (productId !== undefined) {
      const productToEdit = products.find((p) => p.id === productId);
      if (productToEdit) {
        setProductForm(productToEdit);
        setEditProductId(productId);
        setOpenModal(true);
      }
    } else if (selectedWarehouseId && selectedSectionId && selectedShelfId) {
      setProductForm({
        ...productForm,
        warehouseId: selectedWarehouseId,
        sectionId: selectedSectionId,
        shelfId: selectedShelfId,
        dataCadastro: new Date().toISOString().split('T')[0],
      });
      setEditProductId(null);
      setOpenModal(true);
    } else {
      setAlert({
        severity: 'error',
        message: 'Selecione armazém, seção e prateleira antes de adicionar um produto.',
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditProductId(null);
    setProductForm({
      id: 0,
      name: '',
      categoria: '',
      custoAqui: 0,
      detalhes: '',
      fornecedor: '',
      validade: '',
      prico: 0,
      quantidade: 0,
      quantidadeMinima: 0,
      warehouseId: selectedWarehouseId || 0,
      sectionId: selectedSectionId || 0,
      shelfId: selectedShelfId || 0,
      dataCadastro: new Date().toISOString().split('T')[0],
    });
    setFormErrors({
      name: '',
      custoAqui: '',
      quantidade: '',
      quantidadeMinima: '',
      validade: '',
      prico: '',
      categoria: '',
    });
  };

  const handleOpenDetailsModal = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setOpenDetailsModal(true);
    }
  };

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedProduct(null);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]:
        name === 'custoAqui' ||
        name === 'prico' ||
        name === 'quantidade' ||
        name === 'quantidadeMinima'
          ? value === ''
            ? 0
            : Number(value) || 0
          : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const errors: FormErrors = {
      name: '',
      custoAqui: '',
      quantidade: '',
      quantidadeMinima: '',
      validade: '',
      prico: '',
      categoria: '',
    };
    if (!productForm.name) errors.name = 'Nome do produto é obrigatório';
    if (productForm.custoAqui <= 0) errors.custoAqui = 'O custo deve ser maior que 0';
    if (productForm.quantidade <= 0) errors.quantidade = 'A quantidade deve ser maior que 0';
    if (productForm.quantidadeMinima < 0)
      errors.quantidadeMinima = 'A quantidade mínima não pode ser negativa';
    if (productForm.prico <= 0) errors.prico = 'O preço deve ser maior que 0';
    if (!productForm.categoria) errors.categoria = 'A categoria é obrigatória';
    if (!productForm.validade || isNaN(new Date(productForm.validade).getTime()))
      errors.validade = 'A validade é inválida';

    setFormErrors(errors);
    return Object.values(errors).every((error) => error === '');
  };

  const handleSaveProduct = () => {
    if (validateForm()) {
      if (editProductId !== null) {
        const updatedProducts = products.map((product) =>
          product.id === editProductId ? { ...productForm, id: editProductId } : product,
        );
        setProducts(updatedProducts);
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
      } else {
        const newProduct: Product = {
          ...productForm,
          id: products.length + 1,
          warehouseId: selectedWarehouseId!,
          sectionId: selectedSectionId!,
          shelfId: selectedShelfId!,
          dataCadastro: productForm.dataCadastro || new Date().toISOString().split('T')[0],
        };
        setProducts([...products, newProduct]);
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
      }
      handleCloseModal();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteProduct = (productId: number) => {
    if (window.confirm('Tem certeza que deseja deletar este produto?')) {
      const updatedProducts = products.filter((product) => product.id !== productId);
      setProducts(updatedProducts);
      setAlert({ severity: 'success', message: 'Produto deletado com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const sections = selectedWarehouse?.sections || [];
  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const shelves = selectedSection?.shelves || [];

  const filteredProducts = products.filter((product) =>
    selectedShelfId
      ? product.warehouseId === selectedWarehouseId &&
        product.sectionId === selectedSectionId &&
        product.shelfId === selectedShelfId
      : selectedSectionId
        ? product.warehouseId === selectedWarehouseId && product.sectionId === selectedSectionId
        : selectedWarehouseId
          ? product.warehouseId === selectedWarehouseId
          : true,
  );

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      <Paper sx={{ p: 3, width: '100%' }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          sx={{ gap: 2 }}
        >
          <FormControl sx={{ flex: 1, minWidth: 200 }}>
            <InputLabel>Armazém</InputLabel>
            <Select value={selectedWarehouseId || ''} onChange={handleWarehouseChange} displayEmpty>
              <MenuItem value="">Todos os Armazéns</MenuItem>
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1, minWidth: 200 }} disabled={!selectedWarehouseId}>
            <InputLabel>Seção</InputLabel>
            <Select value={selectedSectionId || ''} onChange={handleSectionChange} displayEmpty>
              <MenuItem value="">Todas as Seções</MenuItem>
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1, minWidth: 200 }} disabled={!selectedSectionId}>
            <InputLabel>Prateleira</InputLabel>
            <Select value={selectedShelfId || ''} onChange={handleShelfChange} displayEmpty>
              <MenuItem value="">Todas as Prateleiras</MenuItem>
              {shelves.map((shelf) => (
                <MenuItem key={shelf.id} value={shelf.id}>
                  {shelf.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Search />}
            sx={{ minWidth: 150 }}
            onClick={() => {} /* Apenas para manter o botão funcional */}
          >
            Aplicar Filtro
          </Button>

          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleOpenModal()}
            sx={{ minWidth: 150 }}
          >
            Adicionar Produto
          </Button>
        </Stack>
      </Paper>

      {/* Modal para cadastrar/editar produto */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editProductId !== null ? 'Editar Produto' : 'Cadastrar Produto'}
          </Typography>
          <Stack sx={{ width: '100%' }} spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="name"
                  label="Nome do Produto"
                  value={productForm.name}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="custoAqui"
                  label="Custo de Aquisição"
                  type="number"
                  value={productForm.custoAqui}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.custoAqui)}
                  helperText={formErrors.custoAqui}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantidade"
                  label="Quantidade"
                  type="number"
                  value={productForm.quantidade}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.quantidade)}
                  helperText={formErrors.quantidade}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantidadeMinima"
                  label="Quantidade Mínima"
                  type="number"
                  value={productForm.quantidadeMinima}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.quantidadeMinima)}
                  helperText={formErrors.quantidadeMinima}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="validade"
                  label="Validade"
                  type="date"
                  value={productForm.validade}
                  onChange={handleProductChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formErrors.validade)}
                  helperText={formErrors.validade}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="prico"
                  label="Preço"
                  type="number"
                  value={productForm.prico}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.prico)}
                  helperText={formErrors.prico}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Select
                  name="categoria"
                  value={productForm.categoria}
                  onChange={handleSelectChange}
                  displayEmpty
                  fullWidth
                  error={Boolean(formErrors.categoria)}
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
                  name="detalhes"
                  label="Detalhes"
                  value={productForm.detalhes}
                  onChange={handleProductChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="fornecedor"
                  label="Fornecedor"
                  value={productForm.fornecedor}
                  onChange={handleProductChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="dataCadastro"
                  label="Data de Cadastro"
                  type="date"
                  value={productForm.dataCadastro}
                  onChange={handleProductChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled
                />
              </Grid>
            </Grid>
            <Button variant="contained" color="secondary" onClick={handleSaveProduct}>
              {editProductId !== null ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Modal para ver detalhes do produto */}
      <Modal open={openDetailsModal} onClose={handleCloseDetailsModal}>
        <Box sx={detailsModalStyle}>
          <Typography
            variant="h5"
            mb={3}
            sx={{
              fontWeight: 700,
              color: '#351a7e',
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}
          >
            Detalhes do Produto
          </Typography>
          {selectedProduct && (
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>ID:</strong> {selectedProduct.id}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Nome:</strong> {selectedProduct.name}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Categoria:</strong> {selectedProduct.categoria}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Custo de Aquisição:</strong> {selectedProduct.custoAqui.toFixed(2)} Kzs
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Quantidade:</strong> {selectedProduct.quantidade}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Quantidade Mínima:</strong> {selectedProduct.quantidadeMinima}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Preço:</strong> {selectedProduct.prico.toFixed(2)} Kzs
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack spacing={2}>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Validade:</strong>{' '}
                    {selectedProduct.validade &&
                    !isNaN(new Date(selectedProduct.validade).getTime())
                      ? new Date(selectedProduct.validade).toLocaleDateString('pt-BR')
                      : 'Data inválida'}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Detalhes:</strong> {selectedProduct.detalhes || '-'}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Fornecedor:</strong> {selectedProduct.fornecedor || '-'}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Data de Cadastro:</strong>{' '}
                    {selectedProduct.dataCadastro &&
                    !isNaN(new Date(selectedProduct.dataCadastro).getTime())
                      ? new Date(selectedProduct.dataCadastro).toLocaleDateString('pt-BR')
                      : 'Data inválida'}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Armazém ID:</strong> {selectedProduct.warehouseId}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Seção ID:</strong> {selectedProduct.sectionId}
                  </Typography>
                  <Typography sx={{ fontSize: '1.1rem', color: '#424242' }}>
                    <strong>Prateleira ID:</strong> {selectedProduct.shelfId}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseDetailsModal}
            sx={{
              mt: 4,
              width: '200px',
              alignSelf: 'center',
              borderRadius: 3,
              bgcolor: '#5e13c0',
              '&:hover': {
                bgcolor: '#612599',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
              py: 1.2,
              fontWeight: 600,
            }}
          >
            Fechar
          </Button>
        </Box>
      </Modal>

      <br />

      <Paper sx={{ p: 2, textAlign: 'center', color: 'gray', width: '100%' }}>
        {isSmallScreen ? (
          filteredProducts.map((product) => (
            <Paper
              key={product.id}
              sx={{
                p: 2,
                mb: 2,
                boxShadow: 2,
                bgcolor: product.quantidade <= product.quantidadeMinima ? 'orange' : 'inherit',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{product.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => handleOpenDetailsModal(product.id)}
                  >
                    Ver mais
                  </Typography>
                  <IconButton color="primary" onClick={() => handleOpenModal(product.id)}>
                    <Edit />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteProduct(product.id)}>
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>
              <Box>
                <strong>Categoria:</strong> {product.categoria}
              </Box>
              <Box>
                <strong>Quantidade:</strong> {product.quantidade}
              </Box>
              <Box>
                <strong>Quantidade Mínima:</strong> {product.quantidadeMinima}
              </Box>
              <Box>
                <strong>Preço:</strong> {product.prico.toFixed(2)} Kzs
              </Box>
              <Box>
                <strong>Custo:</strong> {product.custoAqui.toFixed(2)} Kzs
              </Box>
              <Box>
                <strong>Validade:</strong>{' '}
                {product.validade && !isNaN(new Date(product.validade).getTime())
                  ? new Date(product.validade).toLocaleDateString('pt-BR')
                  : 'Data inválida'}
              </Box>
              <Box>
                <strong>Detalhes:</strong> {product.detalhes || '-'}
              </Box>
              <Box>
                <strong>Fornecedor:</strong> {product.fornecedor || '-'}
              </Box>
              <Box>
                <strong>Data de Cadastro:</strong>{' '}
                {product.dataCadastro && !isNaN(new Date(product.dataCadastro).getTime())
                  ? new Date(product.dataCadastro).toLocaleDateString('pt-BR')
                  : 'Data inválida'}
              </Box>
            </Paper>
          ))
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome do Produto</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Custo</TableCell>
                  <TableCell>Validade</TableCell>
                  <TableCell>Fornecedor</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      bgcolor:
                        product.quantidade <= product.quantidadeMinima ? 'orange' : 'inherit',
                    }}
                  >
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.quantidade}</TableCell>
                    <TableCell>{product.custoAqui.toFixed(2)} Kzs</TableCell>
                    <TableCell>
                      {product.validade && !isNaN(new Date(product.validade).getTime())
                        ? new Date(product.validade).toLocaleDateString('pt-BR')
                        : 'Data inválida'}
                    </TableCell>
                    <TableCell>{product.fornecedor || '-'}</TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                          display: 'inline-block',
                          mr: 1,
                        }}
                        onClick={() => handleOpenDetailsModal(product.id)}
                      >
                        Ver mais
                      </Typography>
                      <IconButton color="primary" onClick={() => handleOpenModal(product.id)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteProduct(product.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      Nenhum produto encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </>
  );
};

export default Stock;
