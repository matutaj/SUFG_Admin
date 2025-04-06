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
import { FuncionarioCaixa, Funcionario, Caixa, Venda, TipoDocumento } from '../../types/models';
import {
  getEmployeeCashRegisters,
  createEmployeeCashRegister,
  updateEmployeeCashRegister,
  getEmployees,
  getCashRegisters,
  createSale,
  getSales,
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
  const [loja, setLoja] = useState<Produto[]>(() => {
    const lojaSalva = localStorage.getItem('loja');
    return lojaSalva ? JSON.parse(lojaSalva) : [];
  });

  const [openFatura, setOpenFatura] = useState(false);
  const [faturas, setFaturas] = useState<Fatura[]>([]);

  const [form, setForm] = useState({
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioCaixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');

  const [openCaixaForm, setOpenCaixaForm] = useState(false);
  const [openCaixaList, setOpenCaixaList] = useState(false);
  const [caixaForm, setCaixaForm] = useState({
    funcionarioId: '',
    caixaId: '',
  });
  const [caixaErrors, setCaixaErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const id = localStorage.getItem('loggedInFuncionarioId') || '';
    if (id) {
      setLoggedInFuncionarioId(id);
      setCaixaForm((prev) => ({ ...prev, funcionarioId: id }));
    } else {
      console.warn('Nenhum funcionário logado encontrado no localStorage.');
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [salesData, funcionariosCaixaData, funcionariosData, caixasData] = await Promise.all([
          getSales(),
          getEmployeeCashRegisters(),
          getEmployees(),
          getCashRegisters(),
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

        setFaturas(mappedFaturas);
        setFuncionariosCaixa(funcionariosCaixaData);
        setFuncionarios(funcionariosData);
        setCaixas(caixasData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    fetchInitialData();
  }, [loggedInFuncionarioId]);

  const handleOpen = () => setOpenFatura(true);
  const handleClose = () => {
    setOpenFatura(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
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
    setErrors({});
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    const updatedProdutos = [...form.produtosSelecionados];
    updatedProdutos[index] = { ...updatedProdutos[index], [field]: value };
    setForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));

    if (field === 'quantidade') {
      const produto = loja.find((p) => p.id.toString() === updatedProdutos[index].id);
      const quantidade = Number(value);
      if (produto && quantidade > produto.quantidade) {
        setErrors((prev) => ({
          ...prev,
          [`produto_${index}`]: `Quantidade indisponível. Estoque: ${produto.quantidade}`,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`produto_${index}`];
          return newErrors;
        });
      }
    }
  };

  const adicionarNovoProdutoInput = () => {
    setForm((prev) => ({
      ...prev,
      produtosSelecionados: [...prev.produtosSelecionados, { id: '', quantidade: 1 }],
    }));
  };

  const removerProdutoInput = (index: number) => {
    const updatedProdutos = form.produtosSelecionados.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`produto_${index}`];
      return newErrors;
    });
  };

  const calcularTotal = () => {
    return form.produtosSelecionados.reduce((acc, curr) => {
      const produto = loja.find((p) => p.id.toString() === curr.id);
      return acc + (produto ? produto.prico * curr.quantidade : 0);
    }, 0);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.cliente.trim()) newErrors.cliente = 'Nome do cliente é obrigatório';
    if (!form.data.trim()) newErrors.data = 'Data é obrigatória';
    if (form.produtosSelecionados.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    if (!form.funcionariosCaixaId) newErrors.funcionariosCaixaId = 'Selecione um caixa';
    form.produtosSelecionados.forEach((p, index) => {
      if (!p.id) {
        newErrors[`produto_${index}`] = 'Selecione um produto';
      } else {
        const produto = loja.find((prod) => prod.id.toString() === p.id);
        if (produto && p.quantidade > produto.quantidade) {
          newErrors[`produto_${index}`] = `Quantidade indisponível. Estoque: ${produto.quantidade}`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddFaturaSubmit = async () => {
    if (!validateForm()) return;

    try {
      const vendaData: VendaCreateInput = {
        id_cliente: form.cliente,
        dataEmissao: new Date(form.data).toISOString(),
        dataValidade: new Date(
          new Date(form.data).setDate(new Date(form.data).getDate() + 30),
        ).toISOString(),
        id_funcionarioCaixa: form.funcionariosCaixaId,
        numeroDocumento: `FAT-${Date.now()}`,
        tipoDocumento: TipoDocumento.FATURA,
        valorTotal: calcularTotal(),
        vendasProdutos: form.produtosSelecionados.map((p) => ({
          id_produto: p.id,
          quantidadeVendida: p.quantidade,
        })),
      };

      const createdVenda = await createSale(vendaData as Venda);

      const newFatura: Fatura = {
        id: createdVenda.id ? Number(createdVenda.id) : faturas.length + 1,
        cliente: form.cliente,
        nif: form.nif,
        telefone: form.telefone,
        localizacao: form.localizacao,
        email: form.email,
        data: createdVenda.dataEmissao.split('T')[0],
        status: form.status,
        produtos:
          createdVenda.vendasProdutos?.map((vp) => ({
            produto: {
              id: Number(vp.produtos?.id),
              name: vp.produtos?.nomeProduto || '',
              shelf: '',
              prico: vp.produtos?.precoVenda || 0,
              validade: '',
              quantidade: vp.produtos?.quantidadeEstoque || 0,
            },
            quantidade: vp.quantidadeVendida,
          })) ||
          form.produtosSelecionados.map((p) => ({
            produto: loja.find((prod) => prod.id.toString() === p.id)!,
            quantidade: p.quantidade,
          })),
        funcionariosCaixa: funcionariosCaixa.find(
          (fc) => fc.id === createdVenda.id_funcionarioCaixa,
        ),
      };

      setFaturas((prev) => [...prev, newFatura]);
      setLoja((prev) =>
        prev
          .map((produto) => {
            const produtoSelecionado = form.produtosSelecionados.find(
              (p) => p.id === produto.id.toString(),
            );
            if (produtoSelecionado) {
              return { ...produto, quantidade: produto.quantidade - produtoSelecionado.quantidade };
            }
            return produto;
          })
          .filter((p) => p.quantidade > 0),
      );
      handleClose();
    } catch (error: unknown) {
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
      setForm({
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
      setOpenFatura(true);
    }
  };

  const handleOpenCaixa = () => setOpenCaixaForm(true);
  const handleCloseCaixaForm = () => {
    setOpenCaixaForm(false);
    setCaixaForm({ funcionarioId: loggedInFuncionarioId, caixaId: '' });
    setCaixaErrors({});
  };

  const handleOpenCaixaList = () => setOpenCaixaList(true);
  const handleCloseCaixaList = () => setOpenCaixaList(false);

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
      handleCloseCaixaForm();
    } catch (error: unknown) {
      console.error('Erro ao abrir caixa:', error);
      alert('Falha ao abrir o caixa. Tente novamente.');
    }
  };

  const handleFecharCaixa = async (caixaId: string) => {
    try {
      const caixaAtual = funcionariosCaixa.find((c) => c.id === caixaId);
      if (caixaAtual) {
        // Calcular o total faturado para este caixa
        const totalFaturado = faturas
          .filter((fatura) => fatura.funcionariosCaixa?.id === caixaId)
          .reduce((acc, fatura) => acc + calcularTotalFatura(fatura), 0);

        const updatedCaixa: FuncionarioCaixa = {
          ...caixaAtual,
          estadoCaixa: false,
          quantidadaFaturada: totalFaturado, // Atualiza com o total faturado
          horarioFechamento: new Date().toISOString(), // Salva a hora atual
        };

        const response = await updateEmployeeCashRegister(caixaId, updatedCaixa);
        setFuncionariosCaixa((prev) => prev.map((c) => (c.id === caixaId ? response : c)));
        handleCloseCaixaList();
      }
    } catch (error) {
      console.error('Erro ao fechar o caixa:', error);
      alert('Falha ao fechar o caixa. Tente novamente.');
    }
  };

  const calcularTotalFatura = (fatura: Fatura) => {
    return fatura.produtos.reduce((acc, curr) => acc + curr.produto.prico * curr.quantidade, 0);
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
              Faturação
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpen}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                size="small"
                fullWidth={true}
              >
                Adicionar Fatura
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCaixa}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
                size="small"
                fullWidth={true}
              >
                Abrir Caixa
              </Button>
              <Button
                variant="contained"
                color="info"
                onClick={handleOpenCaixaList}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
                size="small"
                fullWidth={true}
              >
                Ver Caixas
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openFatura} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" fontSize={{ xs: 18, sm: 24 }}>
              Cadastrar Fatura
            </Typography>
            <Button variant="outlined" color="error" onClick={handleClose} size="small">
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
                  value={form.cliente}
                  onChange={handleTextFieldChange}
                  error={Boolean(errors.cliente)}
                  helperText={errors.cliente}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="nif"
                  label="NIF/BI"
                  value={form.nif}
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
                  value={form.telefone}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="localizacao"
                  label="Localização"
                  value={form.localizacao}
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
                  value={form.email}
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
                  value={form.data}
                  onChange={handleTextFieldChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.data)}
                  helperText={errors.data}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="status"
                  label="Status"
                  value={form.status}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth variant="filled" error={Boolean(errors.funcionariosCaixaId)}>
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="funcionariosCaixaId"
                    value={form.funcionariosCaixaId}
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
                  {errors.funcionariosCaixaId && (
                    <FormHelperText>{errors.funcionariosCaixaId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  label="Total a Pagar"
                  value={`${calcularTotal().toFixed(2)}kz`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            {form.produtosSelecionados.map((produto, index) => (
              <Grid container spacing={1} key={index} alignItems="center">
                <Grid item xs={12} sm={6} md={5}>
                  <FormControl
                    fullWidth
                    variant="filled"
                    error={Boolean(errors[`produto_${index}`])}
                  >
                    <InputLabel>Produto</InputLabel>
                    <Select
                      value={produto.id}
                      onChange={(e) => handleProdutoChange(index, 'id', e.target.value)}
                    >
                      {loja.map((p) => (
                        <MenuItem key={p.id} value={p.id.toString()}>
                          {p.name} - {p.prico}kzs (Estoque: {p.quantidade})
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[`produto_${index}`] && (
                      <FormHelperText>{errors[`produto_${index}`]}</FormHelperText>
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
                    error={Boolean(errors[`produto_${index}`])}
                    helperText={errors[`produto_${index}`]}
                  />
                </Grid>
                <Grid item xs={4} sm={2} md={2}>
                  <IconButton color="error" onClick={() => removerProdutoInput(index)}>
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            {errors.produtos && (
              <Typography color="error" variant="body2">
                {errors.produtos}
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                onClick={adicionarNovoProdutoInput}
                fullWidth={true}
                size="small"
              >
                Adicionar Produto
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddFaturaSubmit}
                fullWidth={true}
                size="small"
              >
                Cadastrar Fatura
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openCaixaForm} onClose={handleCloseCaixaForm}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" fontSize={{ xs: 18, sm: 24 }}>
              Abrir Novo Caixa
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCloseCaixaForm} size="small">
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
                    disabled={!!loggedInFuncionarioId} // Desabilitado para o funcionário logado
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="filled"
                  label="Quantidade Faturada"
                  value="0 kz" // Valor inicial fixo
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="filled"
                  label="Hora Atual"
                  value={new Intl.DateTimeFormat('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date())} // Mostra a hora atual
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            <Button variant="contained" color="primary" onClick={onAddCaixaSubmit} size="small">
              Abrir Caixa
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openCaixaList} onClose={handleCloseCaixaList}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" fontSize={{ xs: 18, sm: 24 }}>
              Caixas Abertos
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCloseCaixaList} size="small">
              Fechar
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Caixa
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Funcionário
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Hora Atual
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Quantidade Faturada
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Fechamento
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: { xs: 12, sm: 14 } }}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {funcionariosCaixa.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>{item.id}</TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {item.caixas?.nomeCaixa || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {item.funcionarios?.nomeFuncionario || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {item.estadoCaixa ? 'Aberto' : 'Fechado'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date())}{' '}
                      {/* Mostra a hora atual */}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {item.quantidadaFaturada.toFixed(2)} kz
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {item.horarioFechamento
                        ? new Intl.DateTimeFormat('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(item.horarioFechamento))
                        : 'N/A'}
                    </TableCell>
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

      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    'Cliente',
                    'NIF',
                    'Telefone',
                    'Localização',
                    'Email',
                    'Data',
                    'Total',
                    'Status',
                    'Produtos',
                    'Caixa',
                    'Ações',
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 'bold',
                        fontSize: { xs: 12, sm: 14 },
                        display: {
                          xs:
                            header === 'Cliente' || header === 'Total' || header === 'Ações'
                              ? 'table-cell'
                              : 'none',
                          sm: 'table-cell',
                        },
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {faturas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>{item.cliente}</TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.nif}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.telefone}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.localizacao}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.email}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(item.data))}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 14 } }}>
                      {calcularTotalFatura(item).toFixed(2)}kzs
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.status}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.produtos.map((p, idx) => (
                        <div key={idx}>{`${p.produto.name} - ${p.quantidade}x`}</div>
                      ))}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: { xs: 12, sm: 14 },
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      {item.funcionariosCaixa?.caixas?.nomeCaixa || 'N/A'}
                    </TableCell>
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
