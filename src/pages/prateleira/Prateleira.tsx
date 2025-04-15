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
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Modal from '@mui/material/Modal';
import React from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { getAllShelves, createShelf, updateShelf, deleteShelf } from '../../api/methods'; // Ajuste o caminho
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

const PrateleiraComponent = ({ open }: CollapsedItemProps) => {
  const [openPrateleira, setOpenPrateleira] = React.useState(false);
  const [editPrateleiraId, setEditPrateleiraId] = React.useState<string | null>(null); // ID como string (UUID)
  const [nomePrateleira, setNomePrateleira] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [prateleiras, setPrateleiras] = React.useState<Prateleira[]>([]);
  const [errors, setErrors] = React.useState<{ nomePrateleira?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);

  const handleOpen = () => setOpenPrateleira(true);
  const handleClose = () => {
    setOpenPrateleira(false);
    setEditPrateleiraId(null);
    setNomePrateleira('');
    setDescricao('');
    setErrors({});
  };

  // Buscar prateleiras da API
  const fetchShelves = async () => {
    try {
      setLoading(true);
      const data = await getAllShelves();
      setPrateleiras(data);
    } catch (error) {
      console.error('Erro ao buscar prateleiras:', error);
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
        // Editar prateleira existente
        await updateShelf(editPrateleiraId, { nomePrateleira, descricao });
      } else {
        // Criar nova prateleira
        await createShelf({ nomePrateleira, descricao });
      }
      await fetchShelves(); // Atualiza a lista
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar prateleira:', error);
      setErrors({ nomePrateleira: 'Erro ao salvar. Tente novamente.' });
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta prateleira?')) {
      try {
        setLoading(true);
        await deleteShelf(id);
        await fetchShelves(); // Atualiza a lista
      } catch (error) {
        console.error('Erro ao excluir prateleira:', error);
      } finally {
        setLoading(false);
      }
    }
  };

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
              Cadastrar Prateleira
            </Typography>
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
                ) : prateleiras.length > 0 ? (
                  prateleiras.map((prateleira) => (
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
                          onClick={() => handleDelete(prateleira.id!)}
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
                      Nenhuma prateleira cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default PrateleiraComponent;
