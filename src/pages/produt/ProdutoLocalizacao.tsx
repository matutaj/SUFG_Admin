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
  ProdutoLocalizacao,
  Localizacao,
  Seccao,
  Prateleira,
  Corredor,
} from '../../types/models';
import {
  getProducts,
  getProductLocations,
  createProductLocation,
  updateProductLocation,
  deleteProductLocation,
  getLocations,
  getSections,
  getShelves,
  getCorridors,
  getStockByProduct,
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

const isStoreLocation = (locationId: string | undefined, locations: Localizacao[]): boolean => {
  if (!locationId) return false;
  const location = locations.find((loc) => loc.id === locationId);
  return location?.nomeLocalizacao.toLowerCase().includes('loja') || false;
};

const ProductLocationComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openLocationModal, setOpenLocationModal] = React.useState(false);
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
  const [locationToDelete, setLocationToDelete] = React.useState<string | null>(null);
  const [editLocationId, setEditLocationId] = React.useState<string | null>(null);
  const [idProdutoLocalizacao, setIdProdutoLocalizacao] = React.useState<string>('');
  const [idLocalizacao, setIdLocalizacao] = React.useState<string>('');
  const [idSeccao, setIdSeccao] = React.useState<string>('');
  const [idPrateleira, setIdPrateleira] = React.useState<string>('');
  const [idCorredor, setIdCorredor] = React.useState<string>('');
  const [quantidadeProduto, setQuantidadeProduto] = React.useState<number>(0);
  const [quantidadeMinimaProduto, setQuantidadeMinimaProduto] = React.useState<number>(0);
  const [stockQuantity, setStockQuantity] = React.useState<number | null>(null);
  const [warehouseQuantity, setWarehouseQuantity] = React.useState<number>(0);
  const [remainingStoreQuantity, setRemainingStoreQuantity] = React.useState<number | null>(null);
  const [selectedLocationType, setSelectedLocationType] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [products, setProducts] = React.useState<Produto[]>([]);
  const [locations, setLocations] = React.useState<Localizacao[]>([]);
  const [sections, setSections] = React.useState<Seccao[]>([]);
  const [shelves, setShelves] = React.useState<Prateleira[]>([]);
  const [corridors, setCorridors] = React.useState<Corredor[]>([]);
  const [productLocations, setProductLocations] = React.useState<ProdutoLocalizacao[]>([]);
  const [filteredProductLocations, setFilteredProductLocations] = React.useState<
    ProdutoLocalizacao[]
  >([]);
  const [errors, setErrors] = React.useState<{
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

  const handleOpenLocation = () => setOpenLocationModal(true);

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
    setStockQuantity(null);
    setWarehouseQuantity(0);
    setRemainingStoreQuantity(null);
    setErrors({});
  };

  const handleOpenConfirmModal = (id: string) => {
    setLocationToDelete(id);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setLocationToDelete(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        productsData,
        locationsData,
        sectionsData,
        shelvesData,
        corridorsData,
        productLocationsData,
      ] = await Promise.all([
        getProducts(),
        getLocations(),
        getSections(),
        getShelves(),
        getCorridors(),
        getProductLocations(),
      ]);

      const cleanedProductLocations = productLocationsData.map((loc) => ({
        ...loc,
        id_produto: loc.id_produto ?? '',
        id_localizacao: loc.id_localizacao ?? '',
        id_seccao: loc.id_seccao ?? '',
        id_prateleira: loc.id_prateleira ?? '',
        id_corredor: loc.id_corredor ?? '',
        quantidadeProduto: loc.quantidadeProduto ?? 0,
        quantidadeMinimaProduto: loc.quantidadeMinimaProduto ?? 0,
      }));

      setProducts(productsData);
      setLocations(locationsData);
      setSections(sectionsData);
      setShelves(shelvesData);
      setCorridors(corridorsData);
      setProductLocations(cleanedProductLocations);
      setFilteredProductLocations(cleanedProductLocations);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar dados!' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    let filtered = productLocations;

    if (selectedLocationType !== '') {
      filtered = filtered.filter((location) => location.id_localizacao === selectedLocationType);
    }

    if (searchQuery !== '') {
      filtered = filtered.filter((location) => {
        const product = products.find((p) => p.id === location.id_produto);
        return product?.nomeProduto.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      });
    }

    setFilteredProductLocations(filtered);
  }, [selectedLocationType, searchQuery, productLocations, products]);

  React.useEffect(() => {
    const fetchStockAndWarehouseData = async () => {
      if (idProdutoLocalizacao) {
        const stock = await getStockByProduct(idProdutoLocalizacao).catch(() => null);
        const totalStock = stock ? Number(stock.quantidadeAtual) : 0;
        setStockQuantity(totalStock);

        const warehouseQty = productLocations
          .filter(
            (loc) =>
              loc.id_produto === idProdutoLocalizacao &&
              !isStoreLocation(loc.id_localizacao, locations),
          )
          .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
        setWarehouseQuantity(warehouseQty);

        const remaining = totalStock - warehouseQty;
        setRemainingStoreQuantity(remaining >= 0 ? remaining : 0);
      } else {
        setStockQuantity(null);
        setWarehouseQuantity(0);
        setRemainingStoreQuantity(null);
      }
    };
    fetchStockAndWarehouseData();
  }, [idProdutoLocalizacao, productLocations, locations]);

  const getTotalStockInLocations = (productId: string): number => {
    return productLocations
      .filter((loc) => loc.id_produto === productId)
      .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
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
    if (quantidadeProduto < quantidadeMinimaProduto)
      newErrors.quantidadeProduto = `A quantidade não pode ser inferior ao limite mínimo (${quantidadeMinimaProduto})!`;

    const stockItem = await getStockByProduct(idProdutoLocalizacao).catch(() => null);
    const totalStock = Number(stockItem?.quantidadeAtual) || 0;

    if (!stockItem) {
      newErrors.idProdutoLocalizacao = 'Este produto não possui estoque registrado.';
    } else {
      const currentLocationQty = editLocationId
        ? productLocations.find((loc) => loc.id === editLocationId)?.quantidadeProduto || 0
        : 0;
      const currentTotal = getTotalStockInLocations(idProdutoLocalizacao);
      const newTotal = currentTotal - currentLocationQty + quantidadeProduto;

      if (isStoreLocation(idLocalizacao, locations)) {
        // Para "loja": permitir até o estoque total se houver quantidade no armazém
        if (newTotal > totalStock) {
          newErrors.quantidadeProduto = `Quantidade excede o estoque total disponível (${totalStock})!`;
        } else if (remainingStoreQuantity === 0 && quantidadeProduto > currentLocationQty) {
          newErrors.quantidadeProduto = 'Não há estoque disponível para adicionar mais na loja!';
        }
      } else {
        // Para "armazém": permitir até o limite do estoque total
        if (newTotal > totalStock) {
          newErrors.quantidadeProduto = `Quantidade excede o estoque total disponível (${totalStock})!`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const locationData: ProdutoLocalizacao = {
        id_produto: idProdutoLocalizacao,
        id_localizacao: idLocalizacao,
        id_seccao: idSeccao,
        id_prateleira: idPrateleira,
        id_corredor: idCorredor,
        quantidadeProduto: quantidadeProduto,
        quantidadeMinimaProduto: quantidadeMinimaProduto,
        id: editLocationId || undefined,
      };

      let updatedLocations: ProdutoLocalizacao[];
      if (editLocationId) {
        await updateProductLocation(editLocationId, locationData);
        updatedLocations = productLocations.map((loc) =>
          loc.id === editLocationId ? locationData : loc,
        );
      } else {
        const newLocation = await createProductLocation(locationData);
        updatedLocations = [...productLocations, newLocation];
      }

      setProductLocations(updatedLocations);
      setFilteredProductLocations(updatedLocations);
      setAlert({
        severity: 'success',
        message: editLocationId
          ? 'Localização atualizada com sucesso!'
          : 'Localização cadastrada com sucesso!',
      });
      handleCloseLocation();
    } catch (error) {
      console.error('Erro ao salvar localização do produto:', error);
      setErrors({
        idProdutoLocalizacao: (error as Error).message || 'Erro ao salvar. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditLocation = (id: string) => {
    const locationToEdit = productLocations.find((loc) => loc.id === id);
    if (locationToEdit) {
      setIdProdutoLocalizacao(locationToEdit.id_produto ?? '');
      setIdLocalizacao(locationToEdit.id_localizacao ?? '');
      setIdSeccao(locationToEdit.id_seccao ?? '');
      setIdPrateleira(locationToEdit.id_prateleira ?? '');
      setIdCorredor(locationToEdit.id_corredor ?? '');
      setQuantidadeProduto(locationToEdit.quantidadeProduto ?? 0);
      setQuantidadeMinimaProduto(locationToEdit.quantidadeMinimaProduto ?? 0);
      setEditLocationId(id);
      setOpenLocationModal(true);
    } else {
      console.warn('Localização não encontrada para o ID:', id);
      setAlert({ severity: 'error', message: 'Localização não encontrada!' });
    }
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      setLoading(true);
      const locationToRemove = productLocations.find((loc) => loc.id === locationToDelete);
      if (!locationToRemove) throw new Error('Localização não encontrada.');

      await deleteProductLocation(locationToDelete);
      const updatedLocations = productLocations.filter((loc) => loc.id !== locationToDelete);

      setProductLocations(updatedLocations);
      setFilteredProductLocations(updatedLocations);
      setAlert({ severity: 'success', message: 'Localização do produto excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir localização do produto:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir localização!' });
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
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
            <Typography variant="h5">Localizações de Produtos</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Select
                value={selectedLocationType}
                onChange={(e) => setSelectedLocationType(e.target.value as string)}
                displayEmpty
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todas as Localizações</MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.nomeLocalizacao}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label="Pesquisar Produto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 200 }}
                placeholder="Digite o nome do produto"
                InputProps={{
                  endAdornment: (
                    <IconifyIcon icon="heroicons-solid:search" sx={{ color: 'text.secondary' }} />
                  ),
                }}
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenLocation}
                disabled={loading}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              >
                Nova Localização
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openLocationModal} onClose={handleCloseLocation}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editLocationId ? 'Editar Localização do Produto' : 'Cadastrar Localização do Produto'}
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <Select
                value={idProdutoLocalizacao}
                onChange={(e) => setIdProdutoLocalizacao(e.target.value as string)}
                displayEmpty
                fullWidth
                error={!!errors.idProdutoLocalizacao}
              >
                <MenuItem value="" disabled>
                  Selecione um Produto
                </MenuItem>
                {products.map((prod) => (
                  <MenuItem key={prod.id} value={prod.id}>
                    {prod.nomeProduto}
                  </MenuItem>
                ))}
              </Select>
              {errors.idProdutoLocalizacao && (
                <FormHelperText error>{errors.idProdutoLocalizacao}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={idLocalizacao}
                onChange={(e) => setIdLocalizacao(e.target.value as string)}
                displayEmpty
                fullWidth
                error={!!errors.idLocalizacao}
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
                error={!!errors.idSeccao}
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
                error={!!errors.idPrateleira}
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
                error={!!errors.idCorredor}
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
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Quantidade do Produto"
                  type="number"
                  value={quantidadeProduto}
                  onChange={(e) => setQuantidadeProduto(Number(e.target.value) || 0)}
                  error={!!errors.quantidadeProduto}
                  helperText={errors.quantidadeProduto}
                  disabled={loading}
                  fullWidth
                />
                {isStoreLocation(idLocalizacao, locations) ? (
                  <Typography variant="body2" color="text.secondary">
                    Estoque: {stockQuantity !== null ? stockQuantity : 'N/A'} | Armazém:{' '}
                    {warehouseQuantity} | Restante:{' '}
                    {remainingStoreQuantity !== null ? remainingStoreQuantity : 'N/A'}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Estoque: {stockQuantity !== null ? stockQuantity : 'N/A'}
                  </Typography>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Limite Mínimo"
                type="number"
                value={quantidadeMinimaProduto}
                onChange={(e) => setQuantidadeMinimaProduto(Number(e.target.value) || 0)}
                error={!!errors.quantidadeMinimaProduto}
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

      <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
        <Box sx={confirmModalStyle}>
          <Typography variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir esta localização do produto? Esta ação não pode ser
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
              onClick={handleDeleteLocation}
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
                    <strong>Referência</strong>
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
                    <strong>Limite Mínimo</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProductLocations.length > 0 ? (
                  filteredProductLocations.map((location) => {
                    const product = products.find((p) => p.id === location.id_produto);
                    const isBelowLimit =
                      (location.quantidadeProduto ?? 0) <= (location.quantidadeMinimaProduto ?? 0);
                    return (
                      <TableRow key={location.id ?? ''}>
                        <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                          {product?.nomeProduto || 'N/A'}
                        </TableCell>
                        <TableCell>{product?.referenciaProduto || 'N/A'}</TableCell>
                        <TableCell>
                          {locations.find((l) => l.id === location.id_localizacao)
                            ?.nomeLocalizacao || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {sections.find((s) => s.id === location.id_seccao)?.nomeSeccao || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {shelves.find((s) => s.id === location.id_prateleira)?.nomePrateleira ||
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {corridors.find((c) => c.id === location.id_corredor)?.nomeCorredor ||
                            'N/A'}
                        </TableCell>
                        <TableCell>{location.quantidadeProduto ?? 0}</TableCell>
                        <TableCell>{location.quantidadeMinimaProduto ?? 0}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditLocation(location.id ?? '')}
                            disabled={loading}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenConfirmModal(location.id ?? '')}
                            disabled={loading}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Nenhuma localização cadastrada.
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

export default ProductLocationComponent;
