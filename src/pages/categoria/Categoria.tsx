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
import { SubItem } from 'types/types';
import IconifyIcon from 'components/base/IconifyIcon';
import Modal from '@mui/material/Modal';
import React from 'react';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';

interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const style = {
  position: 'absolute',
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
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  backgroundColor: '#f9f9f9',
  p: 4,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#6c63ff #f1f1f1',
};

const Categoria = ({ open }: CollapsedItemProps) => {
  const [openCategoria, setOpenCategoria] = React.useState(false);
  const [editCategoriaId, setEditCategoriaId] = React.useState<number | null>(null);
  const handleOpen = () => setOpenCategoria(true);
  const handleClose = () => {
    setOpenCategoria(false);
    setEditCategoriaId(null);
    setName('');
    setDescription('');
    setErrors({});
  };
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [categoria, setCategoria] = React.useState<
    { id: number; name: string; description: string }[]
  >(JSON.parse(localStorage.getItem('categoria') || '[]'));

  const [errors, setErrors] = React.useState<{ name?: string; description?: string }>({});

  function onAddCategoriaSubmit(name: string, description: string) {
    const newErrors: { name?: string; description?: string } = {};
    if (!name.trim()) newErrors.name = 'O nome da categoria é obrigatório.';
    if (!description.trim()) newErrors.description = 'A descrição é obrigatória.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editCategoriaId) {
      // Editar categoria existente
      setCategoria(
        categoria.map((cat) => (cat.id === editCategoriaId ? { ...cat, name, description } : cat)),
      );
    } else {
      // Adicionar nova categoria
      const newsCategoria = {
        id: categoria.length + 1,
        name,
        description,
      };
      setCategoria([...categoria, newsCategoria]);
    }

    setName('');
    setDescription('');
    setErrors({});
    handleClose();
  }

  const handleEdit = (id: number) => {
    const categoriaToEdit = categoria.find((cat) => cat.id === id);
    if (categoriaToEdit) {
      setName(categoriaToEdit.name);
      setDescription(categoriaToEdit.description);
      setEditCategoriaId(id);
      handleOpen();
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategoria(categoria.filter((cat) => cat.id !== id));
    }
  };

  React.useEffect(() => {
    localStorage.setItem('categoria', JSON.stringify(categoria));
  }, [categoria]);

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
              Cadastrar Categoria
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              sx={(theme) => ({ p: theme.spacing(0.625, 1.5), borderRadius: 1.5 })}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              onClick={handleOpen}
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
            <Modal
              open={openCategoria}
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
                    Cadastrar Categoria de Produtos
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error">
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    id="product-cost"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    label="Nome da Categoria"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />
                  <TextField
                    id="product-name-duplicate"
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    label="Descrição"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.description)}
                    helperText={errors.description}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ height: 40, width: '100%' }}
                    onClick={() => onAddCategoriaSubmit(name, description)}
                  >
                    <Typography variant="body2">Cadastrar</Typography>
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
                    <strong>ID da Categoria</strong>
                  </TableCell>
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
                {categoria.length > 0 ? (
                  categoria.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>{categoria.id}</TableCell>
                      <TableCell>{categoria.name}</TableCell>
                      <TableCell>{categoria.description}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEdit(categoria.id)}>
                          <Edit>edit</Edit>
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(categoria.id)}>
                          <Delete>delete</Delete>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
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
