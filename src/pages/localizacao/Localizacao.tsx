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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  CircularProgress,
} from '@mui/material';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { Localizacao, tipo } from '../../types/models';
import { getAllLocations, createLocation, deleteLocation, updateLocation } from '../../api/methods';
import { getUserData, hasPermission } from '../../api/authUtils';
import { useNavigate } from 'react-router-dom';

interface CollapsedItemProps {
  open: boolean;
}

const modalStyle = {
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

const WarehouseComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const navigate = useNavigate();
  const [openWarehouseModal, setOpenWarehouseModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [deleteWarehouseId, setDeleteWarehouseId] = useState<string | null>(null);
  const [editWarehouseId, setEditWarehouseId] = useState<string | null>(null);
  const [nomeLocalizacao, setNomeLocalizacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoSelecionado, setTipoSelecionado] = useState<tipo | null>(null);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [localizacoesFiltradas, setLocalizacoesFiltradas] = useState<Localizacao[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<{
    nomeLocalizacao?: string;
    descricao?: string;
    tipo?: string;
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
    if (!canCreate && !editWarehouseId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar localizações!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && editWarehouseId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar localizações!',
      });
      log('Permissão de atualização negada');
      return;
    }
    setOpenWarehouseModal(true);
  }, [canCreate, canUpdate, editWarehouseId]);

  const handleClose = useCallback(() => {
    setOpenWarehouseModal(false);
    setEditWarehouseId(null);
    setNomeLocalizacao('');
    setDescricao('');
    setTipoSelecionado(null);
    setErrors({});
  }, []);

  const handleOpenConfirmDelete = useCallback(
    (id: string) => {
      if (!canDelete) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para excluir localizações!',
        });
        log('Permissão de exclusão negada');
        return;
      }
      setDeleteWarehouseId(id);
      setOpenConfirmDelete(true);
    },
    [canDelete],
  );

  const handleCloseConfirmDelete = useCallback(() => {
    setOpenConfirmDelete(false);
    setDeleteWarehouseId(null);
  }, []);

  const loadUserData = useCallback(() => {
    try {
      const userData = getUserData();
      log('Dados do usuário:', userData);
      if (!userData || !userData.id) {
        throw new Error('Usuário não autenticado');
      }
      setCanRead(hasPermission('listar_localizacao'));
      setCanCreate(hasPermission('criar_localizacao'));
      setCanUpdate(hasPermission('atualizar_localizacao'));
      setCanDelete(hasPermission('eliminar_localizacao'));
      log('Permissões:', { canRead, canCreate, canUpdate, canDelete });
      return userData.id;
    } catch (error: any) {
      console.error('Erro em loadUserData:', error);
      setAlert({ severity: 'error', message: error.message });
      navigate('/login');
      return '';
    }
  }, [navigate]);

  const fetchLocalizacoes = useCallback(async () => {
    if (!canRead) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para visualizar localizações!',
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
      const data = await timeoutPromise(getAllLocations(), 10000);
      setLocalizacoes(data ?? []);
      setLocalizacoesFiltradas(data ?? []);
      log('Localizações carregadas:', data);
    } catch (error: any) {
      console.error('Erro ao buscar localizações:', error);
      let errorMessage = 'Erro ao carregar localizações';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Permissão negada para listar localizações';
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
        await fetchLocalizacoes();
      } catch (error) {
        console.error('Erro no initialize:', error);
        setAlert({ severity: 'error', message: 'Erro ao inicializar a página' });
      }
    };
    initialize();
  }, [fetchLocalizacoes, loadUserData, navigate]);

  const getTipoLabel = useCallback((tipoValue: tipo | null | undefined): string => {
    switch (tipoValue) {
      case tipo.Armazem:
        return 'Armazém';
      case tipo.Loja:
        return 'Loja';
      default:
        return 'Sem tipo';
    }
  }, []);

  const handleAddLocation = useCallback(async () => {
    if (!canCreate && !editWarehouseId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para criar localizações!',
      });
      log('Permissão de criação negada');
      return;
    }
    if (!canUpdate && editWarehouseId) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para atualizar localizações!',
      });
      log('Permissão de atualização negada');
      return;
    }
    const newErrors: { nomeLocalizacao?: string; descricao?: string; tipo?: string } = {};
    if (!nomeLocalizacao.trim()) newErrors.nomeLocalizacao = 'O nome da localização é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';
    if (tipoSelecionado === null) newErrors.tipo = 'O tipo de localização é obrigatório.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setAlert(null);
      const locationData: Localizacao = {
        nomeLocalizacao: nomeLocalizacao.trim(),
        descricao: descricao.trim(),
        tipo: tipoSelecionado as tipo,
      };

      if (editWarehouseId) {
        await updateLocation(editWarehouseId, locationData);
        setAlert({ severity: 'success', message: 'Localização atualizada com sucesso!' });
        log('Localização atualizada:', { id: editWarehouseId, ...locationData });
      } else {
        const newLocation = await createLocation(locationData);
        setLocalizacoes((prev) => [...prev, newLocation]);
        setLocalizacoesFiltradas((prev) => [...prev, newLocation]);
        setAlert({ severity: 'success', message: 'Localização cadastrada com sucesso!' });
        log('Localização criada:', newLocation);
      }
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar localização:', error);
      let errorMessage = 'Erro ao salvar localização';
      if (error.response) {
        if (error.response.status === 409) {
          errorMessage = 'Já existe uma localização com esse nome';
        } else if (error.response.status === 403) {
          errorMessage = `Permissão negada para ${editWarehouseId ? 'atualizar' : 'criar'} localizações`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Dados inválidos';
        }
      }
      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [
    canCreate,
    canUpdate,
    editWarehouseId,
    nomeLocalizacao,
    descricao,
    tipoSelecionado,
    handleClose,
  ]);

  const handleEdit = useCallback(
    (id: string) => {
      if (!canUpdate) {
        setAlert({
          severity: 'error',
          message: 'Você não tem permissão para atualizar localizações!',
        });
        log('Permissão de atualização negada');
        return;
      }
      const locationToEdit = localizacoes.find((loc) => loc.id === id);
      if (locationToEdit) {
        setNomeLocalizacao(locationToEdit.nomeLocalizacao || '');
        setDescricao(locationToEdit.descricao || '');
        setTipoSelecionado(locationToEdit.tipo || null);
        setEditWarehouseId(id);
        handleOpen();
        log('Editando localização:', locationToEdit);
      } else {
        setAlert({ severity: 'error', message: 'Localização não encontrada para edição' });
      }
    },
    [canUpdate, localizacoes, handleOpen],
  );

  const handleDelete = useCallback(async () => {
    if (!canDelete) {
      setAlert({
        severity: 'error',
        message: 'Você não tem permissão para excluir localizações!',
      });
      log('Permissão de exclusão negada');
      return;
    }
    if (!deleteWarehouseId) {
      setAlert({ severity: 'error', message: 'ID da localização não fornecido' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      // Cache the location for rollback
      const locationToDelete = localizacoes.find((loc) => loc.id === deleteWarehouseId);
      if (!locationToDelete) {
        throw new Error('Localização não encontrada');
      }

      // Optimistic update
      setLocalizacoes((prev) => prev.filter((loc) => loc.id !== deleteWarehouseId));
      setLocalizacoesFiltradas((prev) => prev.filter((loc) => loc.id !== deleteWarehouseId));

      await deleteLocation(deleteWarehouseId);
      setAlert({ severity: 'success', message: 'Localização excluída com sucesso!' });
      log('Localização excluída:', deleteWarehouseId);
      handleCloseConfirmDelete();
    } catch (error: any) {
      console.error('Erro ao excluir localização:', error);
      let errorMessage = 'Erro ao excluir localização';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Localização não encontrada no servidor';
        } else if (error.response.status === 400) {
          errorMessage =
            error.response.data?.message ||
            'Localização não pode ser excluída (possivelmente em uso)';
        } else if (error.response.status === 403) {
          errorMessage = 'Permissão negada para excluir localizações';
        } else if (error.response.status === 500) {
          errorMessage = 'Erro interno no servidor';
        }
      }

      // Rollback optimistic update
      if (locationToDelete) {
        setLocalizacoes((prev) =>
          [...prev, locationToDelete].sort((a, b) =>
            (a.nomeLocalizacao || '').localeCompare(b.nomeLocalizacao || ''),
          ),
        );
        setLocalizacoesFiltradas((prev) =>
          [...prev, locationToDelete].sort((a, b) =>
            (a.nomeLocalizacao || '').localeCompare(b.nomeLocalizacao || ''),
          ),
        );
      }

      setAlert({ severity: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [canDelete, deleteWarehouseId, localizacoes, handleCloseConfirmDelete]);

  const handleSearch = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setLocalizacoesFiltradas(localizacoes);
    } else {
      const filtered = localizacoes.filter(
        (loc) =>
          (loc.nomeLocalizacao?.toLowerCase()?.includes(query) ?? false) ||
          (loc.descricao?.toLowerCase()?.includes(query) ?? false) ||
          getTipoLabel(loc.tipo).toLowerCase().includes(query),
      );
      setLocalizacoesFiltradas(filtered);
    }
    setPage(0);
  }, [searchQuery, localizacoes, getTipoLabel]);

  useEffect(() => {
    handleSearch;
  }, [searchQuery, localizacoes]);

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

  const paginatedLocations = useMemo(
    () => localizacoesFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [localizacoesFiltradas, page, rowsPerPage],
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Localização</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                id="search-location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Pesquisar Localização"
                variant="outlined"
                size="small"
                disabled={loading || !canRead}
                title={!canRead ? 'Você não tem permissão para visualizar localizações' : ''}
              />
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpen}
                disabled={loading || !canCreate}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                title={!canCreate ? 'Você não tem permissão para criar localizações' : ''}
              >
                Localização
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openWarehouseModal} onClose={handleClose}>
        <Box sx={modalStyle} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editWarehouseId ? 'Editar Localização' : 'Cadastrar Localização'}
          </Typography>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              id="nome-localizacao"
              label="Nome da Localização"
              value={nomeLocalizacao}
              onChange={(e) => setNomeLocalizacao(e.target.value)}
              error={Boolean(errors.nomeLocalizacao)}
              helperText={errors.nomeLocalizacao}
              disabled={loading}
              variant="filled"
              fullWidth
              required
            />
            <TextField
              id="descricao"
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              error={Boolean(errors.descricao)}
              helperText={errors.descricao}
              disabled={loading}
              variant="filled"
              fullWidth
              required
            />
            <FormControl variant="filled" fullWidth error={Boolean(errors.tipo)} required>
              <InputLabel id="tipo-label">Tipo de Localização</InputLabel>
              <Select
                labelId="tipo-label"
                id="tipo"
                value={tipoSelecionado || ''}
                onChange={(e) => setTipoSelecionado(e.target.value as tipo)}
                disabled={loading}
              >
                <MenuItem value="" disabled>
                  Selecione o tipo
                </MenuItem>
                <MenuItem value={tipo.Armazem}>Armazém</MenuItem>
                <MenuItem value={tipo.Loja}>Loja</MenuItem>
              </Select>
              {errors.tipo && <FormHelperText>{errors.tipo}</FormHelperText>}
            </FormControl>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAddLocation}
              disabled={
                loading || (!canCreate && !editWarehouseId) || (!canUpdate && editWarehouseId)
              }
              fullWidth
              title={
                !canCreate && !editWarehouseId
                  ? 'Você não tem permissão para criar localizações'
                  : !canUpdate && editWarehouseId
                    ? 'Você não tem permissão para atualizar localizações'
                    : ''
              }
            >
              {loading ? 'Salvando...' : editWarehouseId ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Localizações Criadas
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Descrição</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tipo</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : paginatedLocations.length > 0 ? (
                  paginatedLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.nomeLocalizacao || 'Sem nome'}</TableCell>
                      <TableCell>{location.descricao || 'Sem descrição'}</TableCell>
                      <TableCell>
                        <Chip
                          label={getTipoLabel(location.tipo)}
                          color={location.tipo === tipo.Armazem ? 'primary' : 'secondary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(location.id!)}
                          disabled={loading || !canUpdate}
                          title={
                            !canUpdate ? 'Você não tem permissão para atualizar localizações' : ''
                          }
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(location.id!)}
                          disabled={loading || !canDelete}
                          title={
                            !canDelete ? 'Você não tem permissão para excluir localizações' : ''
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhuma localização encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[rowsPerPage]}
            component="div"
            count={localizacoesFiltradas.length}
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
            Tem certeza que deseja excluir esta localização?
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
              title={!canDelete ? 'Você não tem permissão para excluir localizações' : ''}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default WarehouseComponent;
