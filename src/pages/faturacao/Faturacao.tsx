import React, { useState, useEffect, ChangeEvent } from 'react';
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
} from '../../types/models';
import {
  getEmployeeCashRegisters,
  createEmployeeCashRegister,
  updateEmployeeCashRegister,
  getEmployees,
  getCashRegisters,
  createSale,
  getSales,
  getProducts,
  getProductLocations,
  updateProductLocation,
  getLocations,
  updateProduct,
} from '../../api/methods';

interface Fatura {
  id: number;
  cliente: string;
  nif: string;
  telefone: string;
  localizacao: string;
  email: string;
  data: string;
  status: string;
  produtos: { produto: Produto; quantidade: number }[];
  funcionariosCaixa?: FuncionarioCaixa;
}

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90vw', sm: '80vw', md: 900 },
  maxWidth: '100%',
  height: { xs: '90vh', sm: '80vh', md: 700 },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: { xs: 2, sm: 3, md: 4 },
  overflowY: 'auto' as const,
  borderRadius: 2,
};

const Faturacao: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openFaturaModal, setOpenFaturaModal] = useState(false);
  const [openCaixaModal, setOpenCaixaModal] = useState(false);
  const [openCaixaListModal, setOpenCaixaListModal] = useState(false);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);

  const [faturaForm, setFaturaForm] = useState({
    cliente: '',
    nif: '',
    telefone: '',
    localizacao: '',
    email: '',
    data: '',
    status: 'Pendente',
    produtosSelecionados: [] as { id: string; quantidade: number }[],
    funcionariosCaixaId: '',
  });
  const [faturaErrors, setFaturaErrors] = useState<{ [key: string]: string }>({});

  const [caixaForm, setCaixaForm] = useState({
    funcionarioId: '',
    caixaId: '',
  });
  const [caixaErrors, setCaixaErrors] = useState<{ [key: string]: string }>({});

  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioCaixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');

  useEffect(() => {
    const id = localStorage.getItem('loggedInFuncionarioId') || '';
    setLoggedInFuncionarioId(id);
    setCaixaForm((prev) => ({ ...prev, funcionarioId: id }));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          salesData,
          funcionariosCaixaData,
          funcionariosData,
          caixasData,
          locationsData,
          productsData,
          productLocationsData,
        ] = await Promise.all([
          getSales(),
          getEmployeeCashRegisters(),
          getEmployees(),
          getCashRegisters(),
          getLocations(),
          getProducts(),
          getProductLocations(),
        ]);

        const mappedFaturas = salesData.map((venda: Venda, index: number) => ({
          id: index + 1,
          cliente: venda.clientes?.nomeCliente || venda.id_cliente,
          nif: '',
          telefone: '',
          localizacao: '',
          email: '',
          data: venda.dataEmissao.split('T')[0],
          status: 'Pendente',
          produtos:
            venda.vendasProdutos?.map((vp) => {
              const produto = productsData.find((p) => p.id === vp.id_produto);
              return {
                produto: {
                  id: vp.id_produto,
                  id_categoriaProduto: produto?.id_categoriaProduto || '',
                  referenciaProduto: produto?.referenciaProduto || '',
                  nomeProduto: produto?.nomeProduto || '',
                  custoAquisicao: produto?.custoAquisicao || '0',
                  precoVenda: produto?.precoVenda || 0,
                  quantidadeEstoque: produto?.quantidadeEstoque || 0,
                  unidadeMedida: produto?.unidadeMedida || '',
                  unidadeConteudo: produto?.unidadeConteudo || '',
                  codigoBarras: produto?.codigoBarras || '',
                },
                quantidade: vp.quantidadeVendida,
              };
            }) || [],
          funcionariosCaixa: venda.funcionariosCaixa,
        }));

        setFaturas(mappedFaturas);
        setFuncionariosCaixa(funcionariosCaixaData);
        setFuncionarios(funcionariosData);
        setCaixas(caixasData);
        setLocations(locationsData);
        setProdutos(productsData);
        setProductLocations(productLocationsData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    fetchInitialData();
  }, [loggedInFuncionarioId]);

  const fetchProductsAndLocations = async () => {
    try {
      const [productsData, productLocationsData] = await Promise.all([
        getProducts(),
        getProductLocations(),
      ]);
      setProdutos(productsData);
      setProductLocations(productLocationsData);
    } catch (error) {
      console.error('Erro ao buscar produtos e localizações:', error);
    }
  };

  const handleOpenFaturaModal = () => setOpenFaturaModal(true);
  const handleCloseFaturaModal = () => {
    setOpenFaturaModal(false);
    resetFaturaForm();
  };

  const resetFaturaForm = () => {
    setFaturaForm({
      cliente: '',
      nif: '',
      telefone: '',
      localizacao: '',
      email: '',
      data: '',
      status: 'Pendente',
      produtosSelecionados: [],
      funcionariosCaixaId: '',
    });
    setFaturaErrors({});
  };

  const handleTextFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFaturaForm((prev) => ({ ...prev, [name]: value }));
    setFaturaErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target as { name?: string; value: string };
    setFaturaForm((prev) => ({ ...prev, [name!]: value }));
    setFaturaErrors((prev) => ({ ...prev, [name!]: '' }));
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    const updatedProdutos = [...faturaForm.produtosSelecionados];
    updatedProdutos[index] = { ...updatedProdutos[index], [field]: value };
    setFaturaForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));

    if (field === 'quantidade') {
      const produto = produtos.find((p) => p.id === updatedProdutos[index].id);
      const quantidade = Number(value);
      if (produto && quantidade > produto.quantidadeEstoque) {
        setFaturaErrors((prev) => ({
          ...prev,
          [`produto_${index}`]: `Quantidade indisponível. Estoque total: ${produto.quantidadeEstoque}`,
        }));
      } else {
        setFaturaErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`produto_${index}`];
          return newErrors;
        });
      }
    }
  };

  const adicionarNovoProdutoInput = () => {
    setFaturaForm((prev) => ({
      ...prev,
      produtosSelecionados: [...prev.produtosSelecionados, { id: '', quantidade: 1 }],
    }));
  };

  const removerProdutoInput = (index: number) => {
    const updatedProdutos = faturaForm.produtosSelecionados.filter((_, i) => i !== index);
    setFaturaForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));
    setFaturaErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`produto_${index}`];
      return newErrors;
    });
  };

  const calcularTotal = () => {
    return faturaForm.produtosSelecionados.reduce((acc, curr) => {
      const produto = produtos.find((p) => p.id === curr.id);
      return acc + (produto ? produto.precoVenda * curr.quantidade : 0);
    }, 0);
  };

  const validateFaturaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!faturaForm.cliente.trim()) newErrors.cliente = 'Nome do cliente é obrigatório';
    if (!faturaForm.data.trim()) newErrors.data = 'Data é obrigatória';
    if (faturaForm.produtosSelecionados.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    if (!faturaForm.funcionariosCaixaId) {
      newErrors.funcionariosCaixaId = 'Selecione um caixa';
    } else if (
      !funcionariosCaixa.some((fc) => fc.id === faturaForm.funcionariosCaixaId && fc.estadoCaixa)
    ) {
      newErrors.funcionariosCaixaId = 'Nenhum caixa aberto disponível';
    }
    faturaForm.produtosSelecionados.forEach((p, index) => {
      if (!p.id) {
        newErrors[`produto_${index}`] = 'Selecione um produto';
      } else {
        const produto = produtos.find((prod) => prod.id === p.id);
        if (produto && p.quantidade > produto.quantidadeEstoque) {
          newErrors[`produto_${index}`] =
            `Quantidade indisponível. Estoque total: ${produto.quantidadeEstoque}`;
        }
      }
    });
    setFaturaErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddFaturaSubmit = async () => {
    if (!validateFaturaForm()) return;

    try {
      const dadosWrapper: DadosWrapper = {
        Dados: {
          dadosVenda: {
            dataEmissao: new Date(faturaForm.data),
            dataValidade: new Date(
              new Date(faturaForm.data).setDate(new Date(faturaForm.data).getDate() + 30),
            ),
            id_funcionarioCaixa: faturaForm.funcionariosCaixaId,
            numeroDocumento: `FAT-${Date.now()}`,
            tipoDocumento: TipoDocumento.FATURA,
            valorTotal: calcularTotal(),
            vendasProdutos: faturaForm.produtosSelecionados.map((p) => ({
              id_produto: p.id,
              quantidade: p.quantidade,
            })),
          },
          cliente: [
            {
              nomeCliente: faturaForm.cliente,
              numeroContribuinte: faturaForm.nif || '',
              telefoneCliente: faturaForm.telefone || '',
              moradaCliente: faturaForm.localizacao || '',
              emailCliente: faturaForm.email || '',
            },
          ],
        },
      };

      const createdVenda = await createSale(dadosWrapper);

      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (lojaLocation) {
        for (const produtoSelecionado of faturaForm.produtosSelecionados) {
          const produtoLocation = productLocations.find(
            (loc) =>
              loc.id_produto === produtoSelecionado.id && loc.id_localizacao === lojaLocation.id,
          );
          if (produtoLocation && produtoLocation.id_produto) {
            // Verifica se existe e tem id_produto
            const newQuantity =
              (produtoLocation.quantidadeProduto ?? 0) - produtoSelecionado.quantidade;
            if (newQuantity >= 0) {
              const updatedLocation: ProdutoLocalizacao = {
                ...produtoLocation,
                quantidadeProduto: newQuantity,
                id_produto: produtoLocation.id_produto, // Garante que id_produto seja incluído
              };
              console.log('Atualizando localização do produto:', updatedLocation); // Para depuração
              await updateProductLocation(produtoLocation.id ?? '', updatedLocation);
            } else {
              throw new Error(
                `Quantidade insuficiente na loja para o produto ${produtoSelecionado.id}`,
              );
            }
          } else {
            console.warn(
              `Localização do produto ${produtoSelecionado.id} não encontrada ou sem id_produto`,
            );
          }
        }
      }

      for (const produtoSelecionado of faturaForm.produtosSelecionados) {
        const produto = produtos.find((p) => p.id === produtoSelecionado.id);
        if (produto) {
          const newStock = produto.quantidadeEstoque - produtoSelecionado.quantidade;
          if (newStock >= 0) {
            const updatedProduto: Produto = {
              ...produto,
              quantidadeEstoque: newStock,
            };
            await updateProduct(produto.id!, updatedProduto);
          } else {
            throw new Error(
              `Quantidade insuficiente no estoque total para o produto ${produtoSelecionado.id}`,
            );
          }
        }
      }

      const novosProdutosFatura = faturaForm.produtosSelecionados.map((p) => {
        const produto = produtos.find((prod) => prod.id === p.id);
        return {
          produto: {
            id: produto!.id!,
            id_categoriaProduto: produto!.id_categoriaProduto,
            referenciaProduto: produto!.referenciaProduto,
            nomeProduto: produto!.nomeProduto,
            custoAquisicao: produto!.custoAquisicao,
            precoVenda: produto!.precoVenda,
            quantidadeEstoque: produto!.quantidadeEstoque - p.quantidade,
            unidadeMedida: produto!.unidadeMedida,
            unidadeConteudo: produto!.unidadeConteudo,
            codigoBarras: produto!.codigoBarras,
          },
          quantidade: p.quantidade,
        };
      });

      const newFatura: Fatura = {
        id: createdVenda.id ? Number(createdVenda.id) : faturas.length + 1,
        cliente: faturaForm.cliente,
        nif: faturaForm.nif,
        telefone: faturaForm.telefone,
        localizacao: faturaForm.localizacao,
        email: faturaForm.email,
        data: createdVenda.dataEmissao.split('T')[0],
        status: faturaForm.status,
        produtos: novosProdutosFatura,
        funcionariosCaixa: funcionariosCaixa.find(
          (fc) => fc.id === createdVenda.id_funcionarioCaixa,
        ),
      };

      setFaturas((prev) => [...prev, newFatura]);
      setProdutos((prev) =>
        prev.map((produto) => {
          const produtoSelecionado = faturaForm.produtosSelecionados.find(
            (p) => p.id === produto.id,
          );
          if (produtoSelecionado) {
            return {
              ...produto,
              quantidadeEstoque: produto.quantidadeEstoque - produtoSelecionado.quantidade,
            };
          }
          return produto;
        }),
      );
      handleCloseFaturaModal();
      await fetchProductsAndLocations();
    } catch (error) {
      console.error('Erro ao criar fatura:', error);
      alert('Falha ao cadastrar fatura. Verifique sua conexão ou tente novamente.');
    }
  };

  const excluirFatura = (faturaId: number) => {
    setFaturas((prev) => prev.filter((f) => f.id !== faturaId));
  };

  const editarFatura = (faturaId: number) => {
    const fatura = faturas.find((f) => f.id === faturaId);
    if (fatura) {
      setFaturaForm({
        cliente: fatura.cliente,
        nif: fatura.nif,
        telefone: fatura.telefone,
        localizacao: fatura.localizacao,
        email: fatura.email,
        data: fatura.data,
        status: fatura.status,
        produtosSelecionados: fatura.produtos.map((p) => ({
          id: p.produto.id!,
          quantidade: p.quantidade,
        })),
        funcionariosCaixaId: fatura.funcionariosCaixa?.id || '',
      });
      setOpenFaturaModal(true);
    }
  };

  const handleOpenCaixaModal = () => setOpenCaixaModal(true);
  const handleCloseCaixaModal = () => {
    setOpenCaixaModal(false);
  };

  const handleOpenCaixaListModal = () => setOpenCaixaListModal(true);
  const handleCloseCaixaListModal = () => setOpenCaixaListModal(false);

  const handleCaixaSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target as { name?: string; value: string };
    setCaixaForm((prev) => ({ ...prev, [name!]: value }));
    setCaixaErrors((prev) => ({ ...prev, [name!]: '' }));
  };

  const validateCaixaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!caixaForm.funcionarioId) {
      newErrors.funcionarioId = 'Funcionário é obrigatório';
    } else if (!funcionarios.some((f) => f.id === caixaForm.funcionarioId)) {
      newErrors.funcionarioId = 'Funcionário não encontrado';
    }
    if (!caixaForm.caixaId) {
      newErrors.caixaId = 'Selecione um caixa';
    } else if (!caixas.some((c) => c.id === caixaForm.caixaId)) {
      newErrors.caixaId = 'Caixa não encontrado';
    }
    if (
      funcionariosCaixa.some(
        (fc) => fc.id_funcionario === caixaForm.funcionarioId && fc.estadoCaixa,
      )
    ) {
      newErrors.funcionarioId = 'Este funcionário já tem um caixa aberto';
    }
    setCaixaErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddCaixaSubmit = async () => {
    if (!validateCaixaForm()) return;

    try {
      const newFuncionarioCaixa: FuncionarioCaixa = {
        id_caixa: caixaForm.caixaId,
        id_funcionario: caixaForm.funcionarioId,
        estadoCaixa: true,
        quantidadaFaturada: 0,
        horarioAbertura: new Date(),
        horarioFechamento: null,
      };

      const createdCaixa = await createEmployeeCashRegister(newFuncionarioCaixa);
      setFuncionariosCaixa((prev) => [...prev, createdCaixa]);
      handleCloseCaixaModal();
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      alert('Falha ao abrir o caixa. Tente novamente.');
    }
  };

  const handleFecharCaixa = async (caixaId: string) => {
    try {
      const caixaAtual = funcionariosCaixa.find((c) => c.id === caixaId);
      if (!caixaAtual) throw new Error('Caixa não encontrado');

      const faturasDoCaixa = faturas.filter((f) => {
        return (
          f.funcionariosCaixa?.id === caixaId &&
          new Date(f.data) >= new Date(caixaAtual.horarioAbertura!) &&
          (!caixaAtual.horarioFechamento || new Date(f.data) <= new Date())
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
      };

      const response = await updateEmployeeCashRegister(caixaId, updatedCaixa);
      setFuncionariosCaixa((prev) => prev.map((c) => (c.id === caixaId ? response : c)));
      handleCloseCaixaListModal();
    } catch (error) {
      console.error('Erro ao fechar o caixa:', error);
      alert('Falha ao fechar o caixa. Tente novamente.');
    }
  };

  const calcularTotalFatura = (fatura: Fatura) => {
    return fatura.produtos.reduce(
      (acc, curr) => acc + curr.produto.precoVenda * curr.quantidade,
      0,
    );
  };

  return (
    <>
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
                onClick={handleOpenFaturaModal}
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

      {/* Modal de Nova Venda */}
      <Modal open={openFaturaModal} onClose={handleCloseFaturaModal}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" fontSize={{ xs: 18, sm: 24 }}>
              Nova Venda (Loja)
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCloseFaturaModal} size="small">
              Fechar
            </Button>
          </Stack>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="cliente"
                  label="Nome do Cliente"
                  value={faturaForm.cliente}
                  onChange={handleTextFieldChange}
                  error={Boolean(faturaErrors.cliente)}
                  helperText={faturaErrors.cliente}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="nif"
                  label="NIF/BI"
                  value={faturaForm.nif}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="telefone"
                  label="Telefone"
                  type="tel"
                  value={faturaForm.telefone}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="localizacao"
                  label="Localização"
                  value={faturaForm.localizacao}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="email"
                  label="Email"
                  type="email"
                  value={faturaForm.email}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="data"
                  type="date"
                  label="Data"
                  value={faturaForm.data}
                  onChange={handleTextFieldChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(faturaErrors.data)}
                  helperText={faturaErrors.data}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="status"
                  label="Status"
                  value={faturaForm.status}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  fullWidth
                  variant="filled"
                  error={Boolean(faturaErrors.funcionariosCaixaId)}
                >
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="funcionariosCaixaId"
                    value={faturaForm.funcionariosCaixaId}
                    onChange={handleSelectChange}
                  >
                    {funcionariosCaixa
                      .filter((fc) => fc.estadoCaixa)
                      .map((fc) => (
                        <MenuItem key={fc.id} value={fc.id}>
                          {fc.caixas?.nomeCaixa} - {fc.funcionarios?.nomeFuncionario || 'N/A'}
                        </MenuItem>
                      ))}
                  </Select>
                  {faturaErrors.funcionariosCaixaId && (
                    <FormHelperText>{faturaErrors.funcionariosCaixaId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  label="Total a Pagar"
                  value={`${calcularTotal()}kz`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            {faturaForm.produtosSelecionados.map((produto, index) => (
              <Grid container spacing={1} key={index} alignItems="center">
                <Grid item xs={12} sm={6} md={5}>
                  <FormControl
                    fullWidth
                    variant="filled"
                    error={Boolean(faturaErrors[`produto_${index}`])}
                  >
                    <InputLabel>Produto</InputLabel>
                    <Select
                      value={produto.id}
                      onChange={(e) => handleProdutoChange(index, 'id', e.target.value)}
                    >
                      {produtos.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.nomeProduto} - {p.precoVenda}kzs (Estoque: {p.quantidadeEstoque})
                        </MenuItem>
                      ))}
                    </Select>
                    {faturaErrors[`produto_${index}`] && (
                      <FormHelperText>{faturaErrors[`produto_${index}`]}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={8} sm={4} md={5}>
                  <TextField
                    fullWidth
                    variant="filled"
                    type="number"
                    label="Quantidade"
                    value={produto.quantidade}
                    onChange={(e) =>
                      handleProdutoChange(index, 'quantidade', parseInt(e.target.value) || 1)
                    }
                    inputProps={{ min: 1 }}
                    error={Boolean(faturaErrors[`produto_${index}`])}
                    helperText={faturaErrors[`produto_${index}`]}
                  />
                </Grid>
                <Grid item xs={4} sm={2} md={2}>
                  <IconButton color="error" onClick={() => removerProdutoInput(index)}>
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            {faturaErrors.produtos && (
              <Typography color="error" variant="body2">
                {faturaErrors.produtos}
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                onClick={adicionarNovoProdutoInput}
                fullWidth
                size="small"
              >
                Adicionar Produto
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddFaturaSubmit}
                fullWidth
                size="small"
              >
                Finalizar Venda
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {/* Modal de Abrir Caixa */}
      <Modal open={openCaixaModal} onClose={handleCloseCaixaModal}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" fontSize={{ xs: 18, sm: 24 }}>
              Abrir Novo Caixa
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCloseCaixaModal} size="small">
              Fechar
            </Button>
          </Stack>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="filled" error={Boolean(caixaErrors.funcionarioId)}>
                  <InputLabel>Funcionário</InputLabel>
                  <Select
                    name="funcionarioId"
                    value={caixaForm.funcionarioId}
                    onChange={handleCaixaSelectChange}
                    disabled={!!loggedInFuncionarioId}
                  >
                    {funcionarios.map((funcionario) => (
                      <MenuItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nomeFuncionario}
                      </MenuItem>
                    ))}
                  </Select>
                  {caixaErrors.funcionarioId && (
                    <FormHelperText>{caixaErrors.funcionarioId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="filled" error={Boolean(caixaErrors.caixaId)}>
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="caixaId"
                    value={caixaForm.caixaId}
                    onChange={handleCaixaSelectChange}
                  >
                    {caixas.map((caixa) => (
                      <MenuItem key={caixa.id} value={caixa.id}>
                        {caixa.nomeCaixa}
                      </MenuItem>
                    ))}
                  </Select>
                  {caixaErrors.caixaId && <FormHelperText>{caixaErrors.caixaId}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
            <Button variant="contained" color="primary" onClick={onAddCaixaSubmit} size="small">
              Abrir Caixa
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Modal de Lista de Caixas */}
      <Modal open={openCaixaListModal} onClose={handleCloseCaixaListModal}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" fontSize={{ xs: 18, sm: 24 }}>
              Caixas Abertos
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleCloseCaixaListModal}
              size="small"
            >
              Fechar
            </Button>
          </Stack>
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
                    <TableCell>{item.funcionarios?.nomeFuncionario || 'N/A'}</TableCell>
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

      {/* Tabela de Faturas */}
      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Produtos</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faturas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(item.data))}
                    </TableCell>
                    <TableCell>{calcularTotalFatura(item)}kzs</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.produtos.map((p, idx) => (
                        <div key={idx}>{`${p.produto.nomeProduto} - ${p.quantidade}x`}</div>
                      ))}
                    </TableCell>
                    <TableCell>{item.funcionariosCaixa?.caixas?.nomeCaixa || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          color="primary"
                          onClick={() => editarFatura(item.id)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => excluirFatura(item.id)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default Faturacao;

function isStoreLocation(id_localizacao: string | undefined, locations: Localizacao[]): boolean {
  if (!id_localizacao) return false;
  return locations.some(
    (loc) => loc.id === id_localizacao && loc.nomeLocalizacao.toLowerCase().includes('loja'),
  );
}
