import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
  TablePagination,
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
  Transferencia,
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
  createTransfer,
} from '../../api/methods';

// Interface para decodificação do token
interface DecodedToken {
  userId?: string;
  sub?: string;
}

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

const transferModalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const isStoreLocation = (locationId: string | undefined, locations: Localizacao[]): boolean => {
  if (!locationId) return false;
  const location = locations.find((loc) => loc.id === locationId);
  return location?.tipo === 'Loja' || false;
};

const ProductLocationComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | undefined>(undefined);
  const [editLocationId, setEditLocationId] = useState<string | undefined>(undefined);
  const [transferProductId, setTransferProductId] = useState<string | undefined>(undefined);
  const [transferQuantity, setTransferQuantity] = useState<number>(0);
  const [transferFromLocation, setTransferFromLocation] = useState<string | undefined>(undefined);
  const [transferToLocation, setTransferToLocation] = useState<string | undefined>(undefined);
  const [transferSection, setTransferSection] = useState<string>('');
  const [transferShelf, setTransferShelf] = useState<string>('');
  const [transferCorridor, setTransferCorridor] = useState<string>('');
  const [idProdutoLocalizacao, setIdProdutoLocalizacao] = useState<string>('');
  const [idLocalizacao, setIdLocalizacao] = useState<string>('');
  const [idSeccao, setIdSeccao] = useState<string>('');
  const [idPrateleira, setIdPrateleira] = useState<string>('');
  const [idCorredor, setIdCorredor] = useState<string>('');
  const [quantidadeProduto, setQuantidadeProduto] = useState<number>(0);
  const [quantidadeMinimaProduto, setQuantidadeMinimaProduto] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number | null>(null);
  const [warehouseQuantity, setWarehouseQuantity] = useState<number>(0);
  const [storeQuantity, setStoreQuantity] = useState<number>(0);
  const [remainingQuantity, setRemainingQuantity] = useState<number | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [products, setProducts] = useState<Produto[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [sections, setSections] = useState<Seccao[]>([]);
  const [shelves, setShelves] = useState<Prateleira[]>([]);
  const [corridors, setCorridors] = useState<Corredor[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [errors, setErrors] = useState<{
    idProdutoLocalizacao?: string;
    idLocalizacao?: string;
    idSeccao?: string;
    idPrateleira?: string;
    idCorredor?: string;
    quantidadeProduto?: string;
    quantidadeMinimaProduto?: string;
    transferProductId?: string;
    transferQuantity?: string;
    transferFromLocation?: string;
    transferToLocation?: string;
    transferSection?: string;
    transferShelf?: string;
    transferCorridor?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Função para carregar e validar o ID do funcionário
  const loadUserData = useCallback((): string => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Nenhum token encontrado. Faça login novamente.');
      }
      let decoded: DecodedToken;
      try {
        decoded = jwtDecode(token);
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
        localStorage.removeItem('token');
        throw new Error('Token inválido. Faça login novamente.');
      }
      const id = decoded.userId || decoded.sub;
      if (!id) {
        throw new Error('ID de usuário não encontrado no token.');
      }
      return id;
    } catch (error: any) {
      setIsLoading(false);
      navigate('/login');
      return '';
    }
  }, [navigate]);

  // Função centralizada para buscar todos os dados
  const fetchData = useCallback(async () => {
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

      setProducts(productsResult.status === 'fulfilled' ? productsResult.value : []);
      setLocations(locationsResult.status === 'fulfilled' ? locationsResult.value : []);
      setSections(sectionsResult.status === 'fulfilled' ? sectionsResult.value : []);
      setShelves(shelvesResult.status === 'fulfilled' ? shelvesResult.value : []);
      setCorridors(corridorsResult.status === 'fulfilled' ? corridorsResult.value : []);
      setProductLocations(
        productLocationsResult.status === 'fulfilled' && Array.isArray(productLocationsResult.value)
          ? productLocationsResult.value
          : [],
      );

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
  }, []);

  // Carregar dados do usuário logado e dados iniciais
  useEffect(() => {
    const handleStorageChange = async () => {
      setIsLoading(true);
      const id = loadUserData();
      if (!id) return;
      try {
        setLoggedInFuncionarioId(id);
        await fetchData();
      } catch (error: any) {
        setLoggedInFuncionarioId('');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchData, loadUserData, navigate]);

  // Atualizar dados de estoque e armazém
  const updateStockAndWarehouseData = useCallback(async () => {
    if (!idProdutoLocalizacao) {
      setStockQuantity(null);
      setWarehouseQuantity(0);
      setStoreQuantity(0);
      setRemainingQuantity(null);
      return;
    }

    try {
      const stock = await getStockByProduct(idProdutoLocalizacao);
      const totalStock = Number(stock.quantidadeAtual) || 0;
      setStockQuantity(totalStock);

      const updatedProductLocations = await getAllProductLocations();
      const validProductLocations = Array.isArray(updatedProductLocations)
        ? updatedProductLocations
        : [];
      setProductLocations(validProductLocations);

      const storeLocations = validProductLocations.filter(
        (loc) =>
          loc.id_produto === idProdutoLocalizacao && isStoreLocation(loc.id_localizacao, locations),
      );
      const warehouseLocations = validProductLocations.filter(
        (loc) =>
          loc.id_produto === idProdutoLocalizacao &&
          !isStoreLocation(loc.id_localizacao, locations),
      );

      const storeQty = storeLocations.reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
      const warehouseQty = warehouseLocations.reduce(
        (sum, loc) => sum + (loc.quantidadeProduto ?? 0),
        0,
      );

      setStoreQuantity(storeQty);
      setWarehouseQuantity(warehouseQty);
      setRemainingQuantity(totalStock - (storeQty + warehouseQty));
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      setStockQuantity(0);
      setWarehouseQuantity(0);
      setStoreQuantity(0);
      setRemainingQuantity(0);
    }
  }, [idProdutoLocalizacao, locations]);

  useEffect(() => {
    updateStockAndWarehouseData();
  }, [updateStockAndWarehouseData]);

  // Limpar alertas após 5 segundos
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Funções de manipulação de modais
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
    setStoreQuantity(0);
    setRemainingQuantity(null);
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

  const handleOpenTransferModal = useCallback((productId: string, locationId: string) => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }
    setTransferProductId(productId);
    setTransferFromLocation(locationId);
    setTransferQuantity(0);
    setTransferToLocation(undefined);
    setTransferSection('');
    setTransferShelf('');
    setTransferCorridor('');
    setErrors((prev) => ({
      ...prev,
      transferProductId: undefined,
      transferQuantity: undefined,
      transferFromLocation: undefined,
      transferToLocation: undefined,
      transferSection: undefined,
      transferShelf: undefined,
      transferCorridor: undefined,
    }));
    setOpenTransferModal(true);
  }, [loggedInFuncionarioId, navigate]);

  const handleCloseTransferModal = useCallback(() => {
    setOpenTransferModal(false);
    setTransferProductId(undefined);
    setTransferQuantity(0);
    setTransferFromLocation(undefined);
    setTransferToLocation(undefined);
    setTransferSection('');
    setTransferShelf('');
    setTransferCorridor('');
    setErrors((prev) => ({
      ...prev,
      transferProductId: undefined,
      transferQuantity: undefined,
      transferFromLocation: undefined,
      transferToLocation: undefined,
      transferSection: undefined,
      transferShelf: undefined,
      transferCorridor: undefined,
    }));
  }, []);

  // Funções de manipulação de paginação
  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Função para expandir/contrair localizações
  const toggleExpandLocation = useCallback((locationId: string) => {
    setExpandedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  }, []);

  // Calcular estoque total em localizações
  const getTotalStockInLocations = useCallback(
    (productId: string, excludeLocationId?: string): number => {
      return productLocations
        .filter((loc) => loc.id_produto === productId && loc.id !== excludeLocationId)
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
    },
    [productLocations],
  );

  // Filtrar e agrupar localizações
  const filteredProductLocations = useMemo(() => {
    let filtered = productLocations;
    if (selectedLocationType) {
      filtered = filtered.filter((location) => location.id_localizacao === selectedLocationType);
    }
    if (searchQuery) {
      filtered = filtered.filter((location) => {
        const product = products.find((p) => p.id === location.id_produto);
        return product?.nomeProduto.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      });
    }
    return filtered;
  }, [selectedLocationType, searchQuery, productLocations, products]);

  const groupedProductLocations = useMemo(() => {
    const grouped: { [key: string]: ProdutoLocalizacao[] } = {};
    filteredProductLocations.forEach((loc) => {
      if (!grouped[loc.id_localizacao]) {
        grouped[loc.id_localizacao] = [];
      }
      grouped[loc.id_localizacao].push(loc);
    });
    return grouped;
  }, [filteredProductLocations]);

  const uniqueLocationIds = useMemo(() => {
    return Object.keys(groupedProductLocations).sort();
  }, [groupedProductLocations]);

  const paginatedLocationIds = useMemo(() => {
    return uniqueLocationIds.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [uniqueLocationIds, page, rowsPerPage]);

  // Adicionar ou atualizar localização do produto
  const handleAddProductLocation = useCallback(async () => {
    const newErrors: typeof errors = {};

    if (!idProdutoLocalizacao) newErrors.idProdutoLocalizacao = 'O produto é obrigatório.';
    if (!idLocalizacao) newErrors.idLocalizacao = 'A localização é obrigatória.';
    if (!idSeccao) newErrors.idSeccao = 'A seção é obrigatória.';
    if (!idPrateleira) newErrors.idPrateleira = 'A prateleira é obrigatória.';
    if (!idCorredor) newErrors.idCorredor = 'O corredor é obrigatório.';
    if (quantidadeProduto <= 0)
      newErrors.quantidadeProduto = 'A quantidade deve ser maior que zero.';
    if (quantidadeMinimaProduto < 0)
      newErrors.quantidadeMinimaProduto = 'A quantidade mínima não pode ser negativa.';
    if (quantidadeProduto < quantidadeMinimaProduto)
      newErrors.quantidadeProduto = `A quantidade não pode ser inferior ao limite mínimo (${quantidadeMinimaProduto})!`;

    let totalStock = 0;
    try {
      const stockItem = await getStockByProduct(idProdutoLocalizacao);
      totalStock = Number(stockItem.quantidadeAtual) || 0;
    } catch {
      newErrors.idProdutoLocalizacao = 'Este produto não possui estoque registrado.';
    }

    if (totalStock === 0) {
      newErrors.quantidadeProduto = 'Não há estoque disponível para este produto.';
    } else {
      const currentTotal = getTotalStockInLocations(idProdutoLocalizacao, editLocationId);
      const newTotal = currentTotal + quantidadeProduto;
      if (newTotal > totalStock) {
        newErrors.quantidadeProduto = `A quantidade total alocada (${newTotal}) excede o estoque disponível (${totalStock}).`;
      } else if (remainingQuantity !== null && quantidadeProduto > remainingQuantity) {
        newErrors.quantidadeProduto = `A quantidade (${quantidadeProduto}) excede o restante disponível (${remainingQuantity}).`;
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

      const existingLocation = productLocations.find(
        (loc) =>
          loc.id_produto === idProdutoLocalizacao &&
          loc.id_localizacao === idLocalizacao &&
          loc.id_seccao === idSeccao &&
          loc.id_prateleira === idPrateleira &&
          loc.id_corredor === idCorredor &&
          loc.id !== editLocationId,
      );

      if (existingLocation && !editLocationId) {
        locationData.id = existingLocation.id;
        locationData.quantidadeProduto =
          (existingLocation.quantidadeProduto ?? 0) + quantidadeProduto;
        locationData.quantidadeMinimaProduto = Math.max(
          existingLocation.quantidadeMinimaProduto ?? 0,
          quantidadeMinimaProduto,
        );
        await updateProductLocation(existingLocation.id!, locationData);
      } else if (editLocationId) {
        await updateProductLocation(editLocationId, locationData);
      } else {
        await createProductLocation(locationData);
      }

      await fetchData();
      await updateStockAndWarehouseData();

      setAlert({
        severity: 'success',
        message: editLocationId
          ? 'Localização atualizada com sucesso!'
          : existingLocation
          ? 'Quantidade adicionada à localização existente!'
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
    getTotalStockInLocations,
    handleCloseLocation,
    updateStockAndWarehouseData,
    remainingQuantity,
    fetchData,
  ]);

  // Editar localização
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

  // Excluir localização
  const handleDeleteLocation = useCallback(async () => {
    if (!locationToDelete) return;

    try {
      setLoading(true);
      setAlert(null);
      const location = productLocations.find((loc) => loc.id === locationToDelete);
      if (location && (location.quantidadeProduto ?? 0) > 0) {
        setAlert({
          severity: 'error',
          message: 'Não é possível excluir uma localização com estoque. Transfira o estoque primeiro.',
        });
        return;
      }
      await deleteProductLocation(locationToDelete);
      await fetchData();
      await updateStockAndWarehouseData();
      setAlert({ severity: 'success', message: 'Localização do produto excluída com sucesso!' });
    } catch (error) {
      console.error('Erro ao excluir localização do produto:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir localização!' });
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
    }
  }, [locationToDelete, handleCloseConfirmModal, updateStockAndWarehouseData, productLocations, fetchData]);

  // Transferir produto
  const handleTransferProduct = useCallback(async () => {
    const newErrors: typeof errors = {};

    // Validações iniciais
    if (!transferProductId) newErrors.transferProductId = 'O produto é obrigatório.';
    if (!transferFromLocation) newErrors.transferFromLocation = 'A localização de origem é obrigatória.';
    if (!transferToLocation) newErrors.transferToLocation = 'A localização de destino é obrigatória.';
    if (transferQuantity <= 0) newErrors.transferQuantity = 'A quantidade deve ser maior que zero.';
    if (transferFromLocation === transferToLocation)
      newErrors.transferToLocation = 'A localização de destino deve ser diferente da origem.';
    if (!transferSection) newErrors.transferSection = 'A seção de destino é obrigatória.';
    if (!transferShelf) newErrors.transferShelf = 'A prateleira de destino é obrigatória.';
    if (!transferCorridor) newErrors.transferCorridor = 'O corredor de destino é obrigatório.';

    const fromLocationData = productLocations.find(
      (loc) => loc.id_produto === transferProductId && loc.id_localizacao === transferFromLocation,
    );

    if (!fromLocationData) {
      newErrors.transferFromLocation = 'Localização de origem inválida ou sem estoque.';
    } else if (transferQuantity > (fromLocationData.quantidadeProduto ?? 0)) {
      newErrors.transferQuantity = `A quantidade (${transferQuantity}) excede o disponível na origem (${
        fromLocationData.quantidadeProduto ?? 0
      }).`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    // Garantir que os IDs são strings válidas
    if (!transferProductId || !transferToLocation || !fromLocationData || !fromLocationData.id) {
      setAlert({ severity: 'error', message: 'Dados de transferência inválidos.' });
      return;
    }

    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      // Atualizar productLocations para garantir dados recentes
      await fetchData();

      // Verificar se existe um registro de ProdutoLocalizacao para o destino
      let toLocationData = productLocations.find(
        (loc) =>
          loc.id_produto === transferProductId &&
          loc.id_localizacao === transferToLocation &&
          loc.id_seccao === transferSection &&
          loc.id_prateleira === transferShelf &&
          loc.id_corredor === transferCorridor,
      );

      if (!toLocationData) {
        // Criar nova localização se não existir
        const newLocationData: ProdutoLocalizacao = {
          id_produto: transferProductId,
          id_localizacao: transferToLocation,
          id_seccao: transferSection,
          id_prateleira: transferShelf,
          id_corredor: transferCorridor,
          quantidadeProduto: transferQuantity,
          quantidadeMinimaProduto: 0,
        };
        console.log('Criando nova localização:', JSON.stringify(newLocationData, null, 2));
        toLocationData = await createProductLocation(newLocationData);
        console.log('Resposta de createProductLocation:', JSON.stringify(toLocationData, null, 2));
        if (!toLocationData || !toLocationData.id) {
          throw new Error('Falha ao criar nova localização: ID não retornado.');
        }
        // Atualizar productLocations após criar nova localização
        await fetchData();
      } else {
        // Atualizar quantidade da localização existente
        toLocationData = {
          ...toLocationData,
          quantidadeProduto: (toLocationData.quantidadeProduto ?? 0) + transferQuantity,
        };
        if (!toLocationData.id) {
          throw new Error('ID da localização de destino não encontrado.');
        }
        console.log('Atualizando localização existente:', JSON.stringify(toLocationData, null, 2));
        await updateProductLocation(toLocationData.id, toLocationData);
      }

      // Atualizar quantidade na localização de origem
      const updatedFromLocation = {
        ...fromLocationData,
        quantidadeProduto: (fromLocationData.quantidadeProduto ?? 0) - transferQuantity,
      };
      console.log('Atualizando localização de origem:', JSON.stringify(updatedFromLocation, null, 2));
      await updateProductLocation(fromLocationData.id, updatedFromLocation);

      // Criar dados da transferência
      const transferData: Transferencia = {
        id_produto: transferProductId,
        id_funcionario: loggedInFuncionarioId,
        id_produtoLocalizacao: toLocationData.id,
        dataTransferencia: new Date().toISOString().slice(0, 19).replace('T', ' '), // Formato YYYY-MM-DD HH:mm:ss
        quantidadeTransferida: transferQuantity,
      };

      // Log detalhado para depuração
      console.log('Dados enviados para createTransfer:', JSON.stringify(transferData, null, 2));

      // Chamar createTransfer
      await createTransfer(transferData);

      // Atualizar dados após transferência
      await fetchData();
      await updateStockAndWarehouseData();

      setAlert({ severity: 'success', message: 'Transferência realizada com sucesso!' });
      handleCloseTransferModal();
    } catch (error: any) {
      console.error('Erro ao realizar transferência:', error);
      // Capturar mensagem de erro detalhada
      let errorMessage = 'Erro ao realizar transferência. Tente novamente.';
      if (error.response?.data?.message) {
        errorMessage = `Erro da API: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setAlert({
        severity: 'error',
        message: errorMessage,
      });
      // Atualizar dados mesmo em caso de erro, para verificar se a transferência foi persistida
      await fetchData();
      await updateStockAndWarehouseData();
    } finally {
      setLoading(false);
    }
  }, [
    transferProductId,
    transferFromLocation,
    transferToLocation,
    transferQuantity,
    transferSection,
    transferShelf,
    transferCorridor,
    productLocations,
    loggedInFuncionarioId,
    navigate,
    updateStockAndWarehouseData,
    handleCloseTransferModal,
    fetchData,
  ]);

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
          <Grid container spacing={2}>
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
                  <MenuItem key={prod.id ?? ''} value={prod.id ?? ''}>
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
              {errors.idLocalizacao && <FormHelperText error>{errors.idLocalizacao}</FormHelperText>}
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
                  value={Number.isNaN(quantidadeProduto) ? '' : quantidadeProduto}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setQuantidadeProduto(Number.isNaN(value) ? 0 : Math.max(0, value));
                    setErrors((prev) => ({ ...prev, quantidadeProduto: undefined }));
                  }}
                  error={!!errors.quantidadeProduto}
                  helperText={errors.quantidadeProduto}
                  disabled={loading}
                  fullWidth
                  inputProps={{ min: 0 }}
                  aria-label="Quantidade do produto"
                />
                <Typography variant="body2" color="text.secondary">
                  Estoque: {stockQuantity ?? 'N/A'} | Loja: {storeQuantity} | Armazém:{' '}
                  {warehouseQuantity} | Restante: {remainingQuantity ?? 'N/A'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Limite Mínimo"
                type="number"
                value={Number.isNaN(quantidadeMinimaProduto) ? '' : quantidadeMinimaProduto}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setQuantidadeMinimaProduto(Number.isNaN(value) ? 0 : Math.max(0, value));
                  setErrors((prev) => ({ ...prev, quantidadeMinimaProduto: undefined }));
                }}
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

      <Modal
        open={openTransferModal}
        onClose={handleCloseTransferModal}
        aria-labelledby="modal-transferencia-produto"
        aria-describedby="modal-transferencia-descricao"
      >
        <Box sx={transferModalStyle} component="form" noValidate autoComplete="off">
          <Typography id="modal-transferencia-produto" variant="h5" mb={2}>
            Transferir Produto
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Select
                value={transferFromLocation ?? ''}
                onChange={(e: SelectChangeEvent<string>) =>
                  setTransferFromLocation(e.target.value || undefined)
                }
                displayEmpty
                fullWidth
                error={!!errors.transferFromLocation}
                disabled={loading || !!transferFromLocation}
                aria-label="Selecionar localização de origem"
              >
                <MenuItem value="" disabled>
                  Selecione a Origem
                </MenuItem>
                {locations.map((loc) => {
                  const hasStock = productLocations.some(
                    (pl) =>
                      pl.id_produto === transferProductId &&
                      pl.id_localizacao === loc.id &&
                      (pl.quantidadeProduto ?? 0) > 0,
                  );
                  return (
                    <MenuItem key={loc.id} value={loc.id} disabled={!hasStock}>
                      {loc.nomeLocalizacao} {hasStock ? '' : '(Sem estoque)'}
                    </MenuItem>
                  );
                })}
              </Select>
              {errors.transferFromLocation && (
                <FormHelperText error>{errors.transferFromLocation}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12}>
              <Select
                value={transferToLocation ?? ''}
                onChange={(e: SelectChangeEvent<string>) => {
                  setTransferToLocation(e.target.value || undefined);
                  const toLocationData = productLocations.find(
                    (loc) =>
                      loc.id_produto === transferProductId && loc.id_localizacao === e.target.value,
                  );
                  setTransferSection(toLocationData?.id_seccao || sections[0]?.id || '');
                  setTransferShelf(toLocationData?.id_prateleira || shelves[0]?.id || '');
                  setTransferCorridor(toLocationData?.id_corredor || corridors[0]?.id || '');
                }}
                displayEmpty
                fullWidth
                error={!!errors.transferToLocation}
                disabled={loading}
                aria-label="Selecionar localização de destino"
              >
                <MenuItem value="" disabled>
                  Selecione o Destino
                </MenuItem>
                {locations.map((loc) => (
                  <MenuItem key={loc.id} value={loc.id}>
                    {loc.nomeLocalizacao}
                  </MenuItem>
                ))}
              </Select>
              {errors.transferToLocation && (
                <FormHelperText error>{errors.transferToLocation}</FormHelperText>
              )}
            </Grid>
            {transferToLocation && transferProductId && (
              <>
                <Grid item xs={12} sm={6}>
                  <Select
                    value={transferSection}
                    onChange={(e: SelectChangeEvent<string>) => setTransferSection(e.target.value)}
                    displayEmpty
                    fullWidth
                    error={!!errors.transferSection}
                    disabled={loading}
                    aria-label="Selecionar seção de destino"
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
                  {errors.transferSection && (
                    <FormHelperText error>{errors.transferSection}</FormHelperText>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Select
                    value={transferShelf}
                    onChange={(e: SelectChangeEvent<string>) => setTransferShelf(e.target.value)}
                    displayEmpty
                    fullWidth
                    error={!!errors.transferShelf}
                    disabled={loading}
                    aria-label="Selecionar prateleira de destino"
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
                  {errors.transferShelf && (
                    <FormHelperText error>{errors.transferShelf}</FormHelperText>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Select
                    value={transferCorridor}
                    onChange={(e: SelectChangeEvent<string>) => setTransferCorridor(e.target.value)}
                    displayEmpty
                    fullWidth
                    error={!!errors.transferCorridor}
                    disabled={loading}
                    aria-label="Selecionar corredor de destino"
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
                  {errors.transferCorridor && (
                    <FormHelperText error>{errors.transferCorridor}</FormHelperText>
                  )}
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                label="Quantidade a Transferir"
                type="number"
                value={Number.isNaN(transferQuantity) ? '' : transferQuantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setTransferQuantity(Number.isNaN(value) ? 0 : Math.max(0, value));
                  setErrors((prev) => ({ ...prev, transferQuantity: undefined }));
                }}
                error={!!errors.transferQuantity}
                helperText={errors.transferQuantity}
                disabled={loading}
                fullWidth
                inputProps={{ min: 0 }}
                aria-label="Quantidade a transferir"
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseTransferModal}
                  disabled={loading}
                  fullWidth
                  aria-label="Cancelar transferência"
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleTransferProduct}
                  disabled={loading}
                  fullWidth
                  aria-label="Confirmar transferência"
                >
                  {loading ? 'Transferindo...' : 'Transferir'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Localizações dos Produtos
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="Tabela de localizações">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Localização</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total de Produtos</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginatedLocationIds.length > 0 ? (
                  paginatedLocationIds.map((locationId) => {
                    const location = locations.find((l) => l.id === locationId);
                    const productsForLocation = groupedProductLocations[locationId] || [];
                    const totalQuantity = productsForLocation.reduce(
                      (sum, loc) => sum + (loc.quantidadeProduto ?? 0),
                      0,
                    );
                    const isExpanded = expandedLocations.has(locationId);

                    return (
                      <React.Fragment key={locationId}>
                        <TableRow>
                          <TableCell>
                            <IconButton
                              onClick={() => toggleExpandLocation(locationId)}
                              aria-label={`Expandir/Contrair ${location?.nomeLocalizacao ?? 'N/A'}`}
                            >
                              <IconifyIcon
                                icon={
                                  isExpanded
                                    ? 'heroicons-solid:chevron-down'
                                    : 'heroicons-solid:chevron-right'
                                }
                              />
                            </IconButton>
                            {location?.nomeLocalizacao ?? 'N/A'}
                          </TableCell>
                          <TableCell>{totalQuantity}</TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} style={{ paddingBottom: 0, paddingTop: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1 }}>
                                <Table size="small" aria-label="Detalhes dos produtos">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>
                                        <strong>Produto</strong>
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
                                    {productsForLocation.map((location) => {
                                      if (!location.id) return null;
                                      const product = products.find(
                                        (p) => p.id === location.id_produto,
                                      );
                                      const isAtOrBelowLimit =
                                        (location.quantidadeProduto ?? 0) <=
                                        (location.quantidadeMinimaProduto ?? 0);
                                      return (
                                        <TableRow
                                          key={location.id}
                                          sx={{
                                            bgcolor: isAtOrBelowLimit ? '#ffebee' : 'inherit',
                                          }}
                                        >
                                          <TableCell
                                            sx={{ color: isAtOrBelowLimit ? 'red' : 'inherit' }}
                                          >
                                            {product?.nomeProduto ?? 'N/A'}
                                          </TableCell>
                                          <TableCell
                                            sx={{ color: isAtOrBelowLimit ? 'red' : 'inherit' }}
                                          >
                                            {sections.find((s) => s.id === location.id_seccao)
                                              ?.nomeSeccao ?? 'N/A'}
                                          </TableCell>
                                          <TableCell
                                            sx={{ color: isAtOrBelowLimit ? 'red' : 'inherit' }}
                                          >
                                            {shelves.find((s) => s.id === location.id_prateleira)
                                              ?.nomePrateleira ?? 'N/A'}
                                          </TableCell>
                                          <TableCell
                                            sx={{ color: isAtOrBelowLimit ? 'red' : 'inherit' }}
                                          >
                                            {corridors.find((c) => c.id === location.id_corredor)
                                              ?.nomeCorredor ?? 'N/A'}
                                          </TableCell>
                                          <TableCell
                                            sx={{ color: isAtOrBelowLimit ? 'red' : 'inherit' }}
                                          >
                                            {location.quantidadeProduto ?? 0}
                                          </TableCell>
                                          <TableCell
                                            sx={{ color: isAtOrBelowLimit ? 'red' : 'inherit' }}
                                          >
                                            {location.quantidadeMinimaProduto ?? 0}
                                          </TableCell>
                                          <TableCell align="right">
                                            <IconButton
                                              color="primary"
                                              onClick={() => handleEditLocation(location?.id!)}
                                              disabled={loading}
                                              aria-label={`Editar localização ${location.id}`}
                                            >
                                              <Edit />
                                            </IconButton>
                                            <IconButton
                                              color="error"
                                              onClick={() => handleOpenConfirmModal(location?.id!)}
                                              disabled={loading}
                                              aria-label={`Excluir localização ${location.id}`}
                                            >
                                              <Delete />
                                            </IconButton>
                                            <IconButton
                                              color="primary"
                                              onClick={() =>
                                                handleOpenTransferModal(
                                                  location.id_produto,
                                                  location.id_localizacao,
                                                )
                                              }
                                              disabled={loading}
                                              aria-label={`Transferir produto ${location.id_produto}`}
                                            >
                                              <IconifyIcon icon="heroicons-solid:arrow-right" />
                                            </IconButton>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhuma localização cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={uniqueLocationIds.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Linhas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductLocationComponent;