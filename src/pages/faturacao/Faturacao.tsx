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
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { SubItem } from 'types/types';

interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
}

interface Fatura {
  id: number;
  cliente: string;
  nif: string;
  telefone: string;
  localizacao: string;
  email: string;
  data: string;
  total: number;
  status: string;
  produtos: { produto: Produto; quantidade: number }[];
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
  // Carrega os produtos da loja do localStorage
  const [loja] = useState<Produto[]>(() => {
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
  });

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
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    const updatedProdutos = [...form.produtosSelecionados];
    updatedProdutos[index] = { ...updatedProdutos[index], [field]: value };
    setForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));
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
  };

  const calcularTotal = () => {
    return form.produtosSelecionados.reduce((acc, curr) => {
      const produto = loja.find((p) => p.id.toString() === curr.id); // Alterado de produtos para loja
      return acc + (produto ? produto.preco * curr.quantidade : 0);
    }, 0);
  };

  const onAddFaturaSubmit = () => {
    if (!form.cliente.trim() || !form.data.trim() || form.produtosSelecionados.length === 0) {
      alert('Preencha todos os campos obrigatórios (Nome do Cliente, Data e Produtos)!');
      return;
    }

    const newFatura: Fatura = {
      id: faturas.length + 1,
      cliente: form.cliente,
      nif: form.nif,
      telefone: form.telefone,
      localizacao: form.localizacao,
      email: form.email,
      data: form.data,
      total: calcularTotal(),
      status: form.status,
      produtos: form.produtosSelecionados.map((p) => ({
        produto: loja.find((prod) => prod.id.toString() === p.id)!, // Alterado de produtos para loja
        quantidade: p.quantidade,
      })),
    };

    setFaturas((prev) => [...prev, newFatura]);
    handleClose();
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
      });
      setOpenFatura(true);
    }
  };

  // Sincroniza faturas com o localStorage
  useEffect(() => {
    localStorage.setItem('faturas', JSON.stringify(faturas));
  }, [faturas]);

  return (
    <>
      <Paper sx={{ p: 2, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Faturação
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              Adicionar Fatura
            </Button>
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
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="nif"
                  label="NIF/BI"
                  value={form.nif}
                  onChange={handleChange}
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
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="localizacao"
                  label="Localização"
                  value={form.localizacao}
                  onChange={handleChange}
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
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="data"
                  label="Data"
                  value={form.data}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="status"
                  label="Status"
                  value={form.status}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="filled"
                  label="Total a Pagar"
                  value={`R$${calcularTotal().toFixed(2)}`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            {form.produtosSelecionados.map((produto, index) => (
              <Grid container spacing={2} key={index}>
                <Grid item xs={12} sm={5}>
                  <FormControl fullWidth variant="filled">
                    <InputLabel>Produto</InputLabel>
                    <Select
                      value={produto.id}
                      onChange={(e) => handleProdutoChange(index, 'id', e.target.value)}
                    >
                      {loja.map(
                        (
                          p, // Alterado de produtos para loja
                        ) => (
                          <MenuItem key={p.id} value={p.id.toString()}>
                            {p.nome} - R${p.preco}
                          </MenuItem>
                        ),
                      )}
                    </Select>
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
                  />
                </Grid>
                <Grid item xs={4} sm={2}>
                  <IconButton color="error" onClick={() => removerProdutoInput(index)}>
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Button variant="outlined" color="primary" onClick={adicionarNovoProdutoInput}>
              Adicionar Produto
            </Button>

            <Button variant="contained" color="secondary" onClick={onAddFaturaSubmit}>
              Cadastrar Fatura
            </Button>
          </Stack>
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
                    <TableCell>{item.data}</TableCell>
                    <TableCell>R${item.total.toFixed(2)}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.produtos.map((p, idx) => (
                        <div
                          key={idx}
                        >{`${p.produto.nome} - ${p.quantidade}x (R$${p.produto.preco})`}</div>
                      ))}
                    </TableCell>
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
