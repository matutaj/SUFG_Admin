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
  Grid,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React from 'react';
import { Cliente } from '../../types/models'; // Import Cliente from models.ts
import { getAllClients, createClient, updateClient, deleteClient } from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

// Use the Cliente interface directly instead of defining a new ClienteData
type ClienteForm = Partial<Cliente>;

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 550 },
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

const ClienteComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openCliente, setOpenCliente] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null); // Changed to string | null
  const [form, setForm] = React.useState<ClienteForm>({
    numeroContribuinte: '',
    nomeCliente: '',
    telefoneCliente: '',
    emailCliente: '',
    moradaCliente: '',
  });
  const [clientes, setClientes] = React.useState<Cliente[]>([]); // Use Cliente type
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const data = await getAllClients();
      setClientes(data); // Type matches Cliente[]
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleOpen = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      numeroContribuinte: '',
      nomeCliente: '',
      telefoneCliente: '',
      emailCliente: '',
      moradaCliente: '',
    });
    setOpenCliente(true);
  };

  const handleClose = () => setOpenCliente(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nomeCliente?.trim()) newErrors.nomeCliente = 'Nome é obrigatório';
    if (!form.telefoneCliente?.trim()) newErrors.telefoneCliente = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddClienteSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && editId !== null) {
        const updatedCliente = await updateClient(editId, form as Cliente); // editId is string
        setClientes((prev) => prev.map((item) => (item.id === editId ? updatedCliente : item)));
      } else {
        const newCliente = await createClient(form as Cliente);
        setClientes((prev) => [...prev, newCliente]);
      }
      setForm({
        numeroContribuinte: '',
        nomeCliente: '',
        telefoneCliente: '',
        emailCliente: '',
        moradaCliente: '',
      });
      setOpenCliente(false);
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error('Error submitting client:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    // Changed to string
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteClient(id);
        setClientes((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleEdit = (client: Cliente) => {
    setIsEditing(true);
    setEditId(client.id || null); // Handle undefined id
    setForm({
      numeroContribuinte: client.numeroContribuinte || '',
      nomeCliente: client.nomeCliente || '',
      telefoneCliente: client.telefoneCliente || '',
      emailCliente: client.emailCliente || '',
      moradaCliente: client.moradaCliente || '',
    });
    setOpenCliente(true);
  };

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
            <Typography variant="h5">Cadastrar Cliente</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              <Typography variant="body2">Adicionar</Typography>
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openCliente} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
              {isEditing ? 'Editar Cliente' : 'Cadastrar Cliente'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numeroContribuinte"
                label="NIF/BI"
                variant="filled"
                fullWidth
                value={form.numeroContribuinte}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nomeCliente"
                label="Nome"
                variant="filled"
                fullWidth
                value={form.nomeCliente}
                onChange={handleChange}
                error={!!errors.nomeCliente}
                helperText={errors.nomeCliente}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="telefoneCliente"
                label="Telefone"
                variant="filled"
                type="tel"
                fullWidth
                value={form.telefoneCliente}
                onChange={handleChange}
                error={!!errors.telefoneCliente}
                helperText={errors.telefoneCliente}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emailCliente"
                label="Email"
                variant="filled"
                fullWidth
                value={form.emailCliente}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="moradaCliente"
                label="Endereço"
                variant="filled"
                fullWidth
                value={form.moradaCliente}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onAddClienteSubmit}
              >
                <Typography variant="body2">{isEditing ? 'Salvar' : 'Cadastrar'}</Typography>
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {['NIF/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.numeroContribuinte}</TableCell>
                    <TableCell>{item.nomeCliente}</TableCell>
                    <TableCell>{item.telefoneCliente}</TableCell>
                    <TableCell>{item.emailCliente}</TableCell>
                    <TableCell>{item.moradaCliente}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEdit(item)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(item.id!)}>
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

export default ClienteComponent;
