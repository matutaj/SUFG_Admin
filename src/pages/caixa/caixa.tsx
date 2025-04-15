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
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { Caixa } from 'types/models';
import {
  getAllCashRegisters,
  createCashRegister,
  updateCashRegister,
  deleteCashRegister,
} from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 700 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '60%', md: 500 },
  maxHeight: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto',
  borderRadius: 2,
};

const Caixas: React.FC<CollapsedItemProps> = ({ open }) => {
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    id: '',
    nomeCaixa: '',
    descricao: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCaixas();
  }, []);

  const fetchCaixas = async () => {
    setLoading(true);
    try {
      const data = await getAllCashRegisters();
      setCaixas(data);
    } catch (error) {
      console.error('Erro ao carregar caixas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      id: '',
      nomeCaixa: '',
      descricao: '',
    });
    setErrors({});
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nomeCaixa.trim()) newErrors.nomeCaixa = 'Nome do caixa é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddCaixaSubmit = async () => {
    if (!validateForm()) return;

    const caixaData: Caixa = {
      id: editId || undefined,
      nomeCaixa: form.nomeCaixa,
      descricao: form.descricao || null,
      funcionariosCaixa: [],
      alertas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      if (editId) {
        const updatedCaixa = await updateCashRegister(editId, caixaData);
        setCaixas((prev) => prev.map((caixa) => (caixa.id === editId ? updatedCaixa : caixa)));
      } else {
        const newCaixa = await createCashRegister(caixaData);
        setCaixas((prev) => [...prev, newCaixa]);
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar caixa:', error);
      setErrors({ submit: 'Erro ao salvar o caixa. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const excluirCaixa = async (caixaId: string) => {
    setLoading(true);
    try {
      await deleteCashRegister(caixaId);
      setCaixas((prev) => prev.filter((c) => c.id !== caixaId));
    } catch (error) {
      console.error('Erro ao excluir caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const editarCaixa = (caixaId: string) => {
    const caixa = caixas.find((c) => c.id === caixaId);
    if (caixa) {
      setForm({
        id: caixa.id || '',
        nomeCaixa: caixa.nomeCaixa,
        descricao: caixa.descricao || '',
      });
      setEditId(caixaId);
      setOpenModal(true);
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Caixas
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              disabled={loading}
            >
              Adicionar Caixa
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openModal} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 4, width: '100%' }}
          >
            <Typography variant="h5" fontWeight="bold">
              {editId ? 'Editar Caixa' : 'Cadastrar Caixa'}
            </Typography>
            <Button variant="outlined" color="error" onClick={handleClose} disabled={loading}>
              Fechar
            </Button>
          </Stack>

          <Stack spacing={3} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="nomeCaixa"
                  label="Nome do Caixa"
                  value={form.nomeCaixa}
                  onChange={handleChange}
                  error={Boolean(errors.nomeCaixa)}
                  helperText={errors.nomeCaixa}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="descricao"
                  label="Descrição"
                  multiline
                  rows={3}
                  value={form.descricao}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
            </Grid>

            {errors.submit && (
              <Typography color="error" variant="body2">
                {errors.submit}
              </Typography>
            )}

            <Button
              variant="contained"
              color="secondary"
              onClick={onAddCaixaSubmit}
              disabled={loading}
            >
              {loading ? 'Salvando...' : editId ? 'Atualizar Caixa' : 'Cadastrar Caixa'}
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
                  {['Nome do Caixa', 'Descrição', 'Funcionários', 'Alertas', 'Ações'].map(
                    (header) => (
                      <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                        {header}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : caixas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum caixa encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  caixas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nomeCaixa}</TableCell>
                      <TableCell>{item.descricao || '-'}</TableCell>
                      <TableCell>
                        {item.funcionariosCaixa && item.funcionariosCaixa.length > 0
                          ? item.funcionariosCaixa.map((fc) => fc.id_funcionario).join(', ')
                          : 'Nenhum'}
                      </TableCell>
                      <TableCell>
                        {item.alertas && item.alertas.length > 0
                          ? item.alertas.map((a) => a.nomeAlerta).join(', ')
                          : 'Nenhum'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => editarCaixa(item.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => excluirCaixa(item.id!)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default Caixas;
