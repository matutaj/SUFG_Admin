import {
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
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
  Alert,
  MenuItem,
  Collapse,
  Grid,
  Box,
  TablePagination,
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { Produto, CategoriaProduto } from '../../types/models';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductCategories,
} from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 980 },
  maxWidth: '100%',
  height: { xs: '80%', sm: '50%', md: 650 },
  maxHeight: '80%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'start' as const,
  alignItems: 'center' as const,
  backgroundColor: '#f9f9f9',
  p: 4,
  overflowY: 'auto' as const,
};

const confirmModalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

const ProductComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
  const [editProductRef, setEditProductRef] = React.useState<string | null>(null);
  const [nomeProduto, setNomeProduto] = React.useState('');
  const [referenciaProduto, setReferenciaProduto] = React.useState('');
  const [idCategoriaProduto, setIdCategoriaProduto] = React.useState('');
  const [precoVenda, setPrecoVenda] = React.useState(0);
  const [quantidadePorUnidade, setquantidadePorUnidade] = React.useState(0);
  const [unidadeMedida, setUnidadeMedida] = React.useState('');
  const [unidadeConteudo, setUnidadeConteudo] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [categories, setCategories] = React.useState<CategoriaProduto[]>([]);
  const [errors, setErrors] = React.useState<{
    nomeProduto?: string;
    referenciaProduto?: string;
    idCategoriaProduto?: string;
    precoVenda?: string;
    quantidadePorUnidade?: string;
    unidadeMedida?: string;
    unidadeConteudo?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleOpenProduct = () => {
    console.log('Opening product modal');
    setOpenProductModal(true);
  };

  const handleCloseProduct = () => {
    console.log('Closing product modal, resetting state');
    setOpenProductModal(false);
    setEditProductRef(null);
    setNomeProduto('');
    setReferenciaProduto('');
    setIdCategoriaProduto('');
    setPrecoVenda(0);
    setquantidadePorUnidade(0);
    setUnidadeMedida('');
    setUnidadeConteudo('');
    setErrors({});
  };

  const handleOpenConfirmModal = (ref: string) => {
    console.log(`Opening confirm modal for product ref: ${ref}`);
    setProductToDelete(ref);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    console.log('Closing confirm modal');
    setOpenConfirmModal(false);
    setProductToDelete(null);
  };

  const fetchProducts = async () => {
    console.log('Fetching products...');
    try {
      setLoading(true);
      const data = await getAllProducts();
      console.log('Products fetched:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar produtos!' });
    } finally {
      setLoading(false);
      console.log('Fetch products completed, loading:', false);
    }
  };

  const fetchCategories = async () => {
    console.log('Fetching categories...');
    try {
      const data = await getAllProductCategories();
      console.log('Categories fetched:', data);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  React.useEffect(() => {
    console.log('useEffect: Initial fetch for products and categories');
    fetchProducts();
    fetchCategories();
  }, []);

  const handleAddProduct = async () => {
    console.log('handleAddProduct called with:', {
      nomeProduto,
      referenciaProduto,
      idCategoriaProduto,
      precoVenda,
      quantidadePorUnidade,
      unidadeMedida,
      unidadeConteudo,
      editProductRef,
    });

    const newErrors: {
      nomeProduto?: string;
      referenciaProduto?: string;
      idCategoriaProduto?: string;
      precoVenda?: string;
      quantidadePorUnidade?: string;
      unidadeMedida?: string;
      unidadeConteudo?: string;
    } = {};

    // Existing validations
    if (!nomeProduto.trim()) newErrors.nomeProduto = 'O nome do produto é obrigatório.';
    if (!referenciaProduto.trim()) newErrors.referenciaProduto = 'A referência é obrigatória.';
    if (!idCategoriaProduto) newErrors.idCategoriaProduto = 'A categoria é obrigatória.';
    if (precoVenda <= 0) newErrors.precoVenda = 'O preço de venda deve ser maior que 0.';
    if (quantidadePorUnidade < 0)
      newErrors.quantidadePorUnidade = 'A quantidade em estoque não pode ser negativa.';
    if (!unidadeMedida.trim()) newErrors.unidadeMedida = 'A unidade de medida é obrigatória.';
    if (!unidadeConteudo.trim()) newErrors.unidadeConteudo = 'O conteúdo é obrigatório.';

    // Check for duplicate product name
    const existingProduct = products.find(
      (p) =>
        p.nomeProduto.toLowerCase() === nomeProduto.trim().toLowerCase() &&
        (!editProductRef || p.id !== editProductRef), // Exclude the product being edited
    );
    if (existingProduct) {
      newErrors.nomeProduto = 'Já existe um produto com este nome.';
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      console.log('No validation errors, proceeding with API call...');
      const productData: Produto = {
        nomeProduto,
        referenciaProduto,
        id_categoriaProduto: idCategoriaProduto,
        precoVenda,
        quantidadePorUnidade,
        unidadeMedida,
        unidadeConteudo,
      };
      console.log('Product data to send:', productData);

      if (editProductRef) {
        console.log(`Updating product with ref: ${editProductRef}`);
        const response = await updateProduct(editProductRef, productData);
        console.log('Update response:', response);
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
      } else {
        console.log('Creating new product');
        const response = await createProduct(productData);
        console.log('Create response:', response);
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
      }

      console.log('Fetching updated products list...');
      await fetchProducts();
      console.log('Products state after fetch:', products);
      console.log('Closing modal after successful save');
      handleCloseProduct();
      setPage(0);
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ nomeProduto: 'Erro ao salvar. Tente novamente.' });
      setAlert({ severity: 'error', message: 'Erro ao salvar produto!' });
    } finally {
      setLoading(false);
      console.log('handleAddProduct completed, loading:', false);
    }
  };

  const handleEditProduct = (ref: string) => {
    console.log(`handleEditProduct called for ref: ${ref}`);
    const productToEdit = products.find((p) => p.id === ref);
    if (productToEdit) {
      console.log('Product to edit found:', productToEdit);
      setNomeProduto(productToEdit.nomeProduto);
      setReferenciaProduto(productToEdit.referenciaProduto);
      setIdCategoriaProduto(productToEdit.id_categoriaProduto);
      setPrecoVenda(productToEdit.precoVenda);
      setquantidadePorUnidade(productToEdit.quantidadePorUnidade);
      setUnidadeMedida(productToEdit.unidadeMedida);
      setUnidadeConteudo(productToEdit.unidadeConteudo);
      setEditProductRef(ref);
      handleOpenProduct();
    } else {
      console.warn(`Product with ref ${ref} not found`);
    }
  };

  const handleDeleteProduct = async () => {
    console.log(`handleDeleteProduct called for ref: ${productToDelete}`);
    if (productToDelete) {
      try {
        setLoading(true);
        console.log('Deleting product...');
        const response = await deleteProduct(productToDelete);
        console.log('Delete response:', response);
        console.log('Fetching updated products list...');
        await fetchProducts();
        console.log('Products state after fetch:', products);
        setAlert({ severity: 'success', message: 'Produto excluído com sucesso!' });
        const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
        if (page >= totalPages && page > 0) {
          setPage(page - 1);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir produto!' });
      } finally {
        setLoading(false);
        console.log('handleDeleteProduct completed, loading:', false);
        console.log('Closing confirm modal');
        handleCloseConfirmModal();
      }
    } else {
      console.warn('No product to delete (productToDelete is null)');
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.referenciaProduto.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  console.log('Filtered products:', filteredProducts);

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log('Changing page to:', event);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('Changing rows per page to:', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      {alert && (
        <Grid sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Grid>
      )}

      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Produtos</Typography>
            <TextField
              label="Pesquisar Produtos"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 400 }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpenProduct}
              disabled={loading}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              Novo Produto
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openProductModal} onClose={handleCloseProduct}>
        <Grid sx={modalStyle} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editProductRef ? 'Editar Produto' : 'Cadastrar Produto'}
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome do Produto"
                value={nomeProduto}
                onChange={(e) => setNomeProduto(e.target.value)}
                error={Boolean(errors.nomeProduto)}
                helperText={errors.nomeProduto}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Referência do Produto"
                value={referenciaProduto}
                onChange={(e) => setReferenciaProduto(e.target.value)}
                error={Boolean(errors.referenciaProduto)}
                helperText={errors.referenciaProduto}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Categoria"
                value={idCategoriaProduto}
                onChange={(e) => setIdCategoriaProduto(e.target.value)}
                error={Boolean(errors.idCategoriaProduto)}
                helperText={errors.idCategoriaProduto}
                disabled={loading}
                fullWidth
              >
                <MenuItem value="" disabled>
                  Selecione uma Categoria
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nomeCategoria}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Preço de Venda"
                type="number"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(Number(e.target.value) || 0)}
                error={Boolean(errors.precoVenda)}
                helperText={errors.precoVenda}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantidade por Unidade"
                type="number"
                value={quantidadePorUnidade}
                onChange={(e) => setquantidadePorUnidade(Number(e.target.value) || 0)}
                error={Boolean(errors.quantidadePorUnidade)}
                helperText={errors.quantidadePorUnidade}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unidade de Medida"
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value)}
                error={Boolean(errors.unidadeMedida)}
                helperText={errors.unidadeMedida}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unidade de Conteúdo"
                value={unidadeConteudo}
                onChange={(e) => setUnidadeConteudo(e.target.value)}
                error={Boolean(errors.unidadeConteudo)}
                helperText={errors.unidadeConteudo}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddProduct}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? 'Salvando...' : editProductRef ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Modal>

      <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
        <Box sx={confirmModalStyle}>
          <Typography variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir este produto? Esta ação não pode be desfeita.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseConfirmModal}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteProduct}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Produtos Cadastrados
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Referência</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Categoria</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Preço Venda</strong>
                  </TableCell>
                  <TableCell align="right">
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
                ) : paginatedProducts.length > 0 ? (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.referenciaProduto}>
                      <TableCell>{product.nomeProduto || 'Sem nome'}</TableCell>
                      <TableCell>{product.referenciaProduto || 'N/A'}</TableCell>
                      <TableCell>
                        {categories.find((cat) => cat.id === product.id_categoriaProduto)
                          ?.nomeCategoria || 'N/A'}
                      </TableCell>
                      <TableCell>{product.precoVenda || 0}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditProduct(product.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmModal(product.id!)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </CardContent>
      </Card>
    </>
  );
};

export default ProductComponent;
