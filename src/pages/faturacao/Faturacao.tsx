import React, { useState, useEffect } from 'react';
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
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from '../../types/models';
import {
  getEmployeeCashRegisters,
  createEmployeeCashRegister,
  updateEmployeeCashRegister,
  getEmployees,
  getCashRegisters,
  createSale,
  getSales,
  getProductLocations,
  updateProductLocation,
  getLocations,
} from '../../api/methods';

interface VendaCreateInput {
  id_cliente: string;
  dataEmissao: string;
  dataValidade: string;
  id_funcionarioCaixa: string;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  valorTotal: number;
  vendasProdutos: { id_produto: string; quantidadeVendida: number }[];
}

interface Produto {
  id: number;
  name: string;
  shelf: string;
  prico: number;
  validade: string;
  quantidade: number;
}

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
  // Estados principais
  const [openFaturaModal, setOpenFaturaModal] = useState(false);
  const [openCaixaModal, setOpenCaixaModal] = useState(false);
  const [openCaixaListModal, setOpenCaixaListModal] = useState(false);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [lojaProdutos, setLojaProdutos] = useState<Produto[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);

  // Formulário de Fatura
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

  // Formulário de Caixa
  const [caixaForm, setCaixaForm] = useState({
    funcionarioId: '',
    caixaId: '',
  });
  const [caixaErrors, setCaixaErrors] = useState<{ [key: string]: string }>({});

  // Dados carregados
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioCaixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');

  // Funções de inicialização
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
          productLocationsData,
        ] = await Promise.all([
          getSales(),
          getEmployeeCashRegisters(),
          getEmployees(),
          getCashRegisters(),
          getLocations(),
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
            venda.vendasProdutos?.map((vp) => ({
              produto: {
                id: Number(vp.produtos?.id),
                name: vp.produtos?.nomeProduto || '',
                shelf: '',
                prico: vp.produtos?.precoVenda || 0,
                validade: '',
                quantidade: vp.produtos?.quantidadeEstoque || 0,
              },
              quantidade: vp.quantidadeVendida,
            })) || [],
          funcionariosCaixa: venda.funcionariosCaixa,
        }));

        const lojaLocation = locationsData.find((loc) =>
          loc.nomeLocalizacao.toLowerCase().includes('loja'),
        );
        const lojaProdutosData = lojaLocation
          ? productLocationsData
              .filter((loc) => loc.id_localizacao === lojaLocation.id)
              .map((loc) => ({
                id: Number(loc.id_produto),
                name: loc.produtos?.nomeProduto || 'Desconhecido',
                shelf: loc.id_prateleira || '',
                prico: loc.produtos?.precoVenda || 0,
                validade: '',
                quantidade: loc.quantidadeProduto || 0,
              }))
          : [];

        setFaturas(mappedFaturas);
        setFuncionariosCaixa(funcionariosCaixaData);
        setFuncionarios(funcionariosData);
        setCaixas(caixasData);
        setLocations(locationsData);
        setLojaProdutos(lojaProdutosData);
        setProductLocations(productLocationsData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    fetchInitialData();
  }, [loggedInFuncionarioId]);

  const fetchProductLocations = async () => {
    try {
      const data = await getProductLocations();
      const cleanedData = data.map((loc) => ({
        ...loc,
        id_produto: loc.id_produto ?? '',
        id_localizacao: loc.id_localizacao ?? '',
        id_seccao: loc.id_seccao ?? '',
        id_prateleira: loc.id_prateleira ?? '',
        id_corredor: loc.id_corredor ?? '',
        quantidadeProduto: loc.quantidadeProduto ?? 0,
        quantidadeMinimaProduto: loc.quantidadeMinimaProduto ?? 0,
      }));
      setProductLocations(cleanedData);

      const lojaLocation = locations.find((loc) =>
        loc.nomeLocalizacao.toLowerCase().includes('loja'),
      );
      const lojaProdutosData = lojaLocation
        ? cleanedData
            .filter((loc) => loc.id_localizacao === lojaLocation.id)
            .map((loc) => ({
              id: Number(loc.id_produto),
              name: loc.produtos?.nomeProduto || 'Desconhecido',
              shelf: loc.id_prateleira || '',
              prico: loc.produtos?.precoVenda || 0,
              validade: '',
              quantidade: loc.quantidadeProduto || 0,
            }))
        : [];
      setLojaProdutos(lojaProdutosData);
    } catch (error) {
      console.error('Erro ao buscar localizações de produtos:', error);
    }
  };

  // Funções de manipulação de formulário de fatura
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

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFaturaForm((prev) => ({ ...prev, [name]: value }));
    setFaturaErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFaturaForm((prev) => ({ ...prev, [name]: value }));
    setFaturaErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    const updatedProdutos = [...faturaForm.produtosSelecionados];
    updatedProdutos[index] = { ...updatedProdutos[index], [field]: value };
    setFaturaForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));

    if (field === 'quantidade') {
      const produto = lojaProdutos.find((p) => p.id.toString() === updatedProdutos[index].id);
      const quantidade = Number(value);
      if (produto && quantidade > produto.quantidade) {
        setFaturaErrors((prev) => ({
          ...prev,
          [`produto_${index}`]: `Quantidade indisponível. Estoque na loja: ${produto.quantidade}`,
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
      const produto = lojaProdutos.find((p) => p.id.toString() === curr.id);
      return acc + (produto ? produto.prico * curr.quantidade : 0);
    }, 0);
  };

  const validateFaturaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!faturaForm.cliente.trim()) newErrors.cliente = 'Nome do cliente é obrigatório';
    if (!faturaForm.data.trim()) newErrors.data = 'Data é obrigatória';
    if (faturaForm.produtosSelecionados.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    if (!faturaForm.funcionariosCaixaId) newErrors.funcionariosCaixaId = 'Selecione um caixa';
    faturaForm.produtosSelecionados.forEach((p, index) => {
      if (!p.id) {
        newErrors[`produto_${index}`] = 'Selecione um produto';
      } else {
        const produto = lojaProdutos.find((prod) => prod.id.toString() === p.id);
        if (produto && p.quantidade > produto.quantidade) {
          newErrors[`produto_${index}`] =
            `Quantidade indisponível. Estoque na loja: ${produto.quantidade}`;
        }
      }
    });
    setFaturaErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddFaturaSubmit = async () => {
    if (!validateFaturaForm()) return;

    try {
      const vendaData: VendaCreateInput = {
        id_cliente: faturaForm.cliente,
        dataEmissao: new Date(faturaForm.data).toISOString(),
        dataValidade: new Date(
          new Date(faturaForm.data).setDate(new Date(faturaForm.data).getDate() + 30),
        ).toISOString(),
        id_funcionarioCaixa: faturaForm.funcionariosCaixaId,
        numeroDocumento: `FAT-${Date.now()}`,
        tipoDocumento: TipoDocumento.FATURA,
        valorTotal: calcularTotal(),
        vendasProdutos: faturaForm.produtosSelecionados.map((p) => ({
          id_produto: p.id,
          quantidadeVendida: p.quantidade,
        })),
      };

      const createdVenda = await createSale(vendaData as Venda);

      // Atualizar a localização "Loja" no backend
      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (lojaLocation) {
        for (const produtoSelecionado of faturaForm.produtosSelecionados) {
          const produtoLocation = productLocations.find(
            (loc) =>
              loc.id_produto === produtoSelecionado.id && loc.id_localizacao === lojaLocation.id,
          );
          if (produtoLocation) {
            const newQuantity =
              (produtoLocation.quantidadeProduto ?? 0) - produtoSelecionado.quantidade;
            if (newQuantity >= 0) {
              const updatedLocation: ProdutoLocalizacao = {
                ...produtoLocation,
                quantidadeProduto: newQuantity,
              };
              await updateProductLocation(produtoLocation.id ?? '', updatedLocation);
            } else {
              throw new Error(
                `Quantidade insuficiente na loja para o produto ${produtoSelecionado.id}`,
              );
            }
          }
        }
      }

      const newFatura: Fatura = {
        id: createdVenda.id ? Number(createdVenda.id) : faturas.length + 1,
        cliente: faturaForm.cliente,
        nif: faturaForm.nif,
        telefone: faturaForm.telefone,
        localizacao: faturaForm.localizacao,
        email: faturaForm.email,
        data: createdVenda.dataEmissao.split('T')[0],
        status: faturaForm.status,
        produtos: faturaForm.produtosSelecionados.map((p) => ({
          produto: lojaProdutos.find((prod) => prod.id.toString() === p.id)!,
          quantidade: p.quantidade,
        })),
        funcionariosCaixa: funcionariosCaixa.find(
          (fc) => fc.id === createdVenda.id_funcionarioCaixa,
        ),
      };

      setFaturas((prev) => [...prev, newFatura]);
      setLojaProdutos((prev) =>
        prev
          .map((produto) => {
            const produtoSelecionado = faturaForm.produtosSelecionados.find(
              (p) => p.id === produto.id.toString(),
            );
            if (produtoSelecionado) {
              return { ...produto, quantidade: produto.quantidade - produtoSelecionado.quantidade };
            }
            return produto;
          })
          .filter((p) => p.quantidade > 0),
      );
      handleCloseFaturaModal();
      await fetchProductLocations(); // Atualizar as localizações após a venda
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
          id: p.produto.id.toString(),
          quantidade: p.quantidade,
        })),
        funcionariosCaixaId: fatura.funcionariosCaixa?.id || '',
      });
      setOpenFaturaModal(true);
    }
  };

  // Funções de manipulação de caixa
  const handleOpenCaixaModal = () => setOpenCaixaModal(true);
  const handleCloseCaixaModal = () => {
    setOpenCaixaModal(false);
    resetCaixaForm();
  };

  const handleOpenCaixaListModal = () => setOpenCaixaListModal(true);
  const handleCloseCaixaListModal = () => setOpenCaixaListModal(false);

  const resetCaixaForm = () => {
    setCaixaForm({ funcionarioId: loggedInFuncionarioId, caixaId: '' });
    setCaixaErrors({});
  };

  const handleCaixaSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCaixaForm((prev) => ({ ...prev, [name]: value }));
    setCaixaErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateCaixaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!caixaForm.funcionarioId) newErrors.funcionarioId = 'Funcionário é obrigatório';
    if (!caixaForm.caixaId) newErrors.caixaId = 'Selecione um caixa';
    setCaixaErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddCaixaSubmit = async () => {
    if (!validateCaixaForm()) return;

    try {
      const newFuncionarioCaixa: FuncionarioCaixa = {
        id_funcionario: caixaForm.funcionarioId,
        id_caixa: caixaForm.caixaId,
        estadoCaixa: true,
        quantidadaFaturada: 0,
        horarioAbertura: new Date().toISOString(),
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
      if (caixaAtual) {
        const totalFaturado = faturas
          .filter((fatura) => fatura.funcionariosCaixa?.id === caixaId)
          .reduce((acc, fatura) => acc + calcularTotalFatura(fatura), 0);

        const updatedCaixa: FuncionarioCaixa = {
          ...caixaAtual,
          estadoCaixa: false,
          quantidadaFaturada: totalFaturado,
          horarioFechamento: new Date().toISOString(),
        };

        const response = await updateEmployeeCashRegister(caixaId, updatedCaixa);
        setFuncionariosCaixa((prev) => prev.map((c) => (c.id === caixaId ? response : c)));
        handleCloseCaixaListModal();
      }
    } catch (error) {
      console.error('Erro ao fechar o caixa:', error);
      alert('Falha ao fechar o caixa. Tente novamente.');
    }
  };

  const calcularTotalFatura = (fatura: Fatura) => {
    return fatura.produtos.reduce((acc, curr) => acc + curr.produto.prico * curr.quantidade, 0);
  };

  // Renderização
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
                      {lojaProdutos.map((p) => (
                        <MenuItem key={p.id} value={p.id.toString()}>
                          {p.name} - {p.prico}kzs (Estoque: {p.quantidade})
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
                        <div key={idx}>{`${p.produto.name} - ${p.quantidade}x`}</div>
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
