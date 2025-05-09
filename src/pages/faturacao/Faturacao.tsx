import React, { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
  Collapse,
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
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { SubItem } from 'types/types';
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

// Interface para decodificação do token
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

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

interface FaturaState {
  id?: string;
  cliente: string;
  nif: string;
  telefone: string;
  localizacao: string;
  email: string;
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
  produtosSelecionados: [],
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
        produtosSelecionados: [...state.produtosSelecionados, { id: '', quantidade: 1 }],
      };
    case 'REMOVE_PRODUTO':
      const filteredProdutos = state.produtosSelecionados.filter((_, i) => i !== action.index);
      const newErrors = { ...state.errors };
      delete newErrors[`produto_${action.index}`];
      return { ...state, produtosSelecionados: filteredProdutos, errors: newErrors };
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

// Função utilitária para validação de fatura
const validateFatura = (
  state: FaturaState,
  produtos: Produto[],
  funcionariosCaixa: FuncionarioCaixa[],
  productLocations: ProdutoLocalizacao[],
  locations: Localizacao[],
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  if (!state.cliente.trim()) errors.cliente = 'Nome do cliente é obrigatório';
  if (state.produtosSelecionados.length === 0) errors.produtos = 'Adicione pelo menos um produto';
  if (!state.funcionariosCaixaId) {
    errors.funcionariosCaixaId = 'Nenhum caixa aberto encontrado. Abra um caixa primeiro.';
  } else if (!funcionariosCaixa.some(fc => fc.id === state.funcionariosCaixaId && fc.estadoCaixa)) {
    errors.funcionariosCaixaId = 'O caixa selecionado não está aberto.';
  }
  if (!locations.length) errors.locations = 'Nenhuma localização encontrada.';
  state.produtosSelecionados.forEach((p, index) => {
    if (!p.id) errors[`produto_${index}`] = 'Selecione um produto';
    const lojaLocation = locations.find(loc => loc.nomeLocalizacao.toLowerCase().includes('loja'));
    if (!lojaLocation) {
      errors[`produto_${index}`] = 'Localização "Loja" não encontrada.';
    } else {
      const produtoLocation = productLocations.find(
        loc => loc.id_produto === p.id && loc.id_localizacao === lojaLocation.id,
      );
      if (!produtoLocation) {
        errors[`produto_${index}`] = 'Produto não encontrado na loja.';
      } else if (p.quantidade > (produtoLocation.quantidadeProduto ?? 0)) {
        errors[`produto_${index}`] = `Quantidade indisponível. Estoque na loja: ${produtoLocation.quantidadeProduto ?? 0}`;
      }
    }
  });
  return errors;
};

// Função utilitária para validação de caixa
const validateCaixa = (
  state: CaixaState,
  funcionarios: Funcionario[],
  caixas: Caixa[],
  funcionariosCaixa: FuncionarioCaixa[],
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  if (!state.funcionarioId) {
    errors.funcionarioId = 'Funcionário é obrigatório. Faça login novamente.';
  } else if (!funcionarios.some(f => f.id === state.funcionarioId)) {
    errors.funcionarioId = 'Funcionário inválido ou não encontrado.';
  }
  if (!state.caixaId) {
    errors.caixaId = 'Selecione um caixa';
  } else if (!caixas.some(c => c.id === state.caixaId)) {
    errors.caixaId = 'Caixa não encontrado';
  }
  if (funcionariosCaixa.some(fc => fc.id_funcionario === state.funcionarioId && fc.estadoCaixa)) {
    errors.funcionarioId = 'Este funcionário já tem um caixa aberto';
  }
  return errors;
};

const Faturacao: React.FC<CollapsedItemProps> = ({ open }) => {
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [faturaState, dispatchFatura] = useReducer(faturaReducer, initialFaturaState);
  const [caixaState, dispatchCaixa] = useReducer(caixaReducer, initialCaixaState);
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioCaixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar e validar os dados do usuário logado
  const loadUserData = (): string => {
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
      setAlert({ severity: 'error', message: error.message });
      setIsLoading(false);
      navigate('/login');
      return '';
    }
  };

  // Efeito para carregar dados do usuário logado e inicializar o componente
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

  // Efeito para carregar dados iniciais
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
            const funcionarioCaixa = funcionariosCaixaData.find((fc: FuncionarioCaixa) => fc.id === venda.id_funcionarioCaixa);
            if (funcionarioCaixa && funcionarioCaixa.id) {
              funcionariosCaixa = {
                ...funcionarioCaixa,
                id_caixa: funcionarioCaixa.id_caixa ?? '',
                id_funcionario: funcionarioCaixa.id_funcionario ?? '',
                quantidadaFaturada: Number(funcionarioCaixa.quantidadaFaturada) || 0,
                caixas: caixasData.find((c: Caixa) => c.id === funcionarioCaixa.id_caixa) ?? undefined,
                Funcionarios: funcionarios.find((f: Funcionario) => f.id === funcionarioCaixa.id_funcionario) ?? undefined,
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
      } catch (error: any) {
        console.error('Erro ao carregar dados iniciais:', error);
        setAlert({ severity: 'error', message: 'Erro ao carregar dados iniciais: ' + (error.message || 'Tente novamente.') });
      }
    };

    if (loggedInFuncionarioId) {
      fetchInitialData();
    }
  }, [loggedInFuncionarioId, funcionarios]);

  const fetchProductsAndLocations = async () => {
    try {
      const [productsData, productLocationsData] = await Promise.all([
        getAllProducts(),
        getAllProductLocations(),
      ]);
      setProdutos(productsData);
      setProductLocations(productLocationsData);
    } catch (error: any) {
      console.error('Erro ao buscar produtos e localizações:', error);
      setAlert({ severity: 'error', message: 'Erro ao buscar produtos e localizações: ' + (error.message || 'Tente novamente.') });
    }
  };

  const isStoreLocation = (
    id_localizacao: string | undefined,
    locations: Localizacao[],
  ): boolean => {
    if (!id_localizacao) return false;
    return locations.some(
      (loc) => loc.id === id_localizacao && loc.nomeLocalizacao.toLowerCase().includes('loja'),
    );
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
        format: 'a4',
      });

      doc.setFont('helvetica', 'normal');
      const blueColor = '#1E90FF';
      const blackColor = '#000000';
      const whiteColor = '#FFFFFF';

      doc.setFillColor(blueColor);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(whiteColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA UNIFICADO DE FATURAÇÃO E GESTÃO', 10, 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('LUANDA- ANGOLA', 10, 18);
      doc.text('SUFGGERAL@EMAIL.COM', 150, 10, { align: 'right' });

      doc.setTextColor(blackColor);
      doc.setFontSize(40);
      doc.setFont('helvetica', 'bold');
      doc.text('Fatura.', 10, 35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fatura: ${fatura.id.padStart(10, '00-0000')}`, 150, 30, {
        align: 'right',
      });
      doc.text(`Data: ${new Date(fatura.data).toLocaleDateString('pt-BR')}`, 150, 35, {
        align: 'right',
      });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Emitido Para', 10, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(fatura.cliente, 10, 55);
      doc.text(`Tel: ${fatura.telefone || 'N/A'}`, 10, 60);
      doc.text(`${fatura.localizacao || 'N/A'}`, 10, 65);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`Kzs ${calcularTotalFatura(fatura).toFixed(2)}`, 150, 55, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.setFontSize(12);
      doc.setFillColor(blueColor);
      doc.rect(10, 75, 190, 10, 'F');
      doc.setTextColor(whiteColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Descrição do Produto', 15, 81);
      doc.text('Qtd', 90, 81, { align: 'center' });
      doc.text('Preço', 130, 81, { align: 'center' });
      doc.text('Total', 170, 81, { align: 'center' });

      const produtosTable = fatura.produtos.map((p) => {
        const precoVenda = Number(p.produto.precoVenda) || 0;
        return [
          p.produto.nomeProduto || 'Produto sem nome',
          p.quantidade.toString(),
          `Kzs ${precoVenda.toFixed(2)}`,
          `Kzs ${(precoVenda * p.quantidade).toFixed(2)}`,
        ];
      });

      let finalY = 85;
      if (produtos.length > 0) {
        autoTable(doc, {
          startY: 85,
          head: [['', '', '', '']],
          body: produtosTable,
          theme: 'plain',
          styles: {
            fontSize: 10,
            cellPadding: 2,
            textColor: blackColor,
          },
          columnStyles: {
            0: { cellWidth: 75 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' },
            3: { cellWidth: 35, halign: 'right' },
          },
        });
        finalY = (doc as any).lastAutoTable.finalY || 85;
      }

      doc.setFontSize(12);
      doc.setTextColor(blackColor);
      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal', 130, finalY + 10);
      doc.text(`Kzs ${calcularTotalFatura(fatura).toFixed(2)}`, 170, finalY + 10, { align: 'right' });
      doc.text('Imposto', 130, finalY + 15);
      doc.text('Kzs 0.00', 170, finalY + 15, { align: 'right' });
      doc.setFillColor(blueColor);
      doc.rect(130, finalY + 20, 70, 10, 'F');
      doc.setTextColor(whiteColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Total', 132, finalY + 26);
      doc.text(`Kzs ${calcularTotalFatura(fatura).toFixed(2)}`, 170, finalY + 26, { align: 'right' });

      doc.setFontSize(12);
      doc.setTextColor(blackColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Informação de pagamento', 10, finalY + 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        'Se você tiver alguma dúvida sobre esta fatura, favor entrar em contato:',
        10,
        finalY + 45,
      );

      doc.setFillColor(blueColor);
      doc.rect(0, 270, 210, 27, 'F');
      doc.setTextColor(whiteColor);
      doc.setFontSize(10);
      doc.text('+244 933081862', 10, 280);
      doc.text('SUFGGERAL@EMAIL.COM', 70, 280);
      doc.text('WWW.SUFGITEL.COM', 150, 280, { align: 'right' });

      const pdfBlob = doc.output('blob');
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(pdfBlob);
      link.download = `Fatura_${fatura.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      setAlert({ severity: 'error', message: 'Erro ao gerar PDF: ' + (error.message || 'Tente novamente.') });
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

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    dispatchFatura({
      type: 'UPDATE_FIELD',
      field: e.target.name as keyof FaturaState,
      value: e.target.value,
    });
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    dispatchFatura({ type: 'UPDATE_PRODUTO', index, field, value });
    if (field === 'quantidade') {
      const lojaLocation = locations.find((loc) =>
        loc.nomeLocalizacao.toLowerCase().includes('loja'),
      );
      const produtoLocation = productLocations.find(
        (loc) =>
          loc.id_produto === faturaState.produtosSelecionados[index].id &&
          loc.id_localizacao === lojaLocation?.id,
      );
      const quantidade = Number(value);
      if (produtoLocation && quantidade > (produtoLocation.quantidadeProduto ?? 0)) {
        dispatchFatura({
          type: 'SET_ERRORS',
          errors: {
            ...faturaState.errors,
            [`produto_${index}`]: `Quantidade indisponível. Estoque na loja: ${produtoLocation.quantidadeProduto ?? 0}`,
          },
        });
      } else {
        const newErrors = { ...faturaState.errors };
        delete newErrors[`produto_${index}`];
        dispatchFatura({ type: 'SET_ERRORS', errors: newErrors });
      }
    }
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

    const errors = validateFatura(faturaState, produtos, funcionariosCaixa, productLocations, locations);
    dispatchFatura({ type: 'SET_ERRORS', errors });
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      const dataEmissao = new Date();
      const dataValidade = new Date(dataEmissao);
      dataValidade.setDate(dataEmissao.getDate() + 30);

      const clienteExistente = clientes.find((c) => c.numeroContribuinte === faturaState.nif);

      const totalVenda = calcularTotal(faturaState.produtosSelecionados, produtos);

      const dadosWrapper: DadosWrapper = {
        Dados: {
          dadosVenda: {
            dataEmissao,
            dataValidade,
            id_funcionarioCaixa: faturaState.funcionariosCaixaId,
            numeroDocumento: `FAT-${Date.now()}`,
            tipoDocumento: TipoDocumento.FATURA,
            valorTotal: totalVenda,
            vendasProdutos: faturaState.produtosSelecionados.map((p) => ({
              id_produto: p.id,
              quantidade: Number(p.quantidade),
            })),
            id_cliente: clienteExistente?.id,
          },
          cliente: clienteExistente
            ? undefined
            : [
                {
                  nomeCliente: faturaState.cliente,
                  numeroContribuinte: faturaState.nif,
                  telefoneCliente: faturaState.telefone,
                  moradaCliente: faturaState.localizacao,
                  emailCliente: faturaState.email,
                } as Cliente,
              ],
        },
      };

      // Criar a venda
      const createdVenda = await createSale(dadosWrapper);
      if (!createdVenda.id) {
        throw new Error('ID da venda não retornado pela API.');
      }

      // Atualizar quantidadaFaturada no FuncionarioCaixa
      const funcionarioCaixa = funcionariosCaixa.find(fc => fc.id === faturaState.funcionariosCaixaId);
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
        setFuncionariosCaixa(prev =>
          prev.map(fc => (fc.id === funcionarioCaixa.id ? updatedFuncionarioCaixa : fc))
        );
      } catch (error: any) {
        console.error('Erro ao atualizar quantidadaFaturada:', error);
        throw new Error('Falha ao atualizar o total faturado do caixa: ' + (error.message || 'Tente novamente.'));
      }

      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (!lojaLocation || !lojaLocation.id) {
        throw new Error('Localização "Loja" não encontrada.');
      }

      // Atualizar localizações dos produtos e estoque
      const updates = faturaState.produtosSelecionados.map(async (produtoSelecionado) => {
        const produtoLocation = productLocations.find(
          (loc) => loc.id_produto === produtoSelecionado.id && loc.id_localizacao === lojaLocation.id,
        );

        if (!produtoLocation || !produtoLocation.id || !produtoLocation.id_produto) {
          throw new Error(`Localização do produto ${produtoSelecionado.id} não encontrada na loja.`);
        }

        const newQuantity = (produtoLocation.quantidadeProduto ?? 0) - produtoSelecionado.quantidade;
        if (newQuantity < 0) {
          throw new Error(
            `Quantidade insuficiente na loja para o produto ${produtoSelecionado.id}`,
          );
        }

        try {
          const updatedLocation: ProdutoLocalizacao = {
            ...produtoLocation,
            quantidadeProduto: newQuantity,
            id_produto: produtoLocation.id_produto,
          };
          await updateProductLocation(produtoLocation.id, updatedLocation);
        } catch (error: any) {
          console.error(`Erro ao atualizar localização do produto ${produtoSelecionado.id}:`, error);
          throw new Error(`Falha ao atualizar localização do produto ${produtoSelecionado.id}: ${error.message || 'Tente novamente.'}`);
        }

        const armazemLocation = locations.find((loc) =>
          loc.nomeLocalizacao.toLowerCase().includes('armazém'),
        );
        const armazemProdutoLocation = armazemLocation
          ? productLocations.find(
              (loc) =>
                loc.id_produto === produtoSelecionado.id &&
                loc.id_localizacao === armazemLocation.id,
            )
          : null;

        const lojaQuantity = Number(produtoLocation.quantidadeProduto) || 0;
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
          console.error(`Erro ao atualizar estoque do produto ${produtoSelecionado.id}:`, error);
          throw new Error(`Falha ao atualizar estoque do produto ${produtoSelecionado.id}: ${error.message || 'Tente novamente.'}`);
        }

        const produto = produtos.find((p) => p.id === produtoSelecionado.id);
        if (!produto || !produto.id) {
          throw new Error(`Produto ${produtoSelecionado.id} não encontrado.`);
        }

        try {
          const updatedProduto: Produto = {
            ...produto,
            quantidadePorUnidade: estoqueGeral,
          };
          await updateProduct(produto.id, updatedProduto);
        } catch (error: any) {
          console.error(`Erro ao atualizar produto ${produto.id}:`, error);
          throw new Error(`Falha ao atualizar produto ${produto.id}: ${error.message || 'Tente novamente.'}`);
        }
      });

      await Promise.all(updates);

      // Mapear produtos para a nova fatura
      const novosProdutosFatura = faturaState.produtosSelecionados.map((p) => {
        const produto = produtos.find((prod) => prod.id === p.id);
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

      // Criar nova fatura para o estado local
      const newFatura: Fatura = {
        id: createdVenda.id,
        cliente: faturaState.cliente,
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
      setProdutos((prev) =>
        prev.map((produto) => {
          const produtoSelecionado = faturaState.produtosSelecionados.find(
            (p) => p.id === produto.id,
          );
          if (produtoSelecionado && produto.id) {
            const lojaLoc = productLocations.find(
              (loc) => loc.id_produto === produto.id && loc.id_localizacao === lojaLocation.id,
            );
            const armazemLoc = productLocations.find(
              (loc) =>
                loc.id_produto === produto.id &&
                loc.id_localizacao ===
                  locations.find((l) => l.nomeLocalizacao.toLowerCase().includes('armazém'))?.id,
            );
            const newStock = (lojaLoc?.quantidadeProduto ?? 0) + (armazemLoc?.quantidadeProduto ?? 0);
            return { ...produto, quantidadePorUnidade: newStock };
          }
          return produto;
        }),
      );

      if (!clienteExistente && createdVenda.id_cliente) {
        const novoCliente: Cliente = {
          id: createdVenda.id_cliente,
          nomeCliente: faturaState.cliente,
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
      console.error('Erro ao criar fatura:', error);
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

      // Reverter quantidadaFaturada no FuncionarioCaixa
      const funcionarioCaixa = funcionariosCaixa.find(fc => fc.id === fatura.funcionariosCaixa?.id);
      if (funcionarioCaixa && funcionarioCaixa.id) {
        const totalFatura = calcularTotalFatura(fatura);
        const currentQuantidadaFaturada = Number(funcionarioCaixa.quantidadaFaturada) || 0;
        const updatedFuncionarioCaixa: FuncionarioCaixa = {
          ...funcionarioCaixa,
          quantidadaFaturada: Math.max(currentQuantidadaFaturada - totalFatura, 0),
        };

        try {
          await updateEmployeeCashRegister(funcionarioCaixa.id, updatedFuncionarioCaixa);
          setFuncionariosCaixa(prev =>
            prev.map(fc => (fc.id === funcionarioCaixa.id ? updatedFuncionarioCaixa : fc))
          );
        } catch (error: any) {
          console.error('Erro ao reverter quantidadaFaturada:', error);
          throw new Error('Falha ao reverter o total faturado do caixa: ' + (error.message || 'Tente novamente.'));
        }
      }

      // Excluir a venda
      try {
        await deleteSale(fatura.id);
      } catch (error: any) {
        console.error('Erro ao excluir venda:', error);
        throw new Error('Falha ao excluir a venda: ' + (error.message || 'Tente novamente.'));
      }

      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (!lojaLocation || !lojaLocation.id) {
        throw new Error('Localização "Loja" não encontrada.');
      }

      // Reverter localizações dos produtos e estoque
      const updates = fatura.produtos.map(async (produtoFatura) => {
        if (!produtoFatura.produto.id) {
          throw new Error(`Produto com ID inválido na fatura ${fatura.id}.`);
        }

        const produtoLocation = productLocations.find(
          (loc) =>
            loc.id_produto === produtoFatura.produto.id && loc.id_localizacao === lojaLocation.id,
        );

        if (!produtoLocation || !produtoLocation.id || !produtoLocation.id_produto) {
          throw new Error(`Localização do produto ${produtoFatura.produto.id} não encontrada na loja.`);
        }

        const newQuantity = (produtoLocation.quantidadeProduto ?? 0) + produtoFatura.quantidade;

        try {
          const updatedLocation: ProdutoLocalizacao = {
            ...produtoLocation,
            quantidadeProduto: newQuantity,
            id_produto: produtoLocation.id_produto,
          };
          await updateProductLocation(produtoLocation.id, updatedLocation);
        } catch (error: any) {
          console.error(`Erro ao atualizar localização do produto ${produtoFatura.produto.id}:`, error);
          throw new Error(`Falha ao atualizar localização do produto ${produtoFatura.produto.id}: ${error.message || 'Tente novamente.'}`);
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

        const lojaQuantity = Number(produtoLocation.quantidadeProduto) || 0;
        const armazemQuantity = Number(armazemProdutoLocation?.quantidadeProduto) || 0;
        const estoqueGeral = lojaQuantity + armazemQuantity;

        try {
          const existingStock = await getStockByProduct(produtoFatura.produto.id);
          if (!existingStock || !existingStock.id) {
            throw new Error(`Nenhum estoque encontrado para o produto ${produtoFatura.produto.id}.`);
          }
          const updatedStockData = {
            id_produto: produtoFatura.produto.id,
            quantidadeAtual: estoqueGeral,
            lote: existingStock.lote || '',
            dataValidadeLote: existingStock.dataValidadeLote || new Date().toISOString(),
          };
          await updateStock(existingStock.id, updatedStockData);
        } catch (error: any) {
          console.error(`Erro ao atualizar estoque do produto ${produtoFatura.produto.id}:`, error);
          throw new Error(`Falha ao atualizar estoque do produto ${produtoFatura.produto.id}: ${error.message || 'Tente novamente.'}`);
        }

        const produto = produtos.find((p) => p.id === produtoFatura.produto.id);
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
          console.error(`Erro ao atualizar produto ${produto.id}:`, error);
          throw new Error(`Falha ao atualizar produto ${produto.id}: ${error.message || 'Tente novamente.'}`);
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
      console.error('Erro ao excluir fatura:', error);
      setAlert({
        severity: 'error',
        message: error.message || 'Erro ao excluir fatura!',
      });
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
      await fetchProductsAndLocations();
    }
  };

  const handleOpenCaixaModal = () => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }
    dispatchCaixa({ type: 'UPDATE_FIELD', field: 'funcionarioId', value: loggedInFuncionarioId });
    setOpenCaixaModal(true);
  };

  const handleCloseCaixaModal = () => {
    setOpenCaixaModal(false);
    dispatchCaixa({ type: 'RESET' });
  };

  const handleOpenCaixaListModal = () => setOpenCaixaListModal(true);
  const handleCloseCaixaListModal = () => setOpenCaixaListModal(false);

  const handleCaixaSelectChange = (e: SelectChangeEvent<string>) => {
    dispatchCaixa({
      type: 'UPDATE_FIELD',
      field: e.target.name as keyof CaixaState,
      value: e.target.value,
    });
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
      if (!createdCaixa.id) {
        throw new Error('ID do caixa não retornado pela API.');
      }

      const updatedFuncionariosCaixa = await getAllEmployeeCashRegisters();
      setFuncionariosCaixa(updatedFuncionariosCaixa);
      setAlert({ severity: 'success', message: 'Caixa aberto com sucesso!' });
      handleCloseCaixaModal();
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error);
      setAlert({
        severity: 'error',
        message: error.message || 'Falha ao abrir o caixa. Tente novamente.',
      });
    } finally {
      setLoading(false);
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
      console.error('Erro ao fechar o caixa:', error);
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

  return (
    <>
      {alert && (
        <Grid sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Grid>
      )}

      <Paper sx={{ p: { xs: 1, sm: 2 }, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
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
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCaixaModal}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
                size="small"
                fullWidth
                disabled={!loggedInFuncionarioId}
              >
                Abrir Caixa
              </Button>
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
            </Stack>
          </Stack>
        </Collapse>
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
                    {funcionariosCaixa.find((fc) => fc.id === faturaState.funcionariosCaixaId)?.caixas?.nomeCaixa || 'Caixa Sem Nome'}{' '}
                    -{' '}
                    {funcionariosCaixa.find((fc) => fc.id === faturaState.funcionariosCaixaId)?.Funcionarios?.nomeFuncionario || 'Funcionário Desconhecido'}
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
                    typeof option === 'string' ? option : option.numeroContribuinte ?? ''
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

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
              Produtos
            </Typography>
            {faturaState.produtosSelecionados.map((produto, index) => (
              <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={5}>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={Boolean(faturaState.errors[`produto_${index}`])}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    <InputLabel>Produto</InputLabel>
                    <Select
                      value={produto.id}
                      onChange={(e) => handleProdutoChange(index, 'id', e.target.value)}
                    >
                      {produtos.map((p) => {
                        const lojaLocation = locations.find((loc) =>
                          loc.nomeLocalizacao.toLowerCase().includes('loja'),
                        );
                        const produtoLocation = productLocations.find(
                          (loc) =>
                            loc.id_produto === p.id && loc.id_localizacao === lojaLocation?.id,
                        );
                        const quantidade = produtoLocation?.quantidadeProduto ?? 0;
                        return (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nomeProduto} - {Number(p.precoVenda).toFixed(2)}kzs (Estoque: {quantidade})
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {faturaState.errors[`produto_${index}`] && (
                      <FormHelperText>{faturaState.errors[`produto_${index}`]}</FormHelperText>
                    )}
                  </FormControl>
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
                  />
                </Grid>
                <Grid item xs={4} sm={2} md={2}>
                  <IconButton
                    color="error"
                    onClick={() => removerProdutoInput(index)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

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
              >
                Adicionar Produto
              </Button>
              <Typography variant="h6" color="text.primary">
                Total a Pagar: {calcularTotal(faturaState.produtosSelecionados, produtos).toFixed(2)} Kz
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddFaturaSubmit}
                sx={{ borderRadius: 1, px: 4 }}
                disabled={loading}
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
                >
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="caixaId"
                    value={caixaState.caixaId}
                    onChange={handleCaixaSelectChange}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  >
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
            <Button
              variant="contained"
              color="primary"
              onClick={onAddCaixaSubmit}
              sx={{ alignSelf: 'flex-end', borderRadius: 1 }}
              disabled={!loggedInFuncionarioId || loading}
            >
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Funcionário</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Quantidade Faturada</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {funcionariosCaixa.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id ?? 'N/A'}</TableCell>
                    <TableCell>{item.caixas?.nomeCaixa || 'N/A'}</TableCell>
                    <TableCell>{item.Funcionarios?.nomeFuncionario || 'N/A'}</TableCell>
                    <TableCell>{item.estadoCaixa ? 'Aberto' : 'Fechado'}</TableCell>
                    <TableCell>{(Number(item.quantidadaFaturada) || 0).toFixed(2)} kz</TableCell>
                    <TableCell>
                      {item.estadoCaixa && item.id && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleFecharCaixa(item.id ?? '')}
                          size="small"
                          disabled={loading}
                        >
                          {loading ? 'Fechando...' : 'Fechar'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
            Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.
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
              onClick={excluirFatura}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
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
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenFaturaModal(item.id)}
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenConfirmModal(item.id)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => generatePDF(item)}
                            size="small"
                          >
                            <IconifyIcon icon="mdi:file-pdf" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhuma fatura encontrada
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
            labelRowsPerPage="Linhas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default Faturacao;