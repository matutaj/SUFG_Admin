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

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 550 },
  maxHeight: '60%',
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Permission states
  const [canRead, setCanRead] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ClienteComponent] ${message}`, ...args);
    }
  };

  const loadUserData = useCallback(() => {
    try {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setCanRead(hasPermission('listar_cliente'));
      setCanCreate(hasPermission('criar_cliente'));
      setCanUpdate(hasPermission('atualizar_cliente'));
      setCanDelete(hasPermission('eliminar_cliente'));
      log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

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
      const timeoutPromise = (promise: Promise<any>, time: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido')), time),
          ),
        ]);
      const data = await timeoutPromise(getAllClients(), 10000);
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllClients não é um array');
      }
      setClientes(data ?? []);
      log('Clientes carregados:', data);
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      let errorMessage = 'Erro ao carregar clientes';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar clientes';
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
        await fetchClientes();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchClientes, loadUserData, navigate]);

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

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
        numeroContribuinte: form.numeroContribuinte || '',
        nomeCliente: form.nomeCliente || '',
        telefoneCliente: form.telefoneCliente || '',
        emailCliente: form.emailCliente || '',
        moradaCliente: form.moradaCliente || '',
      };
      if (isEditing && editId !== null) {
        const updatedCliente = await updateClient(editId, clientData);
        setClientes((prev) => prev.map((item) => (item.id === editId ? updatedCliente : item)));
        setAlert({ severity: 'success', message: 'Cliente atualizado com sucesso!' });
        log('Cliente atualizado:', { id: editId, ...clientData });
      } else {
        const newCliente = await createClient(clientData);
        setClientes((prev) => [...prev, newCliente]);
        setAlert({ severity: 'success', message: 'Cliente cadastrado com sucesso!' });
        log('Cliente criado:', newCliente);
      }
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error);
      let errorMessage = 'Erro ao salvar cliente';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Já existe um cliente com esse NIF/BI';
        } else if (error.response.status === 403) {
          errorMessage = `Permissão negada para ${isEditing ? 'atualizar' : 'criar'} clientes`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Dados inválidos';
        }
      }
      setAlert({ severity: 'error', message: errorMessage });
      setErrors({ nomeCliente: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoadingSave(false);
    }
  }, [canCreate, canUpdate, isEditing, editId, form, handleClose]);

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
      const clientToDelete = clientes.find((client) => client.id === deleteClienteId);
      if (!clientToDelete) {
        throw new Error('Cliente não encontrado');
      }
      setClientes((prev) => prev.filter((item) => item.id !== deleteClienteId));
      await deleteClient(deleteClienteId);
      setAlert({ severity: 'success', message: 'Cliente excluído com sucesso!' });
      log('Cliente excluído:', deleteClienteId);
      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error);
      let errorMessage = 'Erro ao excluir cliente';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Cliente não encontrado no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message || 'Cliente não pode ser excluído (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir clientes';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }
      if (clientToDelete) {
        setClientes((prev) =>
          [...prev, clientToDelete].sort((a, b) =>
            (a.nomeCliente || '').localeCompare(b.nomeCliente || ''),
          ),
        );
      }
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoadingDelete(false);
    }
  }, [canDelete, deleteClienteId, clientes, handleCloseConfirmDelete]);

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

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

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
            <Typography variant="h5">Cadastrar Cliente</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              disabled={loadingFetch || loadingSave || !canCreate}
              title={!canCreate ? 'Você não tem permissão para criar clientes' : ''}
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openCliente} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
              {isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loadingSave}>
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numeroContribuinte"
                label="NIF/BI"
                variant="filled"
                fullWidth
                value={form.numeroContribuinte}
                onChange={handleChange}
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nomeCliente"
                label="Nome"
                variant="filled"
                fullWidth
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
                name="telefoneCliente"
                label="Telefone"
                variant="filled"
                type="tel"
                fullWidth
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
                name="emailCliente"
                label="Email"
                variant="filled"
                fullWidth
                value={form.emailCliente}
                onChange={handleChange}
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="moradaCliente"
                label="Endereço"
                variant="filled"
                fullWidth
                value={form.moradaCliente}
                onChange={handleChange}
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
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
                  {['NIF/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
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
                ) : clientes.length > 0 ? (
                  clientes.map((item) => (
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
            Tem certeza que deseja excluir este cliente?
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
              title={!canDelete ? 'Você não tem permissão para excluir clientes' : ''}
            >
              {loadingDelete ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default ClienteComponent;
