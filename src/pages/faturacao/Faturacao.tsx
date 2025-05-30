import React, { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { format, toZonedTime } from 'date-fns-tz';
import {
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Divider,
  Autocomplete,
  TablePagination,
  Alert,
  SelectChangeEvent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import {
  FuncionarioCaixa,
  Funcionario,
  Caixa,
  Venda,
  TipoDocumento,
  ProdutoLocalizacao,
  Localizacao,
  Produto,
  Cliente,
  tipo,
} from '../../types/models';
import {
  getAllEmployeeCashRegisters,
  createEmployeeCashRegister,
  updateEmployeeCashRegister,
  getAllEmployees,
  getAllCashRegisters,
  createSale,
  getAllSales,
  getAllProducts,
  getAllProductLocations,
  updateProductLocation,
  getAllLocations,
  updateProduct,
  updateStock,
  getStockByProduct,
  getAllClients,
  deleteSale,
} from '../../api/methods';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DadosWrapper } from '../../types/models';
import { useNotifications } from '../../../src/NotificationContext';
import { getUserData } from 'api/authUtils';

interface DecodedToken {
  userId?: string;
  sub?: string;
}

interface Fatura {
  id: string;
  cliente: string;
  nif: string | null;
  telefone: string | null;
  localizacao: string | null;
  email: string | null;
  data: string;
  produtos: { produto: Produto; quantidade: number }[];
  funcionariosCaixa?: FuncionarioCaixa | null;
}

interface FaturaState {
  id?: string;
  cliente: string;
  nif: string;
  telefone: string;

  localizacao: string;
  email: string;
  metodoPagamento: string;
  produtosSelecionados: { id: string; quantidade: number }[];
  funcionariosCaixaId: string;
  errors: { [key: string]: string };
}

interface CaixaState {
  funcionarioId: string;
  caixaId: string;
  errors: { [key: string]: string };
}

type FaturaAction =
  | { type: 'UPDATE_FIELD'; field: keyof FaturaState; value: string }
  | { type: 'UPDATE_PRODUTO'; index: number; field: string; value: string | number }
  | { type: 'ADD_PRODUTO' }
  | { type: 'REMOVE_PRODUTO'; index: number }
  | { type: 'SET_ERRORS'; errors: { [key: string]: string } }
  | { type: 'SET_FATURA'; payload: Partial<FaturaState> }
  | { type: 'RESET' };

type CaixaAction =
  | { type: 'UPDATE_FIELD'; field: keyof CaixaState; value: string }
  | { type: 'SET_ERRORS'; errors: { [key: string]: string } }
  | { type: 'RESET' };

const initialFaturaState: FaturaState = {
  cliente: '',
  nif: '',
  telefone: '',
  localizacao: '',
  email: '',
  metodoPagamento: '',
  produtosSelecionados: [{ id: '', quantidade: 0 }],
  funcionariosCaixaId: '',
  errors: {},
};

const initialCaixaState: CaixaState = {
  funcionarioId: '',
  caixaId: '',
  errors: {},
};

const faturaReducer = (state: FaturaState, action: FaturaAction): FaturaState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'UPDATE_PRODUTO':
      const updatedProdutos = [...state.produtosSelecionados];
      updatedProdutos[action.index] = {
        ...updatedProdutos[action.index],
        [action.field]: action.value,
      };
      return { ...state, produtosSelecionados: updatedProdutos };
    case 'ADD_PRODUTO':
      return {
        ...state,
        produtosSelecionados: [...state.produtosSelecionados, { id: '', quantidade: 0}],
      };
    case 'REMOVE_PRODUTO':
      const filteredProdutos = state.produtosSelecionados.filter((_, i) => i !== action.index);
      const newErrors = { ...state.errors };
      delete newErrors[`produto_${action.index}`];
      return {
        ...state,
        produtosSelecionados:
          filteredProdutos.length === 0 ? [{ id: '', quantidade: 1 }] : filteredProdutos,
        errors: newErrors,
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SET_FATURA':
      return { ...state, ...action.payload, errors: {} };
    case 'RESET':
      return initialFaturaState;
    default:
      return state;
  }
};

const caixaReducer = (state: CaixaState, action: CaixaAction): CaixaState => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        [action.field]: action.value,
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'RESET':
      return initialCaixaState;
    default:
      return state;
  }
};

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95vw', sm: '85vw', md: 900 },
  maxWidth: '100%',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
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

const validateFatura = (
  state: FaturaState,
  produtos: Produto[],
  funcionariosCaixa: FuncionarioCaixa[],
  productLocations: ProdutoLocalizacao[],
  locations: Localizacao[],
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};

  if (!state.metodoPagamento) {
    errors.metodoPagamento = 'Método de pagamento é obrigatório';
  }

  // Removida a validação do campo cliente
  // if (!state.cliente.trim()) {
  //   errors.cliente = 'Nome do cliente é obrigatório';
  // }

  // Filtrar produtos válidos
  const produtosValidos = state.produtosSelecionados.filter(
    (p) => p.id && p.quantidade > 0
  );

  if (produtosValidos.length === 0) {
    errors.produtos = 'Adicione pelo menos um produto válido com quantidade maior que 0';
  }

  if (!state.funcionariosCaixaId) {
    errors.funcionariosCaixaId = 'Nenhum caixa aberto encontrado. Abra um caixa primeiro.';
  } else if (
    !funcionariosCaixa.some((fc) => fc.id === state.funcionariosCaixaId && fc.estadoCaixa)
  ) {
    errors.funcionariosCaixaId = 'O caixa selecionado não está aberto.';
  }

  const lojaLocations = locations.filter((loc) => loc.tipo === tipo.Loja);

  if (!lojaLocations.length) {
    errors.lojaLocation = 'Nenhuma localização do tipo "Loja" encontrada.';
    return errors;
  }

  produtosValidos.forEach((p, index) => {
    const localizacoesDoProduto = productLocations.filter(
      (loc) =>
        loc.id_produto === p.id && lojaLocations.some((loja) => loja.id === loc.id_localizacao),
    );

    if (localizacoesDoProduto.length === 0) {
      errors[`produto_${index}`] = `Produto ${p.id} não encontrado em nenhuma loja.`;
      return;
    }

    const quantidadeDisponivel = localizacoesDoProduto.reduce(
      (total, loc) => total + (loc.quantidadeProduto ?? 0),
      0,
    );

    if (p.quantidade > quantidadeDisponivel) {
      errors[`produto_${index}`] =
        `Quantidade indisponível. Estoque total: ${quantidadeDisponivel}`;
    }
  });

  return errors;
};

const validateCaixa = (
  state: CaixaState,
  funcionarios: Funcionario[],
  caixas: Caixa[],
  funcionariosCaixa: FuncionarioCaixa[],
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  if (!state.funcionarioId) {
    errors.funcionarioId = 'Funcionário é obrigatório. Faça login novamente.';
  } else if (!funcionarios.some((f) => f.id === state.funcionarioId)) {
    errors.funcionarioId = 'Funcionário inválido ou não encontrado.';
  }
  if (!state.caixaId) {
    errors.caixaId = 'Selecione um caixa';
  } else if (!caixas.some((c) => c.id === state.caixaId)) {
    errors.caixaId = 'Caixa não encontrado';
  }
  if (funcionariosCaixa.some((fc) => fc.id_funcionario === state.funcionarioId && fc.estadoCaixa)) {
    errors.funcionarioId = 'Este funcionário já tem um caixa aberto';
  }
  
  return errors;
};

const Faturacao: React.FC = () => {
  const navigate = useNavigate();
  const [openFaturaModal, setOpenFaturaModal] = useState(false);
  const [openCaixaModal, setOpenCaixaModal] = useState(false);
  const [openCaixaListModal, setOpenCaixaListModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [faturaToDelete, setFaturaToDelete] = useState<string | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [productsInStore, setProductsInStore] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { addNotification } = useNotifications();
  const [faturaState, dispatchFatura] = useReducer(faturaReducer, initialFaturaState);
  const [caixaState, dispatchCaixa] = useReducer(caixaReducer, initialCaixaState);
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioCaixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [loggedInFuncionarioCargo, setLoggedInFuncionarioCargo] = useState<string>('');
  const [notifiedLowStock, setNotifiedLowStock] = useState<Set<string>>(new Set());

  
  // Função para verificar estoque baixo
  const checkLowStock = useCallback(async () => {
    try {
      const userData = await getUserData();
      const userRole = userData?.role;

      // Verifica se o usuário é Estoquista ou Repositor
      if (!userRole || !['Estoquista', 'Repositor'].includes(userRole)) {
        return;
      }

      productLocations.forEach((loc) => {
        const currentQty = loc.quantidadeProduto ?? 0;
        const minQty = loc.quantidadeMinimaProduto ?? 0;

        if (currentQty <= minQty) {
          const product = produtos.find((p) => p.id === loc.id_produto);
          const location = locations.find((l) => l.id === loc.id_localizacao);

          if (product && location) {
            const notificationKey = `${loc.id_produto}-${loc.id_localizacao}`;

            // Verifica se já notificou para evitar duplicatas
            if (!notifiedLowStock.has(notificationKey)) {
              const locationType = location.tipo === 'Loja' ? 'Loja' : 'Armazém';
              const message = `Estoque baixo: ${product.nomeProduto} (${locationType}) - Quantidade: ${currentQty} (Mínimo: ${minQty})`;

              addNotification({
                message,
                type: 'stock',
                metadata: {
                  productId: product.id,
                  locationId: location.id,
                  currentQuantity: currentQty,
                  minimumQuantity: minQty,
                  locationType: location.tipo as 'Loja' | 'Armazém',
                },
              });

              // Adiciona ao conjunto de notificações enviadas
              setNotifiedLowStock((prev) => new Set(prev).add(notificationKey));
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error);
    }
  }, [productLocations, produtos, locations, notifiedLowStock, addNotification]);

  // Verificar estoque baixo periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      checkLowStock();
    }, 300000); // Verifica a cada 5 minutos

    // Verificar imediatamente ao carregar
    checkLowStock();

    return () => clearInterval(interval);
  }, [checkLowStock]);

  // Limpar notificações de produtos que já não estão com estoque baixo
  useEffect(() => {
    const newNotifiedLowStock = new Set<string>();

    productLocations.forEach((loc) => {
      const currentQty = loc.quantidadeProduto ?? 0;
      const minQty = loc.quantidadeMinimaProduto ?? 0;

      if (currentQty <= minQty) {
        newNotifiedLowStock.add(`${loc.id_produto}-${loc.id_localizacao}`);
      }
    });

    // Remove notificações de produtos que já não estão com estoque baixo
    setNotifiedLowStock((prev) => {
      const updated = new Set<string>();
      prev.forEach((key) => {
        if (newNotifiedLowStock.has(key)) {
          updated.add(key);
        }
      });
      return updated;
    });
  }, [productLocations]);

  const loadUserData = (): string => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Nenhum token encontrado. Faça login novamente.');
      }

      let decoded: DecodedToken & { role?: string };
      try {
        decoded = jwtDecode(token);
      } catch (error) {
        localStorage.removeItem('token');
        throw new Error('Token inválido. Faça login novamente.');
      }

      const id = decoded.userId || decoded.sub;
      if (!id) {
        throw new Error('ID de usuário não encontrado no token.');
      }

      setLoggedInFuncionarioCargo(decoded.role || '');
      return id;
    } catch (error: any) {
      setAlert({ severity: 'error', message: error.message });
      setIsLoading(false);
      navigate('/login');
      return '';
    }
  };

  useEffect(() => {
    const handleStorageChange = async () => {
      setIsLoading(true);
      const id = loadUserData();
      if (!id) return;

      try {
        const employees = await getAllEmployees();
        const currentEmployee = employees.find((emp) => emp.id === id);

        if (!currentEmployee) {
          throw new Error('Funcionário não encontrado. Verifique suas credenciais.');
        }

        setLoggedInFuncionarioId(id);
        dispatchCaixa({ type: 'UPDATE_FIELD', field: 'funcionarioId', value: id });
        setFuncionarios(employees);
      } catch (error: any) {
        setAlert({ severity: 'error', message: error.message });
        setLoggedInFuncionarioId('');
        dispatchCaixa({ type: 'UPDATE_FIELD', field: 'funcionarioId', value: '' });
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
  }, [navigate]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!loggedInFuncionarioId) return;

      try {
        const [
          salesData,
          funcionariosCaixaData,
          caixasData,
          locationsData,
          productsData,
          productLocationsData,
          clientsData,
        ] = await Promise.all([
          getAllSales(),
          getAllEmployeeCashRegisters(),
          getAllCashRegisters(),
          getAllLocations(),
          getAllProducts(),
          getAllProductLocations(),
          getAllClients(),
        ]);

        setClientes(clientsData as Cliente[]);

        const mappedFaturas: Fatura[] = salesData.map((venda: Venda, index: number) => {
          const cliente = clientsData.find((c: Cliente) => c.id === venda.id_cliente) || {
            nomeCliente: 'Cliente Desconhecido',
            numeroContribuinte: null,
            telefoneCliente: null,
            moradaCliente: null,
            emailCliente: null,
          };

          let funcionariosCaixa: FuncionarioCaixa | null = null;
          if (venda.id_funcionarioCaixa) {
            const funcionarioCaixa = funcionariosCaixaData.find(
              (fc: FuncionarioCaixa) => fc.id === venda.id_funcionarioCaixa,
            );
            if (funcionarioCaixa && funcionarioCaixa.id) {
              funcionariosCaixa = {
                ...funcionarioCaixa,
                id_caixa: funcionarioCaixa.id_caixa ?? '',
                id_funcionario: funcionarioCaixa.id_funcionario ?? '',
                quantidadaFaturada: Number(funcionarioCaixa.quantidadaFaturada) || 0,
                caixas:
                  caixasData.find((c: Caixa) => c.id === funcionarioCaixa.id_caixa) ?? undefined,
                Funcionarios:
                  funcionarios.find((f: Funcionario) => f.id === funcionarioCaixa.id_funcionario) ??
                  undefined,
              };
            }
          }

          return {
            id: venda.id ?? `temp-${index + 1}`,
            cliente: cliente.nomeCliente ?? 'Cliente Desconhecido',
            nif: cliente.numeroContribuinte ?? null,
            telefone: cliente.telefoneCliente ?? null,
            localizacao: cliente.moradaCliente ?? null,
            email: cliente.emailCliente ?? null,
            data: venda.dataEmissao.split('T')[0],
            produtos: (venda.vendasProdutos ?? []).map((vp) => {
              const produto = productsData.find((p: Produto) => p.id === vp.id_produto) || {
                id: vp.id_produto,
                id_categoriaProduto: '',
                referenciaProduto: '',
                nomeProduto: 'Produto Desconhecido',
                precoVenda: 0,
                quantidadePorUnidade: 0,
                unidadeMedida: '',
                unidadeConteudo: '',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              return {
                produto,
                quantidade: vp.quantidadeVendida,
              };
            }),
            funcionariosCaixa,
          };
        });

        setFaturas(mappedFaturas);
        setFuncionariosCaixa(funcionariosCaixaData);
        setCaixas(caixasData);
        setLocations(locationsData);
        setProdutos(productsData);
        setProductLocations(productLocationsData);

        await fetchProductsAndLocations();

        setDataLoaded(true);
      } catch (error: any) {
        setAlert({
          severity: 'error',
          message: 'Erro ao carregar dados iniciais: ' + (error.message || 'Tente novamente.'),
        });
        setDataLoaded(false);
      }
    };

    if (loggedInFuncionarioId) {
      fetchInitialData();
    }
  }, [loggedInFuncionarioId, funcionarios]);

  const fetchProductsAndLocations = async () => {
    try {
      const [productsData, productLocationsData, locationsData] = await Promise.all([
        getAllProducts(),
        getAllProductLocations(),
        getAllLocations(),
      ]);

      setLocations(locationsData);

      const lojaLocations = locationsData.filter((loc) => loc.tipo === tipo.Loja);

      if (!lojaLocations.length) {
        setAlert({ severity: 'error', message: 'Nenhuma localização do tipo "Loja" encontrada.' });
        setProductsInStore([]);
        setProdutos(productsData);
        setProductLocations(productLocationsData);
        setDataLoaded(true);
        return;
      }

      const validLojaLocations = lojaLocations.filter((loja) => {
        return productLocationsData.some(
          (location: ProdutoLocalizacao) => location.id_localizacao === loja.id,
        );
      });

      const productsInStore = productsData.filter((product: Produto) => {
        return validLojaLocations.some((loja) => {
          return productLocationsData.find(
            (location: ProdutoLocalizacao) =>
              location.id_produto === product.id &&
              location.id_localizacao === loja.id &&
              (location.quantidadeProduto ?? 0) > 0,
          );
        });
      });

      setProductsInStore(productsInStore);
      setProdutos(productsData);
      setProductLocations(productLocationsData);
      setDataLoaded(true);
    } catch (error: any) {
      setAlert({
        severity: 'error',
        message: 'Erro ao buscar produtos e localizações: ' + (error.message || 'Tente novamente.'),
      });
      setProductsInStore([]);
      setProdutos([]);
      setProductLocations([]);
      setDataLoaded(false);
    }
  };

  const isStoreLocation = (
    id_localizacao: string | undefined,
    locations: Localizacao[],
  ): boolean => {
    if (!id_localizacao) return false;
    return locations.some((loc) => loc.id === id_localizacao && loc.tipo === tipo.Loja);
  };

  const calcularTotal = (
    produtosSelecionados: { id: string; quantidade: number }[],
    produtos: Produto[],
  ): number => {
    return produtosSelecionados.reduce((acc, curr) => {
      const produto = produtos.find((p) => p.id === curr.id);
      return acc + (produto ? Number(produto.precoVenda) * curr.quantidade : 0);
    }, 0);
  };

  const calcularTotalFatura = (fatura: Fatura): number => {
    return fatura.produtos.reduce((acc, curr) => {
      const precoVenda = Number(curr.produto.precoVenda) || 0;
      return acc + precoVenda * curr.quantidade;
    }, 0);
  };

  



  

const generatePDF = (fatura: Fatura) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150 + fatura.produtos.length * 5], // 80mm largura, altura dinâmica
    });

    doc.setFont('helvetica', 'normal');
    const blackColor = '#000000';

    // Cabeçalho com informações fiscais
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUFG - Sistema Unificado', 40, 8, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('NIF: 1234567890', 40, 13, { align: 'center' });
    doc.text('Luanda, Angola', 40, 18, { align: 'center' });
    doc.text('Email: SUFGGERAL@EMAIL.COM', 40, 23, { align: 'center' });
    doc.text('Tel: +244 933081862', 40, 28, { align: 'center' });

    // Informações da Fatura
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fatura: FAT-${fatura.id.slice(-4)}`, 5, 36);

    // Verificação e formatação da data e hora
    let dataFatura = new Date(fatura.data);
    if (isNaN(dataFatura.getTime())) {
      // Fallback para a data e hora atuais (23:16 WAT, 28 de maio de 2025)
      dataFatura = toZonedTime(new Date('2025-05-28T23:16:00+01:00'), 'Africa/Luanda');
    } else {
      // Converter para o fuso horário de Angola (WAT)
      dataFatura = toZonedTime(dataFatura, 'Africa/Luanda');
    }

    doc.text(`Data: ${format(dataFatura, 'dd/MM/yyyy', { timeZone: 'Africa/Luanda' })}`, 5, 41);
    doc.text(`Hora: ${format(dataFatura, 'HH:mm:ss', { timeZone: 'Africa/Luanda' })}`, 5, 46);

    // Informações do Cliente
    doc.setFontSize(8);
    doc.text('----------------------------------------', 5, 51);
    doc.text(`Cliente: ${fatura.cliente.slice(0, 30)}`, 5, 56);
    doc.text(`NIF: ${fatura.nif || 'N/D'}`, 5, 61);
    doc.text(`Morada: ${fatura.localizacao?.slice(0, 30) || 'N/D'}`, 5, 66);

    // Tabela de Produtos
    const produtosTable = fatura.produtos.map((p) => {
      const precoVenda = Number(p.produto.precoVenda) || 0;
      return [
        p.produto.nomeProduto.slice(0, 18), // Limita o nome do produto
        p.quantidade.toString(),
        `${precoVenda.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`,
        `${(precoVenda * p.quantidade).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`,
      ];
    });

    let finalY = 71;
    if (produtosTable.length > 0) {
      autoTable(doc, {
        startY: 71,
        head: [['Descrição', 'Qtd', 'P. Unit.', 'Total']],
        body: produtosTable,
        theme: 'plain',
        styles: {
          fontSize: 7,
          cellPadding: 1,
          textColor: blackColor,
          overflow: 'linebreak',
        },
        headStyles: {
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 15, halign: 'right' },
          3: { cellWidth: 22, halign: 'right' },
        },
        margin: { left: 5, right: 5 },
      });
      finalY = (doc as any).lastAutoTable.finalY || 71;
    }

    // Total
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('----------------------------------------', 5, finalY + 5);
    doc.text(
      `Total: Kz ${calcularTotalFatura(fatura).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}`,
      5,
      finalY + 10,
    );

    // Rodapé
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('----------------------------------------', 5, finalY + 15);
    doc.text('Obrigado pela sua preferência!', 40, finalY + 20, { align: 'center' });
    doc.text('SUFGGERAL@EMAIL.COM | +244 933081862', 40, finalY + 30, { align: 'center' });

    // Saída do PDF
    const pdfBlob = doc.output('blob');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(pdfBlob);
    link.download = `Fatura_${fatura.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    setAlert({
      severity: 'error',
      message: 'Erro ao gerar PDF: ' + (error.message || 'Tente novamente.'),
    });
  }
};

  const handleOpenFaturaModal = (faturaId?: string) => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }

    if (faturaId) {
      const fatura = faturas.find((f) => f.id === faturaId);
      if (fatura && fatura.id) {
        dispatchFatura({
          type: 'SET_FATURA',
          payload: {
            id: fatura.id,
            cliente: fatura.cliente,
            nif: fatura.nif ?? '',
            telefone: fatura.telefone ?? '',
            localizacao: fatura.localizacao ?? '',
            email: fatura.email ?? '',
            produtosSelecionados: fatura.produtos.map((p) => ({
              id: p.produto.id ?? '',
              quantidade: p.quantidade,
            })),
            funcionariosCaixaId: fatura.funcionariosCaixa?.id ?? '',
          },
        });
      }
    } else {
      const caixaAberto = funcionariosCaixa.find(
        (fc) => fc.estadoCaixa && fc.id_funcionario === loggedInFuncionarioId,
      );
      if (caixaAberto && caixaAberto.id) {
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'funcionariosCaixaId',
          value: caixaAberto.id,
        });
      } else {
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'funcionariosCaixaId',
          value: '',
        });
        setAlert({
          severity: 'warning',
          message: 'Nenhum caixa aberto encontrado. Abra um caixa primeiro.',
        });
      }
    }
    setOpenFaturaModal(true);
  };

  const handleCloseFaturaModal = () => {
    setOpenFaturaModal(false);
    dispatchFatura({ type: 'RESET' });
  };

  const handleOpenConfirmModal = (faturaId: string) => {
    setFaturaToDelete(faturaId);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setFaturaToDelete(null);
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatchFatura({
      type: 'UPDATE_FIELD',
      field: name as keyof FaturaState,
      value,
    });

    if (name === 'nif') {
      const clienteEncontrado = clientes.find((c) => c.numeroContribuinte === value);
      if (clienteEncontrado) {
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'cliente',
          value: clienteEncontrado.nomeCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'telefone',
          value: clienteEncontrado.telefoneCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'localizacao',
          value: clienteEncontrado.moradaCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'email',
          value: clienteEncontrado.emailCliente ?? '',
        });
      } else {
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'cliente', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'telefone', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'localizacao', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'email', value: '' });
      }
    }
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    dispatchFatura({ type: 'UPDATE_PRODUTO', index, field, value });
    if (field === 'id' || field === 'quantidade') {
      const lojaLocations = locations.filter((loc) => loc.tipo === tipo.Loja);
      const produtoId =
        field === 'id' ? (value as string) : faturaState.produtosSelecionados[index].id;
      const quantidade =
        field === 'quantidade' ? Number(value) : faturaState.produtosSelecionados[index].quantidade;
      const produtoLocation = productLocations.find(
        (loc) =>
          loc.id_produto === produtoId &&
          lojaLocations.some((loja) => loja.id === loc.id_localizacao),
      );
      const quantidadeDisponivel = productLocations
        .filter(
          (loc) =>
            loc.id_produto === produtoId &&
            lojaLocations.some((loja) => loja.id === loc.id_localizacao),
        )
        .reduce((total, loc) => total + (loc.quantidadeProduto ?? 0), 0);
      const newErrors = { ...faturaState.errors };

      if (!produtoId) {
        newErrors[`produto_${index}`] = 'Selecione um produto';
      } else if (!produtoLocation) {
        newErrors[`produto_${index}`] = 'Produto não encontrado na loja';
      } else if (quantidade > quantidadeDisponivel) {
        newErrors[`produto_${index}`] =
          `Quantidade indisponível. Estoque nas lojas: ${quantidadeDisponivel}`;
      } else {
        delete newErrors[`produto_${index}`];
      }

      dispatchFatura({ type: 'SET_ERRORS', errors: newErrors });
    }
  };
  const getLoggedInUserName = (): string => {
    const funcionario = funcionarios.find((f) => f.id === loggedInFuncionarioId);
    return funcionario?.nomeFuncionario || 'Usuário Desconhecido';
  };
  const getCaixasExibidas = () => {
    return funcionariosCaixa.filter((caixa) => caixa.estadoCaixa);
  };

  const adicionarNovoProdutoInput = () => {
    dispatchFatura({ type: 'ADD_PRODUTO' });
  };

  const removerProdutoInput = (index: number) => {
    dispatchFatura({ type: 'REMOVE_PRODUTO', index });
  };

  const handleClientSelect = (_event: React.SyntheticEvent, newValue: string | Cliente | null) => {
    if (newValue) {
      if (typeof newValue === 'string') {
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'nif', value: newValue });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'cliente', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'telefone', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'localizacao', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'email', value: '' });
      } else {
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'nif',
          value: newValue.numeroContribuinte ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'cliente',
          value: newValue.nomeCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'telefone',
          value: newValue.telefoneCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'localizacao',
          value: newValue.moradaCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'email',
          value: newValue.emailCliente ?? '',
        });
      }
    } else {
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'nif', value: '' });
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'cliente', value: '' });
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'telefone', value: '' });
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'localizacao', value: '' });
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'email', value: '' });
    }
  };

  const onAddFaturaSubmit = async () => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }
  
    try {
      setLoading(true);
  
      await fetchProductsAndLocations();
      await new Promise((resolve) => setTimeout(resolve, 100));
  
      // Filtrar produtos válidos (com id e quantidade > 0)
      const produtosValidos = faturaState.produtosSelecionados.filter(
        (p) => p.id && p.quantidade > 0
      );
  
      // Atualizar o estado com apenas produtos válidos
      dispatchFatura({
        type: 'UPDATE_FIELD',
        field: 'produtosSelecionados',
        value: produtosValidos.length > 0 ? produtosValidos : [{ id: '', quantidade: 0 }],
      });
  
      // Validar a fatura com os produtos filtrados
      const errors = validateFatura(
        { ...faturaState, produtosSelecionados: produtosValidos },
        productsInStore,
        funcionariosCaixa,
        productLocations,
        locations,
      );
      dispatchFatura({ type: 'SET_ERRORS', errors });
      if (Object.keys(errors).length > 0) {
        return;
      }
  
      const dataEmissao = new Date();
      const dataValidade = new Date(dataEmissao);
      dataValidade.setDate(dataEmissao.getDate() + 30);
  
      const clienteExistente = clientes.find((c) => c.numeroContribuinte === faturaState.nif);
  
      // Usar produtos válidos para calcular o total
      const totalVenda = calcularTotal(produtosValidos, productsInStore);
  
      const dadosWrapper: DadosWrapper = {
        Dados: {
          dadosVenda: {
            dataEmissao,
            dataValidade,
            id_funcionarioCaixa: faturaState.funcionariosCaixaId,
            numeroDocumento: `FAT-${Date.now()}`,
            tipoDocumento: TipoDocumento.FATURA,
            metodoPagamento: faturaState.metodoPagamento,
            valorTotal: totalVenda,
            vendasProdutos: produtosValidos.map((p) => ({
              id_produto: p.id,
              quantidade: Number(p.quantidade),
            })),
            id_cliente: clienteExistente?.id,
          },
          cliente: clienteExistente
            ? undefined
            : faturaState.cliente.trim()
              ? [
                  {
                    nomeCliente: faturaState.cliente || null,
                    numeroContribuinte: faturaState.nif || null,
                    telefoneCliente: faturaState.telefone || null,
                    moradaCliente: faturaState.localizacao || null,
                    emailCliente: faturaState.email || null,
                  } as Cliente,
                ]
              : undefined,
        },
      };
  
      const createdVenda = await createSale(dadosWrapper);
      if (!createdVenda.id) {
        throw new Error('ID da venda não retornado pela API.');
      }
  
      const funcionarioCaixa = funcionariosCaixa.find(
        (fc) => fc.id === faturaState.funcionariosCaixaId,
      );
      if (!funcionarioCaixa || !funcionarioCaixa.id) {
        throw new Error('Caixa do funcionário não encontrado.');
      }
  
      const currentQuantidadaFaturada = Number(funcionarioCaixa.quantidadaFaturada) || 0;
      const updatedFuncionarioCaixa: FuncionarioCaixa = {
        ...funcionarioCaixa,
        quantidadaFaturada: currentQuantidadaFaturada + totalVenda,
      };
  
      try {
        await updateEmployeeCashRegister(funcionarioCaixa.id, updatedFuncionarioCaixa);
        setFuncionariosCaixa((prev) =>
          prev.map((fc) => (fc.id === funcionarioCaixa.id ? updatedFuncionarioCaixa : fc)),
        );
      } catch (error: any) {
        throw new Error(
          'Falha ao atualizar o total faturado do caixa: ' + (error.message || 'Tente novamente.'),
        );
      }
  
      const lojaLocations = locations.filter((loc) => loc.tipo === tipo.Loja);
      if (!lojaLocations.length) {
        throw new Error('Nenhuma localização do tipo "Loja" encontrada.');
      }
  
      const updates = produtosValidos.map(async (produtoSelecionado) => {
        const produtoLocations = productLocations.filter(
          (loc) =>
            loc.id_produto === produtoSelecionado.id &&
            lojaLocations.some((loja) => loja.id === loc.id_localizacao),
        );
  
        if (produtoLocations.length === 0) {
          throw new Error(`Produto ${produtoSelecionado.id} não encontrado em nenhuma loja.`);
        }
  
        let quantidadeRestante = produtoSelecionado.quantidade;
  
        for (const produtoLocation of produtoLocations) {
          if (quantidadeRestante <= 0) break;
  
          const quantidadeAtual = produtoLocation.quantidadeProduto ?? 0;
          const quantidadeADescontar = Math.min(quantidadeAtual, quantidadeRestante);
  
          if (quantidadeADescontar > 0) {
            const newQuantity = quantidadeAtual - quantidadeADescontar;
            try {
              const updatedLocation: ProdutoLocalizacao = {
                ...produtoLocation,
                quantidadeProduto: newQuantity,
                id_produto: produtoLocation.id_produto,
              };
              await updateProductLocation(produtoLocation?.id!, updatedLocation);
              setProductLocations((prev) =>
                prev.map((loc) => (loc.id === produtoLocation.id ? updatedLocation : loc)),
              );
              quantidadeRestante -= quantidadeADescontar;
            } catch (error: any) {
              throw new Error(
                `Falha ao atualizar localização do produto ${produtoSelecionado.id} na loja ${produtoLocation.id_localizacao}: ${error.message || 'Tente novamente.'}`,
              );
            }
          }
        }
  
        if (quantidadeRestante > 0) {
          throw new Error(
            `Quantidade insuficiente para o produto ${produtoSelecionado.id} após tentar todas as lojas.`,
          );
        }
      });
  
      const updatedProductLocations = await getAllProductLocations();
      setProductLocations(updatedProductLocations);
  
      const stockUpdates = produtosValidos.map(async (produtoSelecionado) => {
        const lojaQuantity = updatedProductLocations
          .filter(
            (loc) =>
              loc.id_produto === produtoSelecionado.id &&
              lojaLocations.some((loja) => loja.id === loc.id_localizacao),
          )
          .reduce((total, loc) => total + (loc.quantidadeProduto ?? 0), 0);
  
        const armazemLocation = locations.find((loc) =>
          loc.nomeLocalizacao.toLowerCase().includes('armazém'),
        );
        const armazemProdutoLocation = armazemLocation
          ? updatedProductLocations.find(
              (loc) =>
                loc.id_produto === produtoSelecionado.id &&
                loc.id_localizacao === armazemLocation.id,
            )
          : null;
        const armazemQuantity = Number(armazemProdutoLocation?.quantidadeProduto) || 0;
        const estoqueGeral = lojaQuantity + armazemQuantity;
  
        try {
          const existingStock = await getStockByProduct(produtoSelecionado.id);
          if (!existingStock || !existingStock.id) {
            throw new Error(`Nenhum estoque encontrado para o produto ${produtoSelecionado.id}.`);
          }
          const updatedStockData = {
            id_produto: produtoSelecionado.id,
            quantidadeAtual: estoqueGeral,
            lote: existingStock.lote || '',
            dataValidadeLote: existingStock.dataValidadeLote || new Date().toISOString(),
          };
          await updateStock(existingStock.id, updatedStockData);
        } catch (error: any) {
          throw new Error(
            `Falha ao atualizar estoque do produto ${produtoSelecionado.id}: ${error.message || 'Tente novamente.'}`,
          );
        }
  
        const produto = productsInStore.find((p) => p.id === produtoSelecionado.id);
        if (!produto || !produto.id) {
          throw new Error(`Produto ${produtoSelecionado.id} não encontrado.`);
        }
  
        try {
          const updatedProduto: Produto = {
            ...produto,
            quantidadePorUnidade: estoqueGeral,
          };
          await updateProduct(produto.id, updatedProduto);
          setProdutos((prev) => prev.map((p) => (p.id === produto.id ? updatedProduto : p)));
        } catch (error: any) {
          throw new Error(
            `Falha ao atualizar produto ${produto.id}: ${error.message || 'Tente novamente.'}`,
          );
        }
      });
  
      await Promise.all(updates);
      await Promise.all(stockUpdates);
  
      const novosProdutosFatura = produtosValidos.map((p) => {
        const produto = productsInStore.find((prod) => prod.id === p.id);
        if (!produto || !produto.id) {
          throw new Error(`Produto com ID ${p.id} não encontrado.`);
        }
        return {
          produto: {
            ...produto,
            quantidadePorUnidade: (produto.quantidadePorUnidade ?? 0) - p.quantidade,
          },
          quantidade: p.quantidade,
        };
      });
  
      const newFatura: Fatura = {
        id: createdVenda.id,
        cliente: faturaState.cliente || 'Cliente Anônimo',
        nif: faturaState.nif || null,
        telefone: faturaState.telefone || null,
        localizacao: faturaState.localizacao || null,
        email: faturaState.email || null,
        data: dataEmissao.toISOString().split('T')[0],
        produtos: novosProdutosFatura,
        funcionariosCaixa: {
          ...funcionarioCaixa,
          id_caixa: funcionarioCaixa.id_caixa ?? '',
          id_funcionario: loggedInFuncionarioId,
          quantidadaFaturada: currentQuantidadaFaturada + totalVenda,
        },
      };
  
      setFaturas((prev) => [...prev, newFatura]);
  
      if (!clienteExistente && createdVenda.id_cliente) {
        const novoCliente: Cliente = {
          id: createdVenda.id_cliente,
          nomeCliente: faturaState.cliente || 'Cliente Anônimo',
          numeroContribuinte: faturaState.nif,
          telefoneCliente: faturaState.telefone,
          moradaCliente: faturaState.localizacao,
          emailCliente: faturaState.email,
        };
        setClientes((prev) => [...prev, novoCliente]);
      }
  
      setAlert({ severity: 'success', message: 'Fatura criada com sucesso!' });
      generatePDF(newFatura);
      handleCloseFaturaModal();
      await fetchProductsAndLocations();
    } catch (error: any) {
      setAlert({
        severity: 'error',
        message: error.message || 'Falha ao cadastrar fatura. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const excluirFatura = async () => {
    if (!faturaToDelete) {
      setAlert({ severity: 'error', message: 'Nenhuma fatura selecionada para exclusão!' });
      return;
    }

    try {
      setLoading(true);
      const fatura = faturas.find((f) => f.id === faturaToDelete);
      if (!fatura || !fatura.id) {
        throw new Error(`Fatura com ID ${faturaToDelete} não encontrada`);
      }

      const funcionarioCaixa = funcionariosCaixa.find(
        (fc) => fc.id === fatura.funcionariosCaixa?.id,
      );
      if (funcionarioCaixa && funcionarioCaixa.id) {
        const totalFatura = calcularTotalFatura(fatura);
        const currentQuantidadaFaturada = Number(funcionarioCaixa.quantidadaFaturada) || 0;
        const updatedFuncionarioCaixa: FuncionarioCaixa = {
          ...funcionarioCaixa,
          quantidadaFaturada: Math.max(currentQuantidadaFaturada - totalFatura, 0),
        };

        try {
          await updateEmployeeCashRegister(funcionarioCaixa.id, updatedFuncionarioCaixa);
          setFuncionariosCaixa((prev) =>
            prev.map((fc) => (fc.id === funcionarioCaixa.id ? updatedFuncionarioCaixa : fc)),
          );
        } catch (error: any) {
          throw new Error(
            'Falha ao reverter o total faturado do caixa: ' + (error.message || 'Tente novamente.'),
          );
        }
      }

      try {
        await deleteSale(fatura.id);
      } catch (error: any) {
        throw new Error('Falha ao excluir a venda: ' + (error.message || 'Tente novamente.'));
      }

      const lojaLocations = locations.filter((loc) => loc.tipo === tipo.Loja);
      if (!lojaLocations.length) {
        throw new Error('Localização "Loja" não encontrada.');
      }

      const updates = fatura.produtos.map(async (produtoFatura) => {
        if (!produtoFatura.produto.id) {
          throw new Error(`Produto com ID inválido na fatura ${fatura.id}.`);
        }

        const produtoLocations = productLocations.filter(
          (loc) =>
            loc.id_produto === produtoFatura.produto.id &&
            lojaLocations.some((loja) => loja.id === loc.id_localizacao),
        );

        if (produtoLocations.length === 0) {
          throw new Error(
            `Localização do produto ${produtoFatura.produto.id} não encontrada na loja.`,
          );
        }

        let quantidadeRestante = produtoFatura.quantidade;

        for (const produtoLocation of produtoLocations) {
          if (quantidadeRestante <= 0) break;

          const quantidadeAtual = produtoLocation.quantidadeProduto ?? 0;
          const quantidadeAAdicionar = Math.min(quantidadeRestante, quantidadeRestante);

          const newQuantity = quantidadeAtual + quantidadeAAdicionar;

          try {
            const updatedLocation: ProdutoLocalizacao = {
              ...produtoLocation,
              quantidadeProduto: newQuantity,
              id_produto: produtoLocation.id_produto,
            };
            await updateProductLocation(produtoLocation?.id!, updatedLocation);
            setProductLocations((prev) =>
              prev.map((loc) => (loc.id === produtoLocation.id ? updatedLocation : loc)),
            );
            quantidadeRestante -= quantidadeAAdicionar;
          } catch (error: any) {
            throw new Error(
              `Falha ao atualizar localização do produto ${produtoFatura.produto.id}: ${error.message || 'Tente novamente.'}`,
            );
          }
        }

        const armazemLocation = locations.find((loc) =>
          loc.nomeLocalizacao.toLowerCase().includes('armazém'),
        );
        const armazemProdutoLocation = armazemLocation
          ? productLocations.find(
              (loc) =>
                loc.id_produto === produtoFatura.produto.id &&
                loc.id_localizacao === armazemLocation.id,
            )
          : null;

        const lojaQuantity = productLocations
          .filter(
            (loc) =>
              loc.id_produto === produtoFatura.produto.id &&
              lojaLocations.some((loja) => loja.id === loc.id_localizacao),
          )
          .reduce((total, loc) => total + (loc.quantidadeProduto ?? 0), 0);
        const armazemQuantity = Number(armazemProdutoLocation?.quantidadeProduto) || 0;
        const estoqueGeral = lojaQuantity + armazemQuantity;

        try {
          const existingStock = await getStockByProduct(produtoFatura.produto.id);
          if (!existingStock || !existingStock.id) {
            throw new Error(
              `Nenhum estoque encontrado para o produto ${produtoFatura.produto.id}.`,
            );
          }
          const updatedStockData = {
            id_produto: produtoFatura.produto.id,
            quantidadeAtual: estoqueGeral,
            lote: existingStock.lote || '',
            dataValidadeLote: existingStock.dataValidadeLote || new Date().toISOString(),
          };
          await updateStock(existingStock.id, updatedStockData);
        } catch (error: any) {
          throw new Error(
            `Falha ao atualizar estoque do produto ${produtoFatura.produto.id}: ${error.message || 'Tente novamente.'}`,
          );
        }

        const produto = productsInStore.find((p) => p.id === produtoFatura.produto.id);
        if (!produto || !produto.id) {
          throw new Error(`Produto ${produtoFatura.produto.id} não encontrado.`);
        }

        try {
          const updatedProduto: Produto = {
            ...produto,
            quantidadePorUnidade: estoqueGeral,
          };
          await updateProduct(produto.id, updatedProduto);
        } catch (error: any) {
          throw new Error(
            `Falha ao atualizar produto ${produto.id}: ${error.message || 'Tente novamente.'}`,
          );
        }
      });

      await Promise.all(updates);

      setFaturas((prev) => prev.filter((f) => f.id !== faturaToDelete));
      setAlert({ severity: 'success', message: 'Fatura excluída com sucesso!' });

      const totalPages = Math.ceil((faturas.length - 1) / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
    } catch (error: any) {
      setAlert({
        severity: 'error',
        message: error.message || 'Erro ao excluir fatura!',
      });
    } finally {
      setLoading(false);
      await fetchProductsAndLocations();
    }
  };
  
  /*useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();
  
    const handleBarcodeScan = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
  
      // Detectar entrada rápida (típica de scanners de código de barras)
      if (timeDiff < 50 && event.key !== 'Enter') {
        barcodeBuffer += event.key;
      } else if (event.key === 'Enter' && barcodeBuffer) {
        // Processar o código de barras quando "Enter" é detectado
        const referencia = barcodeBuffer.trim();
        const foundProduct = productsInStore.find(
          (p) => p.referenciaProduto.toLowerCase() === referencia.toLowerCase(),
        );
  
        if (foundProduct && foundProduct.id && openFaturaModal) {
          const index = faturaState.produtosSelecionados.length - 1;
          handleProdutoChange(index, 'id', foundProduct.id);
          if (index === faturaState.produtosSelecionados.length - 1) {
            adicionarNovoProdutoInput();
          }
        } else if (openFaturaModal) {
          setAlert({
            severity: 'error',
            message: `Produto com referência ${referencia} não encontrado.`,
          });
        }
  
        barcodeBuffer = ''; // Limpar o buffer após processar
      }
  
      lastKeyTime = currentTime;
    };
  
    window.addEventListener('keydown', handleBarcodeScan);
  
    return () => {
      window.removeEventListener('keydown', handleBarcodeScan);
    };
  }, [productsInStore, openFaturaModal, faturaState.produtosSelecionados, handleProdutoChange, adicionarNovoProdutoInput, setAlert]);*/
  useEffect(() => {
    let barcodeInput = '';
  
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!openFaturaModal) return; // Só processa eventos se o modal de fatura estiver aberto
  
      if (event.key !== 'Enter') {
        barcodeInput += event.key; // Acumula os caracteres do código de barras
        return;
      }
  
      // Quando "Enter" é detectado, processa o código de barras
      const referencia = barcodeInput.trim();
      if (referencia) {
        const foundProduct = productsInStore.find(
          (p) => p.referenciaProduto.toLowerCase() === referencia.toLowerCase(),
        );
        if (foundProduct && foundProduct.id) {
          const lastIndex = faturaState.produtosSelecionados.length - 1;
          handleProdutoChange(lastIndex, 'id', foundProduct.id);
          // Adiciona um novo campo de produto para a próxima leitura
          if (lastIndex === faturaState.produtosSelecionados.length - 1) {
            adicionarNovoProdutoInput();
          }
        } else {
          setAlert({
            severity: 'error',
            message: `Produto com referência ${referencia} não encontrado.`,
          });
        }
      }
      barcodeInput = ''; // Reseta o buffer após processar
    };
  
    window.addEventListener('keypress', handleKeyPress);
  
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [openFaturaModal, productsInStore, faturaState.produtosSelecionados, handleProdutoChange, adicionarNovoProdutoInput, setAlert]);
  const lastInputRef = useRef<HTMLInputElement | null>(null);

useEffect(() => {
  if (lastInputRef.current && openFaturaModal) {
    lastInputRef.current.focus();
    console.log('Foco aplicado ao TextField');
  }
}, [faturaState.produtosSelecionados, openFaturaModal]);
  const handleOpenCaixaModal = async () => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Obter o endereço MAC da máquina
      const macResponse = await axios.get('http://localhost:3001/mac');
      const machineMacAddress = macResponse.data.mac;

      // Obter o token de autenticação
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      // Buscar o caixa associado ao MAC
      const caixaResponse = await axios.get(
        `http://localhost:3333/caixa/mac/${machineMacAddress}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const caixa = caixaResponse.data;

      if (!caixa || !caixa.id) {
        throw new Error('Nenhum caixa encontrado para o endereço MAC desta máquina.');
      }

      // Atualizar o estado com o caixa encontrado
      dispatchCaixa({
        type: 'UPDATE_FIELD',
        field: 'caixaId',
        value: caixa.id,
      });

      // Buscar o último valor total do caixa
      const ultimoCaixa = funcionariosCaixa
        .filter((fc) => fc.id_caixa === caixa.id)
        .sort((a, b) => {
          const dateA = a.horarioFechamento || a.horarioAbertura || new Date(0);
          const dateB = b.horarioFechamento || b.horarioAbertura || new Date(0);
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })[0];


      dispatchCaixa({
        type: 'UPDATE_FIELD',
        field: 'funcionarioId',
        value: loggedInFuncionarioId,
      });

      setAlert({
        severity: 'info',
        message: `Caixa "${caixa.nomeCaixa}" selecionado automaticamente com base no endereço MAC.`,
      });
      setOpenCaixaModal(true);
    } catch (error: any) {
      setAlert({
        severity: 'error',
        message:
          error.response?.status === 401
            ? 'Autenticação falhou. Faça login novamente.'
            : error.message || 'Erro ao buscar o caixa pelo endereço MAC. Selecione manualmente.',
      });
      dispatchCaixa({
        type: 'UPDATE_FIELD',
        field: 'funcionarioId',
        value: loggedInFuncionarioId,
      });
      setOpenCaixaModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCaixaModal = () => {
    setOpenCaixaModal(false);
    dispatchCaixa({ type: 'RESET' });
  };

  const handleOpenCaixaListModal = () => setOpenCaixaListModal(true);
  const handleCloseCaixaListModal = () => setOpenCaixaListModal(false);

  const handleCaixaSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    dispatchCaixa({
      type: 'UPDATE_FIELD',
      field: name as keyof CaixaState,
      value,
    });

    // Se o campo alterado for caixaId, buscar o último valor total do caixa
    if (name === 'caixaId' && value) {
      const ultimoCaixa = funcionariosCaixa
        .filter((fc) => fc.id_caixa === value)
        .sort((a, b) => {
          const dateA = a.horarioFechamento || a.horarioAbertura || new Date(0);
          const dateB = b.horarioFechamento || b.horarioAbertura || new Date(0);
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })[0];
    }
  };

  const onAddCaixaSubmit = async () => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }

    const errors = validateCaixa(caixaState, funcionarios, caixas, funcionariosCaixa);
    dispatchCaixa({ type: 'SET_ERRORS', errors });
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      const newFuncionarioCaixa: FuncionarioCaixa = {
        id_caixa: caixaState.caixaId,
        id_funcionario: loggedInFuncionarioId,
        estadoCaixa: true,
        quantidadaFaturada: 0,
        horarioAbertura: new Date(),
        horarioFechamento: null,
      };
      const createdCaixa = await createEmployeeCashRegister(newFuncionarioCaixa);
      console.log('Caixa criado:', createdCaixa);
      if (!createdCaixa.id) {
        throw new Error('ID do caixa não retornado pela API.');
      }

      // Adicionar o caixa criado ao estado imediatamente
      setFuncionariosCaixa((prev) => [
        ...prev,
        {
          ...newFuncionarioCaixa,
          id: createdCaixa.id,
          caixas: caixas.find((c) => c.id === caixaState.caixaId), // Adiciona informações do caixa
          Funcionarios: funcionarios.find((f) => f.id === loggedInFuncionarioId), // Adiciona informações do funcionário
        },
      ]);
      const handleCloseModal = () => {
        setOpenModal(false);
      };
      // Atualizar a lista com dados da API
      const updatedFuncionariosCaixa = await getAllEmployeeCashRegisters();
      console.log('Lista de caixas atualizada:', updatedFuncionariosCaixa);
      setFuncionariosCaixa(updatedFuncionariosCaixa);
      setAlert({ severity: 'success', message: 'aberto com sucesso!' });
      handleCloseCaixaModal();
    } catch (error: any) {
      setAlert({
        severity: 'error',
        message: error.message || 'Falha ao abrir o caixa. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCaixaAlert = (message: string) => {
    console.log('[Faturacao] Adicionando notificação:', { message, type: 'caixa' });
    addNotification({
      message,
      type: 'cashier',
    });
  };

  // Função que dispara o alerta
  const handleEnviarAlerta = () => {
    try {
      handleCaixaAlert(`Alerta: Há produtos no caixa de ${getLoggedInUserName()}`);
      setOpenModal(true);
    } catch (error) {
      console.error('[Faturacao] Erro ao enviar alerta:', error);
    }
  };

  const handleFecharCaixa = async (caixaId: string) => {
    try {
      setLoading(true);
      const caixaAtual = funcionariosCaixa.find((c) => c.id === caixaId);
      if (!caixaAtual || !caixaAtual.id) {
        throw new Error('Caixa não encontrado.');
      }

      if (!caixaAtual.horarioAbertura) {
        throw new Error('Erro: Horário de abertura não definido.');
      }

      const updatedCaixa: FuncionarioCaixa = {
        ...caixaAtual,
        estadoCaixa: false,
        horarioFechamento: new Date(),
        caixas: caixaAtual.caixas,
        quantidadaFaturada: Number(caixaAtual.quantidadaFaturada) || 0,
      };

      await updateEmployeeCashRegister(caixaId, updatedCaixa);
      const updatedFuncionariosCaixa = await getAllEmployeeCashRegisters();
      setFuncionariosCaixa(updatedFuncionariosCaixa);
      setAlert({ severity: 'success', message: 'Caixa fechado com sucesso!' });
      handleCloseCaixaListModal();
    } catch (error: any) {
      setAlert({
        severity: 'error',
        message: error.message || 'Falha ao fechar o caixa. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const paginatedFaturas = faturas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', padding: '50px' }}>
        <Typography variant="h6">Carregando...</Typography>
      </Box>
    );
  }
  const handleCloseModal = () => {
    setOpenModal(false);
  };
  return (
    <>
      {alert && (
        <Grid sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Grid>
      )}

      <Paper sx={{ p: { xs: 1, sm: 2 }, width: '100%', borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
        >
          <Typography variant="h5" fontWeight="bold">
            Faturação (Vendas)
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
  {funcionariosCaixa.some(
    (fc) => fc.id_funcionario === loggedInFuncionarioId && fc.estadoCaixa,
  ) && (
    <Button
      variant="contained"
      color="secondary"
      onClick={() => handleOpenFaturaModal()}
      startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
      size="small"
      fullWidth
    >
      Nova Venda
    </Button>
  )}
  {funcionariosCaixa.some(
    (fc) => fc.id_funcionario === loggedInFuncionarioId && fc.estadoCaixa,
  ) ? null : loggedInFuncionarioCargo !== 'Gerente' && (
    <Button
      variant="contained"
      color="primary"
      onClick={async () => {
        if (!loggedInFuncionarioId) {
          setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
          navigate('/login');
          return;
        }

        setLoading(true);
        try {
          // Obter o endereço MAC da máquina
          const macResponse = await axios.get('http://localhost:3001/mac');
          const machineMacAddress = macResponse.data.mac;

          // Obter o token de autenticação
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Token de autenticação não encontrado. Faça login novamente.');
          }

          // Buscar o caixa associado ao MAC
          const caixaResponse = await axios.get(
            `http://localhost:3333/caixa/mac/${machineMacAddress}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          const caixa = caixaResponse.data;

          if (!caixa || !caixa.id) {
            throw new Error('Nenhum caixa encontrado para o endereço MAC desta máquina.');
          }

          // Configurar o estado do caixa
          const caixaState: CaixaState = {
            funcionarioId: loggedInFuncionarioId,
            caixaId: caixa.id,
            errors: {},
          };

          // Validar o caixa
          const errors = validateCaixa(caixaState, funcionarios, caixas, funcionariosCaixa);
          if (Object.keys(errors).length > 0) {
            dispatchCaixa({ type: 'SET_ERRORS', errors });
            setAlert({ severity: 'error', message: Object.values(errors)[0] });
            return;
          }

          // Criar o caixa
          const newFuncionarioCaixa: FuncionarioCaixa = {
            id_caixa: caixa.id,
            id_funcionario: loggedInFuncionarioId,
            estadoCaixa: true,
            quantidadaFaturada: 0,
            horarioAbertura: new Date(),
            horarioFechamento: null,
          };

          const createdCaixa = await createEmployeeCashRegister(newFuncionarioCaixa);
          if (!createdCaixa.id) {
            throw new Error('ID do caixa não retornado pela API.');
          }

          // Atualizar a lista de caixas
          setFuncionariosCaixa((prev) => [
            ...prev,
            {
              ...newFuncionarioCaixa,
              id: createdCaixa.id,
              caixas: caixas.find((c) => c.id === caixa.id),
              Funcionarios: funcionarios.find((f) => f.id === loggedInFuncionarioId),
            },
          ]);

          const updatedFuncionariosCaixa = await getAllEmployeeCashRegisters();
          setFuncionariosCaixa(updatedFuncionariosCaixa);
          setAlert({ severity: 'success', message: `Caixa "${caixa.nomeCaixa}" aberto com sucesso!` });
        } catch (error: any) {
          setAlert({
            severity: 'error',
            message:
              error.response?.status === 401
                ? 'Autenticação falhou. Faça login novamente.'
                : error.message || 'Erro ao abrir o caixa. Tente novamente.',
          });
        } finally {
          setLoading(false);
        }
      }}
      startIcon={<IconifyIcon icon="mdi:cash-register" />}
      size="small"
      fullWidth
      disabled={!loggedInFuncionarioId || loading}
    >
      Abrir Caixa
    </Button>
  )}
  {funcionariosCaixa.some(
    (fc) => fc.id_funcionario === loggedInFuncionarioId && fc.estadoCaixa,
  ) && (
    <Button
      variant="contained"
      color="error"
      onClick={() => {
        const caixaAberto = funcionariosCaixa.find(
          (fc) => fc.id_funcionario === loggedInFuncionarioId && fc.estadoCaixa,
        );
        if (caixaAberto && caixaAberto.id) {
          handleFecharCaixa(caixaAberto.id);
        }
      }}
      startIcon={<IconifyIcon icon="mdi:cash-register-off" />}
      size="small"
      fullWidth
      disabled={loading}
    >
      {loading ? 'Fechando...' : 'Fechar Caixa'}
    </Button>
  )}
  {['Admin', 'Gerente'].includes(loggedInFuncionarioCargo) && (
    <Button
      variant="contained"
      color="info"
      onClick={handleOpenCaixaListModal}
      startIcon={<IconifyIcon icon="mdi:cash-register" />}
      size="small"
      fullWidth
    >
      Ver Caixas
    </Button>
  )}
  {loggedInFuncionarioCargo !== 'Gerente' && (
    <Button
      variant="contained"
      color="warning"
      onClick={handleEnviarAlerta}
      startIcon={<IconifyIcon icon="mdi:alert" />}
      size="small"
      fullWidth
      disabled={!loggedInFuncionarioId || loading}
    >
      Enviar Alerta
    </Button>
  )}
</Stack>
        </Stack>
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Sucesso</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Alerta enviado com sucesso!
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} variant="contained" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <Modal open={openFaturaModal} onClose={handleCloseFaturaModal}>
        <Box sx={modalStyle}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
            Nova Venda (Loja)
          </Typography>
          <Stack spacing={3}>
            <Divider sx={{ borderColor: 'primary.main' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="h6" color="text.secondary">
                Dados da Venda
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {faturaState.funcionariosCaixaId ? (
                  <>
                    Caixa Selecionado:{' '}
                    {funcionariosCaixa.find((fc) => fc.id === faturaState.funcionariosCaixaId)
                      ?.caixas?.nomeCaixa || 'Caixa Sem Nome'}{' '}
                    -{' '}
                    {funcionariosCaixa.find((fc) => fc.id === faturaState.funcionariosCaixaId)
                      ?.Funcionarios?.nomeFuncionario || 'Funcionário Desconhecido'}
                  </>
                ) : (
                  'Nenhum caixa aberto disponível. Abra um caixa primeiro.'
                )}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
              Dados do Cliente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : (option.numeroContribuinte ?? '')
                  }
                  onChange={handleClientSelect}
                  value={
                    clientes.find((c) => c.numeroContribuinte === faturaState.nif) ||
                    (faturaState.nif ? { numeroContribuinte: faturaState.nif } : null)
                  }
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      label="Selecione ou Digite o NIF/BI"
                      name="nif"
                      error={Boolean(faturaState.errors.nif)}
                      helperText={faturaState.errors.nif}
                      sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                      onChange={handleTextFieldChange}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="cliente"
                  label="Nome do Cliente"
                  value={faturaState.cliente}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  error={Boolean(faturaState.errors.cliente)}
                  helperText={faturaState.errors.cliente}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="telefone"
                  label="Telefone"
                  type="tel"
                  value={faturaState.telefone}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="localizacao"
                  label="Localização"
                  value={faturaState.localizacao}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="email"
                  label="Email"
                  type="email"
                  value={faturaState.email}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl
                fullWidth
                variant="outlined"
                error={Boolean(faturaState.errors.metodoPagamento)}
                sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
              >
                <InputLabel>Método de Pagamento</InputLabel>
                <Select
                  name="metodoPagamento"
                  value={faturaState.metodoPagamento}
                  onChange={(e) =>
                    dispatchFatura({
                      type: 'UPDATE_FIELD',
                      field: 'metodoPagamento',
                      value: e.target.value,
                    })
                  }
                  label="Método de Pagamento"
                >
                  <MenuItem value="">
                    <em>Selecione um método</em>
                  </MenuItem>
                  <MenuItem value="DINHEIRO">Dinheiro</MenuItem>
                  <MenuItem value="CARTAO">Cartão</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferência Bancária</MenuItem>
                </Select>
                {faturaState.errors.metodoPagamento && (
                  <FormHelperText>{faturaState.errors.metodoPagamento}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
              Produtos
            </Typography>
            {!dataLoaded ? (
              <Typography variant="body2" color="text.secondary">
                Carregando produtos...
              </Typography>
            ) : locations.length === 0 || !locations.some((loc) => loc.tipo === tipo.Loja) ? (
              <Typography variant="body2" color="error">
                Nenhuma localização do tipo "Loja" encontrada.
              </Typography>
            ) : (
              faturaState.produtosSelecionados.map((produto, index) => {
                const lojaLocations = locations.filter((loc) => loc.tipo === tipo.Loja);
                return (
                  <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
  <Grid item xs={12} sm={6} md={5}>
  <Autocomplete
    options={productsInStore}
    getOptionLabel={(option) => `${option.referenciaProduto} - ${option.nomeProduto}`}
    onChange={(_event, newValue) => {
      if (newValue && newValue.id) {
        handleProdutoChange(index, 'id', newValue.id);
        // Adiciona automaticamente um novo campo de produto após selecionar um produto
        if (index === faturaState.produtosSelecionados.length - 1) {
          adicionarNovoProdutoInput();
        }
      } else {
        handleProdutoChange(index, 'id', '');
      }
    }}
    value={productsInStore.find((p) => p.id === produto.id) || null}
    disabled={loading || !lojaLocations.length}
    renderInput={(params) => (
      <TextField
        {...params}
        fullWidth
        variant="outlined"
        label="Referência ou Nome do Produto"
        error={Boolean(faturaState.errors[`produto_${index}`])}
        helperText={faturaState.errors[`produto_${index}`] || 'Escanear ou selecionar um produto'}
        sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
      />
    )}
    renderOption={(props, option) => {
      const produtoLocations = productLocations.filter(
        (loc) =>
          loc.id_produto === option.id &&
          lojaLocations.some((loja) => loja.id === loc.id_localizacao),
      );
      const quantidade = produtoLocations.reduce(
        (total, loc) => total + (loc.quantidadeProduto ?? 0),
        0,
      );
      return (
        <li {...props} key={option.id}>
          {option.referenciaProduto} - {option.nomeProduto} - {Number(option.precoVenda).toFixed(2)}kzs (Estoque: {quantidade})
        </li>
      );
    }}
  />
</Grid>
  <Grid item xs={8} sm={4} md={5}>
    <TextField
      fullWidth
      variant="outlined"
      type="number"
      label="Quantidade"
      value={produto.quantidade}
      onChange={(e) =>
        handleProdutoChange(index, 'quantidade', parseInt(e.target.value) || 1)
      }
      inputProps={{ min: 1 }}
      error={Boolean(faturaState.errors[`produto_${index}`])}
      helperText={faturaState.errors[`produto_${index}`]}
      sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
      disabled={loading || !lojaLocations.length}
    />
  </Grid>
  <Grid item xs={4} sm={2} md={2}>
    <IconButton
      color="error"
      onClick={() => removerProdutoInput(index)}
      size="small"
      disabled={loading}
    >
      <Delete />
    </IconButton>
  </Grid>
</Grid>
                );
              })
            )}

            {faturaState.errors.produtos && (
              <Typography color="error" variant="body2">
                {faturaState.errors.produtos}
              </Typography>
            )}

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                color="primary"
                onClick={adicionarNovoProdutoInput}
                startIcon={<IconifyIcon icon="mdi:plus" />}
                sx={{ borderRadius: 1 }}
                disabled={
                  loading || !dataLoaded || !locations.some((loc) => loc.tipo === tipo.Loja)
                }
              >
                Adicionar Produto
              </Button>
              <Typography variant="h6" color="text.primary">
                Total a Pagar:{' '}
                {calcularTotal(faturaState.produtosSelecionados, productsInStore).toFixed(2)} Kz
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddFaturaSubmit}
                sx={{ borderRadius: 1, px: 4 }}
                disabled={
                  loading || !dataLoaded || !locations.some((loc) => loc.tipo === tipo.Loja)
                }
              >
                {loading ? 'Processando...' : 'Finalizar Venda'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openCaixaModal} onClose={handleCloseCaixaModal}>
        <Box sx={modalStyle}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
            Abrir Novo Caixa
          </Typography>
          {alert && (
            <Alert severity={alert.severity} sx={{ mb: 2 }}>
              {alert.message}
            </Alert>
          )}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Funcionário"
                  value={
                    funcionarios.find((f) => f.id === loggedInFuncionarioId)?.nomeFuncionario ||
                    'N/A'
                  }
                  disabled
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  error={Boolean(caixaState.errors.funcionarioId)}
                  helperText={caixaState.errors.funcionarioId}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={Boolean(caixaState.errors.caixaId)}
                  disabled={loading}
                >
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="caixaId"
                    value={caixaState.caixaId}
                    onChange={handleCaixaSelectChange}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                    disabled={true} // Desativa a seleção do caixa
                  >
                    <MenuItem value="">
                      <em>Selecione um caixa</em>
                    </MenuItem>
                    {caixas.map((caixa) => (
                      <MenuItem key={caixa.id} value={caixa.id}>
                        {caixa.nomeCaixa}
                      </MenuItem>
                    ))}
                  </Select>
                  {caixaState.errors.caixaId && (
                    <FormHelperText>{caixaState.errors.caixaId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            <Divider sx={{ borderColor: 'primary.main' }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseCaixaModal}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onAddCaixaSubmit}
                disabled={loading || !loggedInFuncionarioId}
              >
                {loading ? 'Abrindo...' : 'Abrir Caixa'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
      <Modal open={openCaixaListModal} onClose={handleCloseCaixaListModal}>
        <Box sx={modalStyle}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
            Caixas Abertos
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
            <TableHead>
  <TableRow>
    <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
    <TableCell sx={{ fontWeight: 'bold' }}>Funcionário</TableCell>
    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
    <TableCell sx={{ fontWeight: 'bold' }}>Valor Faturado</TableCell>
    <TableCell sx={{ fontWeight: 'bold' }}>Total Final</TableCell>
    <TableCell sx={{ fontWeight: 'bold' }} />
  </TableRow>
</TableHead>
              <TableBody>
  {getCaixasExibidas().length > 0 ? (
    getCaixasExibidas().map((item) => {
      const quantidadaFaturada = Number(item.quantidadaFaturada) || 0;
      const totalFinal = quantidadaFaturada;
      return (
        <TableRow key={item.id}>
          <TableCell>{item.caixas?.nomeCaixa || 'N/A'}</TableCell>
          <TableCell>{item.Funcionarios?.nomeFuncionario || 'N/A'}</TableCell>
          <TableCell>{item.estadoCaixa ? 'Aberto' : 'Fechado'}</TableCell>
          <TableCell>{quantidadaFaturada.toFixed(2)} Kz</TableCell>
          <TableCell>{totalFinal.toFixed(2)} Kz</TableCell>
          <TableCell />
        </TableRow>
      );
    })
  ) : (
    <TableRow>
      <TableCell colSpan={6} align="center">
        <Typography variant="body2" color="text.secondary">
          Nenhum caixa aberto encontrado
        </Typography>
      </TableCell>
    </TableRow>
  )}
</TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Modal>

      <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
        <Box sx={confirmModalStyle}>
          <Typography variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir esta fatura? Esta ação não pode be desfeita.
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
            <Button variant="contained" color="error" onClick={excluirFatura} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {['Admin', 'Gerente'].includes(loggedInFuncionarioCargo) ? (
            <>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedFaturas.length > 0 ? (
                      paginatedFaturas.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.cliente}</TableCell>
                          <TableCell>
                            {new Intl.DateTimeFormat('pt-BR').format(new Date(item.data))}
                          </TableCell>
                          <TableCell>{calcularTotalFatura(item).toFixed(2)}kzs</TableCell>
                          <TableCell>
                            {item.funcionariosCaixa?.caixas?.nomeCaixa || 'Caixa Não Informado'}
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenFaturaModal(item.id)}
                                size="small"
                                disabled={loading}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleOpenConfirmModal(item.id)}
                                size="small"
                                disabled={loading}
                              >
                                <Delete />
                              </IconButton>
                              <IconButton
                                color="secondary"
                                onClick={() => generatePDF(item)}
                                size="small"
                                disabled={loading}
                              >
                                <IconifyIcon icon="mdi:download" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Nenhuma fatura encontrada
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={faturas.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              />
            </>
          ) : (
            <Typography variant="body1" color="error" align="center">
              Você não tem permissão para visualizar a listagem de faturas.
            </Typography>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Faturacao;
