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
import { Fornecedor } from 'types/models';
import { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/methods';
import { getUserData, hasPermission } from '../../api/authUtils';
import { useNavigate } from 'react-router-dom';

interface CollapsedItemProps {
  open: boolean;
}

type FornecedorForm = Partial<Fornecedor>;

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

const Fornecedores: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteFornecedorId, setDeleteFornecedorId] = useState<string | null>(null);
  const [form, setForm] = useState<FornecedorForm>({
    nif: '',
    nomeFornecedor: '',
    moradaFornecedor: '',
    telefoneFornecedor: undefined,
    emailFornecedor: '',
  });
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
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
      console.log(`[FornecedoresComponent] ${message}`, ...args);
    }
  };

  const loadUserData = useCallback(() => {
    try {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setCanRead(hasPermission('listar_fornecedor'));
      setCanCreate(hasPermission('criar_fornecedor'));
      setCanUpdate(hasPermission('atualizar_fornecedor'));
      setCanDelete(hasPermission('eliminar_fornecedor'));
      log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchFornecedores = useCallback(async () => {
    if (!canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar fornecedores!',
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
      const data = await timeoutPromise(getAllSuppliers(), 10000);
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllSuppliers não é um array');
      }
      setFornecedores(data ?? []);
      log('Fornecedores carregados:', data);
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error);
      let errorMessage = 'Erro ao carregar fornecedores';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar fornecedores';
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
        await fetchFornecedores();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchFornecedores, loadUserData, navigate]);

  const handleOpen = useCallback(() => {
    if (!canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar fornecedores!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar fornecedores!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setIsEditing(false);
    setEditId(null);
    setForm({
      nif: '',
      nomeFornecedor: '',
      moradaFornecedor: '',
      telefoneFornecedor: undefined,
      emailFornecedor: '',
    });
    setErrors({});
    setOpenModal(true);
  }, [canCreate, canUpdate, isEditing]);

  const handleClose = useCallback(() => {
    setOpenModal(false);
    setIsEditing(false);
    setEditId(null);
    setForm({
      nif: '',
      nomeFornecedor: '',
      moradaFornecedor: '',
      telefoneFornecedor: undefined,
      emailFornecedor: '',
    });
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir fornecedores!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeleteFornecedorId(id);
      setOpenConfirmDelete(true);
    },
    [canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteFornecedorId(null);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: name === 'telefoneFornecedor' ? (value ? Number(value) : undefined) : value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nomeFornecedor?.trim()) newErrors.nomeFornecedor = 'Nome é obrigatório';
    if (!form.telefoneFornecedor) newErrors.telefoneFornecedor = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const onSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!canCreate && !isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar fornecedores!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && isEditing) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar fornecedores!',
      });
      log('Permissão de atualização negada');
      return;
    }
    try {
      setLoadingSave(true);
      setAlert(null);
      const supplierData: Fornecedor = {
        nif: form.nif || '',
        nomeFornecedor: form.nomeFornecedor || '',
        moradaFornecedor: form.moradaFornecedor || '',
        telefoneFornecedor: form.telefoneFornecedor,
        emailFornecedor: form.emailFornecedor || '',
      };
      if (isEditing && editId !== null) {
        const updatedFornecedor = await updateSupplier(editId, supplierData);
        setFornecedores((prev) =>
          prev.map((item) => (item.id === editId ? updatedFornecedor : item)),
        );
        setAlert({ severity: 'success', message: 'Fornecedor atualizado com sucesso!' });
        log('Fornecedor atualizado:', { id: editId, ...supplierData });
      } else {
        const newFornecedor = await createSupplier(supplierData);
        setFornecedores((prev) => [...prev, newFornecedor]);
        setAlert({ severity: 'success', message: 'Fornecedor cadastrado com sucesso!' });
        log('Fornecedor criado:', newFornecedor);
      }
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedor:', error);
      let errorMessage = 'Erro ao salvar fornecedor';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Já existe um fornecedor com esse NIF';
        } else if (error.response.status === 403) {
          errorMessage = `Permissão negada para ${isEditing ? 'atualizar' : 'criar'} fornecedores`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Dados inválidos';
        }
      }
      setAlert({ severity: 'error', message: errorMessage });
      setErrors({ nomeFornecedor: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoadingSave(false);
    }
  }, [canCreate, canUpdate, isEditing, editId, form, handleClose]);

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir fornecedores!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deleteFornecedorId) {
      setAlert({ severity: 'error', message: 'ID do fornecedor não fornecido' });
      return;
    }
    try {
      setLoadingDelete(true);
      setAlert(null);
      const supplierToDelete = fornecedores.find((supplier) => supplier.id === deleteFornecedorId);
      if (!supplierToDelete) {
        throw new Error('Fornecedor não encontrado');
      }
      setFornecedores((prev) => prev.filter((item) => item.id !== deleteFornecedorId));
      await deleteSupplier(deleteFornecedorId);
      setAlert({ severity: 'success', message: 'Fornecedor excluído com sucesso!' });
      log('Fornecedor excluído:', deleteFornecedorId);
      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir fornecedor:', error);
      let errorMessage = 'Erro ao excluir fornecedor';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Fornecedor não encontrado no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message ||
            'Fornecedor não pode ser excluído (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir fornecedores';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }
      if (supplierToDelete) {
        setFornecedores((prev) =>
          [...prev, supplierToDelete].sort((a, b) =>
            (a.nomeFornecedor || '').localeCompare(b.nomeFornecedor || ''),
          ),
        );
      }
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoadingDelete(false);
    }
  }, [canDelete, deleteFornecedorId, fornecedores, handleCloseConfirmDelete]);

  const handleEdit = useCallback(
    (fornecedor: Fornecedor) => {
      if (!canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar fornecedores!',
        });
        log('Permissão de atualização negada');
        return;
      }
      if (!fornecedor.id) {
        setAlert({ severity: 'error', message: 'Fornecedor não encontrado para edição' });
        return;
      }
      setIsEditing(true);
      setEditId(fornecedor.id);
      setForm({
        nif: fornecedor.nif || '',
        nomeFornecedor: fornecedor.nomeFornecedor || '',
        moradaFornecedor: fornecedor.moradaFornecedor || '',
        telefoneFornecedor: fornecedor.telefoneFornecedor,
        emailFornecedor: fornecedor.emailFornecedor || '',
      });
      setErrors({});
      setOpenModal(true);
      log('Editando fornecedor:', fornecedor);
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
            <Typography variant="h5">Cadastrar Fornecedor</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              disabled={loadingFetch || loadingSave || !canCreate}
              title={!canCreate ? 'Você não tem permissão para criar fornecedores' : ''}
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
              {isEditing ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loadingSave}>
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nif"
                label="NIF"
                variant="filled"
                fullWidth
                value={form.nif || ''}
                onChange={handleChange}
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nomeFornecedor"
                label="Nome"
                variant="filled"
                fullWidth
                value={form.nomeFornecedor || ''}
                onChange={handleChange}
                error={!!errors.nomeFornecedor}
                helperText={errors.nomeFornecedor}
                disabled={loadingSave}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="telefoneFornecedor"
                label="Telefone"
                variant="filled"
                type="number"
                fullWidth
                value={form.telefoneFornecedor ?? ''}
                onChange={handleChange}
                error={!!errors.telefoneFornecedor}
                helperText={errors.telefoneFornecedor}
                disabled={loadingSave}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emailFornecedor"
                label="Email"
                variant="filled"
                fullWidth
                value={form.emailFornecedor || ''}
                onChange={handleChange}
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="moradaFornecedor"
                label="Endereço"
                variant="filled"
                fullWidth
                value={form.moradaFornecedor || ''}
                onChange={handleChange}
                disabled={loadingSave}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onSubmit}
                disabled={loadingSave || (!canCreate && !isEditing) || (!canUpdate && isEditing)}
                title={
                  !canCreate && !isEditing
                    ? 'Você não tem permissão para criar fornecedores'
                    : !canUpdate && isEditing
                      ? 'Você não tem permissão para atualizar fornecedores'
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
                  {['NIF', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
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
                ) : fornecedores.length > 0 ? (
                  fornecedores.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nif || 'Sem NIF'}</TableCell>
                      <TableCell>{item.nomeFornecedor || 'Sem nome'}</TableCell>
                      <TableCell>{item.telefoneFornecedor || 'Sem telefone'}</TableCell>
                      <TableCell>{item.emailFornecedor || 'Sem email'}</TableCell>
                      <TableCell>{item.moradaFornecedor || 'Sem endereço'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(item)}
                          disabled={loadingFetch || loadingDelete || !canUpdate}
                          title={
                            !canUpdate ? 'Você não tem permissão para atualizar fornecedores' : ''
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(item.id!)}
                          disabled={loadingFetch || loadingDelete || !canDelete}
                          title={
                            !canDelete ? 'Você não tem permissão para excluir fornecedores' : ''
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum fornecedor encontrado.
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
            Tem certeza que deseja excluir este fornecedor?
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
              title={!canDelete ? 'Você não tem permissão para excluir fornecedores' : ''}
            >
              {loadingDelete ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default Fornecedores;
