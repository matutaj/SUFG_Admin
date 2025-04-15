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
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { Localizacao } from '../../types/models'; // Importando a interface do models.ts
import { getAllLocations, createLocation, deleteLocation, updateLocation } from '../../api/methods'; // Ajuste o caminho conforme sua estrutura

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

const WarehouseComponent: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [editWarehouseId, setEditWarehouseId] = React.useState<string | null>(null);
  const [nomeLocalizacao, setNomeLocalizacao] = React.useState('');
  const [descricao, setDescricao] = React.useState<string | null>('');
  const [warehouses, setWarehouses] = React.useState<Localizacao[]>([]);
  const [errors, setErrors] = React.useState<{ nomeLocalizacao?: string; descricao?: string }>({});
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const handleOpen = () => setOpenWarehouseModal(true);
  const handleClose = () => {
    setOpenWarehouseModal(false);
    setEditWarehouseId(null);
    setNomeLocalizacao('');
    setDescricao('');
    setErrors({});
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await getAllLocations();
      console.log('Dados retornados por getLocations:', JSON.stringify(data, null, 2));

      // Verificar IDs duplicados
      const idSet = new Set(data.map((w: Localizacao) => w.id));
      if (idSet.size !== data.length) {
        console.warn('IDs duplicados encontrados nos dados de armazéns:', data);
      }

      setWarehouses(data);
    } catch (error) {
      console.error('Erro ao buscar armazéns:', error);
      setAlert({ severity: 'error', message: 'Erro ao carregar armazéns!' });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleAddWarehouse = async () => {
    const newErrors: { nomeLocalizacao?: string; descricao?: string } = {};
    if (!nomeLocalizacao.trim()) newErrors.nomeLocalizacao = 'O nome do Localizacao é obrigatório.';
    if (!descricao?.trim()) newErrors.descricao = 'A descrição é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      if (editWarehouseId) {
        await updateLocation(editWarehouseId, { nomeLocalizacao, descricao });
        setAlert({ severity: 'success', message: 'Localizacao atualizado com sucesso!' });
      } else {
        await createLocation({ nomeLocalizacao, descricao });
        setAlert({ severity: 'success', message: 'Localizacao cadastrado com sucesso!' });
      }
      await fetchWarehouses();
      handleClose();
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar Localizacao:', error);
      setErrors({ nomeLocalizacao: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const warehouseToEdit = warehouses.find((w) => w.id === id);
    if (warehouseToEdit) {
      setNomeLocalizacao(warehouseToEdit.nomeLocalizacao || '');
      setDescricao(warehouseToEdit.descricao || '');
      setEditWarehouseId(id);
      handleOpen();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este Localizacao?')) {
      try {
        setLoading(true);
        await deleteLocation(id);
        await fetchWarehouses();
        setAlert({ severity: 'success', message: 'Localizacao excluído com sucesso!' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        console.error('Erro ao excluir Localizacao:', error);
        setAlert({ severity: 'error', message: 'Erro ao excluir Localizacao!' });
        setTimeout(() => setAlert(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">Localização</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              disabled={loading}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              Localizacao
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openWarehouseModal} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            {editWarehouseId ? 'Editar Localizacao' : 'Cadastrar Localizacao'}
          </Typography>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <TextField
              label="Nome do Localizacao"
              value={nomeLocalizacao}
              onChange={(e) => setNomeLocalizacao(e.target.value)}
              error={Boolean(errors.nomeLocalizacao)}
              helperText={errors.nomeLocalizacao}
              disabled={loading}
              fullWidth
            />
            <TextField
              label="Descrição"
              value={descricao || ''}
              onChange={(e) => setDescricao(e.target.value)}
              error={Boolean(errors.descricao)}
              helperText={errors.descricao}
              disabled={loading}
              fullWidth
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAddWarehouse}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Salvando...' : editWarehouseId ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Localizações Criados
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome</strong>
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
                    <TableCell colSpan={4} align="center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : warehouses.length > 0 ? (
                  warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>{warehouse.nomeLocalizacao || 'Sem nome'}</TableCell>
                      <TableCell>{warehouse.descricao || 'Sem descrição'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(warehouse.id!)}
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(warehouse.id!)}
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Nenhum Localizacao cadastrado.
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

export default WarehouseComponent;
