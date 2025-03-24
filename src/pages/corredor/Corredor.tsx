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
import { getCorridors, createCorridor, updateCorridor, deleteCorridor } from '../../api/methods';
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

const CorredorComponent = ({ open }: CollapsedItemProps) => {
  const [openCorredor, setOpenCorredor] = React.useState(false);
  const [editCorredorId, setEditCorredorId] = React.useState<string | null>(null);
  const [nomeCorredor, setNomeCorredor] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [corredores, setCorredores] = React.useState<Corredor[]>([]);
  const [errors, setErrors] = React.useState<{ nomeCorredor?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);

  const handleOpen = () => setOpenCorredor(true);
  const handleClose = () => {
    setOpenCorredor(false);
    setEditCorredorId(null);
    setNomeCorredor('');
    setDescricao('');
    setErrors({});
  };

  const fetchCorridors = async () => {
    try {
      setLoading(true);
      const data = await getCorridors();
      console.log('Dados retornados pela API:', data); // Log para depuração
      setCorredores(data);
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este corredor?')) {
      try {
        setLoading(true);
        await deleteCorridor(id);
        await fetchCorridors();
      } catch (error) {
        console.error('Erro ao excluir corredor:', error);
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
              Cadastrar Corredor
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
                ) : corredores.length > 0 ? (
                  corredores.map((corredor) => (
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
                          onClick={() => handleDelete(corredor.id!)}
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
                      Nenhum corredor cadastrado.
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

export default CorredorComponent;
