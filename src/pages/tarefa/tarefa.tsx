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
  Chip,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import React, { useState, useEffect, useMemo } from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import {
  getAllTasks,
  getAllEmployees,
  getAllDailyActivities,
  createDailyActivity,
  updateDailyActivity,
  deleteDailyActivity,
  createTask,
  updateTask,
  deleteTask,
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
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openTasksModal, setOpenTasksModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    tarefa: Tarefa;
    atividades: AtividadeDoDia[];
  } | null>(null);
  const [atividadeToDelete, setAtividadeToDelete] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editAtividadeId, setEditAtividadeId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
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

  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [employees, setEmployees] = useState<Funcionario[]>([]);
  const [formActivity, setFormActivity] = useState({
    idTarefa: '',
    idFuncionarios: [] as string[],
    status: 'Pendente' as 'Concluída' | 'Em Andamento' | 'Pendente',
  });
  const [formTask, setFormTask] = useState({
    nome: '',
    descricao: '',
  });
  const [errorsActivity, setErrorsActivity] = useState<{
    idTarefa?: string;
    idFuncionarios?: string;
    status?: string;
  }>({});
  const [errorsTask, setErrorsTask] = useState<{
    nome?: string;
  }>({});
  const [hasFormChanges, setHasFormChanges] = useState(false);

  const handleOpenActivityModal = () => {
    if (tasks.length === 0 || employees.length === 0) {
      setAlert({
        severity: 'error',
        message: 'Tarefas ou funcionários não carregados. Tente novamente.',
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    setOpenActivityModal(true);
  };

  const handleOpenTaskModal = (task?: Tarefa) => {
    if (task?.id) {
      setFormTask({ nome: task.nome, descricao: task.descricao || '' });
      setEditTaskId(task.id);
    } else {
      setFormTask({ nome: '', descricao: '' });
      setEditTaskId(null);
    }
    setOpenTaskModal(true);
  };

  const handleOpenTasksModal = () => setOpenTasksModal(true);

  const handleOpenDetailsModal = (taskId: string) => {
    const tarefa = tasks.find((t) => t.id === taskId);
    const taskAtividades = atividades.filter((a) => a.id_tarefa === taskId);
    if (tarefa) {
      setSelectedTask({ tarefa, atividades: taskAtividades });
      setOpenDetailsModal(true);
    } else {
      setAlert({
        severity: 'error',
        message: 'Tarefa não encontrada.',
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleCloseActivityModal = () => {
    if (hasFormChanges && !window.confirm('Deseja descartar as alterações?')) return;
    setOpenActivityModal(false);
    setEditAtividadeId(null);
    setFormActivity({
      idTarefa: '',
      idFuncionarios: [],
      status: 'Pendente',
    });
    setErrorsActivity({});
    setHasFormChanges(false);
  };

  const handleCloseTaskModal = () => {
    if (hasFormChanges && !window.confirm('Deseja descartar as alterações?')) return;
    setOpenTaskModal(false);
    setFormTask({ nome: '', descricao: '' });
    setErrorsTask({});
    setEditTaskId(null);
    setHasFormChanges(false);
  };

  const handleCloseTasksModal = () => setOpenTasksModal(false);

  const handleCloseDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedTask(null);
  };

  const handleOpenConfirmModal = (id: string, type: 'atividade' | 'tarefa') => {
    if (!id) return;
    if (type === 'atividade') {
      setAtividadeToDelete(id);
      setTaskToDelete(null);
    } else {
      setTaskToDelete(id);
      setAtividadeToDelete(null);
    }
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setAtividadeToDelete(null);
    setTaskToDelete(null);
  };

  const handleEditActivity = (id: string | undefined) => {
    if (!id) {
      console.warn('ID de atividade inválido:', id);
      setAlert({ severity: 'error', message: 'ID de atividade inválido.' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    const atividade = atividades.find((a) => a.id === id);
    if (atividade) {
      setFormActivity({
        idTarefa: atividade.id_tarefa,
        idFuncionarios: [atividade.id_funcionario],
        status: atividade.status,
      });
      setEditAtividadeId(id);
      handleOpenActivityModal();
    } else {
      console.warn('Atividade não encontrada:', id);
      setAlert({ severity: 'error', message: 'Atividade não encontrada.' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const tasksPromise = getAllTasks().catch((error) => {
        console.error('Erro ao buscar tarefas:', error);
        return [];
      });
      const employeesPromise = getAllEmployees().catch((error) => {
        console.error('Erro ao buscar funcionários:', error);
        return [];
      });
      const atividadesPromise = getAllDailyActivities().catch((error) => {
        console.error('Erro ao buscar atividades:', error);
        return [];
      });

      const [tasksData, employeesData, atividadesData] = await Promise.all([
        tasksPromise,
        employeesPromise,
        atividadesPromise,
      ]);

      if (!Array.isArray(tasksData)) {
        console.error('Dados de tarefas inválidos:', tasksData);
        throw new Error('Resposta inválida para tarefas');
      }
      if (!Array.isArray(employeesData)) {
        console.error('Dados de funcionários inválidos:', employeesData);
        throw new Error('Resposta inválida para funcionários');
      }
      if (!Array.isArray(atividadesData)) {
        console.error('Dados de atividades inválidos:', atividadesData);
        throw new Error('Resposta inválida para atividades');
      }

      setTasks(tasksData);
      setEmployees(employeesData);
      setAtividades(atividadesData);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao carregar dados. Verifique a conexão com o servidor.';
      console.error('Erro em fetchInitialData:', {
        message: errorMessage,
        error,
      });
      setAlert({ severity: 'error', message: errorMessage });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Agrupar atividades por tarefa para a listagem
  const groupedTasks = useMemo(() => {
    const taskMap = new Map<string, { tarefa: Tarefa; atividades: AtividadeDoDia[] }>();
    tasks.forEach((tarefa) => {
      const taskAtividades = atividades.filter((a) => a.id_tarefa === tarefa.id);
      if (taskAtividades.length > 0) {
        taskMap.set(tarefa.id!, { tarefa, atividades: taskAtividades });
      }
    });
    return Array.from(taskMap.values());
  }, [tasks, atividades]);

  const filteredTasks = useMemo(() => {
    return groupedTasks.filter(({ tarefa }) => {
      const searchLower = searchTerm.toLowerCase();
      return tarefa.nome.toLowerCase().includes(searchLower);
    });
  }, [searchTerm, groupedTasks]);

  const sortedTasks = useMemo(() => {
    if (!sortBy) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      const key = sortBy;
      const valueA = a.atividades[0]?.[key] ?? '';
      const valueB = b.atividades[0]?.[key] ?? '';

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  const paginatedTasks = useMemo(() => {
    return sortedTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedTasks, page, rowsPerPage]);

  const handleChangeActivity = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string | string[]>,
    field: keyof typeof formActivity,
  ) => {
    const value = e.target.value;
    setFormActivity((prev) => ({ ...prev, [field]: value }));
    setErrorsActivity((prev) => ({ ...prev, [field]: undefined }));
    setHasFormChanges(true);
  };

  const handleChangeTask = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof typeof formTask,
  ) => {
    const value = e.target.value;
    setFormTask((prev) => ({ ...prev, [field]: value }));
    setErrorsTask((prev) => ({ ...prev, [field]: undefined }));
    setHasFormChanges(true);
  };

  const validateActivityForm = () => {
    const newErrors: {
      idTarefa?: string;
      idFuncionarios?: string;
      status?: string;
    } = {};
    if (!formActivity.idTarefa) {
      newErrors.idTarefa = 'Selecione uma tarefa.';
    } else if (!tasks.some((t) => t.id === formActivity.idTarefa)) {
      newErrors.idTarefa = 'Tarefa inválida ou não encontrada.';
    }
    if (formActivity.idFuncionarios.length === 0) {
      newErrors.idFuncionarios = 'Selecione pelo menos um funcionário.';
    } else if (!formActivity.idFuncionarios.every((id) => employees.some((e) => e.id === id))) {
      newErrors.idFuncionarios = 'Um ou mais funcionários são inválidos.';
    }
    if (!formActivity.status) {
      newErrors.status = 'Selecione o status da atividade.';
    }
    setErrorsActivity(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTaskForm = () => {
    const newErrors: { nome?: string } = {};
    if (!formTask.nome.trim()) newErrors.nome = 'O nome da tarefa é obrigatório.';
    setErrorsTask(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddActivitySubmit = async () => {
    if (!validateActivityForm()) {
      console.log('Validação de atividade falhou:', errorsActivity);
      return;
    }

    setLoading(true);
    try {
      const activityPromises = formActivity.idFuncionarios.map((idFuncionario) => {
        const activityData: Partial<AtividadeDoDia> = {
          id_tarefa: formActivity.idTarefa,
          id_funcionario: idFuncionario,
          status: formActivity.status,
        };
        if (editAtividadeId) {
          activityData.id = editAtividadeId;
          return updateDailyActivity(editAtividadeId, activityData);
        }
        return createDailyActivity(activityData as AtividadeDoDia);
      });

      await Promise.all(activityPromises);
      setAlert({
        severity: 'success',
        message: editAtividadeId
          ? 'Atividade atualizada com sucesso!'
          : 'Atividades registradas com sucesso!',
      });
      await fetchInitialData();
      setOpenActivityModal(false);
      setEditAtividadeId(null);
      setFormActivity({
        idTarefa: '',
        idFuncionarios: [],
        status: 'Pendente',
      });
      setErrorsActivity({});
      setHasFormChanges(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao salvar atividade. Verifique os dados e tente novamente.';
      const responseData =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data
          : null;

      console.error('Erro ao salvar atividade:', {
        message: errorMessage,
        response: responseData,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setAlert({
        severity: 'error',
        message: responseData?.message || errorMessage,
      });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const onAddTaskSubmit = async () => {
    if (!validateTaskForm()) {
      console.log('Validação de tarefa falhou:', errorsTask);
      return;
    }

    const taskData: Partial<Tarefa> = {
      nome: formTask.nome.trim(),
      descricao: formTask.descricao.trim() ?? null,
    };

    setLoading(true);
    try {
      console.log(editTaskId ? 'Atualizando tarefa:' : 'Criando tarefa:', {
        id: editTaskId,
        data: taskData,
      });
      if (editTaskId) {
        await updateTask(editTaskId, taskData);
        setAlert({
          severity: 'success',
          message: `Tarefa "${taskData.nome}" atualizada com sucesso!`,
        });
      } else {
        await createTask(taskData as Tarefa);
        setAlert({
          severity: 'success',
          message: `Tarefa "${taskData.nome}" criada com sucesso!`,
        });
      }
      await fetchInitialData();
      setOpenTaskModal(false);
      setFormTask({ nome: '', descricao: '' });
      setErrorsTask({});
      setEditTaskId(null);
      setHasFormChanges(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao salvar tarefa. Verifique os dados e tente novamente.';
      const responseData =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data
          : null;

      console.error('Erro ao salvar tarefa:', {
        message: errorMessage,
        response: responseData,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setAlert({
        severity: 'error',
        message: responseData?.message || errorMessage,
      });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (atividadeToDelete) {
        console.log('Excluindo atividade:', atividadeToDelete);
        await deleteDailyActivity(atividadeToDelete);
        setAlert({ severity: 'success', message: 'Atividade excluída com sucesso!' });
        const totalPages = Math.ceil(filteredTasks.length / rowsPerPage);
        if (page >= totalPages && page > 0) {
          setPage(page - 1);
        }
      } else if (taskToDelete) {
        console.log('Excluindo tarefa:', taskToDelete);
        await deleteTask(taskToDelete);
        setAlert({ severity: 'success', message: 'Tarefa excluída com sucesso!' });
      }
      await fetchInitialData();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao excluir. Verifique os dados e tente novamente.';
      console.error('Erro ao excluir:', error);
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleSort = (column: keyof AtividadeDoDia) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
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
            <Typography variant="h5">Tarefas</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Pesquisar Tarefa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: 300 } }}
                disabled={loading}
                inputProps={{ 'aria-label': 'Pesquisar tarefas' }}
              />
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={(theme) => ({
                    p: theme.spacing(0.625, 1.5),
                    borderRadius: 1.5,
                    minWidth: 140,
                  })}
                  startIcon={<IconifyIcon icon="heroicons-solid:view-list" />}
                  onClick={handleOpenTasksModal}
                  disabled={loading}
                  aria-label="Listar tarefas"
                >
                  <Typography variant="body2">Listar Tarefas</Typography>
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={(theme) => ({
                    p: theme.spacing(0.625, 1.5),
                    borderRadius: 1.5,
                    minWidth: 140,
                  })}
                  startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                  onClick={() => handleOpenTaskModal()}
                  disabled={loading}
                  aria-label="Criar nova tarefa"
                >
                  <Typography variant="body2">Nova Tarefa</Typography>
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  sx={(theme) => ({
                    p: theme.spacing(0.625, 1.5),
                    borderRadius: 1.5,
                    minWidth: 140,
                  })}
                  startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                  onClick={handleOpenActivityModal}
                  disabled={loading}
                  aria-label="Registrar nova atividade"
                >
                  <Typography variant="body2">Registrar Atividade</Typography>
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal
        open={openActivityModal}
        onClose={handleCloseActivityModal}
        aria-labelledby="activity-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="activity-modal-title" variant="h6" gutterBottom>
            {editAtividadeId ? 'Editar Atividade' : 'Registrar Atividade do Dia'}
          </Typography>
          <Stack spacing={3} sx={{ width: '100%' }}>
            <FormControl fullWidth error={Boolean(errorsActivity.idTarefa)}>
              <InputLabel id="tarefa-label">Tarefa</InputLabel>
              <Select
                labelId="tarefa-label"
                value={formActivity.idTarefa}
                onChange={(e) => handleChangeActivity(e, 'idTarefa')}
                label="Tarefa"
                disabled={loading}
                aria-describedby="tarefa-error"
              >
                <MenuItem value="">
                  <em>Selecione uma tarefa</em>
                </MenuItem>
                {tasks.map((tarefa) => (
                  <MenuItem key={tarefa.id} value={tarefa.id}>
                    {tarefa.nome}
                  </MenuItem>
                ))}
              </Select>
              {errorsActivity.idTarefa && (
                <Typography id="tarefa-error" color="error" variant="caption">
                  {errorsActivity.idTarefa}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth error={Boolean(errorsActivity.idFuncionarios)}>
              <InputLabel id="funcionarios-label">Funcionários</InputLabel>
              <Select
                labelId="funcionarios-label"
                multiple
                value={formActivity.idFuncionarios}
                onChange={(e) => handleChangeActivity(e, 'idFuncionarios')}
                label="Funcionários"
                disabled={loading}
                aria-describedby="funcionarios-error"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const employee = employees.find((e) => e.id === value);
                      return <Chip key={value} label={employee?.nomeFuncionario || value} />;
                    })}
                  </Box>
                )}
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.nomeFuncionario}
                  </MenuItem>
                ))}
              </Select>
              {errorsActivity.idFuncionarios && (
                <Typography id="funcionarios-error" color="error" variant="caption">
                  {errorsActivity.idFuncionarios}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth error={Boolean(errorsActivity.status)}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={formActivity.status}
                onChange={(e) => handleChangeActivity(e, 'status')}
                label="Status"
                disabled={loading}
                aria-describedby="status-error"
              >
                <MenuItem value="Concluída">Concluída</MenuItem>
                <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                <MenuItem value="Pendente">Pendente</MenuItem>
              </Select>
              {errorsActivity.status && (
                <Typography id="status-error" color="error" variant="caption">
                  {errorsActivity.status}
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

      <Modal open={openTaskModal} onClose={handleCloseTaskModal} aria-labelledby="task-modal-title">
        <Box sx={modalStyle}>
          <Typography id="task-modal-title" variant="h6" gutterBottom>
            {editTaskId ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
          </Typography>
          <Stack spacing={3} sx={{ width: '100%' }}>
            <TextField
              label="Nome da Tarefa"
              value={formTask.nome}
              onChange={(e) => handleChangeTask(e, 'nome')}
              fullWidth
              error={Boolean(errorsTask.nome)}
              helperText={errorsTask.nome}
              disabled={loading}
              inputProps={{ 'aria-describedby': 'nome-tarefa-error' }}
            />
            <TextField
              label="Descrição (Opcional)"
              value={formTask.descricao}
              onChange={(e) => handleChangeTask(e, 'descricao')}
              fullWidth
              multiline
              rows={4}
              disabled={loading}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCloseTaskModal}
                disabled={loading}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={onAddTaskSubmit}
                disabled={loading}
                aria-label={editTaskId ? 'Atualizar tarefa' : 'Criar tarefa'}
              >
                {loading ? 'Salvando...' : editTaskId ? 'Atualizar' : 'Criar'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={openTasksModal}
        onClose={handleCloseTasksModal}
        aria-labelledby="tasks-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="tasks-modal-title" variant="h6" gutterBottom>
            Tarefas Disponíveis
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small" aria-label="Tabela de tarefas disponíveis">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Descrição</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Skeleton variant="rectangular" height={30} />
                    </TableCell>
                  </TableRow>
                ) : tasks.length > 0 ? (
                  tasks.map((tarefa) => (
                    <TableRow key={tarefa.id}>
                      <TableCell>{tarefa.nome}</TableCell>
                      <TableCell>{tarefa.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenTaskModal(tarefa)}
                          disabled={loading}
                          aria-label={`Editar tarefa ${tarefa.nome}`}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => tarefa.id && handleOpenConfirmModal(tarefa.id, 'tarefa')}
                          disabled={loading}
                          aria-label={`Excluir tarefa ${tarefa.nome}`}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhuma tarefa encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseTasksModal}
              disabled={loading}
              aria-label="Fechar"
            >
              Fechar
            </Button>
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
            Tem certeza que deseja excluir {atividadeToDelete ? 'esta atividade' : 'esta tarefa'}?
            Esta ação não pode ser desfeita.
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
              onClick={handleDelete}
              disabled={loading}
              aria-label="Confirmar exclusão"
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={openDetailsModal}
        onClose={handleCloseDetailsModal}
        aria-labelledby="details-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="details-modal-title" variant="h6" gutterBottom>
            Detalhes da Tarefa
          </Typography>
          {selectedTask ? (
            <Stack spacing={2}>
              <Typography variant="body1">
                <strong>Nome:</strong> {selectedTask.tarefa.nome}
              </Typography>
              <Typography variant="body1">
                <strong>Descrição:</strong> {selectedTask.tarefa.descricao || 'Sem descrição'}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {selectedTask.atividades[0]?.status || 'Pendente'}
              </Typography>
              <Typography variant="body1">
                <strong>Data:</strong>{' '}
                {selectedTask.atividades[0]?.createdAt
                  ? new Date(selectedTask.atividades[0].createdAt).toLocaleDateString()
                  : 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Funcionários Atribuídos:</strong>
              </Typography>
              <Box>
                {selectedTask.atividades.length > 0 ? (
                  selectedTask.atividades.map((atividade) => {
                    const funcionario = employees.find((e) => e.id === atividade.id_funcionario);
                    return (
                      <Chip
                        key={atividade.id_funcionario}
                        label={funcionario?.nomeFuncionario || 'Funcionário não encontrado'}
                        sx={{ m: 0.5 }}
                      />
                    );
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nenhum funcionário atribuído.
                  </Typography>
                )}
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2">Carregando detalhes...</Typography>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseDetailsModal}
              disabled={loading}
              aria-label="Fechar"
            >
              Fechar
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table aria-label="Tabela de tarefas">
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort('id_tarefa')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Tarefa {sortBy === 'id_tarefa' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </strong>
                  </TableCell>
                  <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </strong>
                  </TableCell>
                  <TableCell onClick={() => handleSort('createdAt')} sx={{ cursor: 'pointer' }}>
                    <strong>
                      Data {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                      <TableCell colSpan={4}>
                        <Skeleton variant="rectangular" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedTasks.length > 0 ? (
                  paginatedTasks.map(({ tarefa, atividades }) => {
                    const latestAtividade = atividades.sort(
                      (a, b) =>
                        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
                    )[0];
                    return (
                      <TableRow key={tarefa.id}>
                        <TableCell>{tarefa.nome}</TableCell>
                        <TableCell>{latestAtividade?.status || 'Pendente'}</TableCell>
                        <TableCell>
                          {latestAtividade?.createdAt
                            ? new Date(latestAtividade.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => tarefa.id && handleOpenDetailsModal(tarefa.id)}
                            disabled={loading}
                            aria-label={`Ver detalhes da tarefa ${tarefa.nome}`}
                          >
                            Ver Mais Detalhes
                          </Button>
                          <IconButton
                            color="primary"
                            onClick={() =>
                              latestAtividade?.id && handleEditActivity(latestAtividade.id)
                            }
                            disabled={loading || !latestAtividade}
                            aria-label={`Editar atividade da tarefa ${tarefa.nome}`}
                          >
                            <IconifyIcon icon="heroicons-solid:pencil-alt" />
                          </IconButton>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenTaskModal(tarefa)}
                            disabled={loading}
                            aria-label={`Editar tarefa ${tarefa.nome}`}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => tarefa.id && handleOpenConfirmModal(tarefa.id, 'tarefa')}
                            disabled={loading}
                            aria-label={`Excluir tarefa ${tarefa.nome}`}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhuma tarefa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
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
