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
  TablePagination,
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

const Caixas: React.FC<CollapsedItemProps> = ({ open }) => {
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [filteredCaixas, setFilteredCaixas] = useState<Caixa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [caixaToDelete, setCaixaToDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    id: '',
    nomeCaixa: '',
    descricao: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchCaixas();
  }, []);

  useEffect(() => {
    const filtered = caixas.filter((caixa) =>
      caixa.nomeCaixa?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCaixas(filtered);
    setPage(0);
  }, [searchTerm, caixas]);

  const fetchCaixas = async () => {
    setLoading(true);
    try {
      const data = await getAllCashRegisters();
      setCaixas(data);
      setFilteredCaixas(data);
    } catch (error) {
      console.error('Erro ao carregar caixas:', error);
      setErrors({ fetch: 'Erro ao carregar caixas. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleOpenConfirmModal = (id: string) => {
    setCaixaToDelete(id);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setCaixaToDelete(null);
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

    // Check for duplicate nomeCaixa (case-insensitive)
    const normalizedNomeCaixa = form.nomeCaixa.trim().toLowerCase();
    const exists = caixas.some(
      (caixa) =>
        caixa.nomeCaixa?.toLowerCase() === normalizedNomeCaixa && (!editId || caixa.id !== editId),
    );
    if (exists) {
      newErrors.nomeCaixa = 'Já existe um caixa com este nome.';
    }

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
        setFilteredCaixas((prev) =>
          prev.map((caixa) => (caixa.id === editId ? updatedCaixa : caixa)),
        );
      } else {
        const newCaixa = await createCashRegister(caixaData);
        setCaixas((prev) => [...prev, newCaixa]);
        setFilteredCaixas((prev) => [...prev, newCaixa]);
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar caixa:', error);
      setErrors({ submit: 'Erro ao salvar o caixa. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const excluirCaixa = async () => {
    if (!caixaToDelete) return;

    setLoading(true);
    try {
      await deleteCashRegister(caixaToDelete);
      setCaixas((prev) => prev.filter((c) => c.id !== caixaToDelete));
      setFilteredCaixas((prev) => prev.filter((c) => c.id !== caixaToDelete));

      const totalPages = Math.ceil(filteredCaixas.length / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Erro ao excluir caixa:', error);
      setErrors({ delete: 'Erro ao excluir o caixa. Tente novamente.' });
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
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

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log(event);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCaixas = filteredCaixas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <Paper sx={{ p: 2, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Caixas
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Pesquisar Caixa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
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

      <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
        <Box sx={confirmModalStyle}>
          <Typography variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir este caixa? Esta ação não pode ser desfeita.
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
            <Button variant="contained" color="error" onClick={excluirCaixa} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
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
                    <TableCell colSpan={5} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginatedCaixas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum caixa encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCaixas.map((item) => (
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
                          onClick={() => handleOpenConfirmModal(item.id!)}
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
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCaixas.length}
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

export default Caixas;
