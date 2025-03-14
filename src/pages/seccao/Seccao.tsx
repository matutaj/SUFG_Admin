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

const Secao = ({ open }: CollapsedItemProps) => {
  const [openSecao, setOpenSecao] = React.useState(false);
  const [editSecaoId, setEditSecaoId] = React.useState<number | null>(null);
  const handleOpen = () => setOpenSecao(true);
  const handleClose = () => {
    setOpenSecao(false);
    setEditSecaoId(null);
    setName('');
    setDescription('');
    setErrors({});
  };
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [secao, setSecao] = React.useState<{ id: number; name: string; description: string }[]>(
    JSON.parse(localStorage.getItem('secao') || '[]'),
  );

  const [errors, setErrors] = React.useState<{ name?: string; description?: string }>({});

  function onAddSecaoSubmit(name: string, description: string) {
    const newErrors: { name?: string; description?: string } = {};
    if (!name.trim()) newErrors.name = 'O nome da seção é obrigatório.';
    if (!description.trim()) newErrors.description = 'A descrição é obrigatória.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editSecaoId) {
      // Editar seção existente
      setSecao(secao.map((sec) => (sec.id === editSecaoId ? { ...sec, name, description } : sec)));
    } else {
      // Adicionar nova seção
      const newSecao = {
        id: secao.length + 1,
        name,
        description,
      };
      setSecao([...secao, newSecao]);
    }

    setName('');
    setDescription('');
    setErrors({});
    handleClose();
  }

  const handleEdit = (id: number) => {
    const secaoToEdit = secao.find((sec) => sec.id === id);
    if (secaoToEdit) {
      setName(secaoToEdit.name);
      setDescription(secaoToEdit.description);
      setEditSecaoId(id);
      handleOpen();
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta seção?')) {
      setSecao(secao.filter((sec) => sec.id !== id));
    }
  };

  React.useEffect(() => {
    localStorage.setItem('secao', JSON.stringify(secao));
  }, [secao]);

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
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
            <Modal
              open={openSecao}
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
                    Cadastrar Seção
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error">
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    id="section-name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    label="Nome da Seção"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                  />
                  <TextField
                    id="section-description"
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
                    onClick={() => onAddSecaoSubmit(name, description)}
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
                    <strong>ID da Seção</strong>
                  </TableCell>
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
                {secao.length > 0 ? (
                  secao.map((secao) => (
                    <TableRow key={secao.id}>
                      <TableCell>{secao.id}</TableCell>
                      <TableCell>{secao.name}</TableCell>
                      <TableCell>{secao.description}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleEdit(secao.id)}>
                          <Edit>edit</Edit>
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDelete(secao.id)}>
                          <Delete>delete</Delete>
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

export default Secao;
