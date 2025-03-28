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
} from '../../api/methods';

// Tipo auxiliar para criação de venda, sem id_venda
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
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '60%', md: 700 },
  maxHeight: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2,
};

const Faturacao: React.FC<CollapsedItemProps> = ({ open }) => {
  const [loja, setLoja] = useState<Produto[]>(() => {
    const lojaSalva = localStorage.getItem('loja');
    return lojaSalva ? JSON.parse(lojaSalva) : [];
  });

  const [openFatura, setOpenFatura] = useState(false);
  const [faturas, setFaturas] = useState<Fatura[]>(
    JSON.parse(localStorage.getItem('faturas') || '[]'),
  );

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
    setLoggedInFuncionarioId(id);
    setCaixaForm((prev) => ({ ...prev, funcionarioId: id }));
  }, []);

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

      console.log('Dados enviados para criar venda:', JSON.stringify(vendaData, null, 2));
      const createdVenda = await createSale(vendaData as Venda); // Conversão temporária, ajuste se necessário
      console.log('Venda criada:', createdVenda);

      const updatedLoja = loja
        .map((produto) => {
          const produtoSelecionado = form.produtosSelecionados.find(
            (p) => p.id === produto.id.toString(),
          );
          if (produtoSelecionado) {
            return { ...produto, quantidade: produto.quantidade - produtoSelecionado.quantidade };
          }
          return produto;
        })
        .filter((p) => p.quantidade > 0);

      const newFatura: Fatura = {
        id: faturas.length + 1,
        cliente: form.cliente,
        nif: form.nif,
        telefone: form.telefone,
        localizacao: form.localizacao,
        email: form.email,
        data: form.data,
        status: form.status,
        produtos: form.produtosSelecionados.map((p) => ({
          produto: loja.find((prod) => prod.id.toString() === p.id)!,
          quantidade: p.quantidade,
        })),
        funcionariosCaixa: funcionariosCaixa.find((fc) => fc.id === form.funcionariosCaixaId),
      };

      setFaturas((prev) => [...prev, newFatura]);
      setLoja(updatedLoja);
      handleClose();
    } catch (error: any) {
      console.error('Erro ao criar fatura:', error);
      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
        alert(
          `Falha ao cadastrar fatura: ${error.response.data.message || 'Erro interno no servidor'}`,
        );
      } else {
        alert('Falha ao cadastrar fatura. Verifique sua conexão ou tente novamente.');
      }
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
          quantidade: p.quantidade, // Corrigido de "quantity" para "quantidade"
        })),
        funcionariosCaixaId: fatura.funcionariosCaixa?.id || '',
      });
      setOpenFatura(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('faturas', JSON.stringify(faturas));
  }, [faturas]);

  useEffect(() => {
    localStorage.setItem('loja', JSON.stringify(loja));
  }, [loja]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const funcionariosCaixaData = await getEmployeeCashRegisters();
        const funcionariosData = await getEmployees();
        const caixasData = await getCashRegisters();
        setFuncionariosCaixa(funcionariosCaixaData);
        setFuncionarios(funcionariosData);
        setCaixas(caixasData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    fetchData();
  }, []);

  const handleOpenCaixa = () => {
    setOpenCaixaForm(true);
  };

  const handleCloseCaixaForm = () => {
    setOpenCaixaForm(false);
    setCaixaForm({ funcionarioId: loggedInFuncionarioId, caixaId: '' });
    setCaixaErrors({});
  };

  const handleOpenCaixaList = () => {
    setOpenCaixaList(true);
  };

  const handleCloseCaixaList = () => {
    setOpenCaixaList(false);
  };

  const handleCaixaSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCaixaForm((prev) => ({ ...prev, [name]: value }));
    setCaixaErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateCaixaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!caixaForm.funcionarioId) newErrors.funcionarioId = 'Selecione um funcionário';
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

      console.log(
        'Dados enviados para criar FuncionarioCaixa:',
        JSON.stringify(newFuncionarioCaixa, null, 2),
      );
      const createdCaixa = await createEmployeeCashRegister(newFuncionarioCaixa);
      console.log('Resposta do servidor:', createdCaixa);
      setFuncionariosCaixa((prev) => [...prev, createdCaixa]);
      handleCloseCaixaForm();
    } catch (error: any) {
      console.error('Erro ao criar caixa:', error);
      if (error.response) {
        console.error('Detalhes do erro do servidor:', error.response.data);
        alert(
          `Falha ao abrir o caixa: ${error.response.data.message || 'Erro interno no servidor'}`,
        );
      } else {
        alert('Falha ao abrir o caixa. Verifique sua conexão ou tente novamente.');
      }
    }
  };

  const handleFecharCaixa = async (caixaId: string) => {
    try {
      const caixaAtual = funcionariosCaixa.find((c) => c.id === caixaId);
      if (caixaAtual) {
        const updatedCaixa: FuncionarioCaixa = {
          ...caixaAtual,
          estadoCaixa: false,
          horarioFechamento: new Date().toISOString(),
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
      <Paper sx={{ p: 2, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Faturação
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpen}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              >
                Adicionar Fatura
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCaixa}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
              >
                Abrir Caixa
              </Button>
              <Button
                variant="contained"
                color="info"
                onClick={handleOpenCaixaList}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
              >
                Ver Caixas
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openFatura} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 4, width: '100%' }}
          >
            <Typography variant="h5" fontWeight="bold">
              Cadastrar Fatura
            </Typography>
            <Button variant="outlined" color="error" onClick={handleClose}>
              Fechar
            </Button>
          </Stack>

          <Stack spacing={3} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="nif"
                  label="NIF/BI"
                  value={form.nif}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="localizacao"
                  label="Localização"
                  value={form.localizacao}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="status"
                  label="Status"
                  value={form.status}
                  onChange={handleTextFieldChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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
                          {fc.caixas?.nomeCaixa} - {fc.funcionarios?.nomeFuncionario}
                        </MenuItem>
                      ))}
                  </Select>
                  {errors.funcionariosCaixaId && (
                    <FormHelperText>{errors.funcionariosCaixaId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
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
              <Grid container spacing={2} key={index}>
                <Grid item xs={12} sm={5}>
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
                <Grid item xs={8} sm={5}>
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
                <Grid item xs={4} sm={2}>
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

            <Button variant="outlined" color="primary" onClick={adicionarNovoProdutoInput}>
              Adicionar Produto
            </Button>

            <Button variant="contained" color="secondary" onClick={onAddFaturaSubmit}>
              Cadastrar Fatura
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openCaixaForm} onClose={handleCloseCaixaForm}>
        <Box sx={modalStyle}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 4, width: '100%' }}
          >
            <Typography variant="h5" fontWeight="bold">
              Abrir Novo Caixa
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCloseCaixaForm}>
              Fechar
            </Button>
          </Stack>

          <Stack spacing={3} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="filled" error={Boolean(caixaErrors.funcionarioId)}>
                  <InputLabel>Funcionário</InputLabel>
                  <Select
                    name="funcionarioId"
                    value={caixaForm.funcionarioId}
                    onChange={handleCaixaSelectChange}
                    disabled
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

            <Button variant="contained" color="primary" onClick={onAddCaixaSubmit}>
              Abrir Caixa
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openCaixaList} onClose={handleCloseCaixaList}>
        <Box sx={modalStyle}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 4, width: '100%' }}
          >
            <Typography variant="h5" fontWeight="bold">
              Caixas Abertos
            </Typography>
            <Button variant="outlined" color="error" onClick={handleCloseCaixaList}>
              Fechar
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Funcionário</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Abertura</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Fechamento</TableCell>
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
                    <TableCell>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(item.horarioAbertura))}
                    </TableCell>
                    <TableCell>
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
                        >
                          Fechar Caixa
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

      <Card sx={{ mt: 4, borderRadius: 2 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
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
                    <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {faturas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell>{item.nif}</TableCell>
                    <TableCell>{item.telefone}</TableCell>
                    <TableCell>{item.localizacao}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(item.data))}
                    </TableCell>
                    <TableCell>{calcularTotalFatura(item).toFixed(2)}kzs</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.produtos.map((p, idx) => (
                        <div
                          key={idx}
                        >{`${p.produto.name} - ${p.quantidade}x (${p.produto.prico}kz)`}</div>
                      ))}
                    </TableCell>
                    <TableCell>{item.funcionariosCaixa?.caixas?.nomeCaixa || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => editarFatura(item.id)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => excluirFatura(item.id)}>
                        <Delete />
                      </IconButton>
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
