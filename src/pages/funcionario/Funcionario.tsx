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
  Grid, // Added Grid import
} from '@mui/material';
import { SubItem } from 'types/types';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React from 'react';

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 650 },
  maxHeight: '60%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  p: 4,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#6c63ff #f1f1f1',
};

const Funcionario: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openFuncionario, setOpenFuncionario] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false); // Track if we're editing
  const [editId, setEditId] = React.useState<number | null>(null); // Store the ID of the employee being edited

  const handleOpen = () => {
    setIsEditing(false); // Reset to "add" mode
    setEditId(null);
    setForm({ name: '', telefone: '', email: '', endereco: '', nif: '' }); // Clear form
    setOpenFuncionario(true);
  };
  const handleClose = () => setOpenFuncionario(false);

  const [errors, setErrors] = React.useState<{ name?: string }>({});
  const [form, setForm] = React.useState({
    name: '',
    telefone: '',
    email: '',
    endereco: '',
    nif: '',
  });
  const [funcionarios, setFuncionarios] = React.useState<
    { id: number; nif: string; name: string; telefone: string; email: string; endereco: string }[]
  >(JSON.parse(localStorage.getItem('funcionarios') || '[]')); // Changed 'cliente' to 'funcionarios'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  function onAddFuncionarioSubmit() {
    if (!form.name.trim() || !form.telefone.trim()) {
      alert('Nome e telefone são obrigatórios!');
      return;
    }

    if (isEditing && editId !== null) {
      // Update existing employee
      setFuncionarios((prev) =>
        prev.map((item) => (item.id === editId ? { ...item, ...form } : item)),
      );
    } else {
      // Add new employee
      const newFuncionario = {
        id: funcionarios.length + 1,
        ...form,
      };
      setFuncionarios([...funcionarios, newFuncionario]);
    }

    setForm({
      name: '',
      telefone: '',
      email: '',
      endereco: '',
      nif: '',
    });
    setOpenFuncionario(false); // Close modal after submission
    setIsEditing(false); // Reset editing state
    setEditId(null); // Clear edit ID
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      setFuncionarios((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleEdit = (funcionario: {
    id: number;
    nif: string;
    name: string;
    telefone: string;
    email: string;
    endereco: string;
  }) => {
    setIsEditing(true);
    setEditId(funcionario.id);
    setForm({
      name: funcionario.name,
      telefone: funcionario.telefone,
      email: funcionario.email,
      endereco: funcionario.endereco,
      nif: funcionario.nif,
    });
    setOpenFuncionario(true); // Open modal with pre-filled data
  };

  React.useEffect(() => {
    localStorage.setItem('funcionarios', JSON.stringify(funcionarios)); // Changed 'cliente' to 'funcionarios'
  }, [funcionarios]);

  return (
    <>
      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">Cadastrar Funcionário</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
            <Modal open={openFuncionario} onClose={handleClose}>
              <Box sx={style} component="form" noValidate autoComplete="off">
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: '100%', mb: 2 }}
                >
                  <Typography variant="h5">
                    {isEditing ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error">
                    Fechar
                  </Button>
                </Stack>

                <Grid container spacing={2} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="name"
                      label="Nome"
                      variant="filled"
                      fullWidth
                      value={form.name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="telefone"
                      label="Telefone"
                      variant="filled"
                      type="tel"
                      fullWidth
                      value={form.telefone}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="email"
                      label="Email"
                      type="email"
                      variant="filled"
                      fullWidth
                      value={form.email}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="nif"
                      label="Nif"
                      variant="filled"
                      fullWidth
                      value={form.nif}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="endereco"
                      label="Endereço"
                      variant="filled"
                      fullWidth
                      value={form.endereco}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ height: 40, width: '100%' }}
                      onClick={onAddFuncionarioSubmit}
                    >
                      <Typography variant="body2">{isEditing ? 'Salvar' : 'Cadastrar'}</Typography>
                    </Button>
                  </Grid>
                </Grid>
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
                  {['Nif/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {funcionarios.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nif}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.telefone}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.endereco}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEdit(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(item.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default Funcionario;
