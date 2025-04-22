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
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import React from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { getAllShelves, createShelf, updateShelf, deleteShelf } from '../../api/methods';
import { Prateleira } from '../../types/models';

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

const PrateleiraComponent = ({ open }: CollapsedItemProps) => {
  const [openPrateleira, setOpenPrateleira] = React.useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [deletePrateleiraId, setDeletePrateleiraId] = React.useState<string | null>(null);
  const [editPrateleiraId, setEditPrateleiraId] = React.useState<string | null>(null);
  const [nomePrateleira, setNomePrateleira] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [prateleiras, setPrateleiras] = React.useState<Prateleira[]>([]);
  const [filteredPrateleiras, setFilteredPrateleiras] = React.useState<Prateleira[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [errors, setErrors] = React.useState<{ nomePrateleira?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(6);

  const handleOpen = () => setOpenPrateleira(true);
  const handleClose = () => {
    setOpenPrateleira(false);
    setEditPrateleiraId(null);
    setNomePrateleira('');
    setDescricao('');
    setErrors({});
  };

  const handleOpenConfirmDelete = (id: string) => {
    setDeletePrateleiraId(id);
    setOpenConfirmDelete(true);
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setDeletePrateleiraId(null);
  };

  const fetchShelves = async () => {
    try {
      setLoading(true);
      const data = await getAllShelves();
      if (!Array.isArray(data)) {
        throw new Error('A resposta de getAllShelves não é um array');
      }
      setPrateleiras(data);
      setFilteredPrateleiras(data);
    } catch (error) {
      console.error('Erro ao buscar prateleiras:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar prateleiras!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    fetchShelves();
  }, []);

  const onAddPrateleiraSubmit = async (nomePrateleira: string, descricao: string) => {
    const newErrors: { nomePrateleira?: string; descricao?: string } = {};
    if (!nomePrateleira.trim()) newErrors.nomePrateleira = 'O nome da prateleira é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      setLoading(true);
      if (editPrateleiraId) {
        await updateShelf(editPrateleiraId, { nomePrateleira, descricao });
        setAlert({ severity: 'success', message: 'Prateleira atualizada com sucesso!' });
      } else {
        await createShelf({ nomePrateleira, descricao });
        setAlert({ severity: 'success', message: 'Prateleira cadastrada com sucesso!' });
      }
      await fetchShelves();
      handleClose();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar prateleira:', error);
      setAlert({ severity: 'error', message: 'Erro ao salvar prateleira!' });
      setErrors({ nomePrateleira: 'Erro ao salvar. Tente novamente.' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const prateleiraToEdit = prateleiras.find((prat) => prat.id === id);
    if (prateleiraToEdit) {
      setNomePrateleira(prateleiraToEdit.nomePrateleira || '');
      setDescricao(prateleiraToEdit.descricao || '');
      setEditPrateleiraId(id);
      handleOpen();
    }
  };

  const handleDelete = async () => {
    if (deletePrateleiraId) {
      try {
        setLoading(true);
        await deleteShelf(deletePrateleiraId);
        setAlert({ severity: 'success', message: 'Prateleira excluída com sucesso!' });
        await fetchShelves();
        handleCloseConfirmDelete();
      } catch (error) {
        console.error('Erro ao excluir prateleira:', error);
        setAlert({
          severity: 'error',
          message: 'Falha ao excluir prateleira. Verifique o console.',
        });
      } finally {
        setLoading(false);
      }
    } else {
      console.error('Nenhuma prateleira selecionada para exclusão');
      setAlert({ severity: 'error', message: 'Erro: Nenhuma prateleira selecionada.' });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (query === '') {
      setFilteredPrateleiras(prateleiras);
    } else {
      const filtered = prateleiras.filter(
        (prateleira) =>
          prateleira.nomePrateleira?.toLowerCase().includes(query) ||
          prateleira.descricao?.toLowerCase().includes(query),
      );
      setFilteredPrateleiras(filtered);
    }
    setPage(0);
  };

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const paginatedPrateleiras = filteredPrateleiras.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
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
                disabled={loading}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={loading}
                startIcon={<IconifyIcon icon="material-symbols:search" />}
              >
                Pesquisar
              </Button>
              <Button
                variant="contained"
                color="secondary"
                sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                onClick={handleOpen}
                disabled={loading}
              >
                <Typography variant="body2">Adicionar</Typography>
              </Button>
            </Stack>
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
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ height: 40, width: '100%' }}
                    onClick={() => onAddPrateleiraSubmit(nomePrateleira, descricao)}
                    disabled={loading}
                  >
                    <Typography variant="body2">
                      {loading ? 'Salvando...' : editPrateleiraId ? 'Atualizar' : 'Cadastrar'}
                    </Typography>
                  </Button>
                </Stack>
              </Box>
            </Modal>
          </Stack>
        </Collapse>
      </Paper>
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
                      Carregando...
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
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(prateleira.id!)}
                          disabled={loading}
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
            rowsPerPageOptions={[6]}
            component="div"
            count={filteredPrateleiras.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            labelRowsPerPage="Itens por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
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
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCloseConfirmDelete}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default PrateleiraComponent;
