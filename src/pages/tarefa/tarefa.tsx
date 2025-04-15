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
import { getAllTasks, createTask, updateTask, deleteTask } from '../../api/methods'; // Ajuste o caminho
import { Tarefa } from '../../types/models'; // Importa a interface correta para Tarefa

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

const TarefaComponent = ({ open }: CollapsedItemProps) => {
  console.log('Tarefa renderizado, open:', open);
  const [openTarefa, setOpenTarefa] = React.useState(false);
  const [editTarefaId, setEditTarefaId] = React.useState<string | null>(null); // ID como string (UUID)
  const [nomeTarefa, setNomeTarefa] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [tarefas, setTarefas] = React.useState<Tarefa[]>([]);
  const [errors, setErrors] = React.useState<{ nomeTarefa?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);

  const handleOpen = () => setOpenTarefa(true);
  const handleClose = () => {
    setOpenTarefa(false);
    setEditTarefaId(null);
    setNomeTarefa('');
    setDescricao('');
    setErrors({});
  };

  // Buscar tarefas da API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getAllTasks();
      setTarefas(data);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const onAddTarefaSubmit = async (nomeTarefa: string, descricao: string) => {
    const newErrors: { nomeTarefa?: string; descricao?: string } = {};
    if (!nomeTarefa.trim()) newErrors.nomeTarefa = 'O nome da tarefa é obrigatório.';
    if (!descricao.trim()) newErrors.descricao = 'A descrição é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      if (editTarefaId) {
        // Editar tarefa existente
        await updateTask(editTarefaId, { nomeTarefa, descricao });
      } else {
        // Criar nova tarefa
        await createTask({ nomeTarefa, descricao });
      }
      await fetchTasks(); // Atualiza a lista
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      setErrors({ nomeTarefa: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const tarefaToEdit = tarefas.find((task) => task.id === id);
    if (tarefaToEdit) {
      setNomeTarefa(tarefaToEdit.nomeTarefa || '');
      setDescricao(tarefaToEdit.descricao || '');
      setEditTarefaId(id);
      handleOpen();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        setLoading(true);
        await deleteTask(id);
        await fetchTasks(); // Atualiza a lista
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Para relacionar tarefas a funcionários e funções, você pode adicionar um botão ou modal adicional
  // Aqui, vou sugerir um botão simples para demonstrar a ideia
  const handleAssignToEmployee = (tarefaId: string) => {
    // Lógica para abrir um modal ou redirecionar para uma página onde os funcionários e funções podem ser selecionados
    console.log(`Atribuir tarefa ${tarefaId} a funcionários e funções`);
    // Exemplo: Abrir um modal com uma lista de funcionários e suas funções, permitindo múltiplas seleções
  };

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
              Cadastrar Tarefa
            </Typography>
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
            <Modal
              open={openTarefa}
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
                    {editTarefaId ? 'Editar Tarefa' : 'Cadastrar Tarefa'}
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error" disabled={loading}>
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    id="task-name"
                    onChange={(e) => setNomeTarefa(e.target.value)}
                    value={nomeTarefa}
                    label="Nome da Tarefa"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.nomeTarefa)}
                    helperText={errors.nomeTarefa}
                    disabled={loading}
                  />
                  <TextField
                    id="task-description"
                    onChange={(e) => setDescricao(e.target.value)}
                    value={descricao}
                    label="Descrição"
                    variant="filled"
                    sx={{ width: '100%' }}
                    error={Boolean(errors.descricao)}
                    helperText={errors.descricao}
                    disabled={loading}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ height: 40, width: '100%' }}
                    onClick={() => onAddTarefaSubmit(nomeTarefa, descricao)}
                    disabled={loading}
                  >
                    <Typography variant="body2">
                      {loading ? 'Salvando...' : editTarefaId ? 'Atualizar' : 'Cadastrar'}
                    </Typography>
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
                    <strong>Nome da Tarefa</strong>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : tarefas.length > 0 ? (
                  tarefas.map((tarefa) => (
                    <TableRow key={tarefa.id}>
                      <TableCell>{tarefa.nomeTarefa || 'Sem nome'}</TableCell>
                      <TableCell>{tarefa.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(tarefa.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(tarefa.id!)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                        <IconButton
                          color="success"
                          onClick={() => handleAssignToEmployee(tarefa.id!)}
                          disabled={loading}
                        >
                          <IconifyIcon icon="heroicons-solid:user-group" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhuma tarefa cadastrada.
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

export default TarefaComponent;
