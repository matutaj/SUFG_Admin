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

interface CollapsedItemProps {
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

const Corredor = ({ open }: CollapsedItemProps) => {
  const [openCorredor, setOpenCorredor] = React.useState(false);
  const [editCorredorId, setEditCorredorId] = React.useState<number | null>(null);
  const handleOpen = () => setOpenCorredor(true);
  const handleClose = () => {
    setOpenCorredor(false);
    setEditCorredorId(null);
    setName('');
    setDescription('');
    setErrors({});
  };
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [corredor, setCorredor] = React.useState<
    { id: number; name: string; description: string }[]
  >(JSON.parse(localStorage.getItem('corredor') || '[]'));

  const [errors, setErrors] = React.useState<{ name?: string; description?: string }>({});

  function onAddCorredorSubmit(name: string, description: string) {
    const newErrors: { name?: string; description?: string } = {};
    if (!name.trim()) newErrors.name = 'O nome do corredor é obrigatório.';
    if (!description.trim()) newErrors.description = 'A descrição é obrigatória.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editCorredorId) {
      // Editar corredor existente
      setCorredor(
        corredor.map((corr) =>
          corr.id === editCorredorId ? { ...corr, name, description } : corr,
        ),
      );
    } else {
      // Adicionar novo corredor
      const newCorredor = {
        id: corredor.length + 1,
        name,
        description,
      };
      setCorredor([...corredor, newCorredor]);
    }

    setName('');
    setDescription('');
    setErrors({});
    handleClose();
  }

  const handleEdit = (id: number) => {
    const corredorToEdit = corredor.find((corr) => corr.id === id);
    if (corredorToEdit) {
      setName(corredorToEdit.name);
      setDescription(corredorToEdit.description);
      setEditCorredorId(id);
      handleOpen();
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este corredor?')) {
      setCorredor(corredor.filter((corr) => corr.id !== id));
    }
  };

  React.useEffect(() => {
    localStorage.setItem('corredor', JSON.stringify(corredor));
  }, [corredor]);

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
                    Cadastrar Corredor
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error">
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    id="corridor-name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    label="Nome do Corredor"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />
                  <TextField
                    id="corridor-description"
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
                    onClick={() => onAddCorredorSubmit(name, description)}
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
                    <strong>ID do Corredor</strong>
                  </TableCell>
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
                {corredor.length > 0 ? (
                  corredor.map((corredor) => (
                    <TableRow key={corredor.id}>
                      <TableCell>{corredor.id}</TableCell>
                      <TableCell>{corredor.name}</TableCell>
                      <TableCell>{corredor.description}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEdit(corredor.id)}>
                          <Edit>edit</Edit>
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(corredor.id)}>
                          <Delete>delete</Delete>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
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

export default Corredor;
