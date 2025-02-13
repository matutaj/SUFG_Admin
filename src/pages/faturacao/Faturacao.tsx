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
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from '@mui/material/Icon';
import Edit from '@mui/material/Icon';
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
  data: string;
  total: number;
  status: string;
  produtos: Produto[];
}

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 650 },
  maxHeight: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  p: 4,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#6c63ff #f1f1f1',
};

const Faturacao: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openFatura, setOpenFatura] = useState(false);
  const [form, setForm] = useState({
    cliente: '',
    data: '',
    total: 0,
    status: 'Pendente',
    produtos: [] as Produto[],
    produtoSelecionado: '',
    categoriaSelecionada: '',
  });

  const [faturas, setFaturas] = useState<Fatura[]>(
    JSON.parse(localStorage.getItem('faturas') || '[]'),
  );

  const produtos = [
    { id: 1, nome: 'Produto 1', preco: 10 },
    { id: 2, nome: 'Produto 2', preco: 20 },
    { id: 3, nome: 'Produto 3', preco: 30 },
  ];

  const categorias = JSON.parse(localStorage.getItem('categorias') || '[]');

  const handleOpen = () => setOpenFatura(true);
  const handleClose = () => setOpenFatura(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProdutoChange = (e: SelectChangeEvent<string>) => {
    const produtoId = e.target.value as string;
    const produto = produtos.find((p) => p.id.toString() === produtoId);
    if (produto && form.produtos.length < 10) {
      setForm((prev) => ({
        ...prev,
        produtoSelecionado: produtoId,
      }));
    }
  };

  const handleCategoriaChange = (e: SelectChangeEvent<string>) => {
    setForm((prev) => ({
      ...prev,
      categoriaSelecionada: e.target.value,
    }));
  };

  const adicionarProduto = () => {
    const produto = produtos.find((p) => p.id.toString() === form.produtoSelecionado);
    if (produto && !form.produtos.some((p) => p.id === produto.id)) {
      const produtoComCategoria = {
        ...produto,
        categoria: form.categoriaSelecionada || 'Sem Categoria',
      };

      setForm((prev) => ({
        ...prev,
        produtos: [...prev.produtos, produtoComCategoria],
        total: prev.total + produto.preco,
        produtoSelecionado: '',
      }));
    }
  };

  const excluirProduto = (produtoId: number) => {
    const produto = form.produtos.find((p) => p.id === produtoId);
    if (produto) {
      const updatedProdutos = form.produtos.filter((p) => p.id !== produtoId);
      setForm((prev) => ({
        ...prev,
        produtos: updatedProdutos,
        total: prev.total - produto.preco,
      }));
    }
  };

  const onAddFaturaSubmit = () => {
    if (!form.cliente.trim() || !form.total || !form.data.trim()) {
      alert('Todos os campos são obrigatórios!');
      return;
    }

    const newFatura = {
      id: faturas.length + 1,
      ...form,
    };

    setFaturas([...faturas, newFatura]);
    setForm({
      cliente: '',
      data: '',
      total: 0,
      status: 'Pendente',
      produtos: [],
      produtoSelecionado: '',
      categoriaSelecionada: '',
    });
  };

  const excluirFatura = (faturaId: number) => {
    const updatedFaturas = faturas.filter((f) => f.id !== faturaId);
    setFaturas(updatedFaturas);
    localStorage.setItem('faturas', JSON.stringify(updatedFaturas));
  };

  const editarFatura = (faturaId: number) => {
    const faturaToEdit = faturas.find((f) => f.id === faturaId);
    if (faturaToEdit) {
      setForm({
        cliente: faturaToEdit.cliente,
        data: faturaToEdit.data,
        total: faturaToEdit.total,
        status: faturaToEdit.status,
        produtos: faturaToEdit.produtos,
        produtoSelecionado: '',
        categoriaSelecionada: '',
      });
      setOpenFatura(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('faturas', JSON.stringify(faturas));
  }, [faturas]);

  return (
    <>
      <Paper sx={{ p: 2, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Faturação
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2">Adicionar Fatura</Typography>
            </Button>
          </Stack>

          <Modal open={openFatura} onClose={handleClose}>
            <Box sx={style} component="form" noValidate autoComplete="off">
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: '100%', mb: 2 }}
              >
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Cadastrar Fatura
                </Typography>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  color="error"
                  sx={{ borderRadius: 2 }}
                >
                  Fechar
                </Button>
              </Stack>

              <Stack spacing={2} sx={{ width: '100%' }}>
                {['cliente', 'data', 'total', 'status'].map((field) => (
                  <TextField
                    key={field}
                    name={field}
                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2 }}
                    value={form[field as keyof typeof form]}
                    onChange={handleChange}
                    type={field === 'total' ? 'number' : 'text'}
                    disabled={field === 'total'}
                  />
                ))}

                <FormControl fullWidth variant="filled" sx={{ borderRadius: 2 }}>
                  <InputLabel>Produto</InputLabel>
                  <Select
                    value={form.produtoSelecionado}
                    onChange={handleProdutoChange}
                    label="Produto"
                    sx={{ borderRadius: 2 }}
                  >
                    {produtos.map((produto) => (
                      <MenuItem key={produto.id} value={produto.id.toString()}>
                        {produto.nome} - R${produto.preco}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="primary"
                  sx={{ height: 40, width: '100%', borderRadius: 2 }}
                  onClick={adicionarProduto}
                >
                  <Typography variant="body2">Adicionar Produto</Typography>
                </Button>

                <FormControl fullWidth variant="filled" sx={{ borderRadius: 2 }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={form.categoriaSelecionada}
                    onChange={handleCategoriaChange}
                    label="Categoria"
                    sx={{ borderRadius: 2 }}
                  >
                    {categorias.map((categoria: string, index: number) => (
                      <MenuItem key={index} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ height: 40, width: '100%', borderRadius: 2 }}
                  onClick={onAddFaturaSubmit}
                >
                  <Typography variant="body2">Cadastrar Fatura</Typography>
                </Button>
              </Stack>
            </Box>
          </Modal>
        </Collapse>
      </Paper>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4, borderRadius: 2 }}>
        <CardContent>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Cliente', 'Data', 'Total', 'Status', 'Produtos', 'Ações'].map((header) => (
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
                    <TableCell>{item.data}</TableCell>
                    <TableCell>{item.total}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      {item.produtos.map((produto, index) => (
                        <div key={index}>
                          {produto.nome} - R${produto.preco}
                          <IconButton color="error" onClick={() => excluirProduto(produto.id)}>
                            <Delete />
                          </IconButton>
                        </div>
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
