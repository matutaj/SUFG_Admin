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
import React, { useState, useEffect } from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { CategoriaProduto } from '../../types/models';
import {
  getAllProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '../../api/methods';

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

const Categoria: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openCategoria, setOpenCategoria] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<string | null>(null);
  const [editCategoriaId, setEditCategoriaId] = useState<string | null>(null);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [filteredCategorias, setFilteredCategorias] = useState<CategoriaProduto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<{ nomeCategoria?: string; descricao?: string }>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleOpen = () => setOpenCategoria(true);
  const handleClose = () => {
    setOpenCategoria(false);
    setEditCategoriaId(null);
    setNomeCategoria('');
    setDescricao('');
    setErrors({});
  };

  const handleOpenConfirmModal = (id: string) => {
    setCategoriaToDelete(id);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setCategoriaToDelete(null);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAllProductCategories();
      setCategorias(data);
      setFilteredCategorias(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar categorias!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = categorias.filter((categoria) =>
      categoria.nomeCategoria?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCategorias(filtered);
    setPage(0);
  }, [searchTerm, categorias]);

  const handleAddCategoria = async () => {
    try {
      setLoading(true);
      const categoriaData = { nomeCategoria: nomeCategoria, descricao: descricao };
      if (editCategoriaId) {
        await updateProductCategory(editCategoriaId, categoriaData);
      } else {
        await createProductCategory(categoriaData);
      }
      await fetchCategories();
      handleClose();
      setAlert({ severity: 'success', message: 'Categoria cadastrada com sucesso!' });
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
      setDescricao(categoriaToEdit.descricao || '');
      setEditCategoriaId(id);
      handleOpen();
    }
  };

  const handleDelete = async () => {
    if (!categoriaToDelete) return;

    try {
      setLoading(true);
      await deleteProductCategory(categoriaToDelete);
      await fetchCategories();
      setAlert({ severity: 'success', message: 'Categoria excluída com sucesso!' });
      setTimeout(() => setAlert(null), 3000);

      const totalPages = Math.ceil(filteredCategorias.length / rowsPerPage);
      if (page >= totalPages && page > 0) {
        setPage(page - 1);
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      setAlert({ severity: 'error', message: 'Erro ao excluir categoria!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
      handleCloseConfirmModal();
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log(event);
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedCategorias = filteredCategorias.slice(
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
            <Typography variant="h5">Cadastrar Categoria</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Pesquisar Categoria"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="small"
                sx={(theme) => ({
                  p: theme.spacing(0.625, 1.5),
                  borderRadius: 1.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  },
                })}
              />
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
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openCategoria} onClose={handleClose}>
        <Box sx={modalStyle} component="form" noValidate autoComplete="off">
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

      <Modal open={openConfirmModal} onClose={handleCloseConfirmModal}>
        <Box sx={confirmModalStyle}>
          <Typography variant="h6" gutterBottom>
            Confirmar Exclusão
          </Typography>
          <Typography variant="body1" mb={3}>
            Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseConfirmModal}
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
                ) : paginatedCategorias.length > 0 ? (
                  paginatedCategorias.map((categoria) => (
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
                          onClick={() => handleOpenConfirmModal(categoria.id!)}
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
                      Nenhuma categoria encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredCategorias.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </CardContent>
      </Card>
    </>
  );
};

export default Categoria;
