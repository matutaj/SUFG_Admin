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
import { Funcionario } from 'types/models';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api/methods';

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

const FuncionarioComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<Funcionario>>({
    numeroBI: '',
    nomeFuncionario: '',
    senha: '',
    moradaFuncionario: '',
    telefoneFuncionario: '',
    emailFuncionario: '',
  });
  const [funcionarios, setFuncionarios] = React.useState<Funcionario[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployees();
      setFuncionarios(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleOpen = () => {
    setIsEditing(false);
    setEditId(null);
    setForm({
      numeroBI: '',
      nomeFuncionario: '',
      senha: '',
      moradaFuncionario: '',
      telefoneFuncionario: '',
      emailFuncionario: '',
    });
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

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
    if (!form.nomeFuncionario?.trim()) newErrors.nomeFuncionario = 'Nome é obrigatório';
    if (!form.telefoneFuncionario?.trim()) newErrors.telefoneFuncionario = 'Telefone é obrigatório';
    if (!form.numeroBI?.trim()) newErrors.numeroBI = 'NIF/BI é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (isEditing && editId) {
        const updatedEmployee = await updateEmployee(editId, form as Funcionario);
        setFuncionarios((prev) =>
          prev.map((item) => (item.id === editId ? updatedEmployee : item)),
        );
      } else {
        const newEmployee = await createEmployee(form as Funcionario);
        setFuncionarios((prev) => [...prev, newEmployee]);
      }
      setForm({
        numeroBI: '',
        nomeFuncionario: '',
        senha: '',
        moradaFuncionario: '',
        telefoneFuncionario: '',
        emailFuncionario: '',
      });
      setOpenModal(false);
      setIsEditing(false);
      setEditId(null);
    } catch (error) {
      console.error('Error submitting employee:', error);
      alert('Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        await deleteEmployee(id);
        setFuncionarios((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    setIsEditing(true);
    setEditId(funcionario.id || null); // Fix applied here
    setForm({
      numeroBI: funcionario.numeroBI,
      nomeFuncionario: funcionario.nomeFuncionario,
      senha: funcionario.senha,
      moradaFuncionario: funcionario.moradaFuncionario,
      telefoneFuncionario: funcionario.telefoneFuncionario,
      emailFuncionario: funcionario.emailFuncionario,
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
            <Typography variant="h5">Funcionários</Typography>
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
              {isEditing ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>

          <Grid container spacing={2} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="numeroBI"
                label="NIF/BI"
                variant="filled"
                fullWidth
                value={form.numeroBI}
                onChange={handleChange}
                error={!!errors.numeroBI}
                helperText={errors.numeroBI}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nomeFuncionario"
                label="Nome"
                variant="filled"
                fullWidth
                value={form.nomeFuncionario}
                onChange={handleChange}
                error={!!errors.nomeFuncionario}
                helperText={errors.nomeFuncionario}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="telefoneFuncionario"
                label="Telefone"
                variant="filled"
                type="tel"
                fullWidth
                value={form.telefoneFuncionario}
                onChange={handleChange}
                error={!!errors.telefoneFuncionario}
                helperText={errors.telefoneFuncionario}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="emailFuncionario"
                label="Email"
                type="email"
                variant="filled"
                fullWidth
                value={form.emailFuncionario}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="moradaFuncionario"
                label="Endereço"
                variant="filled"
                fullWidth
                value={form.moradaFuncionario}
                onChange={handleChange}
              />
            </Grid>
            {!isEditing && (
              <Grid item xs={12}>
                <TextField
                  name="senha"
                  label="Senha"
                  type="password"
                  variant="filled"
                  fullWidth
                  value={form.senha}
                  onChange={handleChange}
                />
              </Grid>
            )}
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
                  {['NIF/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {funcionarios.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.numeroBI}</TableCell>
                    <TableCell>{item.nomeFuncionario}</TableCell>
                    <TableCell>{item.telefoneFuncionario}</TableCell>
                    <TableCell>{item.emailFuncionario}</TableCell>
                    <TableCell>{item.moradaFuncionario}</TableCell>
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

export default FuncionarioComponent;
