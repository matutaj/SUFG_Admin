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
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import React from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { getAllSections, createSection, updateSection, deleteSection } from '../../api/methods';
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

const SeccaoComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openSeccao, setOpenSeccao] = React.useState(false);
  const [editSeccaoId, setEditSeccaoId] = React.useState<string | null>(null);
  const [nomeSeccao, setNomeSeccao] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [secoes, setSecoes] = React.useState<Seccao[]>([]);
  const [errors, setErrors] = React.useState<{ nomeSeccao?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const handleOpen = () => setOpenSeccao(true);
  const handleClose = () => {
    setOpenSeccao(false);
    setEditSeccaoId(null);
    setNomeSeccao('');
    setDescricao('');
    setErrors({});
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await getAllSections();
      console.log('Dados retornados por getSections:', JSON.stringify(data, null, 2));

      if (!Array.isArray(data)) {
        throw new Error('A resposta de getSections não é um array');
      }

      const idSet = new Set(data.map((sec: Seccao) => sec.id));
      if (idSet.size !== data.length) {
        console.warn('IDs duplicados encontrados nos dados de seções:', data);
      }

      setSecoes(data);
    } catch (error) {
      console.error('Erro ao buscar seções:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar seções!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSections();
  }, []);

  React.useEffect(() => {
    console.log('Estado secoes atualizado:', JSON.stringify(secoes, null, 2));
  }, [secoes]);

  const onAddSeccaoSubmit = async () => {
    const newErrors: { nomeSeccao?: string; descricao?: string } = {};
    if (!nomeSeccao.trim()) newErrors.nomeSeccao = 'O nome da seção é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const sectionData = {
        nomeSeccao: nomeSeccao.trim(),
        descricao: descricao.trim(),
      };
      console.log('Dados enviados para a API:', sectionData);

      if (editSeccaoId) {
        await updateSection(editSeccaoId, sectionData);
        setAlert({ severity: 'success', message: 'Seção atualizada com sucesso!' });
      } else {
        const response = await createSection(sectionData);
        console.log('Resposta de createSection:', JSON.stringify(response, null, 2));
        setAlert({ severity: 'success', message: 'Seção cadastrada com sucesso!' });
      }
      await fetchSections();
      handleClose();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
      setAlert({ severity: 'error', message: 'Erro ao salvar seção!' });
      setErrors({ nomeSeccao: 'Erro ao salvar. Tente novamente.' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const seccaoToEdit = secoes.find((sec) => sec.id === id);
    if (seccaoToEdit) {
      setNomeSeccao(seccaoToEdit.nomeSeccao || '');
      setDescricao(seccaoToEdit.descricao || '');
      setEditSeccaoId(id);
      handleOpen();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta seção?')) {
      try {
        setLoading(true);
        await deleteSection(id);
        setAlert({ severity: 'success', message: 'Seção excluída com sucesso!' });
        await fetchSections();
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        console.error('Erro ao excluir seção:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir seção!' });
        setTimeout(() => setAlert(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

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
            <Typography variant="h5">Cadastrar Seção</Typography>
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
        </Collapse>
      </Paper>

      <Modal open={openSeccao} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
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
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={onAddSeccaoSubmit}
              disabled={loading}
              fullWidth
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
                    <TableCell colSpan={4} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : secoes.length > 0 ? (
                  secoes.map((seccao, index) => (
                    <TableRow key={seccao.id || `temp-${index}`}>
                      <TableCell>{seccao.nomeSeccao || 'Sem nome'}</TableCell>
                      <TableCell>{seccao.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(seccao.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(seccao.id!)}
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
