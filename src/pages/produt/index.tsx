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
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { Produto, CategoriaProduto } from '../../types/models';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
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
  const [editProductId, setEditProductId] = React.useState<string | null>(null);
  const [nomeProduto, setNomeProduto] = React.useState('');
  const [referenciaProduto, setReferenciaProduto] = React.useState('');
  const [idCategoriaProduto, setIdCategoriaProduto] = React.useState('');
  const [custoAquisicao, setCustoAquisicao] = React.useState('');
  const [precoVenda, setPrecoVenda] = React.useState(0);
  const [quantidadeEstoque, setQuantidadeEstoque] = React.useState(0);
  const [unidadeMedida, setUnidadeMedida] = React.useState('');
  const [unidadeConteudo, setUnidadeConteudo] = React.useState('');
  const [codigoBarras, setCodigoBarras] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [categories, setCategories] = React.useState<CategoriaProduto[]>([]);
  const [errors, setErrors] = React.useState<{
    nomeProduto?: string;
    referenciaProduto?: string;
    idCategoriaProduto?: string;
    custoAquisicao?: string;
    precoVenda?: string;
    quantidadeEstoque?: string;
    unidadeMedida?: string;
    unidadeConteudo?: string;
    codigoBarras?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const handleOpenProduct = () => setOpenProductModal(true);
  const handleCloseProduct = () => {
    setOpenProductModal(false);
    setEditProductId(null);
    setNomeProduto('');
    setReferenciaProduto('');
    setIdCategoriaProduto('');
    setCustoAquisicao('');
    setPrecoVenda(0);
    setQuantidadeEstoque(0);
    setUnidadeMedida('');
    setUnidadeConteudo('');
    setCodigoBarras('');
    setErrors({});
  };

  const handleOpenConfirmModal = (id: string) => {
    setProductToDelete(id);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setProductToDelete(null);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar produtos!' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  React.useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleAddProduct = async () => {
    const newErrors: {
      nomeProduto?: string;
      referenciaProduto?: string;
      idCategoriaProduto?: string;
      custoAquisicao?: string;
      precoVenda?: string;
      quantidadeEstoque?: string;
      unidadeMedida?: string;
      unidadeConteudo?: string;
      codigoBarras?: string;
    } = {};
    if (!nomeProduto.trim()) newErrors.nomeProduto = 'O nome do produto é obrigatório.';
    if (!referenciaProduto.trim()) newErrors.referenciaProduto = 'A referência é obrigatória.';
    if (!idCategoriaProduto) newErrors.idCategoriaProduto = 'A categoria é obrigatória.';
    if (!custoAquisicao.trim() || isNaN(Number(custoAquisicao)))
      newErrors.custoAquisicao = 'O custo de aquisição deve ser um número válido.';
    if (precoVenda <= 0) newErrors.precoVenda = 'O preço de venda deve ser maior que 0.';
    if (quantidadeEstoque < 0)
      newErrors.quantidadeEstoque = 'A quantidade em estoque não pode ser negativa.';
    if (!unidadeMedida.trim()) newErrors.unidadeMedida = 'A unidade de medida é obrigatória.';
    if (!unidadeConteudo.trim()) newErrors.unidadeConteudo = 'O conteúdo é obrigatório.';
    if (!codigoBarras.trim()) newErrors.codigoBarras = 'O código de barras é obrigatório.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const productData = {
        nomeProduto,
        referenciaProduto,
        id_categoriaProduto: idCategoriaProduto,
        custoAquisicao,
        precoVenda,
        quantidadeEstoque,
        unidadeMedida,
        unidadeConteudo,
        codigoBarras,
      };
      if (editProductId) {
        await updateProduct(editProductId, productData);
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
      } else {
        await createProduct(productData);
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
      }
      await fetchProducts();
      handleCloseProduct();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      setErrors({ nomeProduto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (id: string) => {
    const productToEdit = products.find((p) => p.id === id);
    if (productToEdit) {
      setNomeProduto(productToEdit.nomeProduto || '');
      setReferenciaProduto(productToEdit.referenciaProduto || '');
      setIdCategoriaProduto(productToEdit.id_categoriaProduto || '');
      setCustoAquisicao(productToEdit.custoAquisicao || '');
      setPrecoVenda(productToEdit.precoVenda || 0);
      setQuantidadeEstoque(productToEdit.quantidadeEstoque || 0);
      setUnidadeMedida(productToEdit.unidadeMedida || '');
      setUnidadeConteudo(productToEdit.unidadeConteudo || '');
      setCodigoBarras(productToEdit.codigoBarras || '');
      setEditProductId(id);
      handleOpenProduct();
    }
  };

  const handleDeleteProduct = async () => {
    if (productToDelete) {
      try {
        setLoading(true);
        await deleteProduct(productToDelete);
        await fetchProducts();
        setAlert({ severity: 'success', message: 'Produto excluído com sucesso!' });
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir produto!' });
      } finally {
        setLoading(false);
        handleCloseConfirmModal();
      }
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.nomeProduto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.referenciaProduto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase()),
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
              onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Modal para Produto */}
      <Modal open={openProductModal} onClose={handleCloseProduct}>
        <Grid sx={modalStyle} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editProductId ? 'Editar Produto' : 'Cadastrar Produto'}
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
                label="Custo de Aquisição"
                value={custoAquisicao}
                onChange={(e) => setCustoAquisicao(e.target.value)}
                error={Boolean(errors.custoAquisicao)}
                helperText={errors.custoAquisicao}
                disabled={loading}
                fullWidth
              />
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
                label="Quantidade em Estoque"
                type="number"
                value={quantidadeEstoque}
                onChange={(e) => setQuantidadeEstoque(Number(e.target.value) || 0)}
                error={Boolean(errors.quantidadeEstoque)}
                helperText={errors.quantidadeEstoque}
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Código de Barras"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                error={Boolean(errors.codigoBarras)}
                helperText={errors.codigoBarras}
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
                {loading ? 'Salvando...' : editProductId ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Modal>

      {/* Modal de Confirmação para Exclusão */}
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

      {/* Tabela de Produtos */}
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
                    <strong>Código Barras</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.nomeProduto || 'Sem nome'}</TableCell>
                      <TableCell>{product.referenciaProduto || 'N/A'}</TableCell>
                      <TableCell>
                        {categories.find((cat) => cat.id === product.id_categoriaProduto)
                          ?.nomeCategoria || 'N/A'}
                      </TableCell>
                      <TableCell>{product.precoVenda || 0}</TableCell>
                      <TableCell>{product.codigoBarras || 'N/A'}</TableCell>
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
                    <TableCell colSpan={6} align="center">
                      Nenhum produto encontrado.
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

export default ProductComponent;
