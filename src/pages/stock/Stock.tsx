import {
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Modal,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TablePagination,
  Box,
  FormHelperText,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  getAllStock,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry,
  getAllProducts,
  getAllSuppliers,
  getAllEmployees,
  getAllStockEntries,
  createStock,
  updateStock,
  deleteStock,
  getAllSections,
  getAllShelves,
  getAllCorridors,
  getAllLocations,
  createProductLocation,
  getAllProductLocations,
} from '../../api/methods';
import {
  DadosEntradaEstoque,
  DadosEstoque,
  Produto,
  Fornecedor,
  Funcionario,
  ProdutoLocalizacao,
  Localizacao,
  Seccao,
  Prateleira,
  Corredor,
} from 'types/models';

const modalStyle = {
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

const formatDateToInput = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateToDisplay = (date: string | Date): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

interface ProductFormItem {
  id_produto: string;
  quantidadeRecebida: number;
  custoUnitario: number;
  lote: string;
  dataValidadeLote: Date;
}

const Stock: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editStockModal, setEditStockModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmDeleteEntry, setOpenConfirmDeleteEntry] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<{
    id: string;
    dataEntrada: Date;
    id_fornecedor: string;
    id_funcionario: string;
    entries: DadosEntradaEstoque[];
  } | null>(null);
  const [deleteStockId, setDeleteStockId] = useState<string | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<DadosEstoque | null>(null);
  const [lastEntries, setLastEntries] = useState<DadosEntradaEstoque[]>([]);
  const [showStockEntries, setShowStockEntries] = useState(false);
  const [form, setForm] = useState<{
    id_fornecedor: string;
    id_funcionario: string;
    dataEntrada: Date;
    products: ProductFormItem[];
  }>({
    id_fornecedor: '',
    id_funcionario: '',
    dataEntrada: new Date(),
    products: [
      {
        id_produto: '',
        quantidadeRecebida: 0,
        custoUnitario: 0,
        lote: '',
        dataValidadeLote: new Date(),
      },
    ],
  });
  const [stockForm, setStockForm] = useState<Partial<DadosEstoque>>({
    id_produto: '',
    quantidadeAtual: 0,
    lote: '',
    dataValidadeLote: new Date(),
  });
  const [locationForm, setLocationForm] = useState<Partial<ProdutoLocalizacao>>({
    id_produto: '',
    id_localizacao: '',
    quantidadeProduto: 0,
    id_seccao: '',
    id_prateleira: '',
    id_corredor: '',
    quantidadeMinimaProduto: 0,
  });
  const [locationIndex, setLocationIndex] = useState(0);
  const [stockEntries, setStockEntries] = useState<DadosEntradaEstoque[]>([]);
  const [filteredStockEntries, setFilteredStockEntries] = useState<DadosEntradaEstoque[]>([]);
  const [currentStock, setCurrentStock] = useState<DadosEstoque[]>([]);
  const [filteredStock, setFilteredStock] = useState<DadosEstoque[]>([]);
  const [products, setProducts] = useState<Produto[]>([]);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [employees, setEmployees] = useState<Funcionario[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [sections, setSections] = useState<Seccao[]>([]);
  const [shelves, setShelves] = useState<Prateleira[]>([]);
  const [corridors, setCorridors] = useState<Corredor[]>([]);
  const [productsWithoutLocation, setProductsWithoutLocation] = useState<DadosEstoque[]>([]);
  const [filteredProductsWithoutLocation, setFilteredProductsWithoutLocation] = useState<
    DadosEstoque[]
  >([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryPage, setEntryPage] = useState(0);
  const [stockPage, setStockPage] = useState(0);
  const [rowsPerPage] = useState(6);
  const [loading, setLoading] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const groupStockEntries = (entries: DadosEntradaEstoque[]) => {
    const grouped: { [key: string]: DadosEntradaEstoque[] } = {};
  
    entries.forEach((entry) => {
      const dataEntrada = new Date(entry.dataEntrada); // Garantir que é Date
      const key = `${dataEntrada.toISOString()}-${entry.id_fornecedor}-${entry.id_funcionario}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });
  
    return Object.values(grouped).map((entries, index) => ({
      id: `group-${index}`, // ID único para o grupo
      dataEntrada: new Date(entries[0].dataEntrada), // Garantir que é Date
      id_fornecedor: entries[0].id_fornecedor,
      id_funcionario: entries[0].id_funcionario,
      entries, // Lista de entradas no grupo
    }));
  };
  const groupedStockEntries = useMemo(() => groupStockEntries(filteredStockEntries), [filteredStockEntries]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [
        stockEntriesData,
        stockData,
        productsData,
        suppliersData,
        employeesData,
        locationsData,
        sectionsData,
        shelvesData,
        corridorsData,
        productLocationsData,
      ] = await Promise.all([
        getAllStockEntries(),
        getAllStock(),
        getAllProducts(),
        getAllSuppliers(),
        getAllEmployees(),
        getAllLocations(),
        getAllSections(),
        getAllShelves(),
        getAllCorridors(),
        getAllProductLocations(),
      ]);

      console.log('Stock Data:', stockData);
      console.log('Product Locations Data:', productLocationsData);

      if (!productsData || productsData.length === 0) {
        console.warn('Nenhum produto retornado pela API getAllProducts');
        setFetchError('Nenhum produto encontrado. Verifique a API de produtos.');
      }

      const productsWithoutLocationData = stockData.filter((stockItem) => {
        return !productLocationsData.some(
          (location) => location.id_produto === stockItem.id_produto,
        );
      });

      console.log('Products Without Location:', productsWithoutLocationData);

      setStockEntries(stockEntriesData ?? []);
      setFilteredStockEntries(stockEntriesData ?? []);
      setCurrentStock(stockData ?? []);
      setFilteredStock(stockData ?? []);
      setProducts(productsData ?? []);
      setSuppliers(suppliersData ?? []);
      setEmployees(employeesData ?? []);
      setLocations(locationsData ?? []);
      setSections(sectionsData ?? []);
      setShelves(shelvesData ?? []);
      setCorridors(corridorsData ?? []);
      setProductLocations(productLocationsData ?? []);
      setProductsWithoutLocation(productsWithoutLocationData ?? []);
      setFilteredProductsWithoutLocation(productsWithoutLocationData ?? []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setFetchError('Erro ao carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = useCallback(() => {
    let userId = '';
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFetchError('Nenhum usuário logado encontrado. Faça login novamente.');
        return;
      }

      let decoded: { userId?: string } = {};
      try {
        decoded = jwtDecode(token);
      } catch (err) {
        console.error('Erro ao decodificar token:', err);
        setFetchError('Token inválido. Faça login novamente.');
        return;
      }

      userId = decoded.userId || '';
      if (!userId) {
        setFetchError('ID do usuário não encontrado no token. Faça login novamente.');
        return;
      }

      const userExists = employees.some((employee) => employee.id === userId);
      if (!userExists) {
        setFetchError('Funcionário logado não encontrado na lista de funcionários.');
        return;
      }

      setForm({
        id_fornecedor: '',
        id_funcionario: userId,
        dataEntrada: new Date(),
        products: [
          {
            id_produto: '',
            quantidadeRecebida: 0,
            custoUnitario: 0,
            lote: '',
            dataValidadeLote: new Date(),
          },
        ],
      });
      setErrors({});
      setOpenModal(true);
    } catch (error) {
      console.error('Erro ao recuperar usuário:', error);
      setFetchError('Erro ao recuperar informações do usuário logado. Tente novamente.');
    }
  }, [employees]);

  const handleClose = useCallback(() => {
    setOpenModal(false);
    setErrors({});
    setSuccessMessage(null);
    setLastEntries([]);
    setIsEditing(false);
    setEditEntryId(null);
  }, []);

  const handleEditStockClose = useCallback(() => {
    setEditStockModal(false);
    setEditStockId(null);
    setStockForm({
      id_produto: '',
      quantidadeAtual: 0,
      lote: '',
      dataValidadeLote: new Date(),
    });
    setErrors({});
    setSuccessMessage(null);
  }, []);

  const handleOpenLocationModal = useCallback(
    (stocks: DadosEstoque[], entries: DadosEntradaEstoque[]) => {
      setLastEntries(entries);
      setSelectedStock(stocks[0]);
      setLocationIndex(0);
      setLocationForm({
        id_produto: stocks[0].id_produto,
        id_localizacao: '',
        quantidadeProduto: entries[0]?.quantidadeRecebida || stocks[0].quantidadeAtual,
        id_seccao: '',
        id_prateleira: '',
        id_corredor: '',
        quantidadeMinimaProduto: 0,
      });
      setErrors({});
      setOpenLocationModal(true);
    },
    [],
  );

  const handleCloseLocationModal = useCallback(() => {
    setOpenLocationModal(false);
    setSelectedStock(null);
    setLocationForm({
      id_produto: '',
      id_localizacao: '',
      quantidadeProduto: 0,
      id_seccao: '',
      id_prateleira: '',
      id_corredor: '',
      quantidadeMinimaProduto: 0,
    });
    setErrors({});
    setSuccessMessage(null);
    setLastEntries([]);
    setLocationIndex(0);
  }, []);

  const handleOpenDetailsModal = useCallback((group: {
    id: string;
    dataEntrada: Date;
    id_fornecedor: string;
    id_funcionario: string;
    entries: DadosEntradaEstoque[];
  }) => {
    setSelectedEntry(group);
    setOpenDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setOpenDetailsModal(false);
    setSelectedEntry(null);
  }, []);

  const handleOpenConfirmDelete = useCallback((id: string) => {
    setDeleteStockId(id);
    setOpenConfirmDelete(true);
  }, []);

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteStockId(null);
  }, []);

  const handleOpenConfirmDeleteEntry = useCallback((id: string) => {
    setDeleteEntryId(id);
    setOpenConfirmDeleteEntry(true);
  }, []);

  const handleCloseConfirmDeleteEntry = useCallback(() => {
    setOpenConfirmDeleteEntry(false);
    setDeleteEntryId(null);
  }, []);

  const handleTextFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        products: prev.products.map((item, i) =>
          i === index
            ? {
                ...item,
                [name]:
                  name === 'custoUnitario' || name === 'quantidadeRecebida'
                    ? Number(value) || 0
                    : name === 'dataValidadeLote'
                      ? new Date(value)
                      : value,
              }
            : item,
        ),
      }));
      setErrors((prev) => ({ ...prev, [`${name}_${index}`]: '' }));
    },
    [],
  );

  const handleGlobalTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'dataEntrada' ? new Date(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleStockTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({
      ...prev,
      [name]:
        name === 'quantidadeAtual'
          ? Number(value) || 0
          : name === 'dataValidadeLote'
            ? new Date(value)
            : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleLocationTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationForm((prev) => ({
      ...prev,
      [name]:
        name === 'quantidadeProduto' || name === 'quantidadeMinimaProduto'
          ? Number(value) || 0
          : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleSelectChange = useCallback((e: SelectChangeEvent<string>, index?: number) => {
    const { name, value } = e.target;
    if (index !== undefined) {
      setForm((prev) => ({
        ...prev,
        products: prev.products.map((item, i) => (i === index ? { ...item, [name]: value } : item)),
      }));
      setErrors((prev) => ({ ...prev, [`${name}_${index}`]: '' }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, []);

  const handleStockSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setStockForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, []);

  const handleLocationSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setLocationForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, []);

  const addProduct = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id_produto: '',
          quantidadeRecebida: 0,
          custoUnitario: 0,
          lote: '',
          dataValidadeLote: new Date(),
        },
      ],
    }));
  }, []);

  const removeProduct = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.id_fornecedor) newErrors.id_fornecedor = 'Fornecedor é obrigatório';
    if (!form.id_funcionario) newErrors.id_funcionario = 'Funcionário é obrigatório';
    if (!form.dataEntrada || isNaN(new Date(form.dataEntrada).getTime()))
      newErrors.dataEntrada = 'Data de entrada é inválida';

    form.products.forEach((product, index) => {
      if (!product.id_produto) newErrors[`id_produto_${index}`] = 'Produto é obrigatório';
      if (product.quantidadeRecebida <= 0)
        newErrors[`quantidadeRecebida_${index}`] = 'Quantidade deve ser maior que 0';
      if (product.custoUnitario <= 0)
        newErrors[`custoUnitario_${index}`] = 'Custo unitário deve ser maior que 0';
      if (!product.lote || !product.lote.trim()) newErrors[`lote_${index}`] = 'Lote é obrigatório';
      if (!product.dataValidadeLote || isNaN(new Date(product.dataValidadeLote).getTime()))
        newErrors[`dataValidadeLote_${index}`] = 'Data de validade é inválida';
      else if (new Date(product.dataValidadeLote) <= new Date(new Date().setHours(0, 0, 0, 0)))
        newErrors[`dataValidadeLote_${index}`] = 'Data de validade deve ser futura';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const validateStockForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!stockForm.id_produto) newErrors.id_produto = 'Produto é obrigatório';
    if (stockForm.quantidadeAtual === undefined || stockForm.quantidadeAtual < 0)
      newErrors.quantidadeAtual = 'Quantidade não pode ser negativa';
    if (!stockForm.lote || !stockForm.lote.trim()) newErrors.lote = 'Lote é obrigatório';
    if (!stockForm.dataValidadeLote || isNaN(new Date(stockForm.dataValidadeLote).getTime()))
      newErrors.dataValidadeLote = 'Data de validade é inválida';
    else if (new Date(stockForm.dataValidadeLote) <= new Date(new Date().setHours(0, 0, 0, 0)))
      newErrors.dataValidadeLote = 'Data de validade deve ser futura';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [stockForm]);

  const validateLocationForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!locationForm.id_produto) newErrors.id_produto = 'Produto é obrigatório';
    if (!locationForm.id_localizacao) newErrors.id_localizacao = 'Localização é obrigatória';
    if (locationForm.quantidadeProduto === undefined || locationForm.quantidadeProduto <= 0)
      newErrors.quantidadeProduto = 'Quantidade deve ser maior que 0';
    if (
      lastEntries.length > 0 &&
      locationForm.quantidadeProduto! > lastEntries[locationIndex].quantidadeRecebida
    ) {
      newErrors.quantidadeProduto = `Quantidade não pode exceder a entrada (${lastEntries[locationIndex].quantidadeRecebida})`;
    } else if (selectedStock && locationForm.quantidadeProduto! > selectedStock.quantidadeAtual) {
      newErrors.quantidadeProduto = `Quantidade não pode exceder o estoque atual (${selectedStock.quantidadeAtual})`;
    }
    if (!locationForm.id_seccao) newErrors.id_seccao = 'Seção é obrigatória';
    if (!locationForm.id_prateleira) newErrors.id_prateleira = 'Prateleira é obrigatória';
    if (!locationForm.id_corredor) newErrors.id_corredor = 'Corredor é obrigatório';
    if (
      locationForm.quantidadeMinimaProduto === undefined ||
      locationForm.quantidadeMinimaProduto < 0
    ) {
      newErrors.quantidadeMinimaProduto = 'Quantidade mínima deve ser não negativa';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [locationForm, selectedStock, lastEntries, locationIndex]);

  const onSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setFetchError(null);

      const newEntries: DadosEntradaEstoque[] = [];
      const newStocks: DadosEstoque[] = [];

      for (const product of form.products) {
        const entryData: DadosEntradaEstoque = {
          id_fornecedor: form.id_fornecedor!,
          id_produto: product.id_produto,
          id_funcionario: form.id_funcionario!,
          quantidadeRecebida: product.quantidadeRecebida,
          dataEntrada: form.dataEntrada!,
          custoUnitario: product.custoUnitario,
          lote: product.lote,
          dataValidadeLote: product.dataValidadeLote,
          adicionado: true,
        };

        if (isEditing && editEntryId) {
          const updatedEntry = await updateStockEntry(editEntryId, entryData);
          setStockEntries((prev) =>
            prev.map((item) => (item.id === editEntryId ? updatedEntry : item)),
          );
          setFilteredStockEntries((prev) =>
            prev.map((item) => (item.id === editEntryId ? updatedEntry : item)),
          );
          newEntries.push(updatedEntry);
        } else {
          const newEntry = await createStockEntry(entryData);
          newEntries.push(newEntry);
          setStockEntries((previous) => [...previous, newEntry]);
          setFilteredStockEntries((previous) => [...previous, newEntry]);

          const existingStock = currentStock.find(
            (item) =>
              item.id_produto === newEntry.id_produto &&
              item.lote === newEntry.lote &&
              item.dataValidadeLote.toISOString() === newEntry.dataValidadeLote.toISOString(),
          );

          let newStock: DadosEstoque;
          if (existingStock) {
            const updatedQuantity = existingStock.quantidadeAtual + newEntry.quantidadeRecebida;
            const stockData: DadosEstoque = {
              id: existingStock.id,
              id_produto: existingStock.id_produto,
              quantidadeAtual: updatedQuantity,
              lote: existingStock.lote,
              dataValidadeLote: existingStock.dataValidadeLote,
            };
            newStock = await updateStock(existingStock.id!, stockData);
            setCurrentStock((previous) =>
              previous.map((item) => (item.id === newStock.id ? newStock : item)),
            );
            setFilteredStock((previous) =>
              previous.map((item) => (item.id === newStock.id ? newStock : item)),
            );
          } else {
            const stockData: DadosEstoque = {
              id_produto: newEntry.id_produto,
              quantidadeAtual: newEntry.quantidadeRecebida,
              lote: newEntry.lote,
              dataValidadeLote: newEntry.dataValidadeLote,
            };
            newStock = await createStock(stockData);
            setCurrentStock((previous) => [...previous, newStock]);
            setFilteredStock((previous) => [...previous, newStock]);
          }
          newStocks.push(newStock);
        }
      }

      setSuccessMessage('Entradas adicionadas ao estoque. Agora selecione a localização.');
      handleClose();
      handleOpenLocationModal(newStocks, newEntries);
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar entrada de estoque:', error);
      setFetchError('Erro ao salvar entrada de estoque.');
    } finally {
      setLoading(false);
    }
  }, [
    form,
    isEditing,
    editEntryId,
    validateForm,
    handleClose,
    currentStock,
    handleOpenLocationModal,
    fetchData,
  ]);

  const onStockSubmit = useCallback(async () => {
    if (!validateStockForm()) return;

    try {
      setLoading(true);
      setFetchError(null);
      const stockData: DadosEstoque = {
        id_produto: stockForm.id_produto!,
        quantidadeAtual: stockForm.quantidadeAtual!,
        lote: stockForm.lote!,
        dataValidadeLote: stockForm.dataValidadeLote!,
      };

      if (editStockId) {
        const updatedStock = await updateStock(editStockId, stockData);
        setCurrentStock((previous) =>
          previous.map((item) => (item.id === editStockId ? updatedStock : item)),
        );
        setFilteredStock((previous) =>
          previous.map((item) => (item.id === editStockId ? updatedStock : item)),
        );
        setSuccessMessage('Estoque atualizado com sucesso!');
      } else {
        const newStock = await createStock(stockData);
        setCurrentStock((previous) => [...previous, newStock]);
        setFilteredStock((previous) => [...previous, newStock]);
        setSuccessMessage('Estoque criado com sucesso!');
      }
      handleEditStockClose();
      await fetchData();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      setFetchError('Erro ao atualizar estoque.');
    } finally {
      setLoading(false);
    }
  }, [stockForm, editStockId, validateStockForm, handleEditStockClose, fetchData]);

  const onLocationSubmit = useCallback(async () => {
    if (!validateLocationForm()) return;

    try {
      setLoading(true);
      setFetchError(null);

      const locationData: ProdutoLocalizacao = {
        id_produto: locationForm.id_produto!,
        id_localizacao: locationForm.id_localizacao!,
        quantidadeProduto: locationForm.quantidadeProduto!,
        id_seccao: locationForm.id_seccao!,
        id_prateleira: locationForm.id_prateleira!,
        id_corredor: locationForm.id_corredor!,
        quantidadeMinimaProduto: locationForm.quantidadeMinimaProduto!,
      };

      await createProductLocation(locationData);

      if (locationIndex < lastEntries.length - 1) {
        const nextIndex = locationIndex + 1;
        setLocationIndex(nextIndex);
        setLocationForm({
          id_produto: lastEntries[nextIndex].id_produto,
          id_localizacao: '',
          quantidadeProduto: lastEntries[nextIndex].quantidadeRecebida,
          id_seccao: '',
          id_prateleira: '',
          id_corredor: '',
          quantidadeMinimaProduto: 0,
        });
        setErrors({});
      } else {
        setSuccessMessage('Todos os produtos foram adicionados ao armazém com sucesso!');
        handleCloseLocationModal();
      }
      await fetchData();
    } catch (error) {
      console.error('Erro ao adicionar produto ao armazém:', error);
      setFetchError('Erro ao adicionar produto ao armazém.');
    } finally {
      setLoading(false);
    }
  }, [
    locationForm,
    validateLocationForm,
    handleCloseLocationModal,
    lastEntries,
    locationIndex,
    fetchData,
  ]);

  const handleEditStock = useCallback((stock: DadosEstoque) => {
    setEditStockId(stock.id!);
    setStockForm({
      id_produto: stock.id_produto,
      quantidadeAtual: stock.quantidadeAtual,
      lote: stock.lote,
      dataValidadeLote: new Date(stock.dataValidadeLote),
    });
    setEditStockModal(true);
    setErrors({});
  }, []);

  const handleEditStockEntry = useCallback((entry: DadosEntradaEstoque) => {
    setIsEditing(true);
    setEditEntryId(entry.id!);
    setForm({
      id_fornecedor: entry.id_fornecedor,
      id_funcionario: entry.id_funcionario,
      dataEntrada: new Date(entry.dataEntrada), // Garantir que é Date
      products: [{
        id_produto: entry.id_produto,
        quantidadeRecebida: entry.quantidadeRecebida,
        custoUnitario: entry.custoUnitario,
        lote: entry.lote,
        dataValidadeLote: new Date(entry.dataValidadeLote), // Garantir que é Date
      }],
    });
    setErrors({});
    setOpenModal(true);
  }, []);
  const handleEditGroup = useCallback((group: {
    id: string;
    dataEntrada: Date;
    id_fornecedor: string;
    id_funcionario: string;
    entries: DadosEntradaEstoque[];
  }) => {
    setIsEditing(true);
    setEditEntryId(group.id); // Usamos o ID do grupo como identificador
    setForm({
      id_fornecedor: group.id_fornecedor,
      id_funcionario: group.id_funcionario,
      dataEntrada: group.dataEntrada,
      products: group.entries.map((entry) => ({
        id_produto: entry.id_produto,
        quantidadeRecebida: entry.quantidadeRecebida,
        custoUnitario: entry.custoUnitario,
        lote: entry.lote,
        dataValidadeLote: new Date(entry.dataValidadeLote),
      })),
    });
    setErrors({});
    setOpenModal(true);
  }, []);
  const handleDeleteGroup = useCallback((group: {
    id: string;
    dataEntrada: Date;
    id_fornecedor: string;
    id_funcionario: string;
    entries: DadosEntradaEstoque[];
  }) => {
    // Armazena o grupo a ser excluído no estado selectedEntry para uso no modal de confirmação
    setSelectedEntry(group);
    setOpenConfirmDelete(true);
  }, []);

  const handleDeleteStock = useCallback(async () => {
    if (deleteStockId) {
      try {
        setLoading(true);
        setFetchError(null);
        await deleteStock(deleteStockId);

        setCurrentStock((prev) => prev.filter((item) => item.id !== deleteStockId));
        setFilteredStock((prev) => prev.filter((item) => item.id !== deleteStockId));
        setProductsWithoutLocation((prev) => prev.filter((item) => item.id !== deleteStockId));
        setFilteredProductsWithoutLocation((prev) =>
          prev.filter((item) => item.id !== deleteStockId),
        );

        setSuccessMessage('Estoque excluído com sucesso!');
        handleCloseConfirmDelete();
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir estoque:', error);
        setFetchError('Erro ao excluir estoque.');
      } finally {
        setLoading(false);
      }
    }
  }, [deleteStockId, handleCloseConfirmDelete, fetchData]);

  const handleDeleteStockEntry = useCallback(async () => {
    if (deleteEntryId) {
      try {
        setLoading(true);
        setFetchError(null);
        await deleteStockEntry(deleteEntryId);
        setStockEntries((previous) => previous.filter((item) => item.id !== deleteEntryId));
        setFilteredStockEntries((previous) => previous.filter((item) => item.id !== deleteEntryId));
        setSuccessMessage('Entrada de estoque excluída com sucesso!');
        handleCloseConfirmDeleteEntry();
        await fetchData();
      } catch (error) {
        console.error('Erro ao excluir entrada de estoque:', error);
        setFetchError('Erro ao excluir entrada de estoque.');
      } finally {
        setLoading(false);
      }
    }
  }, [deleteEntryId, handleCloseConfirmDeleteEntry, fetchData]);

  const handleSearch = useCallback(() => {
    const query = searchQuery.toLowerCase().trim();
    if (query === '') {
      setFilteredStockEntries(stockEntries);
      setFilteredStock(currentStock);
      setFilteredProductsWithoutLocation(productsWithoutLocation);
    } else {
      const filteredEntries = stockEntries.filter((entry) => {
        const product = products.find((p) => p.id === entry.id_produto);
        return (
          product?.nomeProduto?.toLowerCase().includes(query) ||
          entry.lote?.toLowerCase().includes(query)
        );
      });
      const filteredStock = currentStock.filter((stock) => {
        const product = products.find((p) => p.id === stock.id_produto);
        return (
          product?.nomeProduto?.toLowerCase().includes(query) ||
          stock.lote?.toLowerCase().includes(query)
        );
      });
      const filteredProductsWithoutLocation = productsWithoutLocation.filter((stock) => {
        const product = products.find((p) => p.id === stock.id_produto);
        return (
          product?.nomeProduto?.toLowerCase().includes(query) ||
          stock.lote?.toLowerCase().includes(query)
        );
      });
      setFilteredStockEntries(filteredEntries);
      setFilteredStock(filteredStock);
      setFilteredProductsWithoutLocation(filteredProductsWithoutLocation);
    }
    setEntryPage(0);
    setStockPage(0);
  }, [searchQuery, stockEntries, currentStock, products, productsWithoutLocation]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, stockEntries, currentStock, productsWithoutLocation, handleSearch]);

  const handleChangeEntryPage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setEntryPage(newPage);
  };

  const handleChangeStockPage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setStockPage(newPage);
  };

  const toggleStockEntries = useCallback(() => {
    setShowStockEntries((previous) => !previous);
  }, []);

  const groupStockByProduct = (stock: DadosEstoque[]) => {
    const grouped: { [key: string]: DadosEstoque[] } = {};

    stock.forEach((item) => {
      if (!grouped[item.id_produto]) {
        grouped[item.id_produto] = [];
      }
      grouped[item.id_produto].push(item);
    });

    return Object.entries(grouped).map(([id_produto, lots]) => ({
      id_produto,
      lots: lots.sort(
        (a, b) => new Date(b.dataValidadeLote).getTime() - new Date(a.dataValidadeLote).getTime(),
      ),
      totalQuantity: lots.reduce((sum, lot) => sum + lot.quantidadeAtual, 0),
    }));
  };

  const groupProductsWithoutLocation = (stock: DadosEstoque[]) => {
    const grouped: {
      [key: string]: {
        id_produto: string;
        totalQuantity: number;
        storeQuantity: number;
        warehouseQuantity: number;
        withoutLocationQuantity: number;
      };
    } = {};
  
    stock.forEach((item) => {
      if (!grouped[item.id_produto]) {
        grouped[item.id_produto] = {
          id_produto: item.id_produto,
          totalQuantity: 0,
          storeQuantity: 0,
          warehouseQuantity: 0,
          withoutLocationQuantity: 0,
        };
      }
      grouped[item.id_produto].totalQuantity += item.quantidadeAtual;
  
      // Calcular quantidade em localizações do tipo "Loja"
      const storeLocations = locations.filter((loc) => loc.tipo === 'Loja');
      const productLocationsForStore = productLocations.filter(
        (loc) =>
          loc.id_produto === item.id_produto &&
          storeLocations.some((store) => store.id === loc.id_localizacao),
      );
      const storeQuantity = productLocationsForStore.reduce(
        (sum, loc) => sum + (loc.quantidadeProduto || 0),
        0,
      );
  
      // Calcular quantidade em localizações do tipo "Armazém"
      const warehouseLocations = locations.filter((loc) =>
        loc.nomeLocalizacao.toLowerCase().includes('armazém'),
      );
      const productLocationsForWarehouse = productLocations.filter(
        (loc) =>
          loc.id_produto === item.id_produto &&
          warehouseLocations.some((warehouse) => warehouse.id === loc.id_localizacao),
      );
      const warehouseQuantity = productLocationsForWarehouse.reduce(
        (sum, loc) => sum + (loc.quantidadeProduto || 0),
        0,
      );
  
      grouped[item.id_produto].storeQuantity = storeQuantity;
      grouped[item.id_produto].warehouseQuantity = warehouseQuantity;
      grouped[item.id_produto].withoutLocationQuantity =
        grouped[item.id_produto].totalQuantity - storeQuantity - warehouseQuantity;
    });
  
    return Object.values(grouped).filter((group) => group.withoutLocationQuantity > 0);
  };

  const toggleExpandProduct = (id_produto: string) => {
    setExpandedProducts((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(id_produto)) {
        newSet.delete(id_produto);
      } else {
        newSet.add(id_produto);
      }
      return newSet;
    });
  };

  const groupedStock = useMemo(() => groupStockByProduct(filteredStock), [filteredStock]);
  const groupedProductsWithoutLocation = useMemo(
    () => groupProductsWithoutLocation(filteredProductsWithoutLocation),
    [filteredProductsWithoutLocation],
  );
  const paginatedStockEntries = filteredStockEntries.slice(
    entryPage * rowsPerPage,
    entryPage * rowsPerPage + rowsPerPage,
  );
  const paginatedGroupedStock = groupedStock.slice(
    stockPage * rowsPerPage,
    stockPage * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      {(fetchError || successMessage) && (
        <Alert severity={fetchError ? 'error' : 'success'} sx={{ mb: 2 }}>
          {fetchError || successMessage}
        </Alert>
      )}
      <Paper sx={{ p: 2, width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">Gestão de Estoque</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              id="search-stock"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              label="Pesquisar Produto ou Lote"
              variant="outlined"
              size="small"
              disabled={loading}
              aria-label="Pesquisar por produto ou lote"
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              disabled={loading}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              aria-label="Adicionar nova entrada de estoque"
            >
              Adicionar Entrada
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Modal open={openModal} onClose={handleClose} aria-labelledby="modal-entrada-estoque">
        <Grid sx={modalStyle} component="form" noValidate>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-entrada-estoque" variant="h5">
              {isEditing ? 'Editar Entrada' : 'Nova Entrada'}
            </Typography>
            <Button
              onClick={handleClose}
              variant="outlined"
              color="error"
              disabled={loading}
              aria-label="Fechar modal de entrada de estoque"
            >
              Fechar
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_fornecedor} disabled={loading}>
                <InputLabel>Fornecedor</InputLabel>
                <Select
                  name="id_fornecedor"
                  value={form.id_fornecedor || ''}
                  onChange={(e) => handleSelectChange(e)}
                  aria-label="Selecionar fornecedor para entrada"
                >
                  <MenuItem value="" disabled>
                    Selecione um fornecedor
                  </MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.nomeFornecedor}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_fornecedor && (
                  <Typography color="error">{errors.id_fornecedor}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                error={!!errors.id_funcionario}
                disabled={loading || !isEditing}
              >
                <InputLabel>Funcionário</InputLabel>
                <Select
                  name="id_funcionario"
                  value={form.id_funcionario || ''}
                  onChange={(e) => handleSelectChange(e)}
                  aria-label="Selecionar funcionário responsável"
                  renderValue={(value) =>
                    value
                      ? employees.find((e) => e.id === value)?.nomeFuncionario ||
                        'Funcionário não encontrado'
                      : 'Selecione um funcionário'
                  }
                >
                  <MenuItem value="" disabled>
                    Selecione um funcionário
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.nomeFuncionario}
                    </MenuItem>
                  ))}
                </Select>
                {!isEditing && form.id_funcionario && (
                  <Typography variant="caption" color="textSecondary">
                    Funcionário logado
                  </Typography>
                )}
                {errors.id_funcionario && (
                  <Typography color="error">{errors.id_funcionario}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataEntrada"
                label="Data de Entrada"
                type="date"
                fullWidth
                value={formatDateToInput(form.dataEntrada)}
                onChange={handleGlobalTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataEntrada}
                helperText={errors.dataEntrada}
                disabled={loading}
                aria-label="Data de entrada do estoque"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Produtos
              </Typography>
              {form.products.map((product, index) => (
                <Box
                  key={index}
                  sx={{ mb: 2, p: 2, border: 1, borderRadius: 1, borderColor: 'grey.300' }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="subtitle1">Produto {index + 1}</Typography>
                    {form.products.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => removeProduct(index)}
                        disabled={loading}
                        aria-label={`Remover produto ${index + 1}`}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        error={!!errors[`id_produto_${index}`]}
                        disabled={loading}
                      >
                        <InputLabel>Produto</InputLabel>
                        <Select
                          name="id_produto"
                          value={product.id_produto || ''}
                          onChange={(e) => handleSelectChange(e, index)}
                          aria-label={`Selecionar produto ${index + 1} para entrada`}
                        >
                          <MenuItem value="" disabled>
                            Selecione um produto
                          </MenuItem>
                          {products.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.nomeProduto}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors[`id_produto_${index}`] && (
                          <Typography color="error">{errors[`id_produto_${index}`]}</Typography>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="quantidadeRecebida"
                        label="Quantidade Recebida"
                        type="number"
                        fullWidth
                        value={product.quantidadeRecebida}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextFieldChange(e, index)
                        }
                        error={!!errors[`quantidadeRecebida_${index}`]}
                        helperText={errors[`quantidadeRecebida_${index}`]}
                        disabled={loading}
                        inputProps={{ min: 1 }}
                        aria-label={`Quantidade recebida do produto ${index + 1}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="custoUnitario"
                        label="Custo Unitário"
                        type="number"
                        fullWidth
                        value={product.custoUnitario}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextFieldChange(e, index)
                        }
                        error={!!errors[`custoUnitario_${index}`]}
                        helperText={errors[`custoUnitario_${index}`]}
                        disabled={loading}
                        inputProps={{ min: 0, step: 0.01 }}
                        aria-label={`Custo unitário do produto ${index + 1}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="lote"
                        label="Lote"
                        fullWidth
                        value={product.lote || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextFieldChange(e, index)
                        }
                        error={!!errors[`lote_${index}`]}
                        helperText={errors[`lote_${index}`]}
                        disabled={loading}
                        aria-label={`Lote do produto ${index + 1}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        name="dataValidadeLote"
                        label="Validade do Lote"
                        type="date"
                        fullWidth
                        value={formatDateToInput(product.dataValidadeLote)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextFieldChange(e, index)
                        }
                        InputLabelProps={{ shrink: true }}
                        error={!!errors[`dataValidadeLote_${index}`]}
                        helperText={errors[`dataValidadeLote_${index}`]}
                        disabled={loading}
                        aria-label={`Data de validade do lote do produto ${index + 1}`}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                variant="outlined"
                color="primary"
                onClick={addProduct}
                disabled={loading}
                sx={{ mb: 2 }}
                aria-label="Adicionar outro produto"
              >
                Adicionar Outro Produto
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onSubmit}
                disabled={loading}
                aria-label={
                  isEditing ? 'Salvar entrada de estoque' : 'Cadastrar entrada de estoque'
                }
              >
                {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Modal>

      <Modal
        open={editStockModal}
        onClose={handleEditStockClose}
        aria-labelledby="modal-editar-estoque"
      >
        <Grid sx={modalStyle} component="form" noValidate>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-editar-estoque" variant="h5">
              Editar Estoque
            </Typography>
            <Button
              onClick={handleEditStockClose}
              variant="outlined"
              color="error"
              disabled={loading}
              aria-label="Fechar modal de edição de estoque"
            >
              Fechar
            </Button>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_produto} disabled={loading}>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={stockForm.id_produto || ''}
                  onChange={handleStockSelectChange}
                  aria-label="Selecionar produto para estoque"
                >
                  <MenuItem value="" disabled>
                    Selecione um produto
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.nomeProduto}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_produto && <Typography color="error">{errors.id_produto}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantidadeAtual"
                label="Quantidade Atual"
                type="number"
                fullWidth
                value={stockForm.quantidadeAtual}
                onChange={handleStockTextFieldChange}
                error={!!errors.quantidadeAtual}
                helperText={errors.quantidadeAtual}
                disabled={loading}
                inputProps={{ min: 0 }}
                aria-label="Quantidade atual no estoque"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lote"
                label="Lote"
                fullWidth
                value={stockForm.lote || ''}
                onChange={handleStockTextFieldChange}
                error={!!errors.lote}
                helperText={errors.lote}
                disabled={loading}
                aria-label="Lote do estoque"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataValidadeLote"
                label="Validade do Lote"
                type="date"
                fullWidth
                value={stockForm.dataValidadeLote}
                onChange={handleStockTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataValidadeLote}
                helperText={errors.dataValidadeLote}
                disabled={loading}
                aria-label="Data de validade do lote no estoque"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onStockSubmit}
                disabled={loading}
                aria-label="Salvar alterações no estoque"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Modal>

      <Modal
        open={openLocationModal}
        onClose={handleCloseLocationModal}
        aria-labelledby="modal-adicionar-armazem"
      >
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography id="modal-adicionar-armazem" variant="h5">
              Adicionar Produto ao Armazém ({locationIndex + 1} de {lastEntries.length})
            </Typography>
            <Button
              onClick={handleCloseLocationModal}
              variant="outlined"
              color="error"
              disabled={loading}
              aria-label="Fechar modal de localização"
            >
              Fechar
            </Button>
          </Stack>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Produto:{' '}
            {products.find((p) => p.id === locationForm.id_produto)?.nomeProduto ||
              locationForm.id_produto}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_produto} disabled>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={locationForm.id_produto || ''}
                  onChange={handleLocationSelectChange}
                  aria-label="Selecionar produto para localização"
                >
                  <MenuItem value="" disabled>
                    Selecione um produto
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.nomeProduto}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_produto && <FormHelperText error>{errors.id_produto}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_localizacao} disabled={loading}>
                <InputLabel>Localização</InputLabel>
                <Select
                  name="id_localizacao"
                  value={locationForm.id_localizacao || ''}
                  onChange={handleLocationSelectChange}
                  aria-label="Selecionar localização para o produto"
                >
                  <MenuItem value="" disabled>
                    Selecione uma localização
                  </MenuItem>
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.nomeLocalizacao}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_localizacao && (
                  <FormHelperText error>{errors.id_localizacao}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_seccao} disabled={loading}>
                <InputLabel>Seção</InputLabel>
                <Select
                  name="id_seccao"
                  value={locationForm.id_seccao || ''}
                  onChange={handleLocationSelectChange}
                  aria-label="Selecionar seção para o produto"
                >
                  <MenuItem value="" disabled>
                    Selecione uma seção
                  </MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.nomeSeccao}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_seccao && <FormHelperText error>{errors.id_seccao}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_prateleira} disabled={loading}>
                <InputLabel>Prateleira</InputLabel>
                <Select
                  name="id_prateleira"
                  value={locationForm.id_prateleira || ''}
                  onChange={handleLocationSelectChange}
                  aria-label="Selecionar prateleira para o produto"
                >
                  <MenuItem value="" disabled>
                    Selecione uma prateleira
                  </MenuItem>
                  {shelves.map((shelf) => (
                    <MenuItem key={shelf.id} value={shelf.id}>
                      {shelf.nomePrateleira}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_prateleira && (
                  <FormHelperText error>{errors.id_prateleira}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_corredor} disabled={loading}>
                <InputLabel>Corredor</InputLabel>
                <Select
                  name="id_corredor"
                  value={locationForm.id_corredor || ''}
                  onChange={handleLocationSelectChange}
                  aria-label="Selecionar corredor para o produto"
                >
                  <MenuItem value="" disabled>
                    Selecione um corredor
                  </MenuItem>
                  {corridors.map((corridor) => (
                    <MenuItem key={corridor.id} value={corridor.id}>
                      {corridor.nomeCorredor}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_corredor && <FormHelperText error>{errors.id_corredor}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantidadeProduto"
                label="Quantidade"
                type="number"
                fullWidth
                value={locationForm.quantidadeProduto}
                onChange={handleLocationTextFieldChange}
                error={!!errors.quantidadeProduto}
                helperText={
                  errors.quantidadeProduto ||
                  (lastEntries.length > 0
                    ? `Máximo: ${lastEntries[locationIndex].quantidadeRecebida} unidades (entrada)`
                    : selectedStock
                      ? `Máximo: ${selectedStock.quantidadeAtual} unidades disponíveis`
                      : '')
                }
                disabled={loading}
                inputProps={{
                  min: 1,
                  max:
                    lastEntries.length > 0
                      ? lastEntries[locationIndex].quantidadeRecebida
                      : selectedStock?.quantidadeAtual,
                }}
                aria-label="Quantidade do produto no armazém"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantidadeMinimaProduto"
                label="Limite Mínimo"
                type="number"
                fullWidth
                value={locationForm.quantidadeMinimaProduto}
                onChange={handleLocationTextFieldChange}
                error={!!errors.quantidadeMinimaProduto}
                helperText={errors.quantidadeMinimaProduto}
                disabled={loading}
                inputProps={{ min: 0 }}
                aria-label="Quantidade mínima do produto no armazém"
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={onLocationSubmit}
                  disabled={loading}
                  aria-label="Adicionar produto ao armazém"
                >
                  {loading
                    ? 'Salvando...'
                    : locationIndex < lastEntries.length - 1
                      ? 'Próximo'
                      : 'Concluir'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Modal
        open={openConfirmDelete}
        onClose={handleCloseConfirmDelete}
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-description"
      >
        <Box sx={confirmModalStyle}>
          <Typography id="confirm-delete-modal-title" variant="h6" component="h2" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography id="confirm-delete-modal-description" sx={{ mb: 3 }}>
            Tem certeza que deseja excluir este item do estoque?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCloseConfirmDelete}
              disabled={loading}
              aria-label="Cancelar exclusão do estoque"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteStock}
              disabled={loading}
              aria-label="Confirmar exclusão do estoque"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={openConfirmDeleteEntry}
        onClose={handleCloseConfirmDeleteEntry}
        aria-labelledby="confirm-delete-entry-modal-title"
        aria-describedby="confirm-delete-entry-modal-description"
      >
        <Box sx={confirmModalStyle}>
          <Typography
            id="confirm-delete-entry-modal-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Confirmar Exclusão
          </Typography>
          <Typography id="confirm-delete-entry-modal-description" sx={{ mb: 3 }}>
            Tem certeza que deseja excluir esta entrada de estoque? Isso pode afetar o estoque
            atual.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCloseConfirmDeleteEntry}
              disabled={loading}
              aria-label="Cancelar exclusão da entrada de estoque"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteStockEntry}
              disabled={loading}
              aria-label="Confirmar exclusão da entrada de estoque"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
  open={openDetailsModal}
  onClose={handleCloseDetailsModal}
  aria-labelledby="modal-detalhes-entrada"
>
  <Box sx={{ ...modalStyle, width: { xs: '90%', sm: '70%', md: 800 } }}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 2 }}
    >
      <Typography id="modal-detalhes-entrada" variant="h5">
        Detalhes da Entrada de Estoque
      </Typography>
      <Button
        onClick={handleCloseDetailsModal}
        variant="outlined"
        color="error"
        disabled={loading}
        aria-label="Fechar modal de detalhes da entrada"
      >
        Fechar
      </Button>
    </Stack>
    {selectedEntry ? (
      <Stack spacing={2}>
        <Typography variant="body1">
          <strong>Data de Entrada:</strong> {formatDateToDisplay(selectedEntry.dataEntrada)}
        </Typography>
        <Typography variant="body1">
          <strong>Fornecedor:</strong> {suppliers.find((s) => s.id === selectedEntry.id_fornecedor)?.nomeFornecedor || selectedEntry.id_fornecedor}
        </Typography>
        <Typography variant="body1">
          <strong>Funcionário:</strong> {employees.find((e) => e.id === selectedEntry.id_funcionario)?.nomeFuncionario || selectedEntry.id_funcionario}
        </Typography>
        <Typography variant="body1">
          <strong>Produtos:</strong>
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small" aria-label="Tabela de produtos da entrada">
            <TableHead>
              <TableRow>
                <TableCell><strong>Produto</strong></TableCell>
                <TableCell><strong>Quantidade</strong></TableCell>
                <TableCell><strong>Custo Unitário</strong></TableCell>
                <TableCell><strong>Lote</strong></TableCell>
                <TableCell><strong>Validade</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedEntry.entries.map((entry) => {
                const produto = products.find((p) => p.id === entry.id_produto);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{produto?.nomeProduto || entry.id_produto}</TableCell>
                    <TableCell>{entry.quantidadeRecebida}</TableCell>
                    <TableCell>{Number(entry.custoUnitario).toFixed(2)}</TableCell>
                    <TableCell>{entry.lote}</TableCell>
                    <TableCell>{formatDateToDisplay(entry.dataValidadeLote)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    ) : (
      <Typography variant="body2">Carregando detalhes...</Typography>
    )}
  </Box>
</Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Entradas de Estoque</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={toggleStockEntries}
              disabled={loading}
              aria-label={
                showStockEntries ? 'Ocultar entradas de estoque' : 'Ver entradas de estoque'
              }
            >
              {showStockEntries ? 'Ocultar Entradas' : 'Ver Entradas'}
            </Button>
          </Stack>
          {showStockEntries && (
            <>
              <TableContainer component={Paper}>
                <Table aria-label="Tabela de entradas de estoque">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Quantidade</strong></TableCell>
                      <TableCell><strong>Data de Entrada</strong></TableCell>
                      <TableCell><strong>Validade</strong></TableCell>
                      <TableCell><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
  {loading ? (
    <TableRow>
      <TableCell colSpan={4} align="center">
        Carregando...
      </TableCell>
    </TableRow>
  ) : groupedStockEntries.length > 0 ? (
    groupedStockEntries.slice(entryPage * rowsPerPage, entryPage * rowsPerPage + rowsPerPage).map((group) => (
      <TableRow key={group.id}>
        <TableCell>
          {suppliers.find((s) => s.id === group.id_fornecedor)?.nomeFornecedor || group.id_fornecedor}
        </TableCell>
        <TableCell>{formatDateToDisplay(group.dataEntrada)}</TableCell>
        <TableCell>{group.entries.length} produto(s)</TableCell>
        <TableCell align="right">
          <IconButton
            color="info"
            onClick={() => handleOpenDetailsModal(group)}
            disabled={loading}
            aria-label={`Ver detalhes da entrada de estoque ${group.id}`}
          >
            <IconifyIcon icon="mdi:eye" />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => handleEditGroup(group)}
            disabled={loading}
            aria-label={`Editar todas as entradas do grupo ${group.id}`}
          >
            <Edit />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteGroup(group)}
            disabled={loading}
            aria-label={`Excluir todas as entradas do grupo ${group.id}`}
          >
            <Delete />
          </IconButton>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={4} align="center">
        Nenhuma entrada encontrada.
      </TableCell>
    </TableRow>
  )}
</TableBody>
                </Table>
              </TableContainer>
              <TablePagination
  rowsPerPageOptions={[6]}
  component="div"
  count={groupedStockEntries.length}
  rowsPerPage={rowsPerPage}
  page={entryPage}
  onPageChange={handleChangeEntryPage}
  labelRowsPerPage="Itens por página"
  labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
  aria-label="Paginação de entradas de estoque"
/>
            </>
          )}
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Estoque Atual
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="Tabela de estoque atual">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Produto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Quantidade Total</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Lotes</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginatedGroupedStock.length > 0 ? (
                  paginatedGroupedStock.map((group) => {
                    const product = products.find((p) => p.id === group.id_produto);
                    const isExpanded = expandedProducts.has(group.id_produto);
                    return (
                      <React.Fragment key={group.id_produto}>
                        <TableRow>
                          <TableCell>{product?.nomeProduto || group.id_produto}</TableCell>
                          <TableCell>{group.totalQuantity}</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => toggleExpandProduct(group.id_produto)}
                              disabled={loading || group.lots.length === 0}
                              aria-label={
                                isExpanded
                                  ? `Ocultar lotes do produto ${group.id_produto}`
                                  : `Mostrar lotes do produto ${group.id_produto}`
                              }
                            >
                              <IconifyIcon
                                icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                              />
                            </IconButton>
                          </TableCell>
                          <TableCell align="right"></TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ padding: 0 }}>
                              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Table size="small" aria-label="Sub-tabela de lotes">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>
                                        <strong>Lote</strong>
                                      </TableCell>
                                      <TableCell>
                                        <strong>Quantidade</strong>
                                      </TableCell>
                                      <TableCell>
                                        <strong>Validade</strong>
                                      </TableCell>
                                      <TableCell>
                                        <strong>Ações</strong>
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.lots.map((lot) => (
                                      <TableRow key={lot.id}>
                                        <TableCell>{lot.lote}</TableCell>
                                        <TableCell>{lot.quantidadeAtual}</TableCell>
                                        <TableCell>
                                          {formatDateToDisplay(lot.dataValidadeLote)}
                                        </TableCell>
                                        <TableCell align="right">
                                          <IconButton
                                            color="primary"
                                            onClick={() => handleEditStock(lot)}
                                            disabled={loading}
                                            aria-label={`Editar lote ${lot.id} do produto ${group.id_produto}`}
                                          >
                                            <Edit />
                                          </IconButton>
                                          <IconButton
                                            color="error"
                                            onClick={() => handleOpenConfirmDelete(lot.id!)}
                                            disabled={loading}
                                            aria-label={`Excluir lote ${lot.id} do produto ${group.id_produto}`}
                                          >
                                            <Delete />
                                          </IconButton>
                                          <IconButton
                                            color="secondary"
                                            onClick={() => handleOpenLocationModal([lot], [])}
                                            disabled={loading || lot.quantidadeAtual === 0}
                                            aria-label={`Adicionar lote ${lot.id} do produto ${group.id_produto} ao armazém`}
                                          >
                                            <IconifyIcon icon="material-symbols:warehouse" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[6]}
            component="div"
            count={groupedStock.length}
            rowsPerPage={rowsPerPage}
            page={stockPage}
            onPageChange={handleChangeStockPage}
            labelRowsPerPage="Itens por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            aria-label="Paginação de estoque atual"
          />
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Produtos Sem Localização ({groupedProductsWithoutLocation.length})
          </Typography>
          <TableContainer component={Paper}>
  <Table aria-label="Tabela de produtos sem localização">
    <TableHead>
      <TableRow>
        <TableCell>
          <strong>Produto</strong>
        </TableCell>
        <TableCell>
          <strong>Estoque Geral</strong>
        </TableCell>
        <TableCell>
          <strong>Loja</strong>
        </TableCell>
        <TableCell>
          <strong>Armazém</strong>
        </TableCell>
        <TableCell>
          <strong>Sem Localização</strong>
        </TableCell>
        <TableCell>
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
      ) : groupedProductsWithoutLocation.length > 0 ? (
        groupedProductsWithoutLocation.map((group) => {
          const product = products.find((p) => p.id === group.id_produto);
          const stockItems = filteredStock.filter(
            (stock) => stock.id_produto === group.id_produto,
          );
          return (
            <TableRow key={group.id_produto}>
              <TableCell>{product?.nomeProduto || group.id_produto}</TableCell>
              <TableCell>{group.totalQuantity}</TableCell>
              <TableCell>{group.storeQuantity}</TableCell>
              <TableCell>{group.warehouseQuantity}</TableCell>
              <TableCell>{group.withoutLocationQuantity}</TableCell>
              <TableCell align="right">
                <IconButton
                  color="secondary"
                  onClick={() => handleOpenLocationModal(stockItems, [])}
                  disabled={loading || group.withoutLocationQuantity === 0}
                  aria-label={`Adicionar produto ${group.id_produto} ao armazém`}
                >
                  <IconifyIcon icon="material-symbols:warehouse" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableCell colSpan={6} align="center">
            {productsWithoutLocation.length === 0 && currentStock.length > 0
              ? 'Todos os produtos estão localizados.'
              : 'Nenhum produto sem localização encontrado. Verifique os dados do estoque.'}
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

export default Stock;
