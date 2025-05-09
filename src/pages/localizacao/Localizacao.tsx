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
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { Localizacao, tipo } from '../../types/models';
import { getAllLocations, createLocation, deleteLocation, updateLocation } from '../../api/methods';

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
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [deleteWarehouseId, setDeleteWarehouseId] = React.useState<string | null>(null);
  const [editWarehouseId, setEditWarehouseId] = React.useState<string | null>(null);
  const [nomeLocalizacao, setNomeLocalizacao] = React.useState('');
  const [descricao, setDescricao] = React.useState<string>('');
  const [tipoSelecionado, setTipoSelecionado] = React.useState<tipo | null>(null);
  const [localizacoes, setLocalizacoes] = React.useState<Localizacao[]>([]);
  const [localizacoesFiltradas, setLocalizacoesFiltradas] = React.useState<Localizacao[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [errors, setErrors] = React.useState<{ nomeLocalizacao?: string; descricao?: string; tipo?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 6;

  const handleOpen = () => setOpenWarehouseModal(true);
  const handleClose = () => {
    setOpenWarehouseModal(false);
    setEditWarehouseId(null);
    setNomeLocalizacao('');
    setDescricao('');
    setTipoSelecionado(null);
    setErrors({});
  };

  const handleOpenConfirmDelete = (id: string) => {
    setDeleteWarehouseId(id);
    setOpenConfirmDelete(true);
  };

  const handleCloseConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setDeleteWarehouseId(null);
  };

  const fetchLocalizacoes = async () => {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocalizacoes(data);
      setLocalizacoesFiltradas(data);
    } catch (error) {
      console.error('Erro ao buscar localizações:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar localizações!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLocalizacoes();
  }, []);

  const getTipoLabel = (tipoValue: tipo | null | undefined): string => {
    switch (tipoValue) {
      case tipo.Armazem:
        return 'Armazém';
      case tipo.Loja:
        return 'Loja';
      default:
        return 'Sem tipo';
    }
  };

  const handleAddLocation = async () => {
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
      const locationData = { 
        nomeLocalizacao, 
        descricao, 
        tipo: tipoSelecionado as tipo 
      };

      if (editWarehouseId) {
        await updateLocation(editWarehouseId, locationData);
        setAlert({ severity: 'success', message: 'Localização atualizada com sucesso!' });
      } else {
        await createLocation(locationData);
        setAlert({ severity: 'success', message: 'Localização cadastrada com sucesso!' });
      }
      
      await fetchLocalizacoes();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      setAlert({ severity: 'error', message: 'Erro ao salvar localização!' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const locationToEdit = localizacoes.find((loc) => loc.id === id);
    if (locationToEdit) {
      setNomeLocalizacao(locationToEdit.nomeLocalizacao || '');
      setDescricao(locationToEdit.descricao || '');
      setTipoSelecionado(locationToEdit.tipo || null);
      setEditWarehouseId(id);
      handleOpen();
    }
  };

  const handleDelete = async () => {
    if (!deleteWarehouseId) return;

    try {
      setLoading(true);
      await deleteLocation(deleteWarehouseId);
      setAlert({ severity: 'success', message: 'Localização excluída com sucesso!' });
      await fetchLocalizacoes();
      handleCloseConfirmDelete();
    } catch (error) {
      console.error('Erro ao excluir localização:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir localização!' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setLocalizacoesFiltradas(localizacoes);
    } else {
      const filtered = localizacoes.filter(
        (loc) =>
          (loc.nomeLocalizacao?.toLowerCase().includes(query) || '') ||
          (loc.descricao?.toLowerCase().includes(query) || '') ||
          getTipoLabel(loc.tipo).toLowerCase().includes(query)
      );
      setLocalizacoesFiltradas(filtered);
    }
    setPage(0);
  };

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const paginatedLocations = localizacoesFiltradas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
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
                onClick={handleOpen}
                disabled={loading}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
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
              <InputLabel>Tipo de Localização</InputLabel>
              <Select
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
              disabled={loading}
              fullWidth
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
                  <TableCell><strong>Nome</strong></TableCell>
                  <TableCell><strong>Descrição</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell align="right"><strong>Ações</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Carregando...
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
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenConfirmDelete(location.id!)}
                          disabled={loading}
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
              disabled={loading}
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
