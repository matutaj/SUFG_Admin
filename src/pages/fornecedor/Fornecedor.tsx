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
import { Fornecedor } from 'types/models';
import { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../api/methods';

interface CollapsedItemProps {
  open: boolean;
}

type FornecedorForm = Partial<Fornecedor>;

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

const Fornecedores: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FornecedorForm>({
    nif: '',
    nomeFornecedor: '',
    moradaFornecedor: '',
    telefoneFornecedor: undefined,
    emailFornecedor: '',
  });
  const [fornecedores, setFornecedores] = React.useState<Fornecedor[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    fetchFornecedores();
  }, []);

  const fetchFornecedores = async () => {
    try {
      const data = await getAllSuppliers();
      setFornecedores(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleOpen = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      nif: '',
      nomeFornecedor: '',
      moradaFornecedor: '',
      telefoneFornecedor: undefined,
      emailFornecedor: '',
    });
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'telefoneFornecedor' ? (value ? Number(value) : undefined) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nomeFornecedor?.trim()) newErrors.nomeFornecedor = 'Nome é obrigatório';
    if (!form.telefoneFornecedor) newErrors.telefoneFornecedor = 'Telefone é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && editId !== null) {
        const updatedFornecedor = await updateSupplier(editId, form as Fornecedor);
        setFornecedores((prev) =>
          prev.map((item) => (item.id === editId ? updatedFornecedor : item)),
        );
      } else {
        const newFornecedor = await createSupplier(form as Fornecedor);
        setFornecedores((prev) => [...prev, newFornecedor]);
      }
      setForm({
        nif: '',
        nomeFornecedor: '',
        moradaFornecedor: '',
        telefoneFornecedor: undefined,
        emailFornecedor: '',
      });
      setOpenModal(false);
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error('Error submitting supplier:', error);
      alert('Erro ao salvar fornecedor');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteSupplier(id);
        setFornecedores((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setIsEditing(true);
    setEditId(fornecedor.id || null);
    setForm({
      nif: fornecedor.nif || '',
      nomeFornecedor: fornecedor.nomeFornecedor || '',
      moradaFornecedor: fornecedor.moradaFornecedor || '',
      telefoneFornecedor: fornecedor.telefoneFornecedor,
      emailFornecedor: fornecedor.emailFornecedor || '',
    });
    setOpenModal(true);
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
            <Typography variant="h5">Cadastrar Fornecedor</Typography>
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

      <Modal open={openModal} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 2 }}
          >
            <Typography variant="h5">
              {isEditing ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nif"
                label="NIF"
                variant="filled"
                fullWidth
                value={form.nif || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nomeFornecedor"
                label="Nome"
                variant="filled"
                fullWidth
                value={form.nomeFornecedor || ''}
                onChange={handleChange}
                error={!!errors.nomeFornecedor}
                helperText={errors.nomeFornecedor}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="telefoneFornecedor"
                label="Telefone"
                variant="filled"
                type="number"
                fullWidth
                value={form.telefoneFornecedor ?? ''}
                onChange={handleChange}
                error={!!errors.telefoneFornecedor}
                helperText={errors.telefoneFornecedor}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emailFornecedor"
                label="Email"
                variant="filled"
                fullWidth
                value={form.emailFornecedor || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="moradaFornecedor"
                label="Endereço"
                variant="filled"
                fullWidth
                value={form.moradaFornecedor || ''}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={onSubmit}
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
                  {['NIF', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {fornecedores.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nif}</TableCell>
                    <TableCell>{item.nomeFornecedor}</TableCell>
                    <TableCell>{item.telefoneFornecedor}</TableCell>
                    <TableCell>{item.emailFornecedor}</TableCell>
                    <TableCell>{item.moradaFornecedor}</TableCell>
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

export default Fornecedores;
