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
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { CategoriaProduto } from '../../types/models';
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../../api/methods';

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

const Categoria: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openCategoria, setOpenCategoria] = React.useState(false);
  const [editCategoriaId, setEditCategoriaId] = React.useState<string | null>(null);
  const [nomeCategoria, setNomeCategoria] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [categorias, setCategorias] = React.useState<CategoriaProduto[]>([]);
  const [errors, setErrors] = React.useState<{ nomeCategoria?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const handleOpen = () => setOpenCategoria(true);
  const handleClose = () => {
    setOpenCategoria(false);
    setEditCategoriaId(null);
    setNomeCategoria('');
    setDescricao('');
    setErrors({});
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getProductCategories();
      console.log('Dados retornados por getProductCategories:', JSON.stringify(data, null, 2));

      const idSet = new Set(data.map((cat: CategoriaProduto) => cat.id));
      if (idSet.size !== data.length) {
        console.warn('IDs duplicados encontrados nos dados de categorias:', data);
      }

      setCategorias(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar categorias!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategoria = async () => {
    const newErrors: { nomeCategoria?: string; descricao?: string } = {};
    if (!nomeCategoria.trim()) newErrors.nomeCategoria = 'O nome da categoria é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const categoriaData = {
        nomeCategoria: nomeCategoria.trim(), // Garantindo que não haja espaços extras
        descricao: descricao.trim(), // Garantindo que a descrição seja enviada corretamente
      };
      console.log('Dados enviados para a API:', categoriaData); // Log para depuração

      if (editCategoriaId) {
        await updateProductCategory(editCategoriaId, categoriaData);
        setAlert({ severity: 'success', message: 'Categoria atualizada com sucesso!' });
      } else {
        await createProductCategory(categoriaData);
        setAlert({ severity: 'success', message: 'Categoria cadastrada com sucesso!' });
      }
      await fetchCategories();
      handleClose();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      setAlert({ severity: 'error', message: 'Erro ao salvar categoria!' });
      setErrors({ nomeCategoria: 'Erro ao salvar. Tente novamente.' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const categoriaToEdit = categorias.find((cat) => cat.id === id);
    if (categoriaToEdit) {
      setNomeCategoria(categoriaToEdit.nomeCategoria || '');
      setDescricao(categoriaToEdit.descricao || ''); // Garantindo que a descrição seja carregada
      setEditCategoriaId(id);
      handleOpen();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        setLoading(true);
        await deleteProductCategory(id);
        await fetchCategories();
        setAlert({ severity: 'success', message: 'Categoria excluída com sucesso!' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir categoria!' });
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
            <Typography variant="h5">Cadastrar Categoria</Typography>
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

      <Modal open={openCategoria} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
              {editCategoriaId ? 'Editar Categoria' : 'Cadastrar Categoria de Produtos'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error" disabled={loading}>
              Fechar
            </Button>
          </Stack>

          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              label="Nome da Categoria"
              value={nomeCategoria}
              onChange={(e) => setNomeCategoria(e.target.value)}
              variant="filled"
              error={Boolean(errors.nomeCategoria)}
              helperText={errors.nomeCategoria}
              disabled={loading}
              fullWidth
            />
            <TextField
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              variant="filled"
              error={Boolean(errors.descricao)}
              helperText={errors.descricao}
              disabled={loading}
              fullWidth
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAddCategoria}
              disabled={loading}
              fullWidth
            >
              <Typography variant="body2">
                {loading ? 'Salvando...' : editCategoriaId ? 'Atualizar' : 'Cadastrar'}
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
                    <strong>Nome da Categoria</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Descrição da Categoria</strong>
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
                ) : categorias.length > 0 ? (
                  categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>{categoria.nomeCategoria || 'Sem nome'}</TableCell>
                      <TableCell>{categoria.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(categoria.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(categoria.id!)}
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
                      Nenhuma categoria cadastrada.
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

export default Categoria;
