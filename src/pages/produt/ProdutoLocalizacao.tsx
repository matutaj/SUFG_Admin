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
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { useNotifications } from 'NotificationContext';
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
  updateProductLocation,
  deleteProductLocation,
  getAllLocations,
  getAllSections,
  getAllShelves,
  getAllCorridors,
  getStockByProduct,
  createTransfer,
  createProductLocation,
} from '../../api/methods';
import { getUserData, hasPermission } from '../../api/authUtils';

interface DecodedToken {
  userId?: string;
  sub?: string;
}

interface TransferFormItem {
  id_produto: string;
  id_localizacao_origem: string;
  quantidadeTransferida: number;
}

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

interface Errors {
  transferItems: Array<{
    id_produto?: string;
    id_localizacao_origem?: string;
    quantidadeTransferida?: string;
  }>;
  destinationForm: {
    id_localizacao?: string;
    id_seccao?: string;
    id_prateleira?: string;
    id_corredor?: string;
    quantidadeProduto?: string;
  };
}

interface Permissions {
  canRead: boolean;
  canCreateTransfer: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canCreateLocation: boolean;
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
  ...modalStyle,
  width: { xs: '90%', sm: '80%', md: 900 },
};

const ProductLocationComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [openDestinationModal, setOpenDestinationModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState('');
  const [editLocationId, setEditLocationId] = useState('');
  const [transferItems, setTransferItems] = useState<TransferFormItem[]>([]);
  const [destinationLocations, setDestinationLocations] = useState<DestinationLocation[]>([]);
  const [originalLocations, setOriginalLocations] = useState<ProdutoLocalizacao[]>([]);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  const [destinationForm, setDestinationForm] = useState<DestinationLocation>({
    id_produto: '',
    id_localizacao: '',
    id_seccao: '',
    id_prateleira: '',
    id_corredor: '',
    quantidadeProduto: 0,
  });
  const [idProdutoLocalizacao, setIdProdutoLocalizacao] = useState('');
  const [idLocalizacao, setIdLocalizacao] = useState('');
  const [idSeccao, setIdSeccao] = useState('');
  const [idPrateleira, setIdPrateleira] = useState('');
  const [idCorredor, setIdCorredor] = useState('');
  const [quantidadeProduto, setQuantidadeProduto] = useState(0);
  const [quantidadeMinimaProduto, setQuantidadeMinimaProduto] = useState(0);
  const [stockQuantity, setStockQuantity] = useState<number | null>(null);
  const [warehouseQuantity, setWarehouseQuantity] = useState(0);
  const [storeQuantity, setStoreQuantity] = useState(0);
  const [remainingQuantity, setRemainingQuantity] = useState<number | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Produto[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [sections, setSections] = useState<Seccao[]>([]);
  const [shelves, setShelves] = useState<Prateleira[]>([]);
  const [corridors, setCorridors] = useState<Corredor[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [errors, setErrors] = useState<Errors>({
    transferItems: [],
    destinationForm: {},
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [isTransferSuccessful, setIsTransferSuccessful] = useState(false);
  const { addNotification } = useNotifications();
  const [permissions, setPermissions] = useState<Permissions>({
    canRead: false,
    canCreateTransfer: false,
    canUpdate: false,
    canDelete: false,
    canCreateLocation: false,
  });

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  };

  const isStoreLocation = useCallback(
    (locationId: string) => {
      const location = locations.find((loc) => loc.id === locationId);
      return location?.tipo === 'Loja';
    },
    [locations],
  );

  const loadUserDataAndPermissions = useCallback(async () => {
    try {
      const userData = await getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setLoggedInFuncionarioId(userData.id);
      const [canRead, canCreateTransfer, canUpdate, canDelete, canCreateLocation] =
        await Promise.all([
          hasPermission('listar_produto_localizacao'),
          hasPermission('criar_transferencia'),
          hasPermission('atualizar_produto_localizacao'),
          hasPermission('eliminar_produto_localizacao'),
          hasPermission('criar_produto_localizacao'),
        ]);
      setPermissions({ canRead, canCreateTransfer, canUpdate, canDelete, canCreateLocation });
      log('Permissões carregadas:', {
        canRead,
        canCreateTransfer,
        canUpdate,
        canDelete,
        canCreateLocation,
      });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserDataAndPermissions:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!permissions.canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar localizações!',
      });
      log('Permissão de leitura negada');
      return;
    }
    try {
      setLoading(true);
      setAlert(null);

      const timeoutPromise = (promise: Promise<any>, time: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido')), time),
          ),
        ]);

      const results = await Promise.allSettled([
        timeoutPromise(getAllProducts(), 10000),
        timeoutPromise(getAllLocations(), 10000),
        timeoutPromise(getAllSections(), 10000),
        timeoutPromise(getAllShelves(), 10000),
        timeoutPromise(getAllCorridors(), 10000),
        timeoutPromise(getAllProductLocations(), 10000),
      ]);

      const [
        productsResult,
        locationsResult,
        sectionsResult,
        shelvesResult,
        corridorsResult,
        productLocationsResult,
      ] = results;

      setProducts(productsResult.status === 'fulfilled' ? (productsResult.value ?? []) : []);
      setLocations(locationsResult.status === 'fulfilled' ? (locationsResult.value ?? []) : []);
      setSections(sectionsResult.status === 'fulfilled' ? (sectionsResult.value ?? []) : []);
      setShelves(shelvesResult.status === 'fulfilled' ? (shelvesResult.value ?? []) : []);
      setCorridors(corridorsResult.status === 'fulfilled' ? (corridorsResult.value ?? []) : []);
      const productLocationsData =
        productLocationsResult.status === 'fulfilled' && Array.isArray(productLocationsResult.value)
          ? productLocationsResult.value
          : [];
      setProductLocations(productLocationsData);
      log('Dados carregados:', {
        products: productsResult.value,
        locations: locationsResult.value,
        sections: sectionsResult.value,
        shelves: shelvesResult.value,
        corridors: corridorsResult.value,
        productLocations: productLocationsData,
      });

      if (results.some((result) => result.status === 'rejected')) {
        console.error(
          'Erros nas chamadas:',
          results.filter((r) => r.status === 'rejected'),
        );
        setAlert({ severity: 'warning', message: 'Alguns dados não foram carregados' });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  }, [permissions.canRead]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const id = await loadUserDataAndPermissions();
        if (!id) {
          navigate('/login');
          return;
        }
        await fetchData();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [fetchData, loadUserDataAndPermissions, navigate]);

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
      if (!stock) throw new Error('Estoque não encontrado');

      const totalStock = Number(stock.quantidadeAtual) || 0;
      setStockQuantity(totalStock);
      log('Estoque carregado:', { idProduto: idProdutoLocalizacao, totalStock });

      const storeQty = productLocations
        .filter(
          (loc) => loc.id_produto === idProdutoLocalizacao && isStoreLocation(loc.id_localizacao),
        )
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);

      const warehouseQty = productLocations
        .filter(
          (loc) => loc.id_produto === idProdutoLocalizacao && !isStoreLocation(loc.id_localizacao),
        )
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);

      setStoreQuantity(storeQty);
      setWarehouseQuantity(warehouseQty);

      const currentLocation = editLocationId
        ? productLocations.find((loc) => loc.id === editLocationId)
        : null;
      const currentLocationQty = currentLocation ? (currentLocation.quantidadeProduto ?? 0) : 0;
      setRemainingQuantity(totalStock - (storeQty + warehouseQty - currentLocationQty));
      log('Quantidades atualizadas:', {
        storeQty,
        warehouseQty,
        remainingQty: totalStock - (storeQty + warehouseQty - currentLocationQty),
      });
    } catch (error: any) {
      console.error('Erro ao buscar estoque:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao buscar estoque' });
      setStockQuantity(0);
      setWarehouseQuantity(0);
      setStoreQuantity(0);
      setRemainingQuantity(0);
    }
  }, [idProdutoLocalizacao, locations, productLocations, editLocationId, isStoreLocation]);

  useEffect(() => {
    updateStockData();
  }, [updateStockData]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleOpenConfirmModal = useCallback(
    (id: string) => {
      if (!permissions.canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir localizações!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setLocationToDelete(id);
      setOpenConfirmModal(true);
    },
    [permissions.canDelete],
  );

  const handleCloseConfirmModal = useCallback(() => {
    setOpenConfirmModal(false);
    setLocationToDelete('');
  }, []);

  const handleOpenTransferModal = useCallback(() => {
    if (!permissions.canCreateTransfer) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para criar transferências!' });
      log('Permissão de criação de transferência negada');
      return;
    }
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado' });
      navigate('/login');
      return;
    }
    setTransferItems([{ id_produto: '', id_localizacao_origem: '', quantidadeTransferida: 0 }]);
    setErrors({
      transferItems: [{ id_produto: '', id_localizacao_origem: '', quantidadeTransferida: '' }],
      destinationForm: {},
    });
    setOpenTransferModal(true);
  }, [loggedInFuncionarioId, navigate, permissions.canCreateTransfer]);

  const handleCloseTransferModal = useCallback(() => {
    setOpenTransferModal(false);
    setTransferItems([]);
    setErrors({ transferItems: [], destinationForm: {} });
  }, []);

  const handleOpenDestinationModal = useCallback(
    (transfers: TransferFormItem[]) => {
      if (!permissions.canCreateTransfer) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para criar transferências!',
        });
        log('Permissão de criação de transferência negada');
        return;
      }
      if (!transfers || transfers.length === 0) {
        setAlert({ severity: 'error', message: 'Nenhum item válido' });
        return;
      }
  
      const validTransfers = transfers.filter(
        (item) => item.id_produto && item.id_localizacao_origem && item.quantidadeTransferida > 0,
      );
  
      if (validTransfers.length === 0) {
        setAlert({ severity: 'error', message: 'Nenhum item válido' });
        return;
      }
  
      const destinations = validTransfers.map((item) => {
        // Verifica se já existe um registro para o produto no destino
        const existingLocation = productLocations.find(
          (loc) =>
            loc.id_produto === item.id_produto &&
            loc.id_localizacao !== item.id_localizacao_origem, // Evita a origem
        );
  
        return {
          id_produto: item.id_produto,
          id_localizacao: existingLocation?.id_localizacao || '',
          id_seccao: existingLocation?.id_seccao || '',
          id_prateleira: existingLocation?.id_prateleira || '',
          id_corredor: existingLocation?.id_corredor || '',
          quantidadeProduto: item.quantidadeTransferida,
        };
      });
  
      setDestinationLocations(destinations);
      setTransferItems(validTransfers);
      setCurrentDestinationIndex(0);
      setDestinationForm({
        id_produto: validTransfers[0].id_produto,
        id_localizacao: destinations[0].id_localizacao,
        id_seccao: destinations[0].id_seccao,
        id_prateleira: destinations[0].id_prateleira,
        id_corredor: destinations[0].id_corredor,
        quantidadeProduto: validTransfers[0].quantidadeTransferida,
      });
      setErrors({ transferItems: [], destinationForm: {} });
      setOpenDestinationModal(true);
    },
    [permissions.canCreateTransfer, productLocations],
  );

  const handleCloseDestinationModal = useCallback(
    async (isCancel = true) => {
      try {
        setLoading(true);
        setAlert(null);

        if (isCancel && !isTransferSuccessful) {
          for (const original of originalLocations) {
            if (original.id) {
              await updateProductLocation(original.id, original);
            }
          }
          setAlert({ severity: 'info', message: 'Transferência cancelada' });
        }
      } catch (error: any) {
        console.error('Erro ao reverter:', error);
        setAlert({ severity: 'error', message: 'Erro ao reverter' });
      } finally {
        setOpenDestinationModal(false);
        setDestinationLocations([]);
        setOriginalLocations([]);
        setCurrentDestinationIndex(0);
        setDestinationForm({
          id_produto: '',
          id_localizacao: '',
          id_seccao: '',
          id_prateleira: '',
          id_corredor: '',
          quantidadeProduto: 0,
        });
        setErrors({ transferItems: [], destinationForm: {} });
        setIsTransferSuccessful(false);
        await fetchData();
        await updateStockData();
        setLoading(false);
      }
    },
    [originalLocations, fetchData, updateStockData, isTransferSuccessful],
  );

  const handleChangePage = useCallback((_event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const toggleExpandLocation = useCallback((locationId: string) => {
    setExpandedLocations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) newSet.delete(locationId);
      else newSet.add(locationId);
      return newSet;
    });
  }, []);

  const getTotalStockInLocations = useCallback(
    (productId: string, excludeLocationId?: string) => {
      return productLocations
        .filter((loc) => loc.id_produto === productId && loc.id !== excludeLocationId)
        .reduce((sum, loc) => sum + (loc.quantidadeProduto ?? 0), 0);
    },
    [productLocations],
  );

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
    const grouped: Record<string, ProdutoLocalizacao[]> = {};
    filteredProductLocations.forEach((loc) => {
      if (!grouped[loc.id_localizacao]) grouped[loc.id_localizacao] = [];
      grouped[loc.id_localizacao].push(loc);
    });
    return grouped;
  }, [filteredProductLocations]);

  const uniqueLocationIds = useMemo(
    () => Object.keys(groupedProductLocations).sort(),
    [groupedProductLocations],
  );
  const paginatedLocationIds = useMemo(
    () => uniqueLocationIds.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [uniqueLocationIds, page, rowsPerPage],
  );

  const locationsWithProduct = useMemo(() => {
    const locationIds = new Set(productLocations.map((loc) => loc.id_localizacao));
    return locations.filter((loc) => locationIds.has(loc?.id!));
  }, [locations, productLocations]);

  const addTransferItem = useCallback(() => {
    setTransferItems((prev) => [
      ...prev,
      { id_produto: '', id_localizacao_origem: '', quantidadeTransferida: 0 },
    ]);
    setErrors((prev) => ({
      ...prev,
      transferItems: [
        ...prev.transferItems,
        { id_produto: '', id_localizacao_origem: '', quantidadeTransferida: '' },
      ],
    }));
  }, []);

  const removeTransferItem = useCallback((index: number) => {
    setTransferItems((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({
      ...prev,
      transferItems: prev.transferItems.filter((_, i) => i !== index),
    }));
  }, []);

  const handleTransferItemChange = useCallback(
    (index: number, field: keyof TransferFormItem, value: string | number) => {
      setTransferItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
      );
      setErrors((prev) => {
        const newErrors = [...prev.transferItems];
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

  const validateTransferForm = useCallback(() => {
    const newErrors: Errors['transferItems'] = transferItems.map(() => ({}));
    let isValid = true;

    transferItems.forEach((item, index) => {
      if (!item.id_produto) {
        newErrors[index].id_produto = 'Produto obrigatório';
        isValid = false;
      }
      if (!item.id_localizacao_origem) {
        newErrors[index].id_localizacao_origem = 'Origem obrigatória';
        isValid = false;
      }
      if (item.quantidadeTransferida <= 0) {
        newErrors[index].quantidadeTransferida = 'Quantidade inválida';
        isValid = false;
      }

      const fromLocation = productLocations.find(
        (loc) =>
          loc.id_produto === item.id_produto && loc.id_localizacao === item.id_localizacao_origem,
      );
      if (!fromLocation) {
        newErrors[index].id_localizacao_origem = 'Origem não encontrada';
        isValid = false;
      } else if (item.quantidadeTransferida > (fromLocation.quantidadeProduto ?? 0)) {
        newErrors[index].quantidadeTransferida =
          `Excede disponível (${fromLocation.quantidadeProduto ?? 0})`;
        isValid = false;
      }
    });

    setErrors((prev) => ({ ...prev, transferItems: newErrors }));
    return isValid;
  }, [transferItems, productLocations]);

  const validateDestinationForm = useCallback(() => {
    const newErrors: Errors['destinationForm'] = {};

    if (!destinationForm.id_localizacao) newErrors.id_localizacao = 'Localização obrigatória';
    if (!destinationForm.id_seccao) newErrors.id_seccao = 'Seção obrigatória';
    if (!destinationForm.id_prateleira) newErrors.id_prateleira = 'Prateleira obrigatória';
    if (!destinationForm.id_corredor) newErrors.id_corredor = 'Corredor obrigatório';
    if (destinationForm.quantidadeProduto <= 0) newErrors.quantidadeProduto = 'Quantidade inválida';
    if (
      destinationForm.id_localizacao &&
      transferItems[currentDestinationIndex] &&
      destinationForm.id_localizacao ===
        transferItems[currentDestinationIndex].id_localizacao_origem
    ) {
      newErrors.id_localizacao = 'Destino igual à origem';
    }

    setErrors((prev) => ({ ...prev, destinationForm: newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [destinationForm, transferItems, currentDestinationIndex]);

  const handleEditLocation = useCallback(
    (id?: string) => {
      if (!permissions.canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar localizações!',
        });
        log('Permissão de atualização negada');
        return;
      }
      if (!id) {
        setAlert({ severity: 'error', message: 'ID inválido' });
        return;
      }
      const location = productLocations.find((loc) => loc.id === id);
      if (location) {
        setEditLocationId(id);
        setIdProdutoLocalizacao(location.id_produto);
        setIdLocalizacao(location.id_localizacao);
        setIdSeccao(location.id_seccao);
        setIdPrateleira(location.id_prateleira);
        setIdCorredor(location.id_corredor);
        setQuantidadeProduto(location.quantidadeProduto ?? 0);
        setQuantidadeMinimaProduto(location.quantidadeMinimaProduto ?? 0);
        setErrors({ transferItems: [], destinationForm: {} });
        log('Editando localização:', location);
      } else {
        setAlert({ severity: 'error', message: 'Localização não encontrada' });
      }
    },
    [productLocations, permissions.canUpdate],
  );

  const handleUpdateProductLocation = useCallback(async () => {
    if (!permissions.canUpdate) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar localizações!',
      });
      log('Permissão de atualização negada');
      return;
    }
    const newErrors: Record<string, string> = {};

    if (!idProdutoLocalizacao) newErrors.idProdutoLocalizacao = 'Produto obrigatório';
    if (!idLocalizacao) newErrors.idLocalizacao = 'Localização obrigatória';
    if (!idSeccao) newErrors.idSeccao = 'Seção obrigatória';
    if (!idPrateleira) newErrors.idPrateleira = 'Prateleira obrigatória';
    if (!idCorredor) newErrors.idCorredor = 'Corredor obrigatório';
    if (quantidadeProduto <= 0) newErrors.quantidadeProduto = 'Quantidade inválida';
    if (quantidadeMinimaProduto < 0) newErrors.quantidadeMinimaProduto = 'Mínimo inválido';
    if (quantidadeProduto < quantidadeMinimaProduto)
      newErrors.quantidadeProduto = `Abaixo do mínimo (${quantidadeMinimaProduto})`;

    let totalStock = 0;
    try {
      const stock = await getStockByProduct(idProdutoLocalizacao);
      if (!stock) throw new Error('Estoque não encontrado');
      totalStock = Number(stock.quantidadeAtual) || 0;
    } catch {
      newErrors.idProdutoLocalizacao = 'Sem estoque registrado';
    }

    if (totalStock > 0) {
      const currentTotal = getTotalStockInLocations(idProdutoLocalizacao, editLocationId);
      const currentLocation = editLocationId
        ? productLocations.find((loc) => loc.id === editLocationId)
        : null;
      const currentLocationQty = currentLocation ? (currentLocation.quantidadeProduto ?? 0) : 0;
      const newTotal = currentTotal - currentLocationQty + quantidadeProduto;
      if (newTotal > totalStock) newErrors.quantidadeProduto = `Excede estoque (${totalStock})`;
    } else {
      newErrors.quantidadeProduto = 'Sem estoque disponível';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors({ transferItems: [], destinationForm: {} });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      const locationData: ProdutoLocalizacao = {
        id: editLocationId,
        id_produto: idProdutoLocalizacao,
        id_localizacao: idLocalizacao,
        id_seccao: idSeccao,
        id_prateleira: idPrateleira,
        id_corredor: idCorredor,
        quantidadeProduto,
        quantidadeMinimaProduto,
      };

      await updateProductLocation(editLocationId, locationData);
      setAlert({ severity: 'success', message: 'Localização atualizada' });
      log('Localização atualizada:', locationData);

      await fetchData();
      await updateStockData();
      setEditLocationId('');
      setIdProdutoLocalizacao('');
      setIdLocalizacao('');
      setIdSeccao('');
      setIdPrateleira('');
      setIdCorredor('');
      setQuantidadeProduto(0);
      setQuantidadeMinimaProduto(0);
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao atualizar' });
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
    fetchData,
    updateStockData,
    permissions.canUpdate,
  ]);

  const handleDeleteLocation = useCallback(async () => {
    if (!permissions.canDelete) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para excluir localizações!' });
      log('Permissão de exclusão negada');
      return;
    }
    if (!locationToDelete) return;

    try {
      setLoading(true);
      setAlert(null);
      const location = productLocations.find((loc) => loc.id === locationToDelete);
      if (!location) throw new Error('Localização não encontrada');

      await deleteProductLocation(locationToDelete);
      await fetchData();
      await updateStockData();
      setAlert({ severity: 'success', message: 'Localização excluída' });
      log('Localização excluída:', locationToDelete);
      handleCloseConfirmModal();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao excluir' });
    } finally {
      setLoading(false);
    }
  }, [
    locationToDelete,
    productLocations,
    handleCloseConfirmModal,
    fetchData,
    updateStockData,
    permissions.canDelete,
  ]);

  const handleTransferProducts = useCallback(async () => {
    if (!permissions.canCreateTransfer) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para criar transferências!' });
      console.log('Permissão de criação de transferência negada');
      return;
    }
    if (!validateTransferForm()) {
      console.log('Validação do formulário de transferência falhou');
      setAlert({ severity: 'error', message: 'Erro na validação dos itens de transferência' });
      return;
    }
  
    try {
      setLoading(true);
      setAlert(null);
  
      // Log inicial dos itens a transferir
      console.log('Iniciando transferência com itens:', JSON.stringify(transferItems, null, 2));
  
      // Validar quantidades disponíveis
      for (const item of transferItems) {
        const fromLocation = productLocations.find(
          (loc) =>
            loc.id_produto === item.id_produto && loc.id_localizacao === item.id_localizacao_origem,
        );
        if (!fromLocation) {
          throw new Error(`Origem não encontrada para o produto ${item.id_produto}`);
        }
        console.log(
          `Produto ${item.id_produto} na origem ${item.id_localizacao_origem}: Disponível=${
            fromLocation.quantidadeProduto ?? 0
          }, Solicitado=${item.quantidadeTransferida}`,
        );
        if (item.quantidadeTransferida > (fromLocation.quantidadeProduto ?? 0)) {
          throw new Error(
            `Quantidade insuficiente para ${item.id_produto}. Disponível: ${
              fromLocation.quantidadeProduto ?? 0
            }, Solicitado: ${item.quantidadeTransferida}`,
          );
        }
      }
  
      // Não atualizar localizações; apenas abrir o modal de destino
      setAlert({ severity: 'success', message: 'Validação concluída, selecione o destino' });
      handleCloseTransferModal();
      handleOpenDestinationModal(transferItems);
    } catch (error: any) {
      console.error('Erro na validação de transferência:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro na validação de transferência' });
    } finally {
      setLoading(false);
    }
  }, [
    transferItems,
    productLocations,
    validateTransferForm,
    handleCloseTransferModal,
    handleOpenDestinationModal,
    permissions.canCreateTransfer,
  ]);

  const handleSaveDestination = useCallback(async () => {
    if (!permissions.canCreateTransfer) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para criar transferências!' });
      console.log('Permissão de criação de transferência negada');
      return;
    }
    if (!permissions.canCreateLocation) {
      setAlert({ severity: 'error', message: 'Você não tem permissão para criar localizações!' });
      console.log('Permissão de criação de localização negada');
      return;
    }
    if (!validateDestinationForm()) {
      console.log('Validação do formulário de destino falhou');
      return;
    }
  
    try {
      setLoading(true);
      setAlert(null);
  
      if (currentDestinationIndex >= transferItems.length || currentDestinationIndex < 0) {
        throw new Error('Índice inválido');
      }
  
      const transferItem = transferItems[currentDestinationIndex];
      if (!transferItem?.id_localizacao_origem || !transferItem.id_produto) {
        throw new Error('Item inválido');
      }
  
      console.log(
        `Salvando destino para produto ${destinationForm.id_produto}, quantidade: ${
          destinationForm.quantidadeProduto
        }`,
      );
  
      // Enviar transferência diretamente
      const transferData = {
        id_funcionario: loggedInFuncionarioId,
        id_produto: destinationForm.id_produto,
        id_localizacao_origem: transferItem.id_localizacao_origem,
        id_localizacao_destino: destinationForm.id_localizacao,
        id_seccao_destino: destinationForm.id_seccao,
        id_prateleira_destino: destinationForm.id_prateleira,
        id_corredor_destino: destinationForm.id_corredor,
        quantidadeTransferida: destinationForm.quantidadeProduto,
        dataTransferencia: new Date(),
        id_produtoLocalizacao: '', // Será determinado no backend
      };
  
      console.log('Criando transferência:', JSON.stringify(transferData, null, 2));
      await createTransfer(transferData);
  
      // Atualizar estado após sucesso
      if (currentDestinationIndex < transferItems.length - 1) {
        const nextIndex = currentDestinationIndex + 1;
        setCurrentDestinationIndex(nextIndex);
        setDestinationForm({
          id_produto: transferItems[nextIndex].id_produto,
          id_localizacao: '',
          id_seccao: '',
          id_prateleira: '',
          id_corredor: '',
          quantidadeProduto: transferItems[nextIndex].quantidadeTransferida,
        });
        setErrors({ transferItems: [], destinationForm: {} });
      } else {
        setAlert({ severity: 'success', message: 'Transferências concluídas' });
        setOriginalLocations([]);
        setTransferItems([]);
        setIsTransferSuccessful(true);
        await fetchData();
        await updateStockData();
        handleCloseDestinationModal(false);
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setAlert({ severity: 'error', message: error.message || 'Erro ao salvar' });
      handleCloseDestinationModal(true);
    } finally {
      setLoading(false);
    }
  }, [
    destinationForm,
    currentDestinationIndex,
    transferItems,
    loggedInFuncionarioId,
    validateDestinationForm,
    handleCloseDestinationModal,
    fetchData,
    updateStockData,
    permissions.canCreateTransfer,
    permissions.canCreateLocation,
  ]);

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 300 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      {isLoading ? (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 2, width: '100%' }}>
            <Collapse in={open}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h5">Localizações de Produtos</Typography>
                <Stack direction="row" spacing={2}>
                  <Select
                    value={selectedLocationType}
                    onChange={(e: SelectChangeEvent<string>) =>
                      setSelectedLocationType(e.target.value)
                    }
                    displayEmpty
                    sx={{ minWidth: 200 }}
                    disabled={loading || !permissions.canRead}
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
                    disabled={loading || !permissions.canRead}
                    InputProps={{ endAdornment: <IconifyIcon icon="heroicons-solid:search" /> }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenTransferModal}
                    disabled={loading || !permissions.canCreateTransfer}
                    startIcon={<IconifyIcon icon="heroicons-solid:arrow-right" />}
                    title={
                      !permissions.canCreateTransfer
                        ? 'Você não tem permissão para criar transferências'
                        : ''
                    }
                  >
                    Transferir
                  </Button>
                </Stack>
              </Stack>
            </Collapse>
          </Paper>

          <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
            <Box sx={confirmModalStyle}>
              <Typography variant="h6" gutterBottom>
                Confirmar Exclusão
              </Typography>
              <Typography variant="body1" mb={3}>
                Tem certeza que deseja excluir esta localização?
              </Typography>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
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
                  disabled={loading || !permissions.canDelete}
                  title={
                    !permissions.canDelete ? 'Você não tem permissão para excluir localizações' : ''
                  }
                >
                  {loading ? 'Excluindo...' : 'Excluir'}
                </Button>
              </Stack>
            </Box>
          </Modal>

          <Modal open={openTransferModal} onClose={handleCloseTransferModal}>
            <Box sx={transferModalStyle}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h5">Transferir Produtos</Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCloseTransferModal}
                  disabled={loading}
                >
                  Fechar
                </Button>
              </Stack>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <Grid container spacing={2}>
                {transferItems.map((item, index) => {
                  const availableProducts = productLocations
                    .filter(
                      (loc) =>
                        loc.id_localizacao === item.id_localizacao_origem &&
                        (loc.quantidadeProduto ?? 0) > 0,
                    )
                    .map((loc) => loc.id_produto)
                    .filter((value, idx, self) => self.indexOf(value) === idx)
                    .map((id_produto) => products.find((p) => p.id === id_produto)!)
                    .filter((p) => p);
                  const stockAvailable =
                    productLocations.find(
                      (loc) =>
                        loc.id_produto === item.id_produto &&
                        loc.id_localizacao === item.id_localizacao_origem,
                    )?.quantidadeProduto ?? 0;
                  return (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        p: 2,
                        border: 1,
                        borderRadius: 1,
                        borderColor: 'grey.300',
                        width: '100%',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 2 }}
                      >
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
                            value={item.id_localizacao_origem}
                            onChange={(e: SelectChangeEvent<string>) => {
                              handleTransferItemChange(
                                index,
                                'id_localizacao_origem',
                                e.target.value,
                              );
                              handleTransferItemChange(index, 'id_produto', '');
                            }}
                            displayEmpty
                            fullWidth
                            error={!!errors.transferItems[index]?.id_localizacao_origem}
                            disabled={loading || !permissions.canCreateTransfer}
                          >
                            <MenuItem value="" disabled>
                              Selecione a Origem
                            </MenuItem>
                            {locationsWithProduct.map((loc) => (
                              <MenuItem key={loc.id} value={loc.id}>
                                {loc.nomeLocalizacao}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.transferItems[index]?.id_localizacao_origem && (
                            <FormHelperText error>
                              {errors.transferItems[index].id_localizacao_origem}
                            </FormHelperText>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Select
                            value={item.id_produto}
                            onChange={(e: SelectChangeEvent<string>) =>
                              handleTransferItemChange(index, 'id_produto', e.target.value)
                            }
                            displayEmpty
                            fullWidth
                            error={!!errors.transferItems[index]?.id_produto}
                            disabled={
                              loading ||
                              !item.id_localizacao_origem ||
                              availableProducts.length === 0 ||
                              !permissions.canCreateTransfer
                            }
                          >
                            <MenuItem value="" disabled>
                              Selecione um Produto
                            </MenuItem>
                            {availableProducts.map((prod) => {
                              const stock =
                                productLocations.find(
                                  (pl) =>
                                    pl.id_produto === prod.id &&
                                    pl.id_localizacao === item.id_localizacao_origem,
                                )?.quantidadeProduto ?? 0;
                              return (
                                <MenuItem key={prod.id} value={prod.id}>
                                  {prod.nomeProduto} (Estoque: {stock})
                                </MenuItem>
                              );
                            })}
                          </Select>
                          {errors.transferItems[index]?.id_produto && (
                            <FormHelperText error>
                              {errors.transferItems[index].id_produto}
                            </FormHelperText>
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
                            error={!!errors.transferItems[index]?.quantidadeTransferida}
                            helperText={
                              errors.transferItems[index]?.quantidadeTransferida ||
                              `Disponível: ${stockAvailable}`
                            }
                            disabled={loading || !item.id_produto || !permissions.canCreateTransfer}
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
                    disabled={loading || !permissions.canCreateTransfer}
                    sx={{ mb: 2 }}
                    fullWidth
                    title={
                      !permissions.canCreateTransfer
                        ? 'Você não tem permissão para criar transferências'
                        : ''
                    }
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
                      disabled={loading || !permissions.canCreateTransfer}
                      fullWidth
                      title={
                        !permissions.canCreateTransfer
                          ? 'Você não tem permissão para criar transferências'
                          : ''
                      }
                    >
                      {loading ? 'Iniciando...' : 'Iniciar Transferências'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Modal>

          <Modal open={openDestinationModal} onClose={() => handleCloseDestinationModal(true)}>
            <Box sx={modalStyle}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h5">
                  Destino ({currentDestinationIndex + 1} de {destinationLocations.length})
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleCloseDestinationModal(true)}
                  disabled={loading}
                >
                  Fechar
                </Button>
              </Stack>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Produto:{' '}
                {products.find((p) => p.id === destinationForm.id_produto)?.nomeProduto || 'N/A'}
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
                    error={!!errors.destinationForm.id_localizacao}
                    disabled={loading || !permissions.canCreateTransfer}
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
                  {errors.destinationForm.id_localizacao && (
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
                    error={!!errors.destinationForm.id_seccao}
                    disabled={loading || !permissions.canCreateTransfer}
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
                  {errors.destinationForm.id_seccao && (
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
                    error={!!errors.destinationForm.id_prateleira}
                    disabled={loading || !permissions.canCreateTransfer}
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
                  {errors.destinationForm.id_prateleira && (
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
                    error={!!errors.destinationForm.id_corredor}
                    disabled={loading || !permissions.canCreateTransfer}
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
                  {errors.destinationForm.id_corredor && (
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
                    disabled={
                      loading || !permissions.canCreateTransfer || !permissions.canCreateLocation
                    }
                    fullWidth
                    title={
                      !permissions.canCreateTransfer
                        ? 'Você não tem permissão para criar transferências'
                        : !permissions.canCreateLocation
                          ? 'Você não tem permissão para criar localizações'
                          : ''
                    }
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
                          <CircularProgress size={24} />
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
                                          const product = products.find(
                                            (p) => p.id === loc.id_produto,
                                          );
                                          const isBelowLimit =
                                            (loc.quantidadeProduto ?? 0) <=
                                            (loc.quantidadeMinimaProduto ?? 0);
                                          return (
                                            <TableRow
                                              key={loc.id}
                                              sx={{ bgcolor: isBelowLimit ? '#ffebee' : 'inherit' }}
                                            >
                                              <TableCell
                                                sx={{ color: isBelowLimit ? 'red' : 'inherit' }}
                                              >
                                                {product?.nomeProduto ?? 'N/A'}
                                              </TableCell>
                                              <TableCell
                                                sx={{ color: isBelowLimit ? 'red' : 'inherit' }}
                                              >
                                                {sections.find((s) => s.id === loc.id_seccao)
                                                  ?.nomeSeccao ?? 'N/A'}
                                              </TableCell>
                                              <TableCell
                                                sx={{ color: isBelowLimit ? 'red' : 'inherit' }}
                                              >
                                                {shelves.find((s) => s.id === loc.id_prateleira)
                                                  ?.nomePrateleira ?? 'N/A'}
                                              </TableCell>
                                              <TableCell
                                                sx={{ color: isBelowLimit ? 'red' : 'inherit' }}
                                              >
                                                {corridors.find((c) => c.id === loc.id_corredor)
                                                  ?.nomeCorredor ?? 'N/A'}
                                              </TableCell>
                                              <TableCell
                                                sx={{ color: isBelowLimit ? 'red' : 'inherit' }}
                                              >
                                                {loc.quantidadeProduto ?? 0}
                                              </TableCell>
                                              <TableCell
                                                sx={{ color: isBelowLimit ? 'red' : 'inherit' }}
                                              >
                                                {loc.quantidadeMinimaProduto ?? 0}
                                              </TableCell>
                                              <TableCell align="right">
                                                <IconButton
                                                  color="primary"
                                                  onClick={() => handleEditLocation(loc.id)}
                                                  disabled={loading || !permissions.canUpdate}
                                                  title={
                                                    !permissions.canUpdate
                                                      ? 'Você não tem permissão para atualizar localizações'
                                                      : ''
                                                  }
                                                >
                                                  <Edit />
                                                </IconButton>
                                                <IconButton
                                                  color="error"
                                                  onClick={() => handleOpenConfirmModal(loc?.id!)}
                                                  disabled={loading || !permissions.canDelete}
                                                  title={
                                                    !permissions.canDelete
                                                      ? 'Você não tem permissão para excluir localizações'
                                                      : ''
                                                  }
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
                          Nenhuma localização cadastrada
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
                  disabled={!permissions.canRead}
                />
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default ProductLocationComponent;
