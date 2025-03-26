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
  Alert,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import {
  Produto,
  CategoriaProduto,
  ProdutoLocalizacao,
  Localizacao,
  Seccao,
  Prateleira,
  Corredor,
} from '../../types/models';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getProductLocations,
  createProductLocation,
  updateProductLocation,
  deleteProductLocation,
  getLocations,
  getSections,
  getShelves,
  getCorridors,
} from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

const style = {
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
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#6c63ff #f1f1f1',
};

const ProductComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [openLocationModal, setOpenLocationModal] = React.useState(false);
  const [editProductId, setEditProductId] = React.useState<string | null>(null);
  const [editLocationId, setEditLocationId] = React.useState<string | null>(null);
  const [nomeProduto, setNomeProduto] = React.useState('');
  const [referenciaProduto, setReferenciaProduto] = React.useState('');
  const [idCategoriaProduto, setIdCategoriaProduto] = React.useState('');
  const [custoAquisicao, setCustoAquisicao] = React.useState('');
  const [precoVenda, setPrecoVenda] = React.useState(0);
  const [quantidadeEstoque, setQuantidadeEstoque] = React.useState(0);
  const [unidadeMedida, setUnidadeMedida] = React.useState('');
  const [unidadeConteudo, setUnidadeConteudo] = React.useState('');
  const [codigoBarras, setCodigoBarras] = React.useState('');
  const [idProdutoLocalizacao, setIdProdutoLocalizacao] = React.useState('');
  const [idLocalizacao, setIdLocalizacao] = React.useState('');
  const [idSeccao, setIdSeccao] = React.useState('');
  const [idPrateleira, setIdPrateleira] = React.useState('');
  const [idCorredor, setIdCorredor] = React.useState('');
  const [quantidadeProduto, setQuantidadeProduto] = React.useState(0);
  const [quantidadeMinimaProduto, setQuantidadeMinimaProduto] = React.useState(0);
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [categories, setCategories] = React.useState<CategoriaProduto[]>([]);
  const [locations, setLocations] = React.useState<Localizacao[]>([]);
  const [sections, setSections] = React.useState<Seccao[]>([]);
  const [shelves, setShelves] = React.useState<Prateleira[]>([]);
  const [corridors, setCorridors] = React.useState<Corredor[]>([]);
  const [productLocations, setProductLocations] = React.useState<ProdutoLocalizacao[]>([]);
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
    idProdutoLocalizacao?: string;
    idLocalizacao?: string;
    idSeccao?: string;
    idPrateleira?: string;
    idCorredor?: string;
    quantidadeProduto?: string;
    quantidadeMinimaProduto?: string;
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

  const handleOpenLocation = (productId: string) => {
    setIdProdutoLocalizacao(productId);
    setOpenLocationModal(true);
  };
  const handleCloseLocation = () => {
    setOpenLocationModal(false);
    setEditLocationId(null);
    setIdProdutoLocalizacao('');
    setIdLocalizacao('');
    setIdSeccao('');
    setIdPrateleira('');
    setIdCorredor('');
    setQuantidadeProduto(0);
    setQuantidadeMinimaProduto(0);
    setErrors({});
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

  const fetchLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const data = await getSections();
      setSections(data);
    } catch (error) {
      console.error('Erro ao buscar seções:', error);
    }
  };

  const fetchShelves = async () => {
    try {
      const data = await getShelves();
      setShelves(data);
    } catch (error) {
      console.error('Erro ao buscar prateleiras:', error);
    }
  };

  const fetchCorridors = async () => {
    try {
      const data = await getCorridors();
      setCorridors(data);
    } catch (error) {
      console.error('Erro ao buscar corredores:', error);
    }
  };

  const fetchProductLocations = async () => {
    try {
      setLoading(true);
      const data = await getProductLocations();
      setProductLocations(data);
    } catch (error) {
      console.error('Erro ao buscar localizações de produtos:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar localizações de produtos!' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
    fetchSections();
    fetchShelves();
    fetchCorridors();
    fetchProductLocations();
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

  const handleAddProductLocation = async () => {
    const newErrors: {
      idProdutoLocalizacao?: string;
      idLocalizacao?: string;
      idSeccao?: string;
      idPrateleira?: string;
      idCorredor?: string;
      quantidadeProduto?: string;
      quantidadeMinimaProduto?: string;
    } = {};
    if (!idProdutoLocalizacao) newErrors.idProdutoLocalizacao = 'O produto é obrigatório.';
    if (!idLocalizacao) newErrors.idLocalizacao = 'A localização é obrigatória.';
    if (!idSeccao) newErrors.idSeccao = 'A seção é obrigatória.';
    if (!idPrateleira) newErrors.idPrateleira = 'A prateleira é obrigatória.';
    if (!idCorredor) newErrors.idCorredor = 'O corredor é obrigatório.';
    if (quantidadeProduto < 0) newErrors.quantidadeProduto = 'A quantidade não pode ser negativa.';
    if (quantidadeMinimaProduto < 0)
      newErrors.quantidadeMinimaProduto = 'A quantidade mínima não pode ser negativa.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const locationData = {
        id_produto: idProdutoLocalizacao,
        id_localizacao: idLocalizacao,
        id_seccao: idSeccao,
        id_prateleira: idPrateleira,
        id_corredor: idCorredor,
        quantidadeProduto,
        quantidadeMinimaProduto,
      };
      if (editLocationId) {
        await updateProductLocation(editLocationId, locationData);
        setAlert({
          severity: 'success',
          message: 'Localização do produto atualizada com sucesso!',
        });
      } else {
        await createProductLocation(locationData);
        setAlert({
          severity: 'success',
          message: 'Localização do produto cadastrada com sucesso!',
        });
      }
      await fetchProductLocations();
      handleCloseLocation();
    } catch (error) {
      console.error('Erro ao salvar localização do produto:', error);
      setErrors({ idProdutoLocalizacao: 'Erro ao salvar. Tente novamente.' });
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

  const handleEditLocation = (id: string) => {
    const locationToEdit = productLocations.find((loc) => loc.id === id);
    if (locationToEdit) {
      setIdProdutoLocalizacao(locationToEdit.id_produto || '');
      setIdLocalizacao(locationToEdit.id_localizacao || '');
      setIdSeccao(locationToEdit.id_seccao || '');
      setIdPrateleira(locationToEdit.id_prateleira || '');
      setIdCorredor(locationToEdit.id_corredor || '');
      setQuantidadeProduto(locationToEdit.quantidadeProduto || 0);
      setQuantidadeMinimaProduto(locationToEdit.quantidadeMinimaProduto || 0);
      setEditLocationId(id);
      handleOpenLocation(locationToEdit.id_produto!);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        setLoading(true);
        await deleteProduct(id);
        await fetchProducts();
        setAlert({ severity: 'success', message: 'Produto excluído com sucesso!' });
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir produto!' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta localização do produto?')) {
      try {
        setLoading(true);
        await deleteProductLocation(id);
        await fetchProductLocations();
        setAlert({ severity: 'success', message: 'Localização do produto excluída com sucesso!' });
      } catch (error) {
        console.error('Erro ao excluir localização do produto:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir localização!' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Produtos</Typography>
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
        <Box sx={style} component="form" noValidate autoComplete="off">
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
              <Select
                value={idCategoriaProduto}
                onChange={(e) => setIdCategoriaProduto(e.target.value as string)}
                displayEmpty
                fullWidth
                error={Boolean(errors.idCategoriaProduto)}
              >
                <MenuItem value="" disabled>
                  Selecione uma Categoria
                </MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nomeCategoria}
                  </MenuItem>
                ))}
              </Select>
              {errors.idCategoriaProduto && (
                <FormHelperText error>{errors.idCategoriaProduto}</FormHelperText>
              )}
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
        </Box>
      </Modal>

      {/* Modal para Localização do Produto */}
      <Modal open={openLocationModal} onClose={handleCloseLocation}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editLocationId ? 'Editar Localização do Produto' : 'Cadastrar Localização do Produto'}
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <Select
                value={idLocalizacao}
                onChange={(e) => setIdLocalizacao(e.target.value as string)}
                displayEmpty
                fullWidth
                error={Boolean(errors.idLocalizacao)}
              >
                <MenuItem value="" disabled>
                  Selecione uma Localização
                </MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.nomeLocalizacao}
                  </MenuItem>
                ))}
              </Select>
              {errors.idLocalizacao && (
                <FormHelperText error>{errors.idLocalizacao}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={idSeccao}
                onChange={(e) => setIdSeccao(e.target.value as string)}
                displayEmpty
                fullWidth
                error={Boolean(errors.idSeccao)}
              >
                <MenuItem value="" disabled>
                  Selecione uma Seção
                </MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>
                    {sec.nomeSeccao}
                  </MenuItem>
                ))}
              </Select>
              {errors.idSeccao && <FormHelperText error>{errors.idSeccao}</FormHelperText>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={idPrateleira}
                onChange={(e) => setIdPrateleira(e.target.value as string)}
                displayEmpty
                fullWidth
                error={Boolean(errors.idPrateleira)}
              >
                <MenuItem value="" disabled>
                  Selecione uma Prateleira
                </MenuItem>
                {shelves.map((shelf) => (
                  <MenuItem key={shelf.id} value={shelf.id}>
                    {shelf.nomePrateleira}
                  </MenuItem>
                ))}
              </Select>
              {errors.idPrateleira && <FormHelperText error>{errors.idPrateleira}</FormHelperText>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={idCorredor}
                onChange={(e) => setIdCorredor(e.target.value as string)}
                displayEmpty
                fullWidth
                error={Boolean(errors.idCorredor)}
              >
                <MenuItem value="" disabled>
                  Selecione um Corredor
                </MenuItem>
                {corridors.map((corr) => (
                  <MenuItem key={corr.id} value={corr.id}>
                    {corr.nomeCorredor}
                  </MenuItem>
                ))}
              </Select>
              {errors.idCorredor && <FormHelperText error>{errors.idCorredor}</FormHelperText>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantidade do Produto"
                type="number"
                value={quantidadeProduto}
                onChange={(e) => setQuantidadeProduto(Number(e.target.value) || 0)}
                error={Boolean(errors.quantidadeProduto)}
                helperText={errors.quantidadeProduto}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantidade Mínima"
                type="number"
                value={quantidadeMinimaProduto}
                onChange={(e) => setQuantidadeMinimaProduto(Number(e.target.value) || 0)}
                error={Boolean(errors.quantidadeMinimaProduto)}
                helperText={errors.quantidadeMinimaProduto}
                disabled={loading}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddProductLocation}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? 'Salvando...' : editLocationId ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
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
                    <strong>Custo Aquisição</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Preço Venda</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Quantidade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Unidade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Código Barras</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Localização</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.nomeProduto || 'Sem nome'}</TableCell>
                      <TableCell>{product.referenciaProduto || 'N/A'}</TableCell>
                      <TableCell>
                        {categories.find((cat) => cat.id === product.id_categoriaProduto)
                          ?.nomeCategoria || 'N/A'}
                      </TableCell>
                      <TableCell>{product.custoAquisicao || 'N/A'}</TableCell>
                      <TableCell>{product.precoVenda || 0}</TableCell>
                      <TableCell>{product.quantidadeEstoque || 0}</TableCell>
                      <TableCell>{product.unidadeMedida || 'N/A'}</TableCell>
                      <TableCell>{product.codigoBarras || 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenLocation(product.id!)}
                        >
                          Adicionar Localização
                        </Button>
                      </TableCell>
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
                          onClick={() => handleDeleteProduct(product.id!)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      Nenhum produto cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Paper>
        {/* Tabela de Localizações */}
        <Typography variant="h6" mt={4} mb={2}>
          Localizações dos Produtos
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Produto</strong>
                </TableCell>
                <TableCell>
                  <strong>Localização</strong>
                </TableCell>
                <TableCell>
                  <strong>Seção</strong>
                </TableCell>
                <TableCell>
                  <strong>Prateleira</strong>
                </TableCell>
                <TableCell>
                  <strong>Corredor</strong>
                </TableCell>
                <TableCell>
                  <strong>Quantidade</strong>
                </TableCell>
                <TableCell>
                  <strong>Quantidade Mínima</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Ações</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : productLocations.length > 0 ? (
                productLocations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      {products.find((p) => p.id === location.id_produto)?.nomeProduto || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {locations.find((l) => l.id === location.id_localizacao)?.nomeLocalizacao ||
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {sections.find((s) => s.id === location.id_seccao)?.nomeSeccao || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {shelves.find((s) => s.id === location.id_prateleira)?.nomePrateleira ||
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {corridors.find((c) => c.id === location.id_corredor)?.nomeCorredor || 'N/A'}
                    </TableCell>
                    <TableCell>{location.quantidadeProduto || 0}</TableCell>
                    <TableCell>{location.quantidadeMinimaProduto || 0}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleEditLocation(location.id!)}
                        disabled={loading}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteLocation(location.id!)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nenhuma localização cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

export default ProductComponent;
