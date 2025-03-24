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
import { getSections, createSection, updateSection, deleteSection } from '../../api/methods';
import { Seccao } from '../../types/models';

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

const SeccaoComponent = ({ open }: CollapsedItemProps) => {
  const [openSeccao, setOpenSeccao] = React.useState(false);
  const [editSeccaoId, setEditSeccaoId] = React.useState<string | null>(null);
  const [nomeSeccao, setNomeSeccao] = React.useState(''); // Corrigido para nomeSeccao
  const [descricao, setDescricao] = React.useState('');
  const [secoes, setSecoes] = React.useState<Seccao[]>([]);
  const [errors, setErrors] = React.useState<{ nomeSeccao?: string; descricao?: string }>({}); // Corrigido para nomeSeccao
  const [loading, setLoading] = React.useState(false);

  const handleOpen = () => setOpenSeccao(true);
  const handleClose = () => {
    setOpenSeccao(false);
    setEditSeccaoId(null);
    setNomeSeccao(''); // Corrigido para nomeSeccao
    setDescricao('');
    setErrors({});
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await getSections();
      setSecoes(data);
    } catch (error) {
      console.error('Erro ao buscar seções:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSections();
  }, []);

  const onAddSeccaoSubmit = async (nomeSeccao: string, descricao: string) => {
    // Corrigido para nomeSeccao
    const newErrors: { nomeSeccao?: string; descricao?: string } = {}; // Corrigido para nomeSeccao
    if (!nomeSeccao.trim()) newErrors.nomeSeccao = 'O nome da seção é obrigatório.'; // Corrigido para nomeSeccao
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      if (editSeccaoId) {
        await updateSection(editSeccaoId, { nomeSeccao, descricao }); // Corrigido para nomeSeccao
      } else {
        await createSection({ nomeSeccao, descricao }); // Corrigido para nomeSeccao
      }
      await fetchSections();
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
      setErrors({ nomeSeccao: 'Erro ao salvar. Tente novamente.' }); // Corrigido para nomeSeccao
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const SeccaoToEdit = secoes.find((sec) => sec.id === id);
    if (SeccaoToEdit) {
      setNomeSeccao(SeccaoToEdit.nomeSeccao || ''); // Corrigido para nomeSeccao
      setDescricao(SeccaoToEdit.descricao || '');
      setEditSeccaoId(id);
      handleOpen();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta seção?')) {
      try {
        setLoading(true);
        await deleteSection(id);
        await fetchSections();
      } catch (error) {
        console.error('Erro ao excluir seção:', error);
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
              Cadastrar Seção
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
                  <Typography id="modal-modal-title" variant="h5" component="h2">
                    {editSeccaoId ? 'Editar Seção' : 'Cadastrar Seção'}
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error" disabled={loading}>
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    id="section-name"
                    onChange={(e) => setNomeSeccao(e.target.value)} // Corrigido para nomeSeccao
                    value={nomeSeccao} // Corrigido para nomeSeccao
                    label="Nome da Seção"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.nomeSeccao)} // Corrigido para nomeSeccao
                    helperText={errors.nomeSeccao} // Corrigido para nomeSeccao
                    disabled={loading}
                  />
                  <TextField
                    id="section-description"
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
                    onClick={() => onAddSeccaoSubmit(nomeSeccao, descricao)} // Corrigido para nomeSeccao
                    disabled={loading}
                  >
                    <Typography variant="body2">
                      {loading ? 'Salvando...' : editSeccaoId ? 'Atualizar' : 'Cadastrar'}
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
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : secoes.length > 0 ? (
                  secoes.map((Seccao) => (
                    <TableRow key={Seccao.id}>
                      <TableCell>{Seccao.nomeSeccao || 'Sem nome'}</TableCell> // Corrigido para
                      nomeSeccao
                      <TableCell>{Seccao.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(Seccao.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(Seccao.id!)}
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
                      Nenhuma seção cadastrada.
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

export default SeccaoComponent;
