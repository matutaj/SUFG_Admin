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
  const rowsPerPage = 6;

  // Permission states
  const [canRead, setCanRead] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Logging function for debugging
  const log = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  };

  const handleOpen = useCallback(() => {
    if (!canCreate && !editPrateleiraId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar prateleiras!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && editPrateleiraId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar prateleiras!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setOpenPrateleira(true);
  }, [canCreate, canUpdate, editPrateleiraId]);

  const handleClose = useCallback(() => {
    setOpenPrateleira(false);
    setEditPrateleiraId(null);
    setNomePrateleira('');
    setDescricao('');
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!canDelete) {
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
    [canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeletePrateleiraId(null);
  }, []);

  const loadUserData = useCallback(() => {
    try {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setCanRead(hasPermission('listar_prateleira'));
      setCanCreate(hasPermission('criar_prateleira'));
      setCanUpdate(hasPermission('atualizar_prateleira'));
      setCanDelete(hasPermission('eliminar_prateleira'));
      log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchShelves = useCallback(async () => {
    if (!canRead) {
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
      log('Prateleiras carregadas:', data);
    } catch (error: any) {
      console.error('Erro ao buscar prateleiras:', error);
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
    } finally {
      setLoading(false);
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
        await fetchShelves();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchShelves, loadUserData, navigate]);

  const onAddPrateleiraSubmit = useCallback(
    async (nomePrateleira: string, descricao: string) => {
      if (!canCreate && !editPrateleiraId) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para criar prateleiras!',
        });
        log('Permissão de criação negada');
        return;
      }
      if (!canUpdate && editPrateleiraId) {
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
          await updateShelf(editPrateleiraId, shelfData);
          setAlert({ severity: 'success', message: 'Prateleira atualizada com sucesso!' });
          log('Prateleira atualizada:', { id: editPrateleiraId, ...shelfData });
        } else {
          const newShelf = await createShelf(shelfData);
          setPrateleiras((prev) => [...prev, newShelf]);
          setFilteredPrateleiras((prev) => [...prev, newShelf]);
          setAlert({ severity: 'success', message: 'Prateleira cadastrada com sucesso!' });
          log('Prateleira criada:', newShelf);
        }
        await fetchShelves();
        handleClose();
      } catch (error: any) {
        console.error('Erro ao salvar prateleira:', error);
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
      } finally {
        setLoading(false);
      }
    },
    [canCreate, canUpdate, editPrateleiraId, handleClose, fetchShelves],
  );

  const handleEdit = useCallback(
    (id: string) => {
      if (!canUpdate) {
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
    [canUpdate, prateleiras, handleOpen],
  );

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
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

      // Cache for rollback
      const shelfToDelete = prateleiras.find((prat) => prat.id === deletePrateleiraId);
      if (!shelfToDelete) {
        throw new Error('Prateleira não encontrada');
      }

      // Optimistic update
      setPrateleiras((prev) => prev.filter((prat) => prat.id !== deletePrateleiraId));
      setFilteredPrateleiras((prev) => prev.filter((prat) => prat.id !== deletePrateleiraId));

      await deleteShelf(deletePrateleiraId);
      setAlert({ severity: 'success', message: 'Prateleira excluída com sucesso!' });
      log('Prateleira excluída:', deletePrateleiraId);
      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir prateleira:', error);
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

      // Rollback
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
    } finally {
      setLoading(false);
    }
  }, [canDelete, deletePrateleiraId, prateleiras, handleCloseConfirmDelete]);

  const handleSearch = useMemo(() => {
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
    handleSearch;
  }, [searchQuery, prateleiras]);

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
                disabled={loading || !canRead}
                title={!canRead ? 'Você não tem permissão para visualizar prateleiras' : ''}
              />
              <Button
                variant="contained"
                color="secondary"
                sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                onClick={handleOpen}
                disabled={loading || !canCreate}
                title={!canCreate ? 'Você não tem permissão para criar prateleiras' : ''}
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
              disabled={loading}
              required
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
              disabled={loading}
              required
            />
            <Button
              variant="contained"
              color="secondary"
              sx={{ height: 40, width: '100%' }}
              onClick={() => onAddPrateleiraSubmit(nomePrateleira, descricao)}
              disabled={
                loading || (!canCreate && !editPrateleiraId) || (!canUpdate && editPrateleiraId)
              }
              title={
                !canCreate && !editPrateleiraId
                  ? 'Você não tem permissão para criar prateleiras'
                  : !canUpdate && editPrateleiraId
                    ? 'Você não tem permissão para atualizar prateleiras'
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
                          disabled={loading || !canUpdate}
                          title={
                            !canUpdate ? 'Você não tem permissão para atualizar prateleiras' : ''
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(prateleira.id!)}
                          disabled={loading || !canDelete}
                          title={
                            !canDelete ? 'Você não tem permissão para excluir prateleiras' : ''
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
            rowsPerPageOptions={[rowsPerPage]}
            component="div"
            count={filteredPrateleiras.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            labelRowsPerPage="Itens por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            disabled={loading || !canRead}
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
            Tem certeza que deseja excluir esta prateleira?
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
              disabled={loading || !canDelete}
              title={!canDelete ? 'Você não tem permissão para excluir prateleiras' : ''}
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
