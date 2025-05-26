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
  Alert,
  CircularProgress,
  TablePagination,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React, { useCallback, useEffect, useState } from 'react';
import { Cliente } from '../../types/models';
import { getAllClients, createClient, updateClient, deleteClient } from '../../api/methods';
import { getUserData, hasPermission } from '../../api/authUtils';
import { useNavigate } from 'react-router-dom';

interface CollapsedItemProps {
  open: boolean;
}

type ClienteForm = Partial<Cliente>;

const modalStyle = {
  position: 'absolute' as const,
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

const ClienteComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openCliente, setOpenCliente] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteClienteId, setDeleteClienteId] = useState<string | null>(null);
  const [form, setForm] = useState<ClienteForm>({
    numeroContribuinte: '',
    nomeCliente: '',
    telefoneCliente: '',
    emailCliente: '',
    moradaCliente: '',
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Permission states
  const [canRead, setCanRead] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ClienteComponent] ${message}`, ...args);
    }
  };

  const loadUserData = useCallback(async () => {
    try {
      const userData = await getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        log('Usuário não autenticado ou sem ID');
        return null;
      }
      const [read, create, update, del] = await Promise.all([
        hasPermission('listar_cliente'),
        hasPermission('criar_cliente'),
        hasPermission('atualizar_cliente'),
        hasPermission('eliminar_cliente'),
      ]);
      setCanRead(read);
      setCanCreate(create);
      setCanUpdate(update);
      setCanDelete(del);
      log('Permissões atribuídas:', { read, create, update, del });
      return userData.id;
    } catch (error: any) {
      log('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar dados do usuário' });
      return null;
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    if (!canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar clientes!',
      });
      log('Permissão de leitura negada');
      return;
    }
    try {
      setLoadingFetch(true);
      const data = await getAllClients();
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllClients não é um array');
      }
      setClientes(data ?? []);
      setFilteredClientes(data ?? []);
      log('Clientes carregados:', data);
    } catch (error: any) {
      log('Erro ao buscar clientes:', error);
      let errorMessage = 'Erro ao carregar clientes';
      if (error.response?.status === 403) {
        errorMessage = 'Permissão negada para listar clientes';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno no servidor';
      }
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoadingFetch(false);
    }
  }, [canRead]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsAuthLoading(true);
        const id = await loadUserData();
        if (!id) {
          log('Redirecionando para login devido a falha na autenticação');
          navigate('/login');
          return;
        }
        await fetchClientes();
      } catch (error) {
        log('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      } finally {
        setIsAuthLoading(false);
      }
    };
    initialize();
  }, [fetchClientes, loadUserData, navigate]);

  useEffect(() => {
    const filtered = clientes.filter((cliente) =>
      cliente.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredClientes(filtered);
    setPage(0);
  }, [searchTerm, clientes]);

  const handleOpen = useCallback(() => {
    if (!canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar clientes!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar clientes!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setIsEditing(false);
    setEditId(null);
    setForm({
      numeroContribuinte: '',
      nomeCliente: '',
      telefoneCliente: '',
      emailCliente: '',
      moradaCliente: '',
    });
    setErrors({});
    setOpenCliente(true);
  }, [canCreate, canUpdate, isEditing]);

  const handleClose = useCallback(() => {
    setOpenCliente(false);
    setIsEditing(false);
    setEditId(null);
    setForm({
      numeroContribuinte: '',
      nomeCliente: '',
      telefoneCliente: '',
      emailCliente: '',
      moradaCliente: '',
    });
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir clientes!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeleteClienteId(id);
      setOpenConfirmDelete(true);
    },
    [canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteClienteId(null);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!form.nomeCliente?.trim()) newErrors.nomeCliente = 'Nome é obrigatório';
    if (!form.telefoneCliente?.trim()) newErrors.telefoneCliente = 'Telefone é obrigatório';
    if (form.emailCliente && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailCliente)) {
      newErrors.emailCliente = 'Email inválido';
    }
    if (form.numeroContribuinte?.trim()) {
      const exists = clientes.some(
        (cliente) =>
          cliente.numeroContribuinte?.toLowerCase() === form.numeroContribuinte?.toLowerCase() &&
          (!editId || cliente.id !== editId),
      );
      if (exists) {
        newErrors.numeroContribuinte = 'Já existe um cliente com este NIF/BI';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, clientes, editId]);

  const onAddClienteSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar clientes!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar clientes!',
      });
      log('Permissão de atualização negada');
      return;
    }
    try {
      setLoadingSave(true);
      setAlert(null);
      const clientData: Cliente = {
        numeroContribuinte: form.numeroContribuinte || null,
        nomeCliente: form.nomeCliente || '',
        telefoneCliente: form.telefoneCliente || '',
        emailCliente: form.emailCliente || null,
        moradaCliente: form.moradaCliente || null,
      };
      if (isEditing && editId !== null) {
        const updatedCliente = await updateClient(editId, clientData);
        setClientes((prev) => prev.map((item) => (item.id === editId ? updatedCliente : item)));
        setFilteredClientes((prev) =>
          prev.map((item) => (item.id === editId ? updatedCliente : item)),
        );
        setAlert({ severity: 'success', message: 'Cliente atualizado com sucesso!' });
        log('Cliente atualizado:', { id: editId, ...clientData });
      } else {
        const newCliente = await createClient(clientData);
        setClientes((prev) => [...prev, newCliente]);
        setFilteredClientes((prev) => [...prev, newCliente]);
        setAlert({ severity: 'success', message: 'Cliente cadastrado com sucesso!' });
        log('Cliente criado:', newCliente);
      }
      handleClose();
    } catch (error: any) {
      log('Erro ao salvar cliente:', error);
      let errorMessage = 'Erro ao salvar cliente';
      if (error.response?.status === 409) {
        errorMessage = 'Já existe um cliente com esse NIF/BI';
      } else if (error.response?.status === 403) {
        errorMessage = `Permissão negada para ${isEditing ? 'atualizar' : 'criar'} clientes`;
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Dados inválidos';
      }
      setAlert({ severity: 'error', message: errorMessage });
      setErrors({ submit: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoadingSave(false);
    }
  }, [canCreate, canUpdate, isEditing, editId, form, handleClose, validateForm]);

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir clientes!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deleteClienteId) {
      setAlert({ severity: 'error', message: 'ID do cliente não fornecido' });
      return;
    }
    try {
      setLoadingDelete(true);
      setAlert(null);
      await deleteClient(deleteClienteId);
      setClientes((prev) => prev.filter((item) => item.id !== deleteClienteId));
      setFilteredClientes((prev) => prev.filter((item) => item.id !== deleteClienteId));
      setAlert({ severity: 'success', message: 'Cliente excluído com sucesso!' });
      log('Cliente excluído:', deleteClienteId);
      const totalPages = Math.ceil(filteredClientes.length / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
    } catch (error: any) {
      log('Erro ao excluir cliente:', error);
      let errorMessage = 'Erro ao excluir cliente';
      if (error.response?.status === 404) {
        errorMessage = 'Cliente não encontrado no servidor';
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message || 'Cliente não pode ser excluído (possivelmente em uso)';
      } else if (error.response?.status === 403) {
        errorMessage = 'Permissão negada para excluir clientes';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno no servidor';
      }
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoadingDelete(false);
      handleCloseConfirmDelete();
    }
  }, [canDelete, deleteClienteId, filteredClientes, page, rowsPerPage, handleCloseConfirmDelete]);

  const handleEdit = useCallback(
    (client: Cliente) => {
      if (!canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar clientes!',
        });
        log('Permissão de atualização negada');
        return;
      }
      if (!client.id) {
        setAlert({ severity: 'error', message: 'Cliente não encontrado para edição' });
        return;
      }
      setIsEditing(true);
      setEditId(client.id);
      setForm({
        numeroContribuinte: client.numeroContribuinte || '',
        nomeCliente: client.nomeCliente || '',
        telefoneCliente: client.telefoneCliente || '',
        emailCliente: client.emailCliente || '',
        moradaCliente: client.moradaCliente || '',
      });
      setErrors({});
      setOpenCliente(true);
      log('Editando cliente:', client);
    },
    [canUpdate],
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    log('Mudando página:', newPage);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    log('Mudando linhas por página:', newRowsPerPage);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const paginatedClientes = filteredClientes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  if (isAuthLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999, minWidth: 300 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}
      <Paper sx={{ p: 2, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Clientes
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Pesquisar Cliente"
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
                disabled={loadingFetch || loadingSave || !canCreate}
                title={!canCreate ? 'Você não tem permissão para criar clientes' : ''}
              >
                Adicionar Cliente
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openCliente} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 4, width: '100%' }}
          >
            <Typography variant="h5" fontWeight="bold">
              {isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loadingSave}>
              Fechar
            </Button>
          </Stack>

          <Stack spacing={3} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="numeroContribuinte"
                  label="NIF/BI"
                  value={form.numeroContribuinte}
                  onChange={handleChange}
                  error={!!errors.numeroContribuinte}
                  helperText={errors.numeroContribuinte}
                  disabled={loadingSave}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="nomeCliente"
                  label="Nome"
                  value={form.nomeCliente}
                  onChange={handleChange}
                  error={!!errors.nomeCliente}
                  helperText={errors.nomeCliente}
                  disabled={loadingSave}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="telefoneCliente"
                  label="Telefone"
                  type="tel"
                  value={form.telefoneCliente}
                  onChange={handleChange}
                  error={!!errors.telefoneCliente}
                  helperText={errors.telefoneCliente}
                  disabled={loadingSave}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="emailCliente"
                  label="Email"
                  value={form.emailCliente}
                  onChange={handleChange}
                  error={!!errors.emailCliente}
                  helperText={errors.emailCliente}
                  disabled={loadingSave}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="filled"
                  name="moradaCliente"
                  label="Endereço"
                  value={form.moradaCliente}
                  onChange={handleChange}
                  disabled={loadingSave}
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
              onClick={onAddClienteSubmit}
              disabled={loadingSave || (!canCreate && !isEditing) || (!canUpdate && isEditing)}
              title={
                !canCreate && !isEditing
                  ? 'Você não tem permissão para criar clientes'
                  : !canUpdate && isEditing
                    ? 'Você não tem permissão para atualizar clientes'
                    : ''
              }
            >
              {loadingSave ? 'Salvando...' : isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openConfirmDelete} onClose={handleCloseConfirmDelete}>
        <Box sx={confirmModalStyle}>
          <Typography variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="secondary"
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
              title={!canDelete ? 'Você não tem permissão para excluir clientes' : ''}
            >
              {loadingDelete ? 'Excluindo...' : 'Excluir'}
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
                  {['NIF/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingFetch ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : paginatedClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClientes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.numeroContribuinte || 'Sem NIF/BI'}</TableCell>
                      <TableCell>{item.nomeCliente || 'Sem nome'}</TableCell>
                      <TableCell>{item.telefoneCliente || 'Sem telefone'}</TableCell>
                      <TableCell>{item.emailCliente || 'Sem email'}</TableCell>
                      <TableCell>{item.moradaCliente || 'Sem endereço'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(item)}
                          disabled={loadingFetch || loadingDelete || !canUpdate}
                          title={!canUpdate ? 'Você não tem permissão para atualizar clientes' : ''}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(item.id!)}
                          disabled={loadingFetch || loadingDelete || !canDelete}
                          title={!canDelete ? 'Você não tem permissão para excluir clientes' : ''}
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
            count={filteredClientes.length}
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

export default ClienteComponent;
