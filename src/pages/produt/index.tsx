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

// Definir opções predefinidas para Unidade de Medida e Unidade de Conteúdo
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

    // Validações
    if (!nomeProduto.trim()) newErrors.nomeProduto = 'O nome do produto é obrigatório.';
    if (!referenciaProduto.trim()) newErrors.referenciaProduto = 'A referência é obrigatória.';
    if (!idCategoriaProduto) newErrors.idCategoriaProduto = 'A categoria é obrigatória.';
    if (precoVenda <= 0) newErrors.precoVenda = 'O preço de venda deve ser maior que 0.';
    if (editProductRef && quantidadePorUnidade < 0)
      newErrors.quantidadePorUnidade = 'A quantidade em estoque não pode ser negativa.';
    if (!unidadeMedida) newErrors.unidadeMedida = 'A unidade de medida é obrigatória.';
    if (!unidadeConteudo) newErrors.unidadeConteudo = 'O conteúdo é obrigatório.';

    // Verificar duplicidade de nome
    const existingProduct = products.find(
      (p) =>
        p.nomeProduto.toLowerCase() === nomeProduto.trim().toLowerCase() &&
        (!editProductRef || p.id !== editProductRef),
    );
    if (existingProduct) {
      newErrors.nomeProduto = 'Já existe um produto com este nome.';
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('Erros de validação:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      console.log('Sem erros de validação, prosseguindo com a chamada à API...');
      const productData: Produto = {
        nomeProduto,
        referenciaProduto,
        id_categoriaProduto: idCategoriaProduto,
        precoVenda,
        quantidadePorUnidade: editProductRef ? quantidadePorUnidade : 0, // Definir 0 ao criar
        unidadeMedida,
        unidadeConteudo,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Dados do produto a enviar:', productData);

      if (editProductRef) {
        console.log(`Atualizando produto com ref: ${editProductRef}`);
        const response = await updateProduct(editProductRef, productData);
        console.log('Resposta da atualização:', response);
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
      } else {
        console.log('Criando novo produto');
        const response = await createProduct(productData);
        console.log('Resposta da criação:', response);
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
      }

      console.log('Buscando lista de produtos atualizada...');
      await fetchProducts();
      console.log('Estado dos produtos após busca:', products);
      console.log('Fechando modal após salvar com sucesso');
      handleCloseProduct();
      setPage(0);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setErrors({ nomeProduto: 'Erro ao salvar. Tente novamente.' });
      setAlert({ severity: 'error', message: 'Erro ao salvar produto!' });
    } finally {
      setLoading(false);
      console.log('handleAddProduct concluído, loading:', false);
    }
  };

  const handleEditProduct = (ref: string) => {
    console.log(`handleEditProduct chamado para ref: ${ref}`);
    const productToEdit = products.find((p) => p.id === ref);
    if (productToEdit) {
      console.log('Produto para edição encontrado:', productToEdit);
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
      console.warn(`Produto com ref ${ref} não encontrado`);
    }
  };

  const handleDeleteProduct = async () => {
    console.log(`handleDeleteProduct chamado para ref: ${productToDelete}`);
    if (productToDelete) {
      try {
        setLoading(true);
        console.log('Deletando produto...');
        const response = await deleteProduct(productToDelete);
        console.log('Resposta da exclusão:', response);
        console.log('Buscando lista de produtos atualizada...');
        await fetchProducts();
        console.log('Estado dos produtos após busca:', products);
        setAlert({ severity: 'success', message: 'Produto excluído com sucesso!' });
        const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
        if (page >= totalPages && page > 0) {
          setPage(page - 1);
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir produto!' });
      } finally {
        setLoading(false);
        console.log('handleDeleteProduct concluído, loading:', false);
        console.log('Fechando modal de confirmação');
        handleCloseConfirmModal();
      }
    } else {
      console.warn('Nenhum produto para excluir (productToDelete é nulo)');
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.referenciaProduto.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  console.log('Produtos filtrados:', filteredProducts);

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log('Mudando página para:', newPage);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    console.log('Mudando linhas por página para:', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Função para obter o rótulo da Unidade de Medida
  const getUnidadeMedidaLabel = (value: string) => {
    const option = unidadeMedidaOptions.find((opt) => opt.value === value);
    return option ? option.label : 'N/A';
  };

  // Função para obter o rótulo da Unidade de Conteúdo
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
            {editProductRef && (
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
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Unidade de Medida"
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value)}
                error={Boolean(errors.unidadeMedida)}
                helperText={errors.unidadeMedida}
                disabled={loading}
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
                disabled={loading}
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
            Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
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
          />
        </CardContent>
      </Card>
    </>
  );
};

export default ProductComponent;