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
  TablePagination,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Modal from '@mui/material/Modal';
import React from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { getAllCorridors, createCorridor, updateCorridor, deleteCorridor } from '../../api/methods';
import { Corredor } from '../../types/models';

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

const CorredorComponent = ({ open }: CollapsedItemProps) => {
  const [openCorredor, setOpenCorredor] = React.useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [deleteCorredorId, setDeleteCorredorId] = React.useState<string | null>(null);
  const [editCorredorId, setEditCorredorId] = React.useState<string | null>(null);
  const [nomeCorredor, setNomeCorredor] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [corredores, setCorredores] = React.useState<Corredor[]>([]);
  const [filteredCorredores, setFilteredCorredores] = React.useState<Corredor[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [errors, setErrors] = React.useState<{ nomeCorredor?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage] = React.useState(6);

  const handleOpen = () => setOpenCorredor(true);
  const handleClose = () => {
    setOpenCorredor(false);
    setEditCorredorId(null);
    setNomeCorredor('');
    setDescricao('');
    setErrors({});
  };

  const handleOpenConfirmDelete = (id: string) => {
    setDeleteCorredorId(id);
    setOpenConfirmDelete(true);
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setDeleteCorredorId(null);
  };

  const fetchCorridors = async () => {
    try {
      setLoading(true);
      const data = await getAllCorridors();
      setCorredores(data);
      setFilteredCorredores(data);
    } catch (error) {
      console.error('Erro ao buscar corredores:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCorridors();
  }, []);

  const onAddCorredorSubmit = async (nomeCorredor: string, descricao: string) => {
    const newErrors: { nomeCorredor?: string; descricao?: string } = {};
    if (!nomeCorredor.trim()) newErrors.nomeCorredor = 'O nome do corredor é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      if (editCorredorId) {
        await updateCorridor(editCorredorId, { nomeCorredor, descricao });
      } else {
        await createCorridor({ nomeCorredor, descricao });
      }
      await fetchCorridors();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar corredor:', error);
      setErrors({ nomeCorredor: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const corredorToEdit = corredores.find((corr) => corr.id === id);
    if (corredorToEdit) {
      setNomeCorredor(corredorToEdit.nomeCorredor || '');
      setDescricao(corredorToEdit.descricao || '');
      setEditCorredorId(id);
      handleOpen();
    }
  };

  const handleDelete = async () => {
    if (deleteCorredorId) {
      try {
        setLoading(true);
        await deleteCorridor(deleteCorredorId);
        await fetchCorridors();
        handleCloseConfirmDelete();
      } catch (error) {
        console.error('Erro ao excluir corredor:', error);
        alert('Falha ao excluir o corredor. Verifique o console para mais detalhes.');
      } finally {
        setLoading(false);
      }
    } else {
      console.error('Nenhum corredor selecionado para exclusão');
      alert('Erro: Nenhum corredor selecionado para exclusão.');
    }
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (query === '') {
      setFilteredCorredores(corredores);
    } else {
      const filtered = corredores.filter(
        (corredor) =>
          corredor.nomeCorredor?.toLowerCase().includes(query) ||
          corredor.descricao?.toLowerCase().includes(query),
      );
      setFilteredCorredores(filtered);
    }
    setPage(0);
  };

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const paginatedCorredores = filteredCorredores.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <>
      <Paper sx={(theme) => ({ p: theme.spacing(2, 2.5), width: '100%' })}>
        <Collapse in={open}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography id="modal-modal-title" variant="h5" component="h2">
              Cadastrar Corredor
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                id="search-corridor"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Pesquisar Corredor"
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
                  <Typography id="modal-modal-title" variant="h5" component="h2">
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
                    sx={{ width: '100%' }}
                    error={Boolean(errors.nomeCorredor)}
                    helperText={errors.nomeCorredor}
                    disabled={loading}
                  />
                  <TextField
                    id="corridor-description"
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
                    onClick={() => onAddCorredorSubmit(nomeCorredor, descricao)}
                    disabled={loading}
                  >
                    <Typography variant="body2">
                      {loading ? 'Salvando...' : editCorredorId ? 'Atualizar' : 'Cadastrar'}
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
                      Carregando...
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
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(corredor.id!)}
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
                      Nenhum corredor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[6]}
            component="div"
            count={filteredCorredores.length}
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
            Tem certeza que deseja excluir este corredor?
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

export default CorredorComponent;
