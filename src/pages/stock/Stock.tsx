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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DadosEntradaEstoque,
  DadosEstoque,
  Produto,
  Fornecedor,
  Funcionario,
  ProdutoLocalizacao,
  Localizacao,
} from 'types/models';
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
} from '../../api/methods';

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

const formatDateToInput = (date: string | Date): string => {
  const d = new Date(date);
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

const Stock: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editStockModal, setEditStockModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmDeleteEntry, setOpenConfirmDeleteEntry] = useState(false);
  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DadosEntradaEstoque | null>(null);
  const [deleteStockId, setDeleteStockId] = useState<string | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [editStockId, setEditStockId] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<DadosEstoque | null>(null);
  const [lastEntry, setLastEntry] = useState<DadosEntradaEstoque | null>(null);
  const [showStockEntries, setShowStockEntries] = useState(false);
  const [form, setForm] = useState<Partial<DadosEntradaEstoque>>({
    id_fornecedor: '',
    id_produto: '',
    id_funcionario: '',
    quantidadeRecebida: 0,
    dataEntrada: new Date(),
    custoUnitario: 0,
    lote: '',
    dataValidadeLote: new Date(),
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
  const [stockEntries, setStockEntries] = useState<DadosEntradaEstoque[]>([]);
  const [filteredStockEntries, setFilteredStockEntries] = useState<DadosEntradaEstoque[]>([]);
  const [currentStock, setCurrentStock] = useState<DadosEstoque[]>([]);
  const [filteredStock, setFilteredStock] = useState<DadosEstoque[]>([]);
  const [products, setProducts] = useState<Produto[]>([]);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [employees, setEmployees] = useState<Funcionario[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryPage, setEntryPage] = useState(0);
  const [stockPage, setStockPage] = useState(0);
  const [rowsPerPage] = useState(6);
  const [loading, setLoading] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

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
      ]);

      setStockEntries(stockEntriesData ?? []);
      setFilteredStockEntries(stockEntriesData ?? []);
      setCurrentStock(stockData ?? []);
      setFilteredStock(stockData ?? []);
      setProducts(productsData ?? []);
      setSuppliers(suppliersData ?? []);
      setEmployees(employeesData ?? []);
      setLocations(locationsData ?? []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setFetchError('Erro ao carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = useCallback(() => {
    setIsEditing(false);
    setEditEntryId(null);
    let userId = '';
    const user = localStorage.getItem('user');
    console.log('Conteúdo do localStorage user:', user); // Log para depuração
    try {
      if (user) {
        const parsedUser = JSON.parse(user);
        // Suporta userId, id, ou user.id
        userId = parsedUser.userId || parsedUser.id || parsedUser.user?.id || '';
        console.log('userId extraído:', userId); // Log para depuração
        if (userId) {
          const userExists = employees.some((employee) => employee.id === userId);
          if (!userExists) {
            setFetchError('Funcionário logado não encontrado na lista de funcionários.');
          }
        } else {
          setFetchError('ID do usuário não encontrado no localStorage.');
        }
      } else {
        setFetchError('Nenhum usuário logado encontrado. Faça login novamente.');
      }
    } catch (error) {
      console.error('Erro ao parsear user do localStorage:', error);
      setFetchError('Erro ao recuperar informações do usuário logado.');
    }

    setForm({
      id_fornecedor: '',
      id_produto: '',
      id_funcionario: userId,
      quantidadeRecebida: 0,
      dataEntrada: (new Date()),
      custoUnitario: 0,
      lote: '',
      dataValidadeLote: (new Date()),
    });
    setErrors({});
    setOpenModal(true);
  }, [employees]);

  const handleClose = useCallback(() => {
    setOpenModal(false);
    setErrors({});
    setSuccessMessage(null);
    setLastEntry(null);
  }, []);

  const handleEditStockClose = useCallback(() => {
    setEditStockModal(false);
    setEditStockId(null);
    setStockForm({
      id_produto: '',
      quantidadeAtual: 0,
      lote: '',
      dataValidadeLote: (new Date()),
    });
    setErrors({});
    setSuccessMessage(null);
  }, []);

  const handleOpenLocationModal = useCallback(
    (stock: DadosEstoque, entry?: DadosEntradaEstoque) => {
      setSelectedStock(stock);
      setLocationForm({
        id_produto: stock.id_produto,
        id_localizacao: '',
        quantidadeProduto: entry?.quantidadeRecebida || stock.quantidadeAtual,
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
    setLastEntry(null);
  }, []);

  const handleOpenDetailsModal = useCallback((entry: DadosEntradaEstoque) => {
    setSelectedEntry(entry);
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

  const handleTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'custoUnitario' || name === 'quantidadeRecebida' ? Number(value) || 0 : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleStockTextFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStockForm((prev) => ({
      ...prev,
      [name]: name === 'quantidadeAtual' ? Number(value) || 0 : value,
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

  const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
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

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.id_produto) newErrors.id_produto = 'Produto é obrigatório';
    if (!form.id_fornecedor) newErrors.id_fornecedor = 'Fornecedor é obrigatório';
    if (!form.id_funcionario) newErrors.id_funcionario = 'Funcionário é obrigatório';
    if (form.quantidadeRecebida === undefined || form.quantidadeRecebida <= 0)
      newErrors.quantidadeRecebida = 'Quantidade deve ser maior que 0';
    if (!form.dataEntrada || isNaN(new Date(form.dataEntrada).getTime()))
      newErrors.dataEntrada = 'Data de entrada é inválida';
    if (form.custoUnitario === undefined || form.custoUnitario <= 0)
      newErrors.custoUnitario = 'Custo unitário deve ser maior que 0';
    if (!form.lote || !form.lote.trim()) newErrors.lote = 'Lote é obrigatório';
    if (!form.dataValidadeLote || isNaN(new Date(form.dataValidadeLote).getTime()))
      newErrors.dataValidadeLote = 'Data de validade é inválida';
    else if (new Date(form.dataValidadeLote) <= new Date(new Date().setHours(0, 0, 0, 0)))
      newErrors.dataValidadeLote = 'Data de validade deve ser futura';
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
    if (lastEntry && locationForm.quantidadeProduto! > lastEntry.quantidadeRecebida) {
      newErrors.quantidadeProduto = `Quantidade não pode exceder a entrada (${lastEntry.quantidadeRecebida})`;
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
  }, [locationForm, selectedStock, lastEntry]);

  const onSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setFetchError(null);

      const entryData: DadosEntradaEstoque = {
        id_fornecedor: form.id_fornecedor!,
        id_produto: form.id_produto!,
        id_funcionario: form.id_funcionario!,
        quantidadeRecebida: form.quantidadeRecebida!,
        dataEntrada: form.dataEntrada!,
        custoUnitario: form.custoUnitario!,
        lote: form.lote!,
        dataValidadeLote: form.dataValidadeLote!,
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
        setSuccessMessage('Entrada atualizada com sucesso!');
        handleClose();
      } else {
        const newEntry = await createStockEntry(entryData);
        setStockEntries((prev) => [...prev, newEntry]);
        setFilteredStockEntries((prev) => [...prev, newEntry]);
        setLastEntry(newEntry);

        const existingStock = currentStock.find(
          (item) =>
            item.id_produto === newEntry.id_produto &&
            item.lote === newEntry.lote &&
            item.dataValidadeLote === newEntry.dataValidadeLote,
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
          setCurrentStock((prev) =>
            prev.map((item) => (item.id === newStock.id ? newStock : item)),
          );
          setFilteredStock((prev) =>
            prev.map((item) => (item.id === newStock.id ? newStock : item)),
          );
        } else {
          const stockData: DadosEstoque = {
            id_produto: newEntry.id_produto,
            quantidadeAtual: newEntry.quantidadeRecebida,
            lote: newEntry.lote,
            dataValidadeLote: newEntry.dataValidadeLote,
          };
          newStock = await createStock(stockData);
          setCurrentStock((prev) => [...prev, newStock]);
          setFilteredStock((prev) => [...prev, newStock]);
        }

        handleClose();
        handleOpenLocationModal(newStock, newEntry);
        setSuccessMessage('Entrada adicionada ao estoque. Agora selecione a localização.');
      }
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
        setCurrentStock((prev) =>
          prev.map((item) => (item.id === editStockId ? updatedStock : item)),
        );
        setFilteredStock((prev) =>
          prev.map((item) => (item.id === editStockId ? updatedStock : item)),
        );
        setSuccessMessage('Estoque atualizado com sucesso!');
      } else {
        const newStock = await createStock(stockData);
        setCurrentStock((prev) => [...prev, newStock]);
        setFilteredStock((prev) => [...prev, newStock]);
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
      setSuccessMessage(
        lastEntry
          ? 'Entrada adicionada ao estoque e ao armazém com sucesso!'
          : 'Produto adicionado ao armazém com sucesso!',
      );
      handleCloseLocationModal();
      await fetchData();
    } catch (error) {
      console.error('Erro ao adicionar produto ao armazém:', error);
      setFetchError('Erro ao adicionar produto ao armazém.');
    } finally {
      setLoading(false);
    }
  }, [locationForm, validateLocationForm, handleCloseLocationModal, lastEntry, fetchData]);

  const handleEditStock = useCallback((stock: DadosEstoque) => {
    setEditStockId(stock.id!);
    setStockForm({
      id_produto: stock.id_produto,
      quantidadeAtual: stock.quantidadeAtual,
      lote: stock.lote,
      dataValidadeLote: (stock.dataValidadeLote),
    });
    setEditStockModal(true);
    setErrors({});
  }, []);

  const handleEditStockEntry = useCallback((entry: DadosEntradaEstoque) => {
    setIsEditing(true);
    setEditEntryId(entry.id!);
    setForm({
      id_fornecedor: entry.id_fornecedor,
      id_produto: entry.id_produto,
      id_funcionario: entry.id_funcionario,
      quantidadeRecebida: entry.quantidadeRecebida,
      dataEntrada: (entry.dataEntrada),
      custoUnitario: entry.custoUnitario,
      lote: entry.lote,
      dataValidadeLote: (entry.dataValidadeLote),
    });
    setErrors({});
    setOpenModal(true);
  }, []);

  const handleDeleteStock = useCallback(async () => {
    if (deleteStockId) {
      try {
        setLoading(true);
        setFetchError(null);
        await deleteStock(deleteStockId);
        setCurrentStock((prev) => prev.filter((item) => item.id !== deleteStockId));
        setFilteredStock((prev) => prev.filter((item) => item.id !== deleteStockId));
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
        setStockEntries((prev) => prev.filter((item) => item.id !== deleteEntryId));
        setFilteredStockEntries((prev) => prev.filter((item) => item.id !== deleteEntryId));
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
      setFilteredStockEntries(filteredEntries);
      setFilteredStock(filteredStock);
    }
    setEntryPage(0);
    setStockPage(0);
  }, [searchQuery, stockEntries, currentStock, products]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, stockEntries, currentStock, handleSearch]);

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
    setShowStockEntries((prev) => !prev);
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
        (a, b) =>
          new Date(b.dataValidadeLote).getTime() - new Date(a.dataValidadeLote).getTime(),
      ),
      totalQuantity: lots.reduce((sum, lot) => sum + lot.quantidadeAtual, 0),
    }));
  };

  const toggleExpandProduct = (id_produto: string) => {
    setExpandedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id_produto)) {
        newSet.delete(id_produto);
      } else {
        newSet.add(id_produto);
      }
      return newSet;
    });
  };

  const groupedStock = useMemo(() => groupStockByProduct(filteredStock), [filteredStock]);
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
              <FormControl fullWidth error={!!errors.id_produto} disabled={loading}>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="id_produto"
                  value={form.id_produto || ''}
                  onChange={handleSelectChange}
                  aria-label="Selecionar produto para entrada"
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
                name="quantidadeRecebida"
                label="Quantidade Recebida"
                type="number"
                fullWidth
                value={form.quantidadeRecebida}
                onChange={handleTextFieldChange}
                error={!!errors.quantidadeRecebida}
                helperText={errors.quantidadeRecebida}
                disabled={loading}
                inputProps={{ min: 1 }}
                aria-label="Quantidade recebida para entrada"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataEntrada"
                label="Data de Entrada"
                type="date"
                fullWidth
                value={form.dataEntrada}
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataEntrada}
                helperText={errors.dataEntrada}
                disabled={loading}
                aria-label="Data de entrada do estoque"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="custoUnitario"
                label="Custo Unitário"
                type="number"
                fullWidth
                value={form.custoUnitario}
                onChange={handleTextFieldChange}
                error={!!errors.custoUnitario}
                helperText={errors.custoUnitario}
                disabled={loading}
                inputProps={{ min: 0, step: 0.01 }}
                aria-label="Custo unitário do produto"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_fornecedor} disabled={loading}>
                <InputLabel>Fornecedor</InputLabel>
                <Select
                  name="id_fornecedor"
                  value={form.id_fornecedor || ''}
                  onChange={handleSelectChange}
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
              <FormControl fullWidth error={!!errors.id_funcionario} disabled={loading || !isEditing}>
                <InputLabel>Funcionário</InputLabel>
                <Select
                  name="id_funcionario"
                  value={form.id_funcionario || ''}
                  onChange={handleSelectChange}
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
                name="lote"
                label="Lote"
                fullWidth
                value={form.lote || ''}
                onChange={handleTextFieldChange}
                error={!!errors.lote}
                helperText={errors.lote}
                disabled={loading}
                aria-label="Lote do produto"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dataValidadeLote"
                label="Validade do Lote"
                type="date"
                fullWidth
                value={form.dataValidadeLote}
                onChange={handleTextFieldChange}
                InputLabelProps={{ shrink: true }}
                error={!!errors.dataValidadeLote}
                helperText={errors.dataValidadeLote}
                disabled={loading}
                aria-label="Data de validade do lote"
              />
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
        <Grid sx={modalStyle} component="form" noValidate>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-adicionar-armazem" variant="h5">
              Adicionar Produto ao Armazém
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
                {errors.id_produto && <Typography color="error">{errors.id_produto}</Typography>}
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
                  <Typography color="error">{errors.id_localizacao}</Typography>
                )}
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
                  (lastEntry
                    ? `Máximo: ${lastEntry.quantidadeRecebida} unidades (entrada)`
                    : selectedStock
                    ? `Máximo: ${selectedStock.quantidadeAtual} unidades disponíveis`
                    : '')
                }
                disabled={loading}
                inputProps={{
                  min: 1,
                  max: lastEntry?.quantidadeRecebida ?? selectedStock?.quantidadeAtual,
                }}
                aria-label="Quantidade do produto no armazém"
              />
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
                </Select>
                {errors.id_seccao && <Typography color="error">{errors.id_seccao}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.id_prateleira} disabled={loading}>
                <InputLabel>Prateleira</InputLabel>
                <Select
                  name="id_prateleira"
                  value={locationForm.id_prateleira || ''}
                  onChange={handleLocationSelectChange}
                  aria-label="Selecionar prateleira para o produto">
                  <MenuItem value="" disabled>
                    Selecione uma prateleira
                  </MenuItem>
                </Select>
                {errors.id_prateleira && (
                  <Typography color="error">{errors.id_prateleira}</Typography>
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
                </Select>
                {errors.id_corredor && <Typography color="error">{errors.id_corredor}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="quantidadeMinimaProduto"
                label="Quantidade Mínima"
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
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={onLocationSubmit}
                disabled={loading}
                aria-label="Adicionar produto ao armazém"
              >
                {loading ? 'Salvando...' : 'Adicionar'}
              </Button>
            </Grid>
          </Grid>
        </Grid>
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
        <Box sx={{ ...modalStyle, width: { xs: '90%', sm: '70%', md: 600 } }}>
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
          {selectedEntry && (
            <TableContainer component={Paper}>
              <Table aria-label="Tabela de detalhes da entrada de estoque">
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Produto</strong></TableCell>
                    <TableCell>
                      {products.find((p) => p.id === selectedEntry.id_produto)?.nomeProduto ||
                        selectedEntry.id_produto}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Fornecedor</strong></TableCell>
                    <TableCell>
                      {suppliers.find((s) => s.id === selectedEntry.id_fornecedor)?.nomeFornecedor ||
                        selectedEntry.id_fornecedor}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Funcionário</strong></TableCell>
                    <TableCell>
                      {employees.find((e) => e.id === selectedEntry.id_funcionario)?.nomeFuncionario ||
                        selectedEntry.id_funcionario}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Quantidade</strong></TableCell>
                    <TableCell>{selectedEntry.quantidadeRecebida}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Data de Entrada</strong></TableCell>
                    <TableCell>{formatDateToDisplay(selectedEntry.dataEntrada)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Custo Unitário</strong></TableCell>
                    <TableCell>{Number(selectedEntry.custoUnitario).toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Lote</strong></TableCell>
                    <TableCell>{selectedEntry.lote}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Validade</strong></TableCell>
                    <TableCell>{formatDateToDisplay(selectedEntry.dataValidadeLote)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
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
                      <TableCell>
                        <strong>Produto</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Quantidade</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Lote</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Data de Entrada</strong>
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
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : paginatedStockEntries.length > 0 ? (
                      paginatedStockEntries.map((entry) => {
                        const product = products.find((p) => p.id === entry.id_produto);
                        return (
                          <TableRow key={entry.id}>
                            <TableCell>{product?.nomeProduto || entry.id_produto}</TableCell>
                            <TableCell>{entry.quantidadeRecebida}</TableCell>
                            <TableCell>{entry.lote}</TableCell>
                            <TableCell>{formatDateToDisplay(entry.dataEntrada)}</TableCell>
                            <TableCell>{formatDateToDisplay(entry.dataValidadeLote)}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                color="primary"
                                onClick={() => handleEditStockEntry(entry)}
                                disabled={loading}
                                aria-label={`Editar entrada de estoque ${entry.id}`}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenConfirmDeleteEntry(entry.id!)}
                                disabled={loading}
                                aria-label={`Excluir entrada de estoque ${entry.id}`}
                              >
                                <Delete />
                              </IconButton>
                              <IconButton
                                color="info"
                                onClick={() => handleOpenDetailsModal(entry)}
                                disabled={loading}
                                aria-label={`Ver detalhes da entrada de estoque ${entry.id}`}
                              >
                                <IconifyIcon icon="mdi:eye" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
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
                count={filteredStockEntries.length}
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
                          <TableCell align="right">
                            {/* Ações gerais do produto, se necessário */}
                          </TableCell>
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
                                            onClick={() => handleOpenLocationModal(lot)}
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
    </>
  );
};

export default Stock;