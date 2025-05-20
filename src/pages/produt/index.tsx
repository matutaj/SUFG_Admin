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
import { getUserData, hasPermission } from '../../api/authUtils';

interface CollapsedItemProps {
  open: boolean;
}

const unidadeMedidaOptions = [
  { value: 'L', label: 'Litros (L)' },
  { value: 'mL', label: 'Mililitros (mL)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'un', label: 'Unidades (un)' },
  { value: 'm', label: 'Metros (m)' },
  { value: 'cm', label: 'Centímetros (cm)' },
];

const unidadeConteudoOptions = [
  { value: 'caixa', label: 'Caixa' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'garrafa', label: 'Garrafa' },
  { value: 'lata', label: 'Lata' },
  { value: 'saco', label: 'Saco' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'embalagem', label: 'Embalagem' },
];

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
  const [unidadeMedida, setUnidadeMedida] = React.useState('');
  const [unidadeConteudo, setUnidadeConteudo] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [categories, setCategories] = React.useState<CategoriaProduto[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [canCreate, setCanCreate] = React.useState(false);
  const [canUpdate, setCanUpdate] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [canRead, setCanRead] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    nomeProduto?: string;
    referenciaProduto?: string;
    idCategoriaProduto?: string;
    precoVenda?: string;
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

  // Função de logging para depuração
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  };

  // Carregar dados do usuário e permissões
  React.useEffect(() => {
    const loadUserData = () => {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (userData && userData.id) {
        setUserId(userData.id);
        setCanRead(hasPermission('listar_produto')); // Updated permission
        setCanCreate(hasPermission('criar_produto')); // Updated permission
        setCanUpdate(hasPermission('atualizar_produto')); // Updated permission
        setCanDelete(hasPermission('eliminar_produto')); // Updated permission
        log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      } else {
        setAlert({ severity: 'error', message: 'Usuário não autenticado!' });
        log('Nenhum usuário autenticado encontrado');
      }
    };
    loadUserData();
  }, []);

  const handleOpenProduct = () => {
    setOpenProductModal(true);
  };

  const handleCloseProduct = () => {
    setOpenProductModal(false);
    setEditProductRef(null);
    setNomeProduto('');
    setReferenciaProduto('');
    setIdCategoriaProduto('');
    setPrecoVenda(0);
    setUnidadeMedida('');
    setUnidadeConteudo('');
    setErrors({});
  };

  const handleOpenConfirmModal = (ref: string) => {
    setProductToDelete(ref);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setProductToDelete(null);
  };

  const fetchProducts = async () => {
    if (!canRead) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para visualizar produtos!' });
      log('Permissão de leitura negada');
      return;
    }
    try {
      setLoading(true);
      const productsData = await getAllProducts();
      log('Produtos carregados:', productsData);
      setProducts(productsData || []);
    } catch (error: any) {
      setAlert({ severity: 'error', message: error.message || 'Erro ao carregar produtos!' });
      log('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllProductCategories();
      log('Categorias carregadas:', data);
      setCategories(data || []);
    } catch (error: any) {
      setAlert({ severity: 'error', message: error.message || 'Erro ao carregar categorias!' });
      log('Erro ao carregar categorias:', error);
    }
  };

  React.useEffect(() => {
    log('canRead changed:', canRead);
    if (canRead) {
      fetchProducts();
      fetchCategories();
    }
  }, [canRead]);

  const handleAddProduct = async () => {
    if (editProductRef && !canUpdate) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para atualizar produtos!' });
      log('Permissão de atualização negada');
      return;
    }
    if (!editProductRef && !canCreate) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para criar produtos!' });
      log('Permissão de criação negada');
      return;
    }

    const newErrors: {
      nomeProduto?: string;
      referenciaProduto?: string;
      idCategoriaProduto?: string;
      precoVenda?: string;
      unidadeMedida?: string;
      unidadeConteudo?: string;
    } = {};

    if (!nomeProduto.trim()) newErrors.nomeProduto = 'O nome do produto é obrigatório.';
    if (!referenciaProduto.trim()) newErrors.referenciaProduto = 'A referência é obrigatória.';
    if (!idCategoriaProduto) newErrors.idCategoriaProduto = 'A categoria é obrigatória.';
    if (precoVenda <= 0) newErrors.precoVenda = 'O preço de venda deve ser maior que 0.';
    if (!unidadeMedida) newErrors.unidadeMedida = 'A unidade de medida é obrigatória.';
    if (!unidadeConteudo) newErrors.unidadeConteudo = 'O conteúdo é obrigatório.';

    const existingProduct = products.find(
      (p) =>
        p.nomeProduto.toLowerCase() === nomeProduto.trim().toLowerCase() &&
        (!editProductRef || p.id !== editProductRef),
    );
    if (existingProduct) {
      newErrors.nomeProduto = 'Já existe um produto com este nome.';
    }

    const existingReference = products.find(
      (p) =>
        p.referenciaProduto.toLowerCase() === referenciaProduto.trim().toLowerCase() &&
        (!editProductRef || p.id !== editProductRef),
    );
    if (existingReference) {
      newErrors.referenciaProduto = 'Já existe um produto com esta referência.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      log('Erros de validação:', newErrors);
      return;
    }

    try {
      setLoading(true);
      const productData: Produto = {
        nomeProduto,
        referenciaProduto,
        id_categoriaProduto: idCategoriaProduto,
        precoVenda,
        unidadeMedida,
        unidadeConteudo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editProductRef) {
        const updatedProduct = await updateProduct(editProductRef, productData);
        setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
        log('Produto atualizado:', updatedProduct);
      } else {
        const newProduct = await createProduct(productData);
        setProducts([...products, newProduct]);
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
        log('Produto criado:', newProduct);
      }

      handleCloseProduct();
      setPage(0);
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar produto!';
      setErrors({ nomeProduto: errorMessage });
      setAlert({ severity: 'error', message: errorMessage });
      log('Erro ao salvar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (ref: string) => {
    if (!canUpdate) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para editar produtos!' });
      log('Permissão de edição negada');
      return;
    }
    const productToEdit = products.find((p) => p.id === ref);
    if (productToEdit) {
      setNomeProduto(productToEdit.nomeProduto);
      setReferenciaProduto(productToEdit.referenciaProduto);
      setIdCategoriaProduto(productToEdit.id_categoriaProduto);
      setPrecoVenda(productToEdit.precoVenda);
      setUnidadeMedida(productToEdit.unidadeMedida);
      setUnidadeConteudo(productToEdit.unidadeConteudo);
      setEditProductRef(ref);
      log('Editando produto:', productToEdit);
      handleOpenProduct();
    }
  };

  const handleDeleteProduct = async () => {
    if (!canDelete) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para excluir produtos!' });
      log('Permissão de exclusão negada');
      handleCloseConfirmModal();
      return;
    }
    if (productToDelete) {
      try {
        setLoading(true);
        await deleteProduct(productToDelete);
        setProducts(products.filter((p) => p.id !== productToDelete));
        setAlert({ severity: 'success', message: 'Produto excluído com sucesso!' });
        log('Produto excluído:', productToDelete);
        const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
        if (page >= totalPages && page > 0) {
          setPage(page - 1);
        }
      } catch (error: any) {
        setAlert({ severity: 'error', message: error.message || 'Erro ao excluir produto!' });
        log('Erro ao excluir produto:', error);
      } finally {
        setLoading(false);
        handleCloseConfirmModal();
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.referenciaProduto.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const getUnidadeMedidaLabel = (value: string) => {
    const option = unidadeMedidaOptions.find((opt) => opt.value === value);
    return option ? option.label : 'N/A';
  };

  const getUnidadeConteudoLabel = (value: string) => {
    const option = unidadeConteudoOptions.find((opt) => opt.value === value);
    return option ? option.label : 'N/A';
  };

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
            <Typography variant="h5">Cadastrar Produtos</Typography>
            <TextField
              label="Pesquisar Produtos"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 400 }}
              disabled={!canRead}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpenProduct}
              disabled={loading || !canCreate}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              title={!canCreate ? 'Você não tem permissão para criar produtos' : ''}
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
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
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
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
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
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
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
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Unidade de Medida"
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value)}
                error={Boolean(errors.unidadeMedida)}
                helperText={errors.unidadeMedida}
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
                fullWidth
              >
                <MenuItem value="" disabled>
                  Selecione uma Unidade de Medida
                </MenuItem>
                {unidadeMedidaOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Unidade de Conteúdo"
                value={unidadeConteudo}
                onChange={(e) => setUnidadeConteudo(e.target.value)}
                error={Boolean(errors.unidadeConteudo)}
                helperText={errors.unidadeConteudo}
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
                fullWidth
              >
                <MenuItem value="" disabled>
                  Selecione uma Unidade de Conteúdo
                </MenuItem>
                {unidadeConteudoOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddProduct}
                disabled={loading || (editProductRef ? !canUpdate : !canCreate)}
                fullWidth
                sx={{ mt: 2 }}
                title={
                  editProductRef
                    ? !canUpdate
                      ? 'Você não tem permissão para atualizar produtos'
                      : ''
                    : !canCreate
                      ? 'Você não tem permissão para criar produtos'
                      : ''
                }
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
            Tem certeza que deseja excluir o produto "
            {products.find((p) => p.id === productToDelete)?.nomeProduto}"? Esta ação não pode ser
            desfeita.
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
              disabled={loading || !canDelete}
              title={!canDelete ? 'Você não tem permissão para excluir produtos' : ''}
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
                  <TableCell>
                    <strong>Unidade de Medida</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Unidade de Conteúdo</strong>
                  </TableCell>
                  <TableCell align="right">
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
                      <TableCell>{getUnidadeMedidaLabel(product.unidadeMedida)}</TableCell>
                      <TableCell>{getUnidadeConteudoLabel(product.unidadeConteudo)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditProduct(product.id!)}
                          disabled={loading || !canUpdate}
                          aria-label="Editar produto"
                          title={!canUpdate ? 'Você não tem permissão para editar produtos' : ''}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmModal(product.id!)}
                          disabled={loading || !canDelete}
                          aria-label="Excluir produto"
                          title={!canDelete ? 'Você não tem permissão para excluir produtos' : ''}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
            disabled={!canRead}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default ProductComponent;
