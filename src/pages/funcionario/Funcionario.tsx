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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const itemsPerPage = 5;

  // Permission states
  const [canRead, setCanRead] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[FuncionarioComponent] ${message}`, ...args);
    }
  };

  const loadUserData = useCallback(() => {
    try {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setCanRead(hasPermission('listar_funcionario'));
      setCanCreate(hasPermission('criar_funcionario'));
      setCanUpdate(hasPermission('atualizar_funcionario'));
      setCanDelete(hasPermission('eliminar_funcionario'));
      log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (!canRead) {
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
      setCurrentPage(1);
      log('Dados carregados:', { employees: employeesData, functions: functionsData });
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
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
    } finally {
      setLoadingFetch(false);
    }
  }, [canRead]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const id = loadUserData();
        if (!id) {
          navigate('/login');
          return;
        }
        await fetchData();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchData, loadUserData, navigate]);

  const handleOpen = useCallback(() => {
    if (!canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar funcionários!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && isEditing) {
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
  }, [canCreate, canUpdate, isEditing]);

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
      if (!canDelete) {
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
    [canDelete],
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
    if (!canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar funcionários!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && isEditing) {
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
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
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
    } finally {
      setLoadingSave(false);
    }
  }, [canCreate, canUpdate, isEditing, editId, form, handleClose]);

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
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
      const totalItems = funcionarios.length - 1;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }
      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error);
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
    } finally {
      setLoadingDelete(false);
    }
  }, [canDelete, deleteFuncionarioId, funcionarios, currentPage, handleCloseConfirmDelete]);

  const handleEdit = useCallback(
    (funcionario: Funcionario) => {
      if (!canUpdate) {
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
    [canUpdate],
  );

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const totalItems = funcionarios.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFuncionarios = funcionarios.slice(startIndex, endIndex);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    },
    [totalPages],
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
              disabled={loadingFetch || loadingSave || !canCreate}
              title={!canCreate ? 'Você não tem permissão para criar funcionários' : ''}
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
                disabled={loadingSave}
                required
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
                disabled={loadingSave}
                required
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
                disabled={loadingSave}
                required
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
                disabled={loadingSave}
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
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                variant="filled"
                fullWidth
                error={!!errors.id_funcao}
                disabled={loadingSave}
              >
                <InputLabel>Função</InputLabel>
                <Select name="id_funcao" value={form.id_funcao} onChange={handleSelectChange}>
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
                  disabled={loadingSave}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onSubmit}
                disabled={loadingSave || (!canCreate && !isEditing) || (!canUpdate && isEditing)}
                title={
                  !canCreate && !isEditing
                    ? 'Você não tem permissão para criar funcionários'
                    : !canUpdate && isEditing
                      ? 'Você não tem permissão para atualizar funcionários'
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
                            disabled={loadingFetch || loadingDelete || !canUpdate}
                            title={
                              !canUpdate ? 'Você não tem permissão para atualizar funcionários' : ''
                            }
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleOpenConfirmDelete(item.id!)}
                            disabled={loadingFetch || loadingDelete || !canDelete}
                            title={
                              !canDelete ? 'Você não tem permissão para excluir funcionários' : ''
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

          {totalItems > itemsPerPage && (
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <Button
                variant="outlined"
                disabled={currentPage === 1 || loadingFetch || loadingDelete}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <Typography>
                Página {currentPage} de {totalPages}
              </Typography>
              <Button
                variant="outlined"
                disabled={currentPage === totalPages || loadingFetch || loadingDelete}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Próximo
              </Button>
            </Stack>
          )}
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
            Tem certeza que deseja excluir este funcionário?
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
              disabled={loadingDelete || !canDelete}
              title={!canDelete ? 'Você não tem permissão para excluir funcionários' : ''}
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
