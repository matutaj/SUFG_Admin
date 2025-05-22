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
import { getAllShelves, createShelf, updateShelf, deleteShelf } from '../../api/methods';
import { Prateleira } from '../../types/models';
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

interface Permissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const PrateleiraComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openPrateleira, setOpenPrateleira] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [deletePrateleiraId, setDeletePrateleiraId] = useState<string | null>(null);
  const [editPrateleiraId, setEditPrateleiraId] = useState<string | null>(null);
  const [nomePrateleira, setNomePrateleira] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prateleiras, setPrateleiras] = useState<Prateleira[]>([]);
  const [filteredPrateleiras, setFilteredPrateleiras] = useState<Prateleira[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<{
    nomePrateleira?: string;
    descricao?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [permissions, setPermissions] = useState<Permissions>({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PrateleiraComponent] ${message}`, ...args);
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
            hasPermission('listar_prateleira'),
            hasPermission('criar_prateleira'),
            hasPermission('atualizar_prateleira'),
            hasPermission('eliminar_prateleira'),
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

  const fetchShelves = useCallback(async () => {
    if (!permissions.canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar prateleiras!',
      });
      log('Permissão de leitura negada');
      return;
    }
    try {
      setLoading(true);
      const timeoutPromise = (promise: Promise<any>, time: number) =>
        Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tempo limite excedido')), time),
          ),
        ]);
      const data = await timeoutPromise(getAllShelves(), 10000);
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllShelves não é um array');
      }
      setPrateleiras(data ?? []);
      setFilteredPrateleiras(data ?? []);
      setPage(0);
      log('Prateleiras carregadas:', data);
    } catch (error: any) {
      let errorMessage = 'Erro ao carregar prateleiras';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar prateleiras';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      } else if (error.message === 'Tempo limite excedido') {
        errorMessage = 'A requisição demorou muito para responder';
      }
      setAlert({ severity: 'error', message: errorMessage });
      log('Erro ao buscar prateleiras:', error);
    } finally {
      setLoading(false);
    }
  }, [permissions.canRead]);

  useEffect(() => {
    if (permissions.canRead) {
      fetchShelves();
    }
  }, [fetchShelves, permissions.canRead]);

  const handleOpen = useCallback(() => {
    if (!permissions.canCreate && !editPrateleiraId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar prateleiras!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!permissions.canUpdate && editPrateleiraId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar prateleiras!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setOpenPrateleira(true);
  }, [permissions.canCreate, permissions.canUpdate, editPrateleiraId]);

  const handleClose = useCallback(() => {
    setOpenPrateleira(false);
    setEditPrateleiraId(null);
    setNomePrateleira('');
    setDescricao('');
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!permissions.canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir prateleiras!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeletePrateleiraId(id);
      setOpenConfirmDelete(true);
    },
    [permissions.canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeletePrateleiraId(null);
  }, []);

  const onAddPrateleiraSubmit = useCallback(
    async (nomePrateleira: string, descricao: string) => {
      if (!permissions.canCreate && !editPrateleiraId) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para criar prateleiras!',
        });
        log('Permissão de criação negada');
        return;
      }
      if (!permissions.canUpdate && editPrateleiraId) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar prateleiras!',
        });
        log('Permissão de atualização negada');
        return;
      }
      const newErrors: { nomePrateleira?: string; descricao?: string } = {};
      if (!nomePrateleira.trim()) newErrors.nomePrateleira = 'O nome da prateleira é obrigatório.';
      if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        setLoading(true);
        setAlert(null);
        const shelfData: Prateleira = {
          nomePrateleira: nomePrateleira.trim(),
          descricao: descricao.trim(),
        };

        if (editPrateleiraId) {
          const updatedShelf = await updateShelf(editPrateleiraId, shelfData);
          setPrateleiras((prev) =>
            prev.map((prat) => (prat.id === editPrateleiraId ? updatedShelf : prat)),
          );
          setFilteredPrateleiras((prev) =>
            prev.map((prat) => (prat.id === editPrateleiraId ? updatedShelf : prat)),
          );
          setAlert({ severity: 'success', message: 'Prateleira atualizada com sucesso!' });
          log('Prateleira atualizada:', { id: editPrateleiraId, ...shelfData });
        } else {
          const newShelf = await createShelf(shelfData);
          setPrateleiras((prev) => [...prev, newShelf]);
          setFilteredPrateleiras((prev) => [...prev, newShelf]);
          setAlert({ severity: 'success', message: 'Prateleira cadastrada com sucesso!' });
          log('Prateleira criada:', newShelf);
        }
        setPage(0);
        handleClose();
      } catch (error: any) {
        let errorMessage = 'Erro ao salvar prateleira';
        if (error.response) {
          if (error.response.status === 409) {
            errorMessage = 'Já existe uma prateleira com esse nome';
          } else if (error.response.status === 403) {
            errorMessage = `Permissão negada para ${editPrateleiraId ? 'atualizar' : 'criar'} prateleiras`;
          } else if (error.response.status === 400) {
            errorMessage = error.response.data?.message || 'Dados inválidos';
          }
        }
        setAlert({ severity: 'error', message: errorMessage });
        setErrors({ nomePrateleira: 'Erro ao salvar. Tente novamente.' });
        log('Erro ao salvar prateleira:', error);
      } finally {
        setLoading(false);
      }
    },
    [permissions.canCreate, permissions.canUpdate, editPrateleiraId, handleClose],
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (!permissions.canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar prateleiras!',
        });
        log('Permissão de atualização negada');
        return;
      }
      const prateleiraToEdit = prateleiras.find((prat) => prat.id === id);
      if (prateleiraToEdit) {
        setNomePrateleira(prateleiraToEdit.nomePrateleira || '');
        setDescricao(prateleiraToEdit.descricao || '');
        setEditPrateleiraId(id);
        handleOpen();
        log('Editando prateleira:', prateleiraToEdit);
      } else {
        setAlert({ severity: 'error', message: 'Prateleira não encontrada para edição' });
      }
    },
    [permissions.canUpdate, prateleiras, handleOpen],
  );

  const handleDelete = useCallback(async () => {
    if (!permissions.canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir prateleiras!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deletePrateleiraId) {
      setAlert({ severity: 'error', message: 'ID da prateleira não fornecido' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);
      const shelfToDelete = prateleiras.find((prat) => prat.id === deletePrateleiraId);
      if (!shelfToDelete) {
        throw new Error('Prateleira não encontrada');
      }
      setPrateleiras((prev) => prev.filter((prat) => prat.id !== deletePrateleiraId));
      setFilteredPrateleiras((prev) => prev.filter((prat) => prat.id !== deletePrateleiraId));
      await deleteShelf(deletePrateleiraId);
      setAlert({ severity: 'success', message: 'Prateleira excluída com sucesso!' });
      log('Prateleira excluída:', deletePrateleiraId);
      const totalPages = Math.ceil((prateleiras.length - 1) / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
      handleCloseConfirmDelete();
    } catch (error: any) {
      let errorMessage = 'Erro ao excluir prateleira';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Prateleira não encontrada no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message ||
            'Prateleira não pode ser excluída (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir prateleiras';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }
      if (shelfToDelete) {
        setPrateleiras((prev) =>
          [...prev, shelfToDelete].sort((a, b) =>
            (a.nomePrateleira || '').localeCompare(b.nomePrateleira || ''),
          ),
        );
        setFilteredPrateleiras((prev) =>
          [...prev, shelfToDelete].sort((a, b) =>
            (a.nomePrateleira || '').localeCompare(b.nomePrateleira || ''),
          ),
        );
      }
      setAlert({ severity: 'error', message: errorMessage });
      log('Erro ao excluir prateleira:', error);
    } finally {
      setLoading(false);
    }
  }, [
    permissions.canDelete,
    deletePrateleiraId,
    prateleiras,
    page,
    rowsPerPage,
    handleCloseConfirmDelete,
  ]);

  const handleSearch = useCallback(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredPrateleiras(prateleiras);
    } else {
      const filtered = prateleiras.filter(
        (prateleira) =>
          (prateleira.nomePrateleira?.toLowerCase()?.includes(query) ?? false) ||
          (prateleira.descricao?.toLowerCase()?.includes(query) ?? false),
      );
      setFilteredPrateleiras(filtered);
    }
    setPage(0);
  }, [searchQuery, prateleiras]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);

  const paginatedPrateleiras = useMemo(
    () => filteredPrateleiras.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredPrateleiras, page, rowsPerPage],
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
            <Typography id="modal-modal-title" variant="h5" component="h2">
              Cadastrar Prateleira
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                id="search-shelf"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Pesquisar Prateleira"
                variant="outlined"
                size="small"
                disabled={loading || !permissions.canRead}
                title={
                  !permissions.canRead ? 'Você não tem permissão para visualizar prateleiras' : ''
                }
              />
              <Button
                variant="contained"
                color="secondary"
                sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                onClick={handleOpen}
                disabled={loading || !permissions.canCreate}
                title={
                  !permissions.canCreate ? 'Você não tem permissão para criar prateleiras' : ''
                }
              >
                <Typography variant="body2">Adicionar</Typography>
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>
      <Modal
        open={openPrateleira}
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
            <Typography id="modal-modal-title" variant="h5" component="h2">
              {editPrateleiraId ? 'Editar Prateleira' : 'Cadastrar Prateleira'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loading}>
              Fechar
            </Button>
          </Stack>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              id="shelf-name"
              onChange={(e) => setNomePrateleira(e.target.value)}
              value={nomePrateleira}
              label="Nome da Prateleira"
              variant="filled"
              sx={{ width: '100%' }}
              error={Boolean(errors.nomePrateleira)}
              helperText={errors.nomePrateleira}
              disabled={
                loading || (editPrateleiraId ? !permissions.canUpdate : !permissions.canCreate)
              }
              required
              title={
                editPrateleiraId
                  ? !permissions.canUpdate
                    ? 'Você não tem permissão para atualizar prateleiras'
                    : ''
                  : !permissions.canCreate
                    ? 'Você não tem permissão para criar prateleiras'
                    : ''
              }
            />
            <TextField
              id="shelf-description"
              onChange={(e) => setDescricao(e.target.value)}
              value={descricao}
              label="Descrição"
              variant="filled"
              sx={{ width: '100%' }}
              error={Boolean(errors.descricao)}
              helperText={errors.descricao}
              disabled={
                loading || (editPrateleiraId ? !permissions.canUpdate : !permissions.canCreate)
              }
              required
              title={
                editPrateleiraId
                  ? !permissions.canUpdate
                    ? 'Você não tem permissão para atualizar prateleiras'
                    : ''
                  : !permissions.canCreate
                    ? 'Você não tem permissão para criar prateleiras'
                    : ''
              }
            />
            <Button
              variant="contained"
              color="secondary"
              sx={{ height: 40, width: '100%' }}
              onClick={() => onAddPrateleiraSubmit(nomePrateleira, descricao)}
              disabled={
                loading || (editPrateleiraId ? !permissions.canUpdate : !permissions.canCreate)
              }
              title={
                editPrateleiraId
                  ? !permissions.canUpdate
                    ? 'Você não tem permissão para atualizar prateleiras'
                    : ''
                  : !permissions.canCreate
                    ? 'Você não tem permissão para criar prateleiras'
                    : ''
              }
            >
              <Typography variant="body2">
                {loading ? 'Salvando...' : editPrateleiraId ? 'Atualizar' : 'Cadastrar'}
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
                    <strong>Nome da Prateleira</strong>
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
                ) : paginatedPrateleiras.length > 0 ? (
                  paginatedPrateleiras.map((prateleira) => (
                    <TableRow key={prateleira.id}>
                      <TableCell>{prateleira.nomePrateleira || 'Sem nome'}</TableCell>
                      <TableCell>{prateleira.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(prateleira.id!)}
                          disabled={loading || !permissions.canUpdate}
                          title={
                            !permissions.canUpdate
                              ? 'Você não tem permissão para atualizar prateleiras'
                              : ''
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(prateleira.id!)}
                          disabled={loading || !permissions.canDelete}
                          title={
                            !permissions.canDelete
                              ? 'Você não tem permissão para excluir prateleiras'
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
                      Nenhuma prateleira encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[6, 12, 24]}
            component="div"
            count={filteredPrateleiras.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
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
          <Typography id="confirm-delete-modal-title" variant="h6" component="h2" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography id="confirm-delete-modal-description" sx={{ mb: 3 }}>
            Tem certeza que deseja excluir a prateleira "
            {prateleiras.find((p) => p.id === deletePrateleiraId)?.nomePrateleira}"? Esta ação não
            pode ser desfeita.
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
              title={
                !permissions.canDelete ? 'Você não tem permissão para excluir prateleiras' : ''
              }
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default PrateleiraComponent;
