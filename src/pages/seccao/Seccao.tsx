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
import { getAllSections, createSection, updateSection, deleteSection } from '../../api/methods';
import { Seccao } from '../../types/models';
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

const SeccaoComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openSeccao, setOpenSeccao] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [deleteSeccaoId, setDeleteSeccaoId] = useState<string | null>(null);
  const [editSeccaoId, setEditSeccaoId] = useState<string | null>(null);
  const [nomeSeccao, setNomeSeccao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [secoes, setSecoes] = useState<Seccao[]>([]);
  const [filteredSecoes, setFilteredSecoes] = useState<Seccao[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<{
    nomeSeccao?: string;
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
    if (!canCreate && !editSeccaoId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar seções!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && editSeccaoId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar seções!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setOpenSeccao(true);
  }, [canCreate, canUpdate, editSeccaoId]);

  const handleClose = useCallback(() => {
    setOpenSeccao(false);
    setEditSeccaoId(null);
    setNomeSeccao('');
    setDescricao('');
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir seções!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeleteSeccaoId(id);
      setOpenConfirmDelete(true);
    },
    [canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteSeccaoId(null);
  }, []);

  const loadUserData = useCallback(() => {
    try {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setCanRead(hasPermission('listar_seccao'));
      setCanCreate(hasPermission('criar_seccao'));
      setCanUpdate(hasPermission('atualizar_seccao'));
      setCanDelete(hasPermission('eliminar_seccao'));
      log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchSections = useCallback(async () => {
    if (!canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar seções!',
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
      const data = await timeoutPromise(getAllSections(), 10000);
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllSections não é um array');
      }
      setSecoes(data ?? []);
      setFilteredSecoes(data ?? []);
      log('Seções carregadas:', data);
    } catch (error: any) {
      console.error('Erro ao buscar seções:', error);
      let errorMessage = 'Erro ao carregar seções';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar seções';
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
        await fetchSections();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchSections, loadUserData, navigate]);

  const onAddSeccaoSubmit = useCallback(async () => {
    if (!canCreate && !editSeccaoId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar seções!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && editSeccaoId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar seções!',
      });
      log('Permissão de atualização negada');
      return;
    }
    const newErrors: { nomeSeccao?: string; descricao?: string } = {};
    if (!nomeSeccao.trim()) newErrors.nomeSeccao = 'O nome da seção é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setAlert(null);
      const sectionData: Seccao = {
        nomeSeccao: nomeSeccao.trim(),
        descricao: descricao.trim(),
      };

      if (editSeccaoId) {
        await updateSection(editSeccaoId, sectionData);
        setAlert({ severity: 'success', message: 'Seção atualizada com sucesso!' });
        log('Seção atualizada:', { id: editSeccaoId, ...sectionData });
      } else {
        const newSection = await createSection(sectionData);
        setSecoes((prev) => [...prev, newSection]);
        setFilteredSecoes((prev) => [...prev, newSection]);
        setAlert({ severity: 'success', message: 'Seção cadastrada com sucesso!' });
        log('Seção criada:', newSection);
      }
      await fetchSections();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar seção:', error);
      let errorMessage = 'Erro ao salvar seção';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Já existe uma seção com esse nome';
        } else if (error.response.status === 403) {
          errorMessage = `Permissão negada para ${editSeccaoId ? 'atualizar' : 'criar'} seções`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Dados inválidos';
        }
      }
      setAlert({ severity: 'error', message: errorMessage });
      setErrors({ nomeSeccao: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }, [canCreate, canUpdate, editSeccaoId, nomeSeccao, descricao, handleClose, fetchSections]);

  const handleEdit = useCallback(
    (id: string) => {
      if (!canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar seções!',
        });
        log('Permissão de atualização negada');
        return;
      }
      const seccaoToEdit = secoes.find((sec) => sec.id === id);
      if (seccaoToEdit) {
        setNomeSeccao(seccaoToEdit.nomeSeccao || '');
        setDescricao(seccaoToEdit.descricao || '');
        setEditSeccaoId(id);
        handleOpen();
        log('Editando seção:', seccaoToEdit);
      } else {
        setAlert({ severity: 'error', message: 'Seção não encontrada para edição' });
      }
    },
    [canUpdate, secoes, handleOpen],
  );

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir seções!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deleteSeccaoId) {
      setAlert({ severity: 'error', message: 'ID da seção não fornecido' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      // Cache for rollback
      const sectionToDelete = secoes.find((sec) => sec.id === deleteSeccaoId);
      if (!sectionToDelete) {
        throw new Error('Seção não encontrada');
      }

      // Optimistic update
      setSecoes((prev) => prev.filter((sec) => sec.id !== deleteSeccaoId));
      setFilteredSecoes((prev) => prev.filter((sec) => sec.id !== deleteSeccaoId));

      await deleteSection(deleteSeccaoId);
      setAlert({ severity: 'success', message: 'Seção excluída com sucesso!' });
      log('Seção excluída:', deleteSeccaoId);
      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir seção:', error);
      let errorMessage = 'Erro ao excluir seção';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Seção não encontrada no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message || 'Seção não pode ser excluída (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir seções';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }

      // Rollback
      if (sectionToDelete) {
        setSecoes((prev) =>
          [...prev, sectionToDelete].sort((a, b) =>
            (a.nomeSeccao || '').localeCompare(b.nomeSeccao || ''),
          ),
        );
        setFilteredSecoes((prev) =>
          [...prev, sectionToDelete].sort((a, b) =>
            (a.nomeSeccao || '').localeCompare(b.nomeSeccao || ''),
          ),
        );
      }

      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [canDelete, deleteSeccaoId, secoes, handleCloseConfirmDelete]);

  const handleSearch = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredSecoes(secoes);
    } else {
      const filtered = secoes.filter(
        (seccao) =>
          (seccao.nomeSeccao?.toLowerCase()?.includes(query) ?? false) ||
          (seccao.descricao?.toLowerCase()?.includes(query) ?? false),
      );
      setFilteredSecoes(filtered);
    }
    setPage(0);
  }, [searchQuery, secoes]);

  useEffect(() => {
    handleSearch;
  }, [searchQuery, secoes]);

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

  const paginatedSecoes = useMemo(
    () => filteredSecoes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredSecoes, page, rowsPerPage],
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
            <Typography variant="h5">Cadastrar Seção</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                id="search-section"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Pesquisar Seção"
                variant="outlined"
                size="small"
                disabled={loading || !canRead}
                title={!canRead ? 'Você não tem permissão para visualizar seções' : ''}
              />
              <Button
                variant="contained"
                color="secondary"
                sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                onClick={handleOpen}
                disabled={loading || !canCreate}
                title={!canCreate ? 'Você não tem permissão para criar seções' : ''}
              >
                <Typography variant="body2">Adicionar</Typography>
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>
      <Modal
        open={openSeccao}
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
              {editSeccaoId ? 'Editar Seção' : 'Cadastrar Seção'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loading}>
              Fechar
            </Button>
          </Stack>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              id="section-name"
              onChange={(e) => setNomeSeccao(e.target.value)}
              value={nomeSeccao}
              label="Nome da Seção"
              variant="filled"
              error={Boolean(errors.nomeSeccao)}
              helperText={errors.nomeSeccao}
              disabled={loading}
              fullWidth
              required
            />
            <TextField
              id="section-description"
              onChange={(e) => setDescricao(e.target.value)}
              value={descricao}
              label="Descrição"
              variant="filled"
              error={Boolean(errors.descricao)}
              helperText={errors.descricao}
              disabled={loading}
              fullWidth
              required
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={onAddSeccaoSubmit}
              disabled={loading || (!canCreate && !editSeccaoId) || (!canUpdate && editSeccaoId)}
              fullWidth
              title={
                !canCreate && !editSeccaoId
                  ? 'Você não tem permissão para criar seções'
                  : !canUpdate && editSeccaoId
                    ? 'Você não tem permissão para atualizar seções'
                    : ''
              }
            >
              <Typography variant="body2">
                {loading ? 'Salvando...' : editSeccaoId ? 'Atualizar' : 'Cadastrar'}
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
                    <strong>Nome da Seção</strong>
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
                ) : paginatedSecoes.length > 0 ? (
                  paginatedSecoes.map((seccao) => (
                    <TableRow key={seccao.id}>
                      <TableCell>{seccao.nomeSeccao || 'Sem nome'}</TableCell>
                      <TableCell>{seccao.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(seccao.id!)}
                          disabled={loading || !canUpdate}
                          title={!canUpdate ? 'Você não tem permissão para atualizar seções' : ''}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(seccao.id!)}
                          disabled={loading || !canDelete}
                          title={!canDelete ? 'Você não tem permissão para excluir seções' : ''}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhuma seção encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[rowsPerPage]}
            component="div"
            count={filteredSecoes.length}
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
            Tem certeza que deseja excluir esta seção?
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
              title={!canDelete ? 'Você não tem permissão para excluir seções' : ''}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default SeccaoComponent;
