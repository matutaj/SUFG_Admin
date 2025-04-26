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
  DadosWrapper,
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

// Interface para decodificação do token
interface DecodedToken {
  userId?: string;
  sub?: string;
}

interface Fatura {
  id: string;
  cliente: string;
  nif: string;
  telefone: string;
  localizacao: string;
  email: string;
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
  const loadUserData = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Nenhum token encontrado. Faça login novamente.');
      }

      let decoded: DecodedToken = {};
      try {
        decoded = jwtDecode(token);
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
        localStorage.removeItem('token');
        throw new Error('Token inválido. Faça login novamente.');
      }

      const id = decoded.userId || decoded.sub || '';
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

        console.log('FuncionariosCaixaData:', JSON.stringify(funcionariosCaixaData, null, 2));
        console.log('ClientsData:', JSON.stringify(clientsData, null, 2));
        setClientes(clientsData as Cliente[]);

        const mappedFaturas = salesData.map((venda: Venda, index: number) => {
          const cliente = clientsData.find((c: Cliente) => c.id === venda.id_cliente);
          console.log(`Venda ${venda.id}: Cliente ID=${venda.id_cliente}, Nome=${cliente?.nomeCliente || 'N/A'}`);

          const funcionariosCaixa = venda.funcionariosCaixa
            ? {
                ...venda.funcionariosCaixa,
                id_caixa: venda.funcionariosCaixa.id_caixa || '',
                id_funcionario: venda.funcionariosCaixa.id_funcionario || '',
                caixas: caixasData.find((c) => c.id === (venda.funcionariosCaixa?.id_caixa || '')),
              } as FuncionarioCaixa
            : null;

          return {
            id: venda.id || `temp-${index + 1}`,
            cliente: cliente?.nomeCliente || venda.clientes?.nomeCliente || 'Cliente Desconhecido',
            nif: cliente?.numeroContribuinte || venda.clientes?.numeroContribuinte || '',
            telefone: cliente?.telefoneCliente || venda.clientes?.telefoneCliente || '',
            localizacao: cliente?.moradaCliente || venda.clientes?.moradaCliente || '',
            email: cliente?.emailCliente || venda.clientes?.emailCliente || '',
            data: venda.dataEmissao.split('T')[0],
            produtos:
              venda.vendasProdutos?.map((vp) => {
                const produto = productsData.find((p) => p.id === vp.id_produto);
                return {
                  produto: {
                    id: vp.id_produto,
                    id_categoriaProduto: produto?.id_categoriaProduto || '',
                    referenciaProduto: produto?.referenciaProduto || '',
                    nomeProduto: produto?.nomeProduto || '',
                    precoVenda: produto?.precoVenda || 0,
                    quantidadePorUnidade: produto?.quantidadePorUnidade || 0,
                    unidadeMedida: produto?.unidadeMedida || '',
                    unidadeConteudo: produto?.unidadeConteudo || '',
                    createdAt: produto?.createdAt || new Date(),
                    updatedAt: produto?.updatedAt || new Date(),
                  },
                  quantidade: vp.quantidadeVendida,
                };
              }) || [],
            funcionariosCaixa,
          };
        });

        setFaturas(mappedFaturas);
        setFuncionariosCaixa(funcionariosCaixaData);
        setCaixas(caixasData);
        setLocations(locationsData);
        setProdutos(productsData);
        setProductLocations(productLocationsData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        setAlert({ severity: 'error', message: 'Erro ao carregar dados iniciais!' });
      }
    };

    if (loggedInFuncionarioId) {
      fetchInitialData();
    }
  }, [loggedInFuncionarioId]);

  const fetchProductsAndLocations = async () => {
    try {
      const [productsData, productLocationsData] = await Promise.all([
        getAllProducts(),
        getAllProductLocations(),
      ]);
      setProdutos(productsData);
      setProductLocations(productLocationsData);
    } catch (error) {
      console.error('Erro ao buscar produtos e localizações:', error);
      setAlert({ severity: 'error', message: 'Erro ao buscar produtos e localizações!' });
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
  ) => {
    return produtosSelecionados.reduce((acc, curr) => {
      const produto = produtos.find((p) => p.id === curr.id);
      return acc + (produto ? produto.precoVenda * curr.quantidade : 0);
    }, 0);
  };

  const calcularTotalFatura = (fatura: Fatura) => {
    return fatura.produtos.reduce(
      (acc, curr) => acc + (Number(curr.produto.precoVenda) || 0) * curr.quantidade,
      0,
    );
  };

  const validateFaturaForm = (
    state: FaturaState,
    produtos: Produto[],
    funcionariosCaixa: FuncionarioCaixa[],
    productLocations: ProdutoLocalizacao[],
    locations: Localizacao[],
  ) => {
    const newErrors: { [key: string]: string } = {};
    if (!state.cliente.trim()) newErrors.cliente = 'Nome do cliente é obrigatório';
    if (state.produtosSelecionados.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    if (!state.funcionariosCaixaId) {
      newErrors.funcionariosCaixaId = 'Nenhum caixa aberto encontrado. Abra um caixa primeiro.';
    } else if (
      !funcionariosCaixa.some((fc) => fc.id === state.funcionariosCaixaId && fc.estadoCaixa)
    ) {
      newErrors.funcionariosCaixaId = 'O caixa selecionado não está aberto.';
    }
    state.produtosSelecionados.forEach((p, index) => {
      if (!p.id) {
        newErrors[`produto_${index}`] = 'Selecione um produto';
      } else {
        const lojaLocation = locations.find((loc) =>
          loc.nomeLocalizacao.toLowerCase().includes('loja'),
        );
        const produtoLocation = productLocations.find(
          (loc) => loc.id_produto === p.id && loc.id_localizacao === lojaLocation?.id,
        );
        if (produtoLocation && p.quantidade > (produtoLocation.quantidadeProduto ?? 0)) {
          newErrors[`produto_${index}`] =
            `Quantidade indisponível. Estoque na loja: ${produtoLocation.quantidadeProduto ?? 0}`;
        }
      }
    });
    return newErrors;
  };

  const validateCaixaForm = (
    state: CaixaState,
    funcionarios: Funcionario[],
    caixas: Caixa[],
    funcionariosCaixa: FuncionarioCaixa[],
  ) => {
    const newErrors: { [key: string]: string } = {};
    if (!state.funcionarioId) {
      newErrors.funcionarioId = 'Funcionário é obrigatório. Faça login novamente.';
    } else if (!funcionarios.some((f) => f.id === state.funcionarioId)) {
      newErrors.funcionarioId = 'Funcionário inválido ou não encontrado.';
    }
    if (!state.caixaId) {
      newErrors.caixaId = 'Selecione um caixa';
    } else if (!caixas.some((c) => c.id === state.caixaId)) {
      newErrors.caixaId = 'Caixa não encontrado';
    }
    if (
      funcionariosCaixa.some((fc) => fc.id_funcionario === state.funcionarioId && fc.estadoCaixa)
    ) {
      newErrors.funcionarioId = 'Este funcionário já tem um caixa aberto';
    }
    return newErrors;
  };

  const generatePDF = (fatura: Fatura) => {
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
    doc.text('NOME DE SUA EMPRESA', 10, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('00, muito bom', 10, 15);
    doc.text('AB CD, Nome da cidade', 10, 18);
    doc.text('SUAEMPRESA@EMAIL.COM', 150, 10, { align: 'right' });
    doc.text('(COI) 000 000 000', 150, 15, { align: 'right' });

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
    doc.text('Data de Vencimento: 02.11.2024', 150, 65, { align: 'right' });

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
    if (produtosTable.length > 0) {
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
      finalY = (doc as any).lastAutoTable.finalY;
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
    doc.text('(000) 0123 345', 10, 280);
    doc.text('NOME@EMAIL.COM', 70, 280);
    doc.text('WWW.WEBSITENOME.COM', 150, 280, { align: 'right' });

    const pdfBlob = doc.output('blob');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(pdfBlob);
    link.download = `Fatura_${fatura.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFaturaModal = (faturaId?: string) => {
    if (!loggedInFuncionarioId) {
      setAlert({ severity: 'error', message: 'Usuário não autenticado. Faça login novamente.' });
      navigate('/login');
      return;
    }

    if (faturaId) {
      const fatura = faturas.find((f) => f.id === faturaId);
      if (fatura) {
        dispatchFatura({
          type: 'SET_FATURA',
          payload: {
            id: fatura.id,
            cliente: fatura.cliente,
            nif: fatura.nif,
            telefone: fatura.telefone,
            localizacao: fatura.localizacao,
            email: fatura.email,
            produtosSelecionados: fatura.produtos.map((p) => ({
              id: p.produto.id!,
              quantidade: p.quantidade,
            })),
            funcionariosCaixaId: fatura.funcionariosCaixa?.id || '',
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

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatchFatura({
      type: 'UPDATE_FIELD',
      field: e.target.name as keyof FaturaState,
      value: e.target.value,
    });
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
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'cliente', value: newValue });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'nif', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'telefone', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'localizacao', value: '' });
        dispatchFatura({ type: 'UPDATE_FIELD', field: 'email', value: '' });
      } else {
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'cliente',
          value: newValue.nomeCliente ?? '',
        });
        dispatchFatura({
          type: 'UPDATE_FIELD',
          field: 'nif',
          value: newValue.numeroContribuinte ?? '',
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
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'cliente', value: '' });
      dispatchFatura({ type: 'UPDATE_FIELD', field: 'nif', value: '' });
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

    const errors = validateFaturaForm(
      faturaState,
      produtos,
      funcionariosCaixa,
      productLocations,
      locations,
    );
    dispatchFatura({ type: 'SET_ERRORS', errors });
    if (Object.keys(errors).length > 0) return;

    try {
      const dataEmissao = new Date();
      const dataValidade = new Date(dataEmissao);
      dataValidade.setDate(dataEmissao.getDate() + 30);

      const clienteExistente = clientes.find((c) => c.nomeCliente === faturaState.cliente);

      if (!faturaState.cliente.trim()) {
        throw new Error('Nome do cliente é obrigatório.');
      }

      const dadosWrapper: DadosWrapper = {
        Dados: {
          dadosVenda: {
            dataEmissao,
            dataValidade,
            id_funcionarioCaixa: faturaState.funcionariosCaixaId,
            numeroDocumento: `FAT-${Date.now()}`,
            tipoDocumento: TipoDocumento.FATURA,
            valorTotal: calcularTotal(faturaState.produtosSelecionados, produtos),
            vendasProdutos: faturaState.produtosSelecionados.map((p) => ({
              id_produto: p.id,
              quantidade: p.quantidade,
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

      console.log('Dados enviados para createSale:', JSON.stringify(dadosWrapper, null, 2));

      const createdVenda = await createSale(dadosWrapper);

      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (!lojaLocation) {
        throw new Error('Localização "Loja" não encontrada.');
      }

      for (const produtoSelecionado of faturaState.produtosSelecionados) {
        const produtoLocation = productLocations.find(
          (loc) => loc.id_produto === produtoSelecionado.id && loc.id_localizacao === lojaLocation.id,
        );

        if (!produtoLocation || !produtoLocation.id_produto) {
          throw new Error(`Localização do produto ${produtoSelecionado.id} não encontrada na loja.`);
        }

        const newQuantity = (produtoLocation.quantidadeProduto ?? 0) - produtoSelecionado.quantidade;
        if (newQuantity < 0) {
          throw new Error(
            `Quantidade insuficiente na loja para o produto ${produtoSelecionado.id}`,
          );
        }

        const updatedLocation: ProdutoLocalizacao = {
          ...produtoLocation,
          quantidadeProduto: newQuantity,
          id_produto: produtoLocation.id_produto,
        };
        await updateProductLocation(produtoLocation.id ?? '', updatedLocation);

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

        const existingStock = await getStockByProduct(produtoSelecionado.id);
        if (existingStock && existingStock.id) {
          const updatedStockData = {
            id_produto: produtoSelecionado.id,
            quantidadeAtual: estoqueGeral,
            lote: existingStock.lote || '',
            dataValidadeLote: existingStock.dataValidadeLote || new Date().toISOString(),
          };
          await updateStock(existingStock.id, updatedStockData);
        } else {
          throw new Error(`Nenhum estoque encontrado para o produto ${produtoSelecionado.id}.`);
        }

        const produto = produtos.find((p) => p.id === produtoSelecionado.id);
        if (produto && produto.id) {
          const updatedProduto: Produto = {
            ...produto,
            quantidadePorUnidade: estoqueGeral,
          };
          await updateProduct(produto.id, updatedProduto);
        }
      }

      const novosProdutosFatura = faturaState.produtosSelecionados.map((p) => {
        const produto = produtos.find((prod) => prod.id === p.id);
        if (!produto) {
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
        id: createdVenda.id || `temp-${faturas.length + 1}`,
        cliente: faturaState.cliente,
        nif: faturaState.nif || '',
        telefone: faturaState.telefone || '',
        localizacao: faturaState.localizacao || '',
        email: faturaState.email || '',
        data: dataEmissao.toISOString().split('T')[0],
        produtos: novosProdutosFatura,
        funcionariosCaixa: {
          ...funcionariosCaixa.find((fc) => fc.id === createdVenda.id_funcionarioCaixa),
          id_caixa: createdVenda.id_funcionarioCaixa || '',
          id_funcionario: loggedInFuncionarioId,
          caixas: caixas.find((c) => c.id === createdVenda.id_funcionarioCaixa),
        } as FuncionarioCaixa,
      };

      setFaturas((prev) => [...prev, newFatura]);
      setProdutos((prev) =>
        prev.map((produto) => {
          const produtoSelecionado = faturaState.produtosSelecionados.find(
            (p) => p.id === produto.id,
          );
          if (produtoSelecionado) {
            const lojaLoc = productLocations.find(
              (loc) => loc.id_produto === produto.id && loc.id_localizacao === lojaLocation?.id,
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
      console.error('Erro ao criar fatura:', error.response?.data || error);
      setAlert({ severity: 'error', message: 'Falha ao cadastrar fatura. Tente novamente.' });
    }
  };

  const excluirFatura = async () => {
    if (faturaToDelete === null) {
      setAlert({ severity: 'error', message: 'Nenhuma fatura selecionada para exclusão!' });
      return;
    }

    try {
      setLoading(true);
      const fatura = faturas.find((f) => f.id === faturaToDelete);
      if (!fatura) {
        throw new Error(`Fatura com ID ${faturaToDelete} não encontrada`);
      }

      await deleteSale(fatura.id);

      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (lojaLocation) {
        for (const produtoFatura of fatura.produtos) {
          const produtoLocation = productLocations.find(
            (loc) =>
              loc.id_produto === produtoFatura.produto.id && loc.id_localizacao === lojaLocation.id,
          );

          if (produtoLocation && produtoLocation.id_produto) {
            const newQuantity = (produtoLocation.quantidadeProduto ?? 0) + produtoFatura.quantidade;
            const updatedLocation: ProdutoLocalizacao = {
              ...produtoLocation,
              quantidadeProduto: newQuantity,
              id_produto: produtoLocation.id_produto,
            };
            await updateProductLocation(produtoLocation.id ?? '', updatedLocation);

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

            const existingStock = await getStockByProduct(produtoFatura.produto.id!);
            if (existingStock) {
              const updatedStockData = {
                id_produto: produtoFatura.produto.id,
                quantidadeAtual: estoqueGeral,
                lote: existingStock.lote,
                dataValidadeLote: existingStock.dataValidadeLote,
              };
              await updateStock(existingStock.id!, updatedStockData);
            }

            const produto = produtos.find((p) => p.id === produtoFatura.produto.id);
            if (produto) {
              const updatedProduto: Produto = {
                ...produto,
                quantidadePorUnidade: estoqueGeral,
              };
              await updateProduct(produto.id!, updatedProduto);
            }
          }
        }
      }

      setFaturas((prev) => prev.filter((f) => f.id !== faturaToDelete));
      setAlert({ severity: 'success', message: 'Fatura excluída com sucesso!' });

      const totalPages = Math.ceil((faturas.length - 1) / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir fatura!' });
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

    const errors = validateCaixaForm(caixaState, funcionarios, caixas, funcionariosCaixa);
    dispatchCaixa({ type: 'SET_ERRORS', errors });
    if (Object.keys(errors).length > 0) return;

    try {
      const newFuncionarioCaixa: FuncionarioCaixa = {
        id_caixa: caixaState.caixaId,
        id_funcionario: loggedInFuncionarioId,
        estadoCaixa: true,
        quantidadaFaturada: 0,
        horarioAbertura: new Date(),
        horarioFechamento: null,
      };

      const createdCaixa = await createEmployeeCashRegister(newFuncionarioCaixa);
      console.log('Novo Caixa Criado:', JSON.stringify(createdCaixa, null, 2));
      setFuncionariosCaixa((prev) => [...prev, createdCaixa]);
      setAlert({ severity: 'success', message: 'Caixa aberto com sucesso!' });
      handleCloseCaixaModal();
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      setAlert({ severity: 'error', message: 'Falha ao abrir o caixa. Tente novamente.' });
    }
  };

  const handleFecharCaixa = async (caixaId: string) => {
    try {
      const caixaAtual = funcionariosCaixa.find((c) => c.id === caixaId);
      if (!caixaAtual) {
        setAlert({ severity: 'error', message: 'Caixa não encontrado.' });
        return;
      }

      if (!caixaAtual.horarioAbertura) {
        setAlert({ severity: 'error', message: 'Erro: Horário de abertura não definido.' });
        return;
      }

      const faturasDoCaixa = faturas.filter((f) => {
        const dataFatura = new Date(f.data);
        const abertura = caixaAtual.horarioAbertura;
        const fechamento = caixaAtual.horarioFechamento
          ? new Date(caixaAtual.horarioFechamento)
          : new Date();
        return (
          f.funcionariosCaixa?.id === caixaId &&
          dataFatura >= abertura &&
          (!caixaAtual.horarioFechamento || dataFatura <= fechamento)
        );
      });

      const totalFaturado = faturasDoCaixa.reduce(
        (acc, fatura) => acc + calcularTotalFatura(fatura),
        0,
      );

      const updatedCaixa: FuncionarioCaixa = {
        ...caixaAtual,
        estadoCaixa: false,
        quantidadaFaturada: totalFaturado,
        horarioFechamento: new Date(),
        caixas: caixaAtual.caixas,
      };

      const response = await updateEmployeeCashRegister(caixaId, updatedCaixa);
      setFuncionariosCaixa((prev) =>
        prev.map((c) => (c.id === caixaId ? { ...response, caixas: c.caixas } : c))
      );
      setAlert({ severity: 'success', message: 'Caixa fechado com sucesso!' });
      handleCloseCaixaListModal();
    } catch (error) {
      console.error('Erro ao fechar o caixa:', error);
      setAlert({ severity: 'error', message: 'Falha ao fechar o caixa. Tente novamente.' });
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
                    typeof option === 'string' ? option : option.nomeCliente ?? ''
                  }
                  onChange={handleClientSelect}
                  value={
                    clientes.find((c) => c.nomeCliente === faturaState.cliente) ||
                    (faturaState.cliente ? { nomeCliente: faturaState.cliente } : null)
                  }
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      label="Selecione ou Digite Cliente"
                      error={Boolean(faturaState.errors.cliente)}
                      helperText={faturaState.errors.cliente}
                      sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                      onChange={(e) =>
                        dispatchFatura({
                          type: 'UPDATE_FIELD',
                          field: 'cliente',
                          value: e.target.value,
                        })
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="nif"
                  label="NIF/BI"
                  value={faturaState.nif}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
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
                            {p.nomeProduto} - {p.precoVenda}kzs (Estoque: {quantidade})
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
                  <IconButton color="error" onClick={() => removerProdutoInput(index)}>
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
                Total a Pagar: {calcularTotal(faturaState.produtosSelecionados, produtos)} Kz
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddFaturaSubmit}
                sx={{ borderRadius: 1, px: 4 }}
              >
                Finalizar Venda
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
              disabled={!loggedInFuncionarioId}
            >
              Abrir Caixa
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
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.caixas?.nomeCaixa || 'N/A'}</TableCell>
                    <TableCell>{item.Funcionarios?.nomeFuncionario || 'N/A'}</TableCell>
                    <TableCell>{item.estadoCaixa ? 'Aberto' : 'Fechado'}</TableCell>
                    <TableCell>{item.quantidadaFaturada} kz</TableCell>
                    <TableCell>
                      {item.estadoCaixa && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleFecharCaixa(item.id!)}
                          size="small"
                        >
                          Fechar
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
            <Button variant="contained" color="error" onClick={excluirFatura} disabled={loading}>
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
                  paginatedFaturas.map((item) => {
                    console.log('Fatura:', item.id, 'Cliente:', item.cliente, 'FuncionariosCaixa:', item.funcionariosCaixa);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.cliente}</TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('pt-BR').format(new Date(item.data))}
                        </TableCell>
                        <TableCell>{calcularTotalFatura(item)}kzs</TableCell>
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
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhuma fatura encontrada.
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
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </CardContent>
      </Card>
    </>
  );
};

export default Faturacao;