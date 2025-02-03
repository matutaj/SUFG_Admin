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
} from '@mui/material';
import { SubItem } from 'types/types';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from '@mui/material/Icon';
import Edit from '@mui/material/Icon';
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
  maxHeight: '90%',
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

const Cliente: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openCliente, setOpenCliente] = React.useState(false);
  const handleOpen = () => setOpenCliente(true);
  const handleClose = () => setOpenCliente(false);

  const [errors, setErrors] = React.useState<{ name?: string }>({});
  const [form, setForm] = React.useState({
    name: '',
    telefone: '',
    email: '',
    endereco: '',
    nif: '',
  });
  const [cliente, setCliente] = React.useState<
    { id: number; nif: string; name: string; telefone: string; email: string; endereco: string }[]
  >(JSON.parse(localStorage.getItem('cliente') || '[]'));

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

  function onAddClienteSubmit() {
    if (!form.name.trim() || !form.telefone.trim()) {
      alert('Nome e telefone são obrigatórios!');
      return;
    }

    const newCliente = {
      id: cliente.length + 1,
      ...form,
    };

    setCliente([...cliente, newCliente]);
    setForm({
      name: '',
      telefone: '',
      email: '',
      endereco: '',
      nif: '',
    });
  }

  React.useEffect(() => {
    localStorage.setItem('cliente', JSON.stringify(cliente));
  }, [cliente]);

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
            <Modal open={openCliente} onClose={handleClose}>
              <Box sx={style} component="form" noValidate autoComplete="off">
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ width: '100%', mb: 2 }}
                >
                  <Typography variant="h5">Cadastrar Cliente</Typography>
                  <Button onClick={handleClose} variant="outlined" color="error">
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  {['name', 'telefone', 'email', 'endereco', 'nif'].map((field) => (
                    <TextField
                      key={field}
                      name={field}
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      variant="filled"
                      sx={{ width: '100%' }}
                      value={form[field as keyof typeof form]}
                      onChange={handleChange}
                    />
                  ))}
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ height: 40, width: '100%' }}
                    onClick={onAddClienteSubmit}
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
                  {['Nif/BI', 'Nome', 'Telefone', 'Email', 'Endereço', 'Ações'].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {cliente.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nif}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.telefone}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.endereco}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton color="error">
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

export default Cliente;
