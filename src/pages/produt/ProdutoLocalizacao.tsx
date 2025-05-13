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

// Interface para um item de transferência no formulário
interface TransferFormItem {
  id_produto: string;
  id_localizacao_origem: string;
  quantidadeTransferida: number;
}

// Interface para dados de localização de destino
interface DestinationLocation {
  id_produto: string;
  id_localizacao: string;
  id_seccao: string;
  id_prateleira: string;
  id_corredor: string;
  quantidadeProduto: number;
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
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  maxHeight: '80vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2,
};

const isStoreLocation = (locationId: string, locations: Localizacao[]): boolean => {
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
  const [openDestinationModal, setOpenDestinationModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string>('');
  const [editLocationId, setEditLocationId] = useState<string>('');
  const [transferItems, setTransferItems] = useState<TransferFormItem[]>([]);
  const [destinationLocations, setDestinationLocations] = useState<DestinationLocation[]>([]);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  const [destinationForm, setDestinationForm] = useState<DestinationLocation>({
    id_produto: '',
    id_localizacao: '',
    id_seccao: '',
    id_prateleira: '',
    id_corredor: '',
    quantidadeProduto: 0,
  });
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
    transferItems?: { [key: string]: string }[];
    destinationForm?: { [key: string]: string };
  }>({ transferItems: [], destinationForm: {} });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  // Carregar e validar o ID do funcionário
  const loadUserData = useCallback((): string => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Nenhum token encontrado. Faça login novamente.');
      }
      const decoded: DecodedToken = jwtDecode(token);
      const id = decoded.userId || decoded.sub;
      if (!id) {
        throw new Error('ID de usuário não encontrado no token.');
      }
      return id;
    } catch (error: any) {
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  // Buscar todos os dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setAlert(null);
      const [productsData, locationsData, sectionsData, shelvesData, corridorsData, productLocationsData] =
        await Promise.all([
          getAllProducts(),
          getAllLocations(),
          getAllSections(),
          getAllShelves(),
          getAllCorridors(),
          getAllProductLocations(),
        ]);

      setProducts(productsData ?? []);
      setLocations(locationsData ?? []);
      setSections(sectionsData ?? []);
      setShelves(shelvesData ?? []);
      setCorridors(corridorsData ?? []);
      setProductLocations(Array.isArray(productLocationsData) ? productLocationsData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar dados!' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar componente
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      const id = loadUserData();
      if (id) {
        setLoggedInFuncionarioId(id);
        await fetchData();
      }
      setIsLoading(false);
    };
    initialize();
  }, [fetchData, loadUserData]);

  // Atualizar dados de estoque
  const updateStockData = useCallback(async () => {
    if (!idProdutoLocalizacao) {
      setStockQuantity(null);
      setWarehouseQuantity(0);
      setStoreQuantity(0);
      setRemainingQuantity(null);
      return;
    }

    try {
      const stock = await getStockByProduct(idProdutoLocalizacao);
      const totalStock = Number(stock?.quantidadeAtual) || 0;
      setStockQuantity(totalStock);

      const storeQty = productLocations
        .filter(
          (loc) =>
            loc.id_produto === idProdutoLocalizacao && isStoreLocation(loc.id_localizacao, locations),
        )
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
      const warehouseQty = productLocations
        .filter(
          (loc) =>
            loc.id_produto === idProdutoLocalizacao && !isStoreLocation(loc.id_localizacao, locations),
        )
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);

      setStoreQuantity(storeQty);
      setWarehouseQuantity(warehouseQty);
      setRemainingQuantity(totalStock - (storeQty + warehouseQty));
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      setAlert({ severity: 'error', message: 'Erro ao buscar dados de estoque.' });
      setStockQuantity(0);
      setWarehouseQuantity(0);
      setStoreQuantity(0);
      setRemainingQuantity(0);
    }
  }, [idProdutoLocalizacao, locations, productLocations]);

  useEffect(() => {
    updateStockData();
  }, [updateStockData]);

  // Limpar alertas
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
    setEditLocationId('');
    setIdProdutoLocalizacao('');
    setIdLocalizacao('');
    setIdSeccao('');
    setIdPrateleira('');
    setIdCorredor('');
    setQuantidadeProduto(0);
    setQuantidadeMinimaProduto(0);
    setErrors({});
  }, []);

  const handleOpenConfirmModal = useCallback((id: string) => {
    setLocationToDelete(id || '');
    setOpenConfirmModal(true);
  }, []);

  const handleCloseConfirmModal = useCallback(() => {
    setOpenConfirmModal(false);
    setLocationToDelete('');
  }, []);

  const handleOpenTransferModal = useCallback(() => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado.' });
      navigate('/login');
      return;
    }
    setTransferItems([{ id_produto: '', id_localizacao_origem: '', quantidadeTransferida: 0 }]);
    setErrors({ transferItems: [{}] });
    setOpenTransferModal(true);
  }, [loggedInFuncionarioId, navigate]);

  const handleCloseTransferModal = useCallback(() => {
    setOpenTransferModal(false);
    setTransferItems([]);
    setErrors({ transferItems: [] });
  }, []);

  const handleOpenDestinationModal = useCallback((transfers: TransferFormItem[]) => {
    const destinations = transfers.map((item) => ({
      id_produto: item.id_produto,
      id_localizacao: '',
      id_seccao: '',
      id_prateleira: '',
      id_corredor: '',
      quantidadeProduto: item.quantidadeTransferida,
    }));
    setDestinationLocations(destinations);
    setCurrentDestinationIndex(0);
    setDestinationForm({
      id_produto: transfers[0].id_produto,
      id_localizacao: '',
      id_seccao: '',
      id_prateleira: '',
      id_corredor: '',
      quantidadeProduto: transfers[0].quantidadeTransferida,
    });
    setErrors({ destinationForm: {} });
    setOpenDestinationModal(true);
  }, []);

  const handleCloseDestinationModal = useCallback(() => {
    setOpenDestinationModal(false);
    setDestinationLocations([]);
    setCurrentDestinationIndex(0);
    setDestinationForm({
      id_produto: '',
      id_localizacao: '',
      id_seccao: '',
      id_prateleira: '',
      id_corredor: '',
      quantidadeProduto: 0,
    });
    setErrors({ destinationForm: {} });
  }, []);

  // Paginação
  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Expandir/contrair localizações
  const toggleExpandLocation = useCallback((locationId: string) => {
    setExpandedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) newSet.delete(locationId);
      else newSet.add(locationId);
      return newSet;
    });
  }, []);

  // Calcular estoque total
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
      filtered = filtered.filter((loc) => loc.id_localizacao === selectedLocationType);
    }
    if (searchQuery) {
      filtered = filtered.filter((loc) => {
        const product = products.find((p) => p.id === loc.id_produto);
        return product?.nomeProduto.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    return filtered;
  }, [selectedLocationType, searchQuery, productLocations, products]);

  const groupedProductLocations = useMemo(() => {
    const grouped: { [key: string]: ProdutoLocalizacao[] } = {};
    filteredProductLocations.forEach((loc) => {
      if (!grouped[loc.id_localizacao]) grouped[loc.id_localizacao] = [];
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

  // Manipulação de itens de transferência
  const addTransferItem = useCallback(() => {
    setTransferItems((prev) => [
      ...prev,
      { id_produto: '', id_localizacao_origem: '', quantidadeTransferida: 0 },
    ]);
    setErrors((prev) => ({
      ...prev,
      transferItems: [...(prev.transferItems ?? []), {}],
    }));
  }, []);

  const removeTransferItem = useCallback((index: number) => {
    setTransferItems((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({
      ...prev,
      transferItems: (prev.transferItems ?? []).filter((_, i) => i !== index),
    }));
  }, []);

  const handleTransferItemChange = useCallback(
    (index: number, field: keyof TransferFormItem, value: string | number) => {
      setTransferItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      );
      setErrors((prev) => {
        const newErrors = [...(prev.transferItems ?? [])];
        newErrors[index] = { ...newErrors[index], [field]: '' };
        return { ...prev, transferItems: newErrors };
      });
    },
    [],
  );

  const handleDestinationFormChange = useCallback(
    (field: keyof DestinationLocation, value: string) => {
      setDestinationForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({
        ...prev,
        destinationForm: { ...prev.destinationForm, [field]: '' },
      }));
    },
    [],
  );

  // Validação do formulário de transferência
  const validateTransferForm = useCallback(() => {
    const newErrors: { [key: string]: string }[] = transferItems.map(() => ({}));
    let isValid = true;

    transferItems.forEach((item, index) => {
      if (!item.id_produto) {
        newErrors[index].id_produto = 'O produto é obrigatório.';
        isValid = false;
      }
      if (!item.id_localizacao_origem) {
        newErrors[index].id_localizacao_origem = 'A localização de origem é obrigatória.';
        isValid = false;
      }
      if (item.quantidadeTransferida <= 0) {
        newErrors[index].quantidadeTransferida = 'A quantidade deve ser maior que zero.';
        isValid = false;
      }

      const fromLocation = productLocations.find(
        (loc) => loc.id_produto === item.id_produto && loc.id_localizacao === item.id_localizacao_origem,
      );
      if (!fromLocation) {
        newErrors[index].id_localizacao_origem = 'Localização de origem não encontrada.';
        isValid = false;
      } else if (item.quantidadeTransferida > (fromLocation.quantidadeProduto ?? 0)) {
        newErrors[index].quantidadeTransferida = `Quantidade excede o disponível (${fromLocation.quantidadeProduto ?? 0}).`;
        isValid = false;
      }
    });

    setErrors((prev) => ({ ...prev, transferItems: newErrors }));
    return isValid;
  }, [transferItems, productLocations]);

  // Validação do formulário de destino
  const validateDestinationForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!destinationForm.id_localizacao) newErrors.id_localizacao = 'A localização é obrigatória.';
    if (!destinationForm.id_seccao) newErrors.id_seccao = 'A seção é obrigatória.';
    if (!destinationForm.id_prateleira) newErrors.id_prateleira = 'A prateleira é obrigatória.';
    if (!destinationForm.id_corredor) newErrors.id_corredor = 'O corredor é obrigatório.';
    if (destinationForm.quantidadeProduto <= 0) {
      newErrors.quantidadeProduto = 'A quantidade deve ser maior que zero.';
    }
    if (
      destinationForm.id_localizacao &&
      destinationForm.id_localizacao === transferItems[currentDestinationIndex]?.id_localizacao_origem
    ) {
      newErrors.id_localizacao = 'O destino não pode ser igual à origem.';
    }

    setErrors((prev) => ({ ...prev, destinationForm: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [destinationForm, transferItems, currentDestinationIndex]);

  // Adicionar ou atualizar localização
  const handleAddProductLocation = useCallback(async () => {
    const newErrors: typeof errors = {};

    if (!idProdutoLocalizacao) newErrors.idProdutoLocalizacao = 'O produto é obrigatório.';
    if (!idLocalizacao) newErrors.idLocalizacao = 'A localização é obrigatória.';
    if (!idSeccao) newErrors.idSeccao = 'A seção é obrigatória.';
    if (!idPrateleira) newErrors.idPrateleira = 'A prateleira é obrigatória.';
    if (!idCorredor) newErrors.idCorredor = 'O corredor é obrigatório.';
    if (quantidadeProduto <= 0) newErrors.quantidadeProduto = 'A quantidade deve ser maior que zero.';
    if (quantidadeMinimaProduto < 0)
      newErrors.quantidadeMinimaProduto = 'A quantidade mínima não pode ser negativa.';
    if (quantidadeProduto < quantidadeMinimaProduto)
      newErrors.quantidadeProduto = `A quantidade não pode ser inferior ao mínimo (${quantidadeMinimaProduto}).`;

    let totalStock = 0;
    try {
      const stock = await getStockByProduct(idProdutoLocalizacao);
      totalStock = Number(stock?.quantidadeAtual) || 0;
    } catch {
      newErrors.idProdutoLocalizacao = 'Produto sem estoque registrado.';
    }

    if (totalStock > 0) {
      const currentTotal = getTotalStockInLocations(idProdutoLocalizacao, editLocationId);
      const newTotal = currentTotal + quantidadeProduto;
      if (newTotal > totalStock) {
        newErrors.quantidadeProduto = `Quantidade total (${newTotal}) excede o estoque (${totalStock}).`;
      } else if (remainingQuantity !== null && quantidadeProduto > remainingQuantity) {
        newErrors.quantidadeProduto = `Quantidade (${quantidadeProduto}) excede o restante (${remainingQuantity}).`;
      }
    } else {
      newErrors.quantidadeProduto = 'Não há estoque disponível.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      const locationData: ProdutoLocalizacao = {
        id: editLocationId || undefined,
        id_produto: idProdutoLocalizacao,
        id_localizacao: idLocalizacao,
        id_seccao: idSeccao,
        id_prateleira: idPrateleira,
        id_corredor: idCorredor,
        quantidadeProduto,
        quantidadeMinimaProduto,
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
        await updateProductLocation(existingLocation?.id!, locationData);
      } else if (editLocationId) {
        await updateProductLocation(editLocationId, locationData);
      } else {
        await createProductLocation(locationData);
      }

      await fetchData();
      await updateStockData();
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
      console.error('Erro ao salvar localização:', error);
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
    remainingQuantity,
    productLocations,
    getTotalStockInLocations,
    handleCloseLocation,
    fetchData,
    updateStockData,
  ]);

  // Editar localização
  const handleEditLocation = useCallback(
    (id?: string) => {
      const location = productLocations.find((loc) => loc.id === id);
      if (location) {
        setEditLocationId(id || '');
        setIdProdutoLocalizacao(location.id_produto);
        setIdLocalizacao(location.id_localizacao);
        setIdSeccao(location.id_seccao);
        setIdPrateleira(location.id_prateleira);
        setIdCorredor(location.id_corredor);
        setQuantidadeProduto(location.quantidadeProduto ?? 0);
        setQuantidadeMinimaProduto(location.quantidadeMinimaProduto ?? 0);
        setOpenLocationModal(true);
        setErrors({});
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
      if (location?.quantidadeProduto && location.quantidadeProduto > 0) {
        setAlert({
          severity: 'error',
          message: 'Não é possível excluir uma localização com estoque. Transfira o estoque primeiro.',
        });
        return;
      }
      await deleteProductLocation(locationToDelete);
      await fetchData();
      await updateStockData();
      setAlert({ severity: 'success', message: 'Localização excluída com sucesso!' });
      handleCloseConfirmModal();
    } catch (error) {
      console.error('Erro ao excluir localização:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir localização!' });
    } finally {
      setLoading(false);
    }
  }, [locationToDelete, productLocations, handleCloseConfirmModal, fetchData, updateStockData]);

  // Transferir produtos
  const handleTransferProducts = useCallback(async () => {
    if (!validateTransferForm()) return;

    try {
      setLoading(true);
      setAlert(null);

      // Atualizar localizações de origem
      for (const item of transferItems) {
        const fromLocation = productLocations.find(
          (loc) => loc.id_produto === item.id_produto && loc.id_localizacao === item.id_localizacao_origem,
        );
        if (!fromLocation?.id) {
          throw new Error(`Localização de origem inválida para o produto ${item.id_produto}.`);
        }
        const updatedFromLocation: ProdutoLocalizacao = {
          ...fromLocation,
          quantidadeProduto: (fromLocation.quantidadeProduto ?? 0) - item.quantidadeTransferida,
        };
        await updateProductLocation(fromLocation.id, updatedFromLocation);
      }

      setAlert({
        severity: 'success',
        message: 'Transferências iniciadas. Defina as localizações de destino.',
      });
      handleCloseTransferModal();
      handleOpenDestinationModal(transferItems);
    } catch (error: any) {
      console.error('Erro ao processar transferências:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao processar transferências.' });
      await fetchData();
    } finally {
      setLoading(false);
    }
  }, [transferItems, productLocations, validateTransferForm, handleCloseTransferModal, handleOpenDestinationModal, fetchData]);

  // Salvar localização de destino
  const handleSaveDestination = useCallback(async () => {
    if (!validateDestinationForm()) return;

    try {
      setLoading(true);
      setAlert(null);

      const locationData: ProdutoLocalizacao = {
        id_produto: destinationForm.id_produto,
        id_localizacao: destinationForm.id_localizacao,
        id_seccao: destinationForm.id_seccao,
        id_prateleira: destinationForm.id_prateleira,
        id_corredor: destinationForm.id_corredor,
        quantidadeProduto: destinationForm.quantidadeProduto,
        quantidadeMinimaProduto: 0,
      };

      let toLocation = productLocations.find(
        (loc) =>
          loc.id_produto === destinationForm.id_produto &&
          loc.id_localizacao === destinationForm.id_localizacao &&
          loc.id_seccao === destinationForm.id_seccao &&
          loc.id_prateleira === destinationForm.id_prateleira &&
          loc.id_corredor === destinationForm.id_corredor,
      );

      if (toLocation?.id) {
        toLocation = {
          ...toLocation,
          quantidadeProduto: (toLocation.quantidadeProduto ?? 0) + destinationForm.quantidadeProduto,
        };
        await updateProductLocation(toLocation?.id!, toLocation);
      } else {
        toLocation = await createProductLocation(locationData);
      }

      if (!toLocation?.id) {
        throw new Error('Falha ao criar/atualizar localização de destino.');
      }

      const transferData: Transferencia = {
        id_produto: destinationForm.id_produto,
        id_funcionario: loggedInFuncionarioId,
        id_produtoLocalizacao: toLocation.id,
        dataTransferencia: new Date().toISOString().slice(0, 19).replace('T', ' '),
        quantidadeTransferida: destinationForm.quantidadeProduto,
      };

      await createTransfer(transferData);

      if (currentDestinationIndex < destinationLocations.length - 1) {
        const nextIndex = currentDestinationIndex + 1;
        setCurrentDestinationIndex(nextIndex);
        setDestinationForm({
          id_produto: destinationLocations[nextIndex].id_produto,
          id_localizacao: '',
          id_seccao: '',
          id_prateleira: '',
          id_corredor: '',
          quantidadeProduto: destinationLocations[nextIndex].quantidadeProduto,
        });
        setErrors({ destinationForm: {} });
      } else {
        setAlert({ severity: 'success', message: 'Transferências concluídas com sucesso!' });
        handleCloseDestinationModal();
        await fetchData();
        await updateStockData();
      }
    } catch (error: any) {
      console.error('Erro ao salvar destino:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao salvar destino.' });
    } finally {
      setLoading(false);
    }
  }, [
    destinationForm,
    destinationLocations,
    currentDestinationIndex,
    productLocations,
    loggedInFuncionarioId,
    validateDestinationForm,
    handleCloseDestinationModal,
    fetchData,
    updateStockData,
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
            <Stack direction="row" spacing={2}>
              <Select
                value={selectedLocationType}
                onChange={(e: SelectChangeEvent<string>) => setSelectedLocationType(e.target.value)}
                displayEmpty
                sx={{ minWidth: 200 }}
                disabled={loading}
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
                disabled={loading}
                InputProps={{
                  endAdornment: <IconifyIcon icon="heroicons-solid:search" />,
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
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenTransferModal}
                disabled={loading}
                startIcon={<IconifyIcon icon="heroicons-solid:arrow-right" />}
              >
                Transferir
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openLocationModal} onClose={handleCloseLocation}>
        <Box sx={modalStyle}>
          <Typography variant="h5" mb={2}>
            {editLocationId ? 'Editar Localização' : 'Cadastrar Localização'}
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
                onChange={(e: SelectChangeEvent<string>) => setIdLocalizacao(e.target.value)}
                displayEmpty
                fullWidth
                error={!!errors.idLocalizacao}
                disabled={loading}
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
                  label="Quantidade"
                  type="number"
                  value={quantidadeProduto || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setQuantidadeProduto(isNaN(value) ? 0 : Math.max(0, value));
                  }}
                  error={!!errors.quantidadeProduto}
                  helperText={errors.quantidadeProduto}
                  disabled={loading}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Estoque: {stockQuantity ?? 'N/A'} | Loja: {storeQuantity} | Armazém: {warehouseQuantity}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Limite Mínimo"
                type="number"
                value={quantidadeMinimaProduto || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setQuantidadeMinimaProduto(isNaN(value) ? 0 : Math.max(0, value));
                }}
                error={!!errors.quantidadeMinimaProduto}
                helperText={errors.quantidadeMinimaProduto}
                disabled={loading}
                fullWidth
                inputProps={{ min: 0 }}
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
            Tem certeza que deseja excluir esta localização? Esta ação não pode ser desfeita.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" color="secondary" onClick={handleCloseConfirmModal} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="contained" color="error" onClick={handleDeleteLocation} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openTransferModal} onClose={handleCloseTransferModal}>
        <Box sx={transferModalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Transferir Produtos</Typography>
            <Button variant="outlined" color="error" onClick={handleCloseTransferModal} disabled={loading}>
              Fechar
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {transferItems.map((item, index) => {
              const stockAvailable = productLocations.find(
                (loc) => loc.id_produto === item.id_produto && loc.id_localizacao === item.id_localizacao_origem,
              )?.quantidadeProduto ?? 0;
              return (
                <Box
                  key={index}
                  sx={{ mb: 2, p: 2, border: 1, borderRadius: 1, borderColor: 'grey.300', width: '100%' }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">Transferência {index + 1}</Typography>
                    {transferItems.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => removeTransferItem(index)}
                        disabled={loading}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Select
                        value={item.id_produto}
                        onChange={(e: SelectChangeEvent<string>) =>
                          handleTransferItemChange(index, 'id_produto', e.target.value)
                        }
                        displayEmpty
                        fullWidth
                        error={!!errors.transferItems?.[index]?.id_produto}
                        disabled={loading}
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
                      {errors.transferItems?.[index]?.id_produto && (
                        <FormHelperText error>{errors.transferItems[index].id_produto}</FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Select
                        value={item.id_localizacao_origem}
                        onChange={(e: SelectChangeEvent<string>) =>
                          handleTransferItemChange(index, 'id_localizacao_origem', e.target.value)
                        }
                        displayEmpty
                        fullWidth
                        error={!!errors.transferItems?.[index]?.id_localizacao_origem}
                        disabled={loading || !item.id_produto}
                      >
                        <MenuItem value="" disabled>
                          Selecione a Origem
                        </MenuItem>
                        {locations.map((loc) => {
                          const stock = productLocations.find(
                            (pl) => pl.id_produto === item.id_produto && pl.id_localizacao === loc.id,
                          )?.quantidadeProduto ?? 0;
                          return (
                            <MenuItem key={loc.id} value={loc.id} disabled={stock <= 0}>
                              {loc.nomeLocalizacao} (Estoque: {stock})
                            </MenuItem>
                          );
                        })}
                      </Select>
                      {errors.transferItems?.[index]?.id_localizacao_origem && (
                        <FormHelperText error>{errors.transferItems[index].id_localizacao_origem}</FormHelperText>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Quantidade a Transferir"
                        type="number"
                        value={item.quantidadeTransferida || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          handleTransferItemChange(
                            index,
                            'quantidadeTransferida',
                            isNaN(value) ? 0 : Math.max(0, Math.min(value, stockAvailable)),
                          );
                        }}
                        error={!!errors.transferItems?.[index]?.quantidadeTransferida}
                        helperText={
                          errors.transferItems?.[index]?.quantidadeTransferida ||
                          `Disponível: ${stockAvailable}`
                        }
                        disabled={loading}
                        fullWidth
                        inputProps={{ min: 0, max: stockAvailable }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              );
            })}
            <Grid item xs={12}>
              <Button
                variant="outlined"
                color="primary"
                onClick={addTransferItem}
                disabled={loading}
                sx={{ mb: 2 }}
                fullWidth
              >
                Adicionar Outra Transferência
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCloseTransferModal}
                  disabled={loading}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleTransferProducts}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Iniciando...' : 'Iniciar Transferências'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Modal open={openDestinationModal} onClose={handleCloseDestinationModal}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">
              Destino ({currentDestinationIndex + 1} de {destinationLocations.length})
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCloseDestinationModal}
              disabled={loading}
            >
              Fechar
            </Button>
          </Stack>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Produto: {products.find((p) => p.id === destinationForm.id_produto)?.nomeProduto || 'N/A'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Select
                value={destinationForm.id_localizacao}
                onChange={(e: SelectChangeEvent<string>) =>
                  handleDestinationFormChange('id_localizacao', e.target.value)
                }
                displayEmpty
                fullWidth
                error={!!errors.destinationForm?.id_localizacao}
                disabled={loading}
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
              {errors.destinationForm?.id_localizacao && (
                <FormHelperText error>{errors.destinationForm.id_localizacao}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={destinationForm.id_seccao}
                onChange={(e: SelectChangeEvent<string>) =>
                  handleDestinationFormChange('id_seccao', e.target.value)
                }
                displayEmpty
                fullWidth
                error={!!errors.destinationForm?.id_seccao}
                disabled={loading}
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
              {errors.destinationForm?.id_seccao && (
                <FormHelperText error>{errors.destinationForm.id_seccao}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={destinationForm.id_prateleira}
                onChange={(e: SelectChangeEvent<string>) =>
                  handleDestinationFormChange('id_prateleira', e.target.value)
                }
                displayEmpty
                fullWidth
                error={!!errors.destinationForm?.id_prateleira}
                disabled={loading}
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
              {errors.destinationForm?.id_prateleira && (
                <FormHelperText error>{errors.destinationForm.id_prateleira}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                value={destinationForm.id_corredor}
                onChange={(e: SelectChangeEvent<string>) =>
                  handleDestinationFormChange('id_corredor', e.target.value)
                }
                displayEmpty
                fullWidth
                error={!!errors.destinationForm?.id_corredor}
                disabled={loading}
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
              {errors.destinationForm?.id_corredor && (
                <FormHelperText error>{errors.destinationForm.id_corredor}</FormHelperText>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Quantidade Transferida"
                type="number"
                value={destinationForm.quantidadeProduto || ''}
                disabled
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleSaveDestination}
                disabled={loading}
                fullWidth
              >
                {loading
                  ? 'Salvando...'
                  : currentDestinationIndex < destinationLocations.length - 1
                  ? 'Próximo'
                  : 'Concluir'}
              </Button>
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
            <Table>
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
                            <IconButton onClick={() => toggleExpandLocation(locationId)}>
                              <IconifyIcon
                                icon={
                                  isExpanded ? 'heroicons-solid:chevron-down' : 'heroicons-solid:chevron-right'
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
                                <Table size="small">
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
                                    {productsForLocation.map((loc) => {
                                      if (!loc.id) return null;
                                      const product = products.find((p) => p.id === loc.id_produto);
                                      const isBelowLimit =
                                        (loc.quantidadeProduto ?? 0) <= (loc.quantidadeMinimaProduto ?? 0);
                                      return (
                                        <TableRow key={loc.id} sx={{ bgcolor: isBelowLimit ? '#ffebee' : 'inherit' }}>
                                          <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                                            {product?.nomeProduto ?? 'N/A'}
                                          </TableCell>
                                          <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                                            {sections.find((s) => s.id === loc.id_seccao)?.nomeSeccao ?? 'N/A'}
                                          </TableCell>
                                          <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                                            {shelves.find((s) => s.id === loc.id_prateleira)?.nomePrateleira ?? 'N/A'}
                                          </TableCell>
                                          <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                                            {corridors.find((c) => c.id === loc.id_corredor)?.nomeCorredor ?? 'N/A'}
                                          </TableCell>
                                          <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                                            {loc.quantidadeProduto ?? 0}
                                          </TableCell>
                                          <TableCell sx={{ color: isBelowLimit ? 'red' : 'inherit' }}>
                                            {loc.quantidadeMinimaProduto ?? 0}
                                          </TableCell>
                                          <TableCell align="right">
                                            <IconButton
                                              color="primary"
                                              onClick={() => handleEditLocation(loc.id)}
                                              disabled={loading}
                                            >
                                              <Edit />
                                            </IconButton>
                                            <IconButton
                                              color="error"
                                              onClick={() => handleOpenConfirmModal(loc?.id!)}
                                              disabled={loading}
                                            >
                                              <Delete />
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