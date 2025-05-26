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
  CircularProgress,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { getAllCorridors, createCorridor, updateCorridor, deleteCorridor } from '../../api/methods';
import { Corredor } from '../../types/models';
import { getUserData, hasPermission } from '../../api/authUtils';
import { useNavigate } from 'react-router-dom';

interface CollapsedItemProps {
  open: boolean;
}

interface Permissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '60%', sm: '50%', md: 650 },
  maxHeight: '60%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'start' as const,
  alignItems: 'center' as const,
  backgroundColor: '#f9f9f9',
  p: 4,
  overflowY: 'auto' as const,
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#6c63ff #f1f1f1',
  borderRadius: 1,
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

const CorredorComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openCorredor, setOpenCorredor] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [deleteCorredorId, setDeleteCorredorId] = useState<string | null>(null);
  const [editCorredorId, setEditCorredorId] = useState<string | null>(null);
  const [nomeCorredor, setNomeCorredor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [corredores, setCorredores] = useState<Corredor[]>([]);
  const [filteredCorredores, setFilteredCorredores] = useState<Corredor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<{
    nomeCorredor?: string;
    descricao?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 6;
  const [permissions, setPermissions] = useState<Permissions>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  };

  const handleOpen = useCallback(() => {
    if (!permissions.canCreate && !editCorredorId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar corredores!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!permissions.canUpdate && editCorredorId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar corredores!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setOpenCorredor(true);
  }, [permissions.canCreate, permissions.canUpdate, editCorredorId]);

  const handleClose = useCallback(() => {
    setOpenCorredor(false);
    setEditCorredorId(null);
    setNomeCorredor('');
    setDescricao('');
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!permissions.canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir corredores!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeleteCorredorId(id);
      setOpenConfirmDelete(true);
    },
    [permissions.canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteCorredorId(null);
  }, []);

  const loadUserDataAndPermissions = useCallback(async () => {
    try {
      const userData = await getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      const [canRead, canCreate, canUpdate, canDelete] = await Promise.all([
        hasPermission('listar_corredor'),
        hasPermission('criar_corredor'),
        hasPermission('atualizar_corredor'),
        hasPermission('eliminar_corredor'),
      ]);
      setPermissions({ canRead, canCreate, canUpdate, canDelete });
      log('Permissões carregadas:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserDataAndPermissions:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchCorridors = useCallback(async () => {
    try {
      setLoading(true);
      const timeoutPromise = (promise: Promise<any>, time: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido')), time),
          ),
        ]);
      const data = await timeoutPromise(getAllCorridors(), 10000);
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllCorridors não é um array');
      }
      setCorredores(data ?? []);
      setFilteredCorredores(data ?? []);
      log('Corredores carregados:', data);
    } catch (error: any) {
      console.error('Erro ao buscar corredores:', error);
      let errorMessage = 'Erro ao carregar corredores';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar corredores';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      } else if (error.message === 'Tempo limite excedido') {
        errorMessage = 'A requisição demorou muito para responder';
      }
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [permissions.canRead]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const id = await loadUserDataAndPermissions();
        if (!id) {
          navigate('/login');
          return;
        }
        await fetchCorridors();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchCorridors, loadUserDataAndPermissions, navigate]);

  const onAddCorredorSubmit = useCallback(
    async (nomeCorredor: string, descricao: string) => {
      if (!permissions.canCreate && !editCorredorId) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para criar corredores!',
        });
        log('Permissão de criação negada');
        return;
      }
      if (!permissions.canUpdate && editCorredorId) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar corredores!',
        });
        log('Permissão de atualização negada');
        return;
      }
      const newErrors: { nomeCorredor?: string; descricao?: string } = {};
      if (!nomeCorredor.trim()) newErrors.nomeCorredor = 'O nome do corredor é obrigatório.';
      if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        setLoading(true);
        setAlert(null);
        const corridorData: Corredor = {
          nomeCorredor: nomeCorredor.trim(),
          descricao: descricao.trim(),
        };

        if (editCorredorId) {
          await updateCorridor(editCorredorId, corridorData);
          setAlert({ severity: 'success', message: 'Corredor atualizado com sucesso!' });
          log('Corredor atualizado:', { id: editCorredorId, ...corridorData });
        } else {
          const newCorridor = await createCorridor(corridorData);
          setCorredores((prev) => [...prev, newCorridor]);
          setFilteredCorredores((prev) => [...prev, newCorridor]);
          setAlert({ severity: 'success', message: 'Corredor cadastrado com sucesso!' });
          log('Corredor criado:', newCorridor);
        }
        await fetchCorridors();
        handleClose();
      } catch (error: any) {
        console.error('Erro ao salvar corredor:', error);
        let errorMessage = 'Erro ao salvar corredor';
        if (error.response) {
          if (error.response.status === 409) {
            errorMessage = 'Já existe um corredor com esse nome';
          } else if (error.response.status === 403) {
            errorMessage = `Permissão negada para ${editCorredorId ? 'atualizar' : 'criar'} corredores`;
          } else if (error.response.status === 400) {
            errorMessage = error.response.data?.message || 'Dados inválidos';
          }
        }
        setAlert({ severity: 'error', message: errorMessage });
        setErrors({ nomeCorredor: 'Erro ao salvar. Tente novamente.' });
      } finally {
        setLoading(false);
      }
    },
    [permissions.canCreate, permissions.canUpdate, editCorredorId, handleClose, fetchCorridors],
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (!permissions.canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar corredores!',
        });
        log('Permissão de atualização negada');
        return;
      }
      const corredorToEdit = corredores.find((corr) => corr.id === id);
      if (corredorToEdit) {
        setNomeCorredor(corredorToEdit.nomeCorredor || '');
        setDescricao(corredorToEdit.descricao || '');
        setEditCorredorId(id);
        handleOpen();
        log('Editando corredor:', corredorToEdit);
      } else {
        setAlert({ severity: 'error', message: 'Corredor não encontrado para edição' });
      }
    },
    [permissions.canUpdate, corredores, handleOpen],
  );

  const handleDelete = useCallback(async () => {
    if (!permissions.canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir corredores!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deleteCorredorId) {
      setAlert({ severity: 'error', message: 'ID do corredor não fornecido' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      // Cache for rollback
      const corridorToDelete = corredores.find((corr) => corr.id === deleteCorredorId);
      if (!corridorToDelete) {
        throw new Error('Corredor não encontrado');
      }

      // Optimistic update
      setCorredores((prev) => prev.filter((corr) => corr.id !== deleteCorredorId));
      setFilteredCorredores((prev) => prev.filter((corr) => corr.id !== deleteCorredorId));

      await deleteCorridor(deleteCorredorId);
      setAlert({ severity: 'success', message: 'Corredor excluído com sucesso!' });
      log('Corredor excluído:', deleteCorredorId);

      // Adjust page if necessary
      const totalPages = Math.ceil((filteredCorredores.length - 1) / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }

      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir corredor:', error);
      let errorMessage = 'Erro ao excluir corredor';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Corredor não encontrado no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message || 'Corredor não pode ser excluído (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir corredores';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }

      // Rollback
      if (corridorToDelete) {
        setCorredores((prev) =>
          [...prev, corridorToDelete].sort((a, b) =>
            (a.nomeCorredor || '').localeCompare(b.nomeCorredor || ''),
          ),
        );
        setFilteredCorredores((prev) =>
          [...prev, corridorToDelete].sort((a, b) =>
            (a.nomeCorredor || '').localeCompare(b.nomeCorredor || ''),
          ),
        );
      }

      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [
    permissions.canDelete,
    deleteCorredorId,
    corredores,
    filteredCorredores.length,
    page,
    rowsPerPage,
    handleCloseConfirmDelete,
  ]);

  const handleSearch = useCallback(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredCorredores(corredores);
    } else {
      const filtered = corredores.filter(
        (corredor) =>
          (corredor.nomeCorredor?.toLowerCase()?.includes(query) ?? false) ||
          (corredor.descricao?.toLowerCase()?.includes(query) ?? false),
      );
      setFilteredCorredores(filtered);
    }
    setPage(0);
  }, [searchQuery, corredores]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    [],
  );

  const paginatedCorredores = useMemo(
    () => filteredCorredores.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredCorredores, page, rowsPerPage],
  );

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999, minWidth: 300 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}
      <Paper sx={(theme) => ({ p: theme.spacing(2, 2.5), width: '100%' })}>
        <Collapse in={open}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">Cadastrar Corredor</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                id="search-corridor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Pesquisar Corredor"
                variant="outlined"
                size="small"
                disabled={loading || !permissions.canRead}
              />
              <Button
                variant="contained"
                color="secondary"
                sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                onClick={handleOpen}
                disabled={loading || !permissions.canCreate}
                title={!permissions.canCreate ? 'Você não tem permissão para criar corredores' : ''}
              >
                <Typography variant="body2">Adicionar</Typography>
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>
      <Modal
        open={openCorredor}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-modal-title" variant="h5">
              {editCorredorId ? 'Editar Corredor' : 'Cadastrar Corredor'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loading}>
              Fechar
            </Button>
          </Stack>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              id="corridor-name"
              onChange={(e) => setNomeCorredor(e.target.value)}
              value={nomeCorredor}
              label="Nome do Corredor"
              variant="filled"
              error={Boolean(errors.nomeCorredor)}
              helperText={errors.nomeCorredor}
              disabled={loading}
              required
              fullWidth
            />
            <TextField
              id="corridor-description"
              onChange={(e) => setDescricao(e.target.value)}
              value={descricao}
              label="Descrição"
              variant="filled"
              error={Boolean(errors.descricao)}
              helperText={errors.descricao}
              disabled={loading}
              required
              fullWidth
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => onAddCorredorSubmit(nomeCorredor, descricao)}
              disabled={
                loading ||
                (!permissions.canCreate && !editCorredorId) ||
                (!permissions.canUpdate && editCorredorId)
              }
              title={
                !permissions.canCreate && !editCorredorId
                  ? 'Você não tem permissão para criar corredores'
                  : !permissions.canUpdate && editCorredorId
                    ? 'Você não tem permissão para atualizar corredores'
                    : ''
              }
              fullWidth
            >
              <Typography variant="body2">
                {loading ? 'Salvando...' : editCorredorId ? 'Atualizar' : 'Cadastrar'}
              </Typography>
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome do Corredor</strong>
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
                    <TableCell colSpan={3} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : paginatedCorredores.length > 0 ? (
                  paginatedCorredores.map((corredor) => (
                    <TableRow key={corredor.id}>
                      <TableCell>{corredor.nomeCorredor || 'Sem nome'}</TableCell>
                      <TableCell>{corredor.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(corredor.id!)}
                          disabled={loading || !permissions.canUpdate}
                          title={
                            !permissions.canUpdate
                              ? 'Você não tem permissão para atualizar corredores'
                              : ''
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(corredor.id!)}
                          disabled={loading || !permissions.canDelete}
                          title={
                            !permissions.canDelete
                              ? 'Você não tem permissão para excluir corredores'
                              : ''
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhum corredor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[rowsPerPage]}
            component="div"
            count={filteredCorredores.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            labelRowsPerPage="Itens por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            disabled={loading || !permissions.canRead}
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
          <Typography id="confirm-delete-modal-title" variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography id="confirm-delete-modal-description" sx={{ mb: 3 }}>
            Tem certeza que deseja excluir este corredor?
          </Typography>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCloseConfirmDelete}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={loading || !permissions.canDelete}
              title={!permissions.canDelete ? 'Você não tem permissão para excluir corredores' : ''}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default CorredorComponent;
