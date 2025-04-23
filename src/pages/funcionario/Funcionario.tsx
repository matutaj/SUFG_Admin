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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import React from 'react';
import {
  Funcionario,
  Funcao,
  Permissao,
  FuncionarioFuncao,
  FuncionarioPermissao,
} from 'types/models';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllFunctions,
  getAllPermissions,
  createEmployeeFunction,
  createEmployeePermission,
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
  height: { xs: '100%', sm: '50%', md: 790 },
  maxHeight: '77%',
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
  const [form, setForm] = React.useState<
    Partial<Funcionario> & { funcaoId?: string; permissoesIds?: string[] }
  >({
    numeroBI: '',
    nomeFuncionario: '',
    senha: '',
    moradaFuncionario: '',
    telefoneFuncionario: '',
    emailFuncionario: '',
    funcaoId: '',
    permissoesIds: [],
  });
  const [funcionarios, setFuncionarios] = React.useState<Funcionario[]>([]);
  const [funcoes, setFuncoes] = React.useState<Funcao[]>([]);
  const [permissoes, setPermissoes] = React.useState<Permissao[]>([]);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const itemsPerPage = 5;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesData, functionsData, permissionsData] = await Promise.all([
          getAllEmployees(),
          getAllFunctions(),
          getAllPermissions(),
        ]);
        setFuncionarios(employeesData);
        setFuncoes(functionsData);
        setPermissoes(permissionsData);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

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
      funcaoId: '',
      permissoesIds: [],
    });
    setErrors({});
    setOpenModal(true);
  };

  const handleClose = () => setOpenModal(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name as string]: value,
    }));
    if (errors[name as string]) {
      setErrors((prev) => ({ ...prev, [name as string]: '' }));
    }
  };

  const handlePermissionsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string[];
    setForm((prev) => ({
      ...prev,
      permissoesIds: value,
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nomeFuncionario?.trim()) newErrors.nomeFuncionario = 'Nome é obrigatório';
    if (!form.telefoneFuncionario?.trim()) newErrors.telefoneFuncionario = 'Telefone é obrigatório';
    if (!form.numeroBI?.trim()) newErrors.numeroBI = 'NIF/BI é obrigatório';
    if (!form.funcaoId) newErrors.funcaoId = 'Função é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validateForm()) return;

    try {
      let employeeId: string;
      const employeeData: Funcionario = {
        numeroBI: form.numeroBI!,
        nomeFuncionario: form.nomeFuncionario!,
        senha: form.senha!,
        moradaFuncionario: form.moradaFuncionario!,
        telefoneFuncionario: form.telefoneFuncionario!,
        emailFuncionario: form.emailFuncionario!,
        roles: [],
      };

      if (isEditing && editId) {
        const updatedEmployee = await updateEmployee(editId, employeeData);
        employeeId = editId;
        setFuncionarios((prev) =>
          prev.map((item) => (item.id === editId ? updatedEmployee : item)),
        );
      } else {
        const newEmployee = await createEmployee(employeeData);
        employeeId = newEmployee.id!;
        setFuncionarios((prev) => [...prev, newEmployee]);
      }

      // Create FuncionarioFuncao
      if (form.funcaoId) {
        const funcionarioFuncao: FuncionarioFuncao = {
          id_funcionario: employeeId,
          id_funcao: form.funcaoId,
        };
        await createEmployeeFunction(funcionarioFuncao);
      }

      // Create FuncionarioPermissao for each selected permission
      if (form.permissoesIds && form.permissoesIds.length > 0) {
        for (const permissaoId of form.permissoesIds) {
          const funcionarioPermissao: FuncionarioPermissao = {
            id_funcionario: employeeId,
            id_permissao: permissaoId,
          };
          await createEmployeePermission(funcionarioPermissao);
        }
      }

      setForm({
        numeroBI: '',
        nomeFuncionario: '',
        senha: '',
        moradaFuncionario: '',
        telefoneFuncionario: '',
        emailFuncionario: '',
        funcaoId: '',
        permissoesIds: [],
      });
      setOpenModal(false);
      setIsEditing(false);
      setEditId(null);
      setCurrentPage(1);
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
        const totalItems = funcionarios.length - 1;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleEdit = (funcionario: Funcionario) => {
    setIsEditing(true);
    setEditId(funcionario.id || null);
    setForm({
      numeroBI: funcionario.numeroBI,
      nomeFuncionario: funcionario.nomeFuncionario,
      senha: funcionario.senha,
      moradaFuncionario: funcionario.moradaFuncionario,
      telefoneFuncionario: funcionario.telefoneFuncionario,
      emailFuncionario: funcionario.emailFuncionario,
      funcaoId: '',
      permissoesIds: [],
    });
    setErrors({});
    setOpenModal(true);
  };

  const totalItems = funcionarios.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFuncionarios = funcionarios.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
            <Grid item xs={12} sm={6}>
              <FormControl variant="filled" fullWidth error={!!errors.funcaoId}>
                <InputLabel>Função</InputLabel>
                <Select name="funcaoId" value={form.funcaoId} onChange={handleChange}>
                  <MenuItem value="">
                    <em>Selecione uma função</em>
                  </MenuItem>
                  {funcoes.map((funcao) => (
                    <MenuItem key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </MenuItem>
                  ))}
                </Select>
                {errors.funcaoId && (
                  <Typography color="error" variant="caption">
                    {errors.funcaoId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl variant="filled" fullWidth>
                <InputLabel>Permissões</InputLabel>
                <Select
                  multiple
                  name="permissoesIds"
                  value={form.permissoesIds}
                  onChange={handlePermissionsChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip
                          key={value}
                          label={permissoes.find((p) => p.id === value)?.nome || value}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {permissoes.map((permissao) => (
                    <MenuItem key={permissao.id} value={permissao.id}>
                      {permissao.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                {paginatedFuncionarios.length > 0 ? (
                  paginatedFuncionarios.map((item) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalItems > itemsPerPage && (
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={2}
              sx={{ mt: 2 }}
            >
              <Button
                variant="outlined"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <Typography>
                Página {currentPage} de {totalPages}
              </Typography>
              <Button
                variant="outlined"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Próximo
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default FuncionarioComponent;
