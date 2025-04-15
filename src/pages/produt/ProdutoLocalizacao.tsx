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
import { SelectChangeEvent } from '@mui/material/Select';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  getAllProducts,
  getAllProductLocations,
  createProductLocation,
  updateProductLocation,
  deleteProductLocation,
  getAllLocations,
  getAllSections,
  getAllShelves,
  getAllCorridors,
  getStockByProduct,
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
  maxHeight: '80vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2,
  scrollbarWidth: 'thin',
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
  borderRadius: 2,
};

const isStoreLocation = (locationId: string | undefined, locations: Localizacao[]): boolean => {
  if (!locationId) return false;
  const location = locations.find((loc) => loc.id === locationId);
  return location?.nomeLocalizacao.toLowerCase().includes('loja') || false;
};

const ProductLocationComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | undefined>(undefined);
  const [editLocationId, setEditLocationId] = useState<string | undefined>(undefined);
  const [idProdutoLocalizacao, setIdProdutoLocalizacao] = useState<string>('');
  const [idLocalizacao, setIdLocalizacao] = useState<string>('');
  const [idSeccao, setIdSeccao] = useState<string>('');
  const [idPrateleira, setIdPrateleira] = useState<string>('');
  const [idCorredor, setIdCorredor] = useState<string>('');
  const [quantidadeProduto, setQuantidadeProduto] = useState<number>(0);
  const [quantidadeMinimaProduto, setQuantidadeMinimaProduto] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number | null>(null);
  const [warehouseQuantity, setWarehouseQuantity] = useState<number>(0);
  const [remainingStoreQuantity, setRemainingStoreQuantity] = useState<number | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<Produto[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [sections, setSections] = useState<Seccao[]>([]);
  const [shelves, setShelves] = useState<Prateleira[]>([]);
  const [corridors, setCorridors] = useState<Corredor[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [errors, setErrors] = useState<{
    idProdutoLocalizacao?: string;
    idLocalizacao?: string;
    idSeccao?: string;
    idPrateleira?: string;
    idCorredor?: string;
    quantidadeProduto?: string;
    quantidadeMinimaProduto?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const handleOpenLocation = useCallback(() => setOpenLocationModal(true), []);

  const handleCloseLocation = useCallback(() => {
    setOpenLocationModal(false);
    setEditLocationId(undefined);
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
  }, []);

  const handleOpenConfirmModal = useCallback((id: string) => {
    setLocationToDelete(id);
    setOpenConfirmModal(true);
  }, []);

  const handleCloseConfirmModal = useCallback(() => {
    setOpenConfirmModal(false);
    setLocationToDelete(undefined);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setAlert(null);
      const results = await Promise.allSettled([
        getAllProducts(),
        getAllLocations(),
        getAllSections(),
        getAllShelves(),
        getAllCorridors(),
        getAllProductLocations(),
      ]);

      const [
        productsResult,
        locationsResult,
        sectionsResult,
        shelvesResult,
        corridorsResult,
        productLocationsResult,
      ] = results;

      const newProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];
      const newLocations = locationsResult.status === 'fulfilled' ? locationsResult.value : [];
      const newSections = sectionsResult.status === 'fulfilled' ? sectionsResult.value : [];
      const newShelves = shelvesResult.status === 'fulfilled' ? shelvesResult.value : [];
      const newCorridors = corridorsResult.status === 'fulfilled' ? corridorsResult.value : [];
      const newProductLocations =
        productLocationsResult.status === 'fulfilled' ? productLocationsResult.value : [];

      setProducts(newProducts);
      setLocations(newLocations);
      setSections(newSections);
      setShelves(newShelves);
      setCorridors(newCorridors);
      setProductLocations(newProductLocations);

      if (results.some((result) => result.status === 'rejected')) {
        setAlert({
          severity: 'warning',
          message: 'Alguns dados não foram carregados corretamente.',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar dados!' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchStockAndWarehouseData = async () => {
      if (!idProdutoLocalizacao) {
        setStockQuantity(null);
        setWarehouseQuantity(0);
        setRemainingStoreQuantity(null);
        return;
      }

      try {
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
      } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        setStockQuantity(0);
        setWarehouseQuantity(0);
        setRemainingStoreQuantity(0);
      }
    };
    fetchStockAndWarehouseData();
  }, [idProdutoLocalizacao, productLocations, locations]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const getTotalStockInLocations = useCallback(
    (productId: string, excludeLocationId?: string): number => {
      return productLocations
        .filter((loc) => loc.id_produto === productId && loc.id !== excludeLocationId)
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
    },
    [productLocations],
  );

  const filteredProductLocations = useMemo(() => {
    let filtered = productLocations;

    if (selectedLocationType) {
      filtered = filtered.filter((location) => location.id_localizacao === selectedLocationType);
    }

    if (searchQuery) {
      filtered = filtered.filter((location) => {
        const product = products.find((p) => p.referenciaProduto === location.id_produto);
        return product?.nomeProduto.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      });
    }

    return filtered;
  }, [selectedLocationType, searchQuery, productLocations, products]);

  const handleAddProductLocation = useCallback(async () => {
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

    // Check for duplicate location
    const isDuplicate = productLocations.some(
      (loc) =>
        loc.id_produto === idProdutoLocalizacao &&
        loc.id_localizacao === idLocalizacao &&
        loc.id_seccao === idSeccao &&
        loc.id_prateleira === idPrateleira &&
        loc.id_corredor === idCorredor &&
        loc.id !== editLocationId,
    );
    if (isDuplicate) {
      newErrors.idProdutoLocalizacao = 'Já existe uma localização idêntica para este produto.';
    }

    let totalStock = 0;
    try {
      const stockItem = await getStockByProduct(idProdutoLocalizacao);
      totalStock = Number(stockItem?.quantidadeAtual) || 0;
    } catch {
      newErrors.idProdutoLocalizacao = 'Este produtonão possui estoque registrado.';
    }

    if (totalStock > 0) {
      const currentTotal = getTotalStockInLocations(idProdutoLocalizacao, editLocationId);
      const newTotal = currentTotal + quantidadeProduto;

      if (isStoreLocation(idLocalizacao, locations)) {
        if (newTotal > totalStock) {
          newErrors.quantidadeProduto = `Quantidade excede o estoque total disponível (${totalStock})!`;
        } else if (remainingStoreQuantity === 0 && quantidadeProduto > 0 && !editLocationId) {
          newErrors.quantidadeProduto = 'Não há estoque disponível para adicionar mais na loja!';
        }
      } else {
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
      setAlert(null);
      const locationData: ProdutoLocalizacao = {
        id_produto: idProdutoLocalizacao,
        id_localizacao: idLocalizacao,
        id_seccao: idSeccao,
        id_prateleira: idPrateleira,
        id_corredor: idCorredor,
        quantidadeProduto,
        quantidadeMinimaProduto,
        id: editLocationId,
      };

      let updatedLocations: ProdutoLocalizacao[];
      if (editLocationId) {
        await updateProductLocation(editLocationId, locationData);
        updatedLocations = productLocations.map((loc) =>
          loc.id === editLocationId ? { ...loc, ...locationData } : loc,
        );
      } else {
        const newLocation = await createProductLocation(locationData);
        updatedLocations = [...productLocations, newLocation];
      }

      setProductLocations(updatedLocations);
      setAlert({
        severity: 'success',
        message: editLocationId
          ? 'Localização atualizada com sucesso!'
          : 'Localização cadastrada com sucesso!',
      });
      handleCloseLocation();
    } catch (error) {
      console.error('Erro ao salvar localização do produto:', error);
      setAlert({ severity: 'error', message: 'Erro ao salvar localização!' });
    } finally {
      setLoading(false);
    }
  }, [
    idProdutoLocalizacao,
    idLocalizacao,
    idSeccao,
    idPrateleira,
    idCorredor,
    quantidadeProduto,
    quantidadeMinimaProduto,
    editLocationId,
    productLocations,
    locations,
    remainingStoreQuantity,
    getTotalStockInLocations,
    handleCloseLocation,
  ]);

  const handleEditLocation = useCallback(
    (id: string) => {
      const locationToEdit = productLocations.find((loc) => loc.id === id);
      if (locationToEdit) {
        setIdProdutoLocalizacao(locationToEdit.id_produto);
        setIdLocalizacao(locationToEdit.id_localizacao);
        setIdSeccao(locationToEdit.id_seccao);
        setIdPrateleira(locationToEdit.id_prateleira);
        setIdCorredor(locationToEdit.id_corredor);
        setQuantidadeProduto(locationToEdit.quantidadeProduto);
        setQuantidadeMinimaProduto(locationToEdit.quantidadeMinimaProduto);
        setEditLocationId(id);
        setErrors({});
        setOpenLocationModal(true);
      } else {
        setAlert({ severity: 'error', message: 'Localização não encontrada!' });
      }
    },
    [productLocations],
  );

  const handleDeleteLocation = useCallback(async () => {
    if (!locationToDelete) return;

    try {
      setLoading(true);
      setAlert(null);
      await deleteProductLocation(locationToDelete);
      const updatedLocations = productLocations.filter((loc) => loc.id !== locationToDelete);
      setProductLocations(updatedLocations);
      setAlert({ severity: 'success', message: 'Localização do produto excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir localização do produto:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir localização!' });
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
    }
  }, [locationToDelete, productLocations, handleCloseConfirmModal]);

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 300 }}>
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
                onChange={(e: SelectChangeEvent<string>) => setSelectedLocationType(e.target.value)}
                displayEmpty
                sx={{ minWidth: 200 }}
                disabled={loading}
                aria-label="Filtrar por localização"
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
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <IconifyIcon icon="heroicons-solid:search" sx={{ color: 'text.secondary' }} />
                  ),
                }}
                aria-label="Pesquisar produto"
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenLocation}
                disabled={loading}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                aria-label="Adicionar nova localização"
              >
                Nova Localização
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal
        open={openLocationModal}
        onClose={handleCloseLocation}
        aria-labelledby="modal-localizacao-produto"
        aria-describedby="modal-localizacao-descricao"
      >
        <Box sx={modalStyle} component="form" noValidate autoComplete="off">
          <Typography id="modal-localizacao-produto" variant="h5" mb={2}>
            {editLocationId ? 'Editar Localização do Produto' : 'Cadastrar Localização do Produto'}
          </Typography>
          <Typography id="modal-localizacao-descricao" sx={{ display: 'none' }}>
            Formulário para cadastrar ou editar a localização de um produto no estoque.
          </Typography>
          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <Select
                value={idProdutoLocalizacao}
                onChange={(e: SelectChangeEvent<string>) => setIdProdutoLocalizacao(e.target.value)}
                displayEmpty
                fullWidth
                error={!!errors.idProdutoLocalizacao}
                disabled={loading || !!editLocationId}
                aria-label="Selecionar produto"
              >
                <MenuItem value="" disabled>
                  Selecione um Produto
                </MenuItem>
                {products.map((prod) => (
                  <MenuItem key={prod.referenciaProduto} value={prod.referenciaProduto}>
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
                onChange={(e: SelectChangeEvent<string>) => setIdLocalizacao(e.target.value)}
                displayEmpty
                fullWidth
                error={!!errors.idLocalizacao}
                disabled={loading}
                aria-label="Selecionar localização"
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
                onChange={(e: SelectChangeEvent<string>) => setIdSeccao(e.target.value)}
                displayEmpty
                fullWidth
                error={!!errors.idSeccao}
                disabled={loading}
                aria-label="Selecionar seção"
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
                onChange={(e: SelectChangeEvent<string>) => setIdPrateleira(e.target.value)}
                displayEmpty
                fullWidth
                error={!!errors.idPrateleira}
                disabled={loading}
                aria-label="Selecionar prateleira"
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
                onChange={(e: SelectChangeEvent<string>) => setIdCorredor(e.target.value)}
                displayEmpty
                fullWidth
                error={!!errors.idCorredor}
                disabled={loading}
                aria-label="Selecionar corredor"
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
                  inputProps={{ min: 0 }}
                  aria-label="Quantidade do produto"
                />
                {isStoreLocation(idLocalizacao, locations) ? (
                  <Typography variant="body2" color="text.secondary">
                    Estoque: {stockQuantity ?? 'N/A'} | Armazém: {warehouseQuantity} | Restante:{' '}
                    {remainingStoreQuantity ?? 'N/A'}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Estoque: {stockQuantity ?? 'N/A'}
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
                inputProps={{ min: 0 }}
                aria-label="Limite mínimo"
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
                aria-label={editLocationId ? 'Atualizar localização' : 'Cadastrar localização'}
              >
                {loading ? 'Salvando...' : editLocationId ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Modal
        open={openConfirmModal}
        onClose={handleCloseConfirmModal}
        aria-labelledby="modal-confirmar-exclusao"
        aria-describedby="modal-confirmar-exclusao-descricao"
      >
        <Box sx={confirmModalStyle}>
          <Typography id="modal-confirmar-exclusao" variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography id="modal-confirmar-exclusao-descricao" variant="body1" mb={3}>
            Tem certeza que deseja excluir esta localização do produto? Esta ação não pode ser
            desfeita.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseConfirmModal}
              disabled={loading}
              aria-label="Cancelar exclusão"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteLocation}
              disabled={loading}
              aria-label="Confirmar exclusão"
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
            <Table aria-label="Tabela de localizações de produtos">
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
                    if (!location.id) return null;
                    const product = products.find(
                      (p) => p.referenciaProduto === location.id_produto,
                    );
                    const isBelowLimit =
                      (location.quantidadeProduto ?? 0) <= (location.quantidadeMinimaProduto ?? 0);
                    return (
                      <TableRow key={location.id}>
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
                            onClick={() => handleEditLocation(location.id!)}
                            disabled={loading}
                            aria-label={`Editar localização ${location.id}`}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenConfirmModal(location.id!)}
                            disabled={loading}
                            aria-label={`Excluir localização ${location.id}`}
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
