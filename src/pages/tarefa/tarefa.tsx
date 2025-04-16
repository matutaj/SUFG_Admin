import {
  Collapse,
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
  Modal,
  Alert,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import React, { useState, useEffect, useMemo } from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { isValid, parseISO, format } from 'date-fns';
import {
  getAllTasks,
  getAllEmployees,
  getAllDailyActivities,
  createDailyActivity,
  updateDailyActivity,
  deleteDailyActivity,
} from '../../api/methods';
import { Tarefa, Funcionario, AtividadeDoDia } from '../../types/models';

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 600 },
  maxWidth: '100%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  overflowY: 'auto' as const,
  maxHeight: '80vh',
};

const confirmModalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 400 },
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

const TarefaComponent = () => {
  const [openActivityModal, setOpenActivityModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [atividadeToDelete, setAtividadeToDelete] = useState<string | null>(null);
  const [editAtividadeId, setEditAtividadeId] = useState<string | null>(null);
  const [atividades, setAtividades] = useState<AtividadeDoDia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState<keyof AtividadeDoDia | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // State for activity form
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [employees, setEmployees] = useState<Funcionario[]>([]);
  const [form, setForm] = useState({
    idTarefa: '',
    idFuncionario: '',
    dataAtividade: '',
    status: 'Pendente' as 'Concluída' | 'Em Andamento' | 'Pendente',
  });
  const [errors, setErrors] = useState<{
    idTarefa?: string;
    idFuncionario?: string;
    dataAtividade?: string;
    status?: string;
  }>({});
  const [hasFormChanges, setHasFormChanges] = useState(false);

  const handleOpenActivityModal = () => setOpenActivityModal(true);

  const handleCloseActivityModal = () => {
    if (hasFormChanges && !window.confirm('Deseja descartar as alterações?')) return;
    setOpenActivityModal(false);
    setEditAtividadeId(null);
    setForm({
      idTarefa: '',
      idFuncionario: '',
      dataAtividade: '',
      status: 'Pendente',
    });
    setErrors({});
    setHasFormChanges(false);
  };

  const handleOpenConfirmModal = (id: string) => {
    setAtividadeToDelete(id);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setAtividadeToDelete(null);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tasksData, employeesData, atividadesData] = await Promise.all([
        getAllTasks(),
        getAllEmployees(),
        getAllDailyActivities(),
      ]);
      setTasks(tasksData);
      setEmployees(employeesData);
      setAtividades(atividadesData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredAtividades = useMemo(() => {
    return atividades.filter((atividade) => {
      const tarefa = tasks.find((t) => t.id === atividade.idTarefa);
      const funcionario = employees.find((e) => e.numeroBI === atividade.idFuncionario);
      return (
        tarefa?.nomeTarefa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        funcionario?.nomeFuncionario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atividade.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, atividades, tasks, employees]);

  const sortedAtividades = useMemo(() => {
    if (!sortBy) return filteredAtividades;
    //  return [...filteredAtividades].sort((a, b) => {
    //   const valueA = sortBy === 'dataAtividade' ? new Date(a[sortBy]) : a[sortBy];
    // const valueB = sortBy === 'dataAtividade' ? new Date(b[sortBy]) : b[sortBy];
    // if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
    //if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
    //   return 0;
    // });
  }, [filteredAtividades, sortBy, sortOrder]);

  const paginatedAtividades = useMemo(() => {
    return sortedAtividades!.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedAtividades, page, rowsPerPage]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>,
    field: keyof typeof form,
  ) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setHasFormChanges(true);
  };

  const validateForm = () => {
    const newErrors: {
      idTarefa?: string;
      idFuncionario?: string;
      dataAtividade?: string;
      status?: string;
    } = {};
    if (!form.idTarefa) newErrors.idTarefa = 'Selecione uma tarefa.';
    if (!form.idFuncionario) newErrors.idFuncionario = 'Selecione um funcionário.';
    if (!form.dataAtividade) newErrors.dataAtividade = 'Selecione a data da atividade.';
    else if (!isValid(parseISO(form.dataAtividade))) newErrors.dataAtividade = 'Data inválida.';
    if (!form.status) newErrors.status = 'Selecione o status da atividade.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddActivitySubmit = async () => {
    if (!validateForm()) return;

    const dataAtividadeISO = form.dataAtividade
      ? parseISO(form.dataAtividade).toISOString()
      : new Date().toISOString();

    const activityData: AtividadeDoDia = {
      id: editAtividadeId || undefined,
      idTarefa: form.idTarefa,
      idFuncionario: form.idFuncionario,
      dataAtividade: dataAtividadeISO,
      status: form.status,
      createdAt: editAtividadeId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      if (editAtividadeId) {
        await updateDailyActivity(editAtividadeId, activityData);
        setAlert({ severity: 'success', message: 'Atividade atualizada com sucesso!' });
      } else {
        await createDailyActivity(activityData);
        setAlert({ severity: 'success', message: 'Atividade registrada com sucesso!' });
      }
      await fetchInitialData();
      handleCloseActivityModal();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (id: string | undefined) => {
    if (!id) return;
    const atividade = atividades.find((a) => a.id === id);
    if (atividade) {
      setForm({
        idTarefa: atividade.idTarefa,
        idFuncionario: atividade.idFuncionario,
        dataAtividade: format(parseISO(atividade.dataAtividade), 'yyyy-MM-dd'),
        status: atividade.status,
      });
      setEditAtividadeId(id);
      handleOpenActivityModal();
    }
  };

  const handleDeleteActivity = async () => {
    if (!atividadeToDelete) return;

    setLoading(true);
    try {
      await deleteDailyActivity(atividadeToDelete);
      await fetchInitialData();
      setAlert({ severity: 'success', message: 'Atividade excluída com sucesso!' });
      setTimeout(() => setAlert(null), 3000);

      const totalPages = Math.ceil(filteredAtividades.length / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
    }
  };

  const handleSort = (column: keyof AtividadeDoDia) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log(event);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      <Paper sx={(theme) => ({ p: theme.spacing(2, 2.5), width: '100%' })}>
        <Collapse in={true}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Typography variant="h5">Atividades do Dia</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Pesquisar (Tarefa, Funcionário ou Status)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: 300 } }}
                disabled={loading}
                inputProps={{ 'aria-label': 'Pesquisar atividades' }}
              />
              <Button
                variant="contained"
                color="secondary"
                sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                onClick={handleOpenActivityModal}
                disabled={loading}
                aria-label="Registrar nova atividade"
              >
                <Typography variant="body2">Registrar Atividade</Typography>
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal
        open={openActivityModal}
        onClose={handleCloseActivityModal}
        aria-labelledby="modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-title" variant="h6" gutterBottom>
            {editAtividadeId ? 'Editar Atividade' : 'Registrar Atividade do Dia'}
          </Typography>
          <Stack spacing={3} sx={{ width: '100%' }}>
            <FormControl fullWidth error={Boolean(errors.idTarefa)}>
              <InputLabel id="tarefa-label">Tarefa</InputLabel>
              <Select
                labelId="tarefa-label"
                value={form.idTarefa}
                onChange={(e) => handleChange(e, 'idTarefa')}
                label="Tarefa"
                disabled={loading}
                aria-describedby="tarefa-error"
              >
                <MenuItem value="">
                  <em>Selecione uma tarefa</em>
                </MenuItem>
                {tasks.map((tarefa) => (
                  <MenuItem key={tarefa.id} value={tarefa.id}>
                    {tarefa.nomeTarefa}
                  </MenuItem>
                ))}
              </Select>
              {errors.idTarefa && (
                <Typography id="tarefa-error" color="error" variant="caption">
                  {errors.idTarefa}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth error={Boolean(errors.idFuncionario)}>
              <InputLabel id="funcionario-label">Funcionário</InputLabel>
              <Select
                labelId="funcionario-label"
                value={form.idFuncionario}
                onChange={(e) => handleChange(e, 'idFuncionario')}
                label="Funcionário"
                disabled={loading}
                aria-describedby="funcionario-error"
              >
                <MenuItem value="">
                  <em>Selecione um funcionário</em>
                </MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.numeroBI} value={employee.numeroBI}>
                    {employee.nomeFuncionario}
                  </MenuItem>
                ))}
              </Select>
              {errors.idFuncionario && (
                <Typography id="funcionario-error" color="error" variant="caption">
                  {errors.idFuncionario}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Data da Atividade"
              type="date"
              value={form.dataAtividade}
              onChange={(e) => handleChange(e, 'dataAtividade')}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={Boolean(errors.dataAtividade)}
              helperText={errors.dataAtividade}
              disabled={loading}
              inputProps={{ 'aria-describedby': 'data-error' }}
            />

            <FormControl fullWidth error={Boolean(errors.status)}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={form.status}
                onChange={(e) => handleChange(e, 'status')}
                label="Status"
                disabled={loading}
                aria-describedby="status-error"
              >
                <MenuItem value="Concluída">Concluída</MenuItem>
                <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                <MenuItem value="Pendente">Pendente</MenuItem>
              </Select>
              {errors.status && (
                <Typography id="status-error" color="error" variant="caption">
                  {errors.status}
                </Typography>
              )}
            </FormControl>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseActivityModal}
                disabled={loading}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onAddActivitySubmit}
                disabled={loading}
                aria-label={editAtividadeId ? 'Atualizar atividade' : 'Registrar atividade'}
              >
                {loading ? 'Salvando...' : editAtividadeId ? 'Atualizar' : 'Registrar'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={openConfirmModal}
        onClose={handleCloseConfirmModal}
        aria-labelledby="confirm-modal-title"
      >
        <Box sx={confirmModalStyle}>
          <Typography id="confirm-modal-title" variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseConfirmModal}
              disabled={loading}
              aria-label="Cancelar exclusão"
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteActivity}
              disabled={loading}
              aria-label="Confirmar exclusão"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table aria-label="Tabela de atividades diárias">
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort('idTarefa')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Tarefa {sortBy === 'idTarefa' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </strong>
                  </TableCell>
                  <TableCell onClick={() => handleSort('idFuncionario')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Funcionário {sortBy === 'idFuncionario' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </strong>
                  </TableCell>
                  <TableCell onClick={() => handleSort('dataAtividade')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Data {sortBy === 'dataAtividade' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </strong>
                  </TableCell>
                  <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: rowsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={5}>
                        <Skeleton variant="rectangular" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedAtividades.length > 0 ? (
                  paginatedAtividades.map((atividade) => {
                    const tarefa = tasks.find((t) => t.id === atividade.idTarefa);
                    const funcionario = employees.find(
                      (e) => e.numeroBI === atividade.idFuncionario,
                    );
                    return (
                      <TableRow key={atividade.id}>
                        <TableCell>{tarefa?.nomeTarefa || 'Tarefa não encontrada'}</TableCell>
                        <TableCell>
                          {funcionario?.nomeFuncionario || 'Funcionário não encontrado'}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(atividade.dataAtividade), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{atividade.status}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEditActivity(atividade.id)}
                            disabled={loading}
                            aria-label={`Editar atividade ${tarefa?.nomeTarefa || 'desconhecida'}`}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenConfirmModal(atividade.id!)}
                            disabled={loading}
                            aria-label={`Excluir atividade ${tarefa?.nomeTarefa || 'desconhecida'}`}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhuma atividade encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAtividades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
            aria-label="Paginação da tabela"
          />
        </CardContent>
      </Card>
    </>
  );
};

export default TarefaComponent;
