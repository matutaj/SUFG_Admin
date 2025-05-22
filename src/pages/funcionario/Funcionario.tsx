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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React, { useCallback, useEffect, useState } from 'react';
import { Funcionario, Funcao } from 'types/models';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllFunctions,
} from '../../api/methods';
import { getUserData, hasPermission } from '../../api/authUtils';
import { useNavigate } from 'react-router-dom';

interface CollapsedItemProps {
  open: boolean;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 790 },
  maxHeight: '77%',
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

interface Permissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const FuncionarioComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteFuncionarioId, setDeleteFuncionarioId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Funcionario, 'id'>>({
    id_funcao: '',
    numeroBI: '',
    nomeFuncionario: '',
    senha: '',
    moradaFuncionario: '',
    telefoneFuncionario: '',
    emailFuncionario: '',
  });
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[FuncionarioComponent] ${message}`, ...args);
    }
  };

  // Carregar dados do usuário e permissões
  useEffect(() => {
    const loadUserDataAndPermissions = async () => {
      try {
        const userData = await getUserData();
        log('Dados do usuário:', userData);
        if (userData && userData.id) {
          const [canRead, canCreate, canUpdate, canDelete] = await Promise.all([
            hasPermission('listar_funcionario'),
            hasPermission('criar_funcionario'),
            hasPermission('atualizar_funcionario'),
            hasPermission('eliminar_funcionario'),
          ]);
          setPermissions({ canRead, canCreate, canUpdate, canDelete });
          log('Permissões carregadas:', { canRead, canCreate, canUpdate, canDelete });
        } else {
          setAlert({ severity: 'error', message: 'Usuário não autenticado!' });
          log('Nenhum usuário autenticado encontrado');
          navigate('/login');
        }
      } catch (error: any) {
        setAlert({ severity: 'error', message: 'Erro ao carregar dados do usuário!' });
        log('Erro ao carregar dados do usuário:', error);
        navigate('/login');
      }
    };
    loadUserDataAndPermissions();
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!permissions.canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar funcionários!',
      });
      log('Permissão de leitura negada');
      return;
    }
    try {
      setLoadingFetch(true);
      const timeoutPromise = (promise: Promise<any>, time: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido')), time),
          ),
        ]);
      const [employeesData, functionsData] = await Promise.all([
        timeoutPromise(getAllEmployees(), 10000),
        timeoutPromise(getAllFunctions(), 10000),
      ]);
      if (!Array.isArray(employeesData) || !Array.isArray(functionsData)) {
        throw new Error('A resposta da API não é um array');
      }
      setFuncionarios(employeesData ?? []);
      setFuncoes(functionsData ?? []);
      setPage(0);
      log('Dados carregados:', { employees: employeesData, functions: functionsData });
    } catch (error: any) {
      let errorMessage = 'Erro ao carregar dados';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar funcionários';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      } else if (error.message === 'Tempo limite excedido') {
        errorMessage = 'A requisição demorou muito para responder';
      }
      setAlert({ severity: 'error', message: errorMessage });
      log('Erro ao buscar dados:', error);
    } finally {
      setLoadingFetch(false);
    }
  }, [permissions.canRead]);

  useEffect(() => {
    if (permissions.canRead) {
      fetchData();
    }
  }, [fetchData, permissions.canRead]);

  const handleOpen = useCallback(() => {
    if (!permissions.canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar funcionários!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!permissions.canUpdate && isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar funcionários!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setIsEditing(false);
    setEditId(null);
    setForm({
      id_funcao: '',
      numeroBI: '',
      nomeFuncionario: '',
      senha: '',
      moradaFuncionario: '',
      telefoneFuncionario: '',
      emailFuncionario: '',
    });
    setErrors({});
    setOpenModal(true);
  }, [permissions.canCreate, permissions.canUpdate, isEditing]);

  const handleClose = useCallback(() => {
    setOpenModal(false);
    setIsEditing(false);
    setEditId(null);
    setForm({
      id_funcao: '',
      numeroBI: '',
      nomeFuncionario: '',
      senha: '',
      moradaFuncionario: '',
      telefoneFuncionario: '',
      emailFuncionario: '',
    });
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!permissions.canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir funcionários!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeleteFuncionarioId(id);
      setOpenConfirmDelete(true);
    },
    [permissions.canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteFuncionarioId(null);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [errors],
  );

  const handleSelectChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nomeFuncionario?.trim()) newErrors.nomeFuncionario = 'Nome é obrigatório';
    if (!form.telefoneFuncionario?.trim()) newErrors.telefoneFuncionario = 'Telefone é obrigatório';
    if (!form.numeroBI?.trim()) newErrors.numeroBI = 'NIF/BI é obrigatório';
    if (!form.id_funcao) newErrors.id_funcao = 'Função é obrigatória';
    if (!isEditing && !form.senha?.trim()) newErrors.senha = 'Senha é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, isEditing]);

  const onSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!permissions.canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar funcionários!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!permissions.canUpdate && isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar funcionários!',
      });
      log('Permissão de atualização negada');
      return;
    }
    try {
      setLoadingSave(true);
      setAlert(null);
      const employeeData: Omit<Funcionario, 'id'> = {
        id_funcao: form.id_funcao,
        numeroBI: form.numeroBI,
        nomeFuncionario: form.nomeFuncionario,
        senha: form.senha || '',
        moradaFuncionario: form.moradaFuncionario || '',
        telefoneFuncionario: form.telefoneFuncionario,
        emailFuncionario: form.emailFuncionario || '',
      };
      if (isEditing && editId) {
        const updatedEmployee = await updateEmployee(editId, employeeData);
        setFuncionarios((prev) =>
          prev.map((item) => (item.id === editId ? updatedEmployee : item)),
        );
        setAlert({ severity: 'success', message: 'Funcionário atualizado com sucesso!' });
        log('Funcionário atualizado:', { id: editId, ...employeeData });
      } else {
        const newEmployee = await createEmployee(employeeData);
        setFuncionarios((prev) => [...prev, newEmployee]);
        setAlert({ severity: 'success', message: 'Funcionário cadastrado com sucesso!' });
        log('Funcionário criado:', newEmployee);
      }
      handleClose();
      setPage(0);
    } catch (error: any) {
      let errorMessage = 'Erro ao salvar funcionário';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Já existe um funcionário com esse NIF/BI';
        } else if (error.response.status === 403) {
          errorMessage = `Permissão negada para ${isEditing ? 'atualizar' : 'criar'} funcionários`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Dados inválidos';
        }
      }
      setAlert({ severity: 'error', message: errorMessage });
      setErrors({ nomeFuncionario: 'Erro ao salvar. Tente novamente.' });
      log('Erro ao salvar funcionário:', error);
    } finally {
      setLoadingSave(false);
    }
  }, [permissions.canCreate, permissions.canUpdate, isEditing, editId, form, handleClose]);

  const handleDelete = useCallback(async () => {
    if (!permissions.canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir funcionários!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deleteFuncionarioId) {
      setAlert({ severity: 'error', message: 'ID do funcionário não fornecido' });
      return;
    }
    try {
      setLoadingDelete(true);
      setAlert(null);
      const employeeToDelete = funcionarios.find((emp) => emp.id === deleteFuncionarioId);
      if (!employeeToDelete) {
        throw new Error('Funcionário não encontrado');
      }
      setFuncionarios((prev) => prev.filter((item) => item.id !== deleteFuncionarioId));
      await deleteEmployee(deleteFuncionarioId);
      setAlert({ severity: 'success', message: 'Funcionário excluído com sucesso!' });
      log('Funcionário excluído:', deleteFuncionarioId);
      const totalPages = Math.ceil((funcionarios.length - 1) / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
      handleCloseConfirmDelete();
    } catch (error: any) {
      let errorMessage = 'Erro ao excluir funcionário';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Funcionário não encontrado no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message ||
            'Funcionário não pode ser excluído (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir funcionários';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }
      if (employeeToDelete) {
        setFuncionarios((prev) =>
          [...prev, employeeToDelete].sort((a, b) =>
            (a.nomeFuncionario || '').localeCompare(b.nomeFuncionario || ''),
          ),
        );
      }
      setAlert({ severity: 'error', message: errorMessage });
      log('Erro ao excluir funcionário:', error);
    } finally {
      setLoadingDelete(false);
    }
  }, [
    permissions.canDelete,
    deleteFuncionarioId,
    funcionarios,
    page,
    rowsPerPage,
    handleCloseConfirmDelete,
  ]);

  const handleEdit = useCallback(
    (funcionario: Funcionario) => {
      if (!permissions.canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar funcionários!',
        });
        log('Permissão de atualização negada');
        return;
      }
      if (!funcionario.id) {
        setAlert({ severity: 'error', message: 'Funcionário não encontrado para edição' });
        return;
      }
      setIsEditing(true);
      setEditId(funcionario.id);
      setForm({
        id_funcao: funcionario.id_funcao,
        numeroBI: funcionario.numeroBI || '',
        nomeFuncionario: funcionario.nomeFuncionario || '',
        senha: '',
        moradaFuncionario: funcionario.moradaFuncionario || '',
        telefoneFuncionario: funcionario.telefoneFuncionario || '',
        emailFuncionario: funcionario.emailFuncionario || '',
      });
      setErrors({});
      setOpenModal(true);
      log('Editando funcionário:', funcionario);
    },
    [permissions.canUpdate],
  );

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const paginatedFuncionarios = funcionarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999, minWidth: 300 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}
      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">Funcionários</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              disabled={loadingFetch || loadingSave || !permissions.canCreate}
              title={!permissions.canCreate ? 'Você não tem permissão para criar funcionários' : ''}
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openModal} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
              {isEditing ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loadingSave}>
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numeroBI"
                label="NIF/BI"
                variant="filled"
                fullWidth
                value={form.numeroBI}
                onChange={handleInputChange}
                error={!!errors.numeroBI}
                helperText={errors.numeroBI}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
                required
                title={
                  isEditing
                    ? !permissions.canUpdate
                      ? 'Você não tem permissão para atualizar funcionários'
                      : ''
                    : !permissions.canCreate
                      ? 'Você não tem permissão para criar funcionários'
                      : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nomeFuncionario"
                label="Nome"
                variant="filled"
                fullWidth
                value={form.nomeFuncionario}
                onChange={handleInputChange}
                error={!!errors.nomeFuncionario}
                helperText={errors.nomeFuncionario}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
                required
                title={
                  isEditing
                    ? !permissions.canUpdate
                      ? 'Você não tem permissão para atualizar funcionários'
                      : ''
                    : !permissions.canCreate
                      ? 'Você não tem permissão para criar funcionários'
                      : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="telefoneFuncionario"
                label="Telefone"
                variant="filled"
                type="tel"
                fullWidth
                value={form.telefoneFuncionario}
                onChange={handleInputChange}
                error={!!errors.telefoneFuncionario}
                helperText={errors.telefoneFuncionario}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
                required
                title={
                  isEditing
                    ? !permissions.canUpdate
                      ? 'Você não tem permissão para atualizar funcionários'
                      : ''
                    : !permissions.canCreate
                      ? 'Você não tem permissão para criar funcionários'
                      : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emailFuncionario"
                label="Email"
                type="email"
                variant="filled"
                fullWidth
                value={form.emailFuncionario}
                onChange={handleInputChange}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
                title={
                  isEditing
                    ? !permissions.canUpdate
                      ? 'Você não tem permissão para atualizar funcionários'
                      : ''
                    : !permissions.canCreate
                      ? 'Você não tem permissão para criar funcionários'
                      : ''
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="moradaFuncionario"
                label="Endereço"
                variant="filled"
                fullWidth
                value={form.moradaFuncionario}
                onChange={handleInputChange}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
                title={
                  isEditing
                    ? !permissions.canUpdate
                      ? 'Você não tem permissão para atualizar funcionários'
                      : ''
                    : !permissions.canCreate
                      ? 'Você não tem permissão para criar funcionários'
                      : ''
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                variant="filled"
                fullWidth
                error={!!errors.id_funcao}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
              >
                <InputLabel>Função</InputLabel>
                <Select
                  name="id_funcao"
                  value={form.id_funcao}
                  onChange={handleSelectChange}
                  title={
                    isEditing
                      ? !permissions.canUpdate
                        ? 'Você não tem permissão para atualizar funcionários'
                        : ''
                      : !permissions.canCreate
                        ? 'Você não tem permissão para criar funcionários'
                        : ''
                  }
                >
                  <MenuItem value="">
                    <em>Selecione uma função</em>
                  </MenuItem>
                  {funcoes.map((funcao) => (
                    <MenuItem key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </MenuItem>
                  ))}
                </Select>
                {errors.id_funcao && (
                  <Typography color="error" variant="caption">
                    {errors.id_funcao}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            {!isEditing && (
              <Grid item xs={12}>
                <TextField
                  name="senha"
                  label="Senha"
                  type="password"
                  variant="filled"
                  fullWidth
                  value={form.senha}
                  onChange={handleInputChange}
                  error={!!errors.senha}
                  helperText={errors.senha}
                  disabled={loadingSave || !permissions.canCreate}
                  required
                  title={
                    !permissions.canCreate ? 'Você não tem permissão para criar funcionários' : ''
                  }
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onSubmit}
                disabled={
                  loadingSave || (isEditing ? !permissions.canUpdate : !permissions.canCreate)
                }
                title={
                  isEditing
                    ? !permissions.canUpdate
                      ? 'Você não tem permissão para atualizar funcionários'
                      : ''
                    : !permissions.canCreate
                      ? 'Você não tem permissão para criar funcionários'
                      : ''
                }
              >
                <Typography variant="body2">
                  {loadingSave ? 'Salvando...' : isEditing ? 'Salvar' : 'Cadastrar'}
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['NIF/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Função', 'Ações'].map(
                    (header) => (
                      <TableCell key={header}>
                        <strong>{header}</strong>
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingFetch ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : paginatedFuncionarios.length > 0 ? (
                  paginatedFuncionarios.map((item) => {
                    const funcao = funcoes.find((f) => f.id === item.id_funcao);
                    const nomeFuncao = funcao ? funcao.nome : 'Sem função no sistema';
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.numeroBI || 'Sem NIF/BI'}</TableCell>
                        <TableCell>{item.nomeFuncionario || 'Sem nome'}</TableCell>
                        <TableCell>{item.telefoneFuncionario || 'Sem telefone'}</TableCell>
                        <TableCell>{item.emailFuncionario || 'Sem email'}</TableCell>
                        <TableCell>{item.moradaFuncionario || 'Sem endereço'}</TableCell>
                        <TableCell>{nomeFuncao}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(item)}
                            disabled={loadingFetch || loadingDelete || !permissions.canUpdate}
                            title={
                              !permissions.canUpdate
                                ? 'Você não tem permissão para atualizar funcionários'
                                : ''
                            }
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenConfirmDelete(item.id!)}
                            disabled={loadingFetch || loadingDelete || !permissions.canDelete}
                            title={
                              !permissions.canDelete
                                ? 'Você não tem permissão para excluir funcionários'
                                : ''
                            }
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={funcionarios.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
            disabled={!permissions.canRead}
          />
        </CardContent>
      </Card>

      <Modal
        open={openConfirmDelete}
        onClose={handleCloseConfirmDelete}
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-description"
      >
        <Box sx={confirmModalStyle}>
          <Typography id="confirm-delete-modal-title" variant="h6" component="h2" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography id="confirm-delete-modal-description" sx={{ mb: 3 }}>
            Tem certeza que deseja excluir o funcionário "
            {funcionarios.find((f) => f.id === deleteFuncionarioId)?.nomeFuncionario}"? Esta ação
            não pode ser desfeita.
          </Typography>
          {loadingDelete && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCloseConfirmDelete}
              disabled={loadingDelete}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={loadingDelete || !permissions.canDelete}
              title={
                !permissions.canDelete ? 'Você não tem permissão para excluir funcionários' : ''
              }
            >
              {loadingDelete ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default FuncionarioComponent;
