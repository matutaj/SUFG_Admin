import {
  Collapse,
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
  IconButton,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormHelperText,
  Alert,
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 980 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 450 },
  maxHeight: '90%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  p: 4,
  overflowY: 'auto',
};

interface FormErrors {
  categoria: string;
  name: string;
  pratileira: string;
  quantidade: string;
  validade: string;
  prico: string;
}

const ProductLoja: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openProduct, setOpenProduct] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const handleOpen = () => setOpenProduct(true);
  const handleClose = () => {
    setOpenProduct(false);
    setAlert(null); // Clear alert when closing modal
  };
  const [search, setSearch] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  const [form, setForm] = React.useState({
    name: '',
    pratileira: '',
    categoria: '',
    validade: new Date(),
    prico: 0,
    quantidade: 0,
  });

  const [formErrors, setFormErrors] = React.useState({
    name: '',
    pratileira: '',
    categoria: '',
    validade: '',
    prico: '',
    quantidade: '',
  });

  const [loja, setLoja] = React.useState<
    {
      id: number;
      name: string;
      pratileira: string;
      categoria: string;
      validade: Date;
      prico: number;
      quantidade: number;
    }[]
  >(JSON.parse(localStorage.getItem('loja') || '[]'));

  const [products] = React.useState<
    {
      id: number;
      name: string;
      pratileira: string;
      categoria: string;
      validade: Date;
      prico: number;
      quantidade: number;
    }[]
  >(JSON.parse(localStorage.getItem('products') || '[]'));

  const [categories] = React.useState<{ id: number; name: string }[]>(
    JSON.parse(localStorage.getItem('categoria') || '[]'),
  );

  const filteredProducts = loja.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name as string]: name === 'prico' || name === 'quantidade' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const errors: FormErrors = {
      name: '',
      quantidade: '',
      validade: '',
      categoria: '',
      prico: '',
      pratileira: '',
    };
    if (!form.name) {
      errors.name = 'Nome do produto é obrigatório';
    }

    if (form.quantidade <= 0) {
      errors.quantidade = 'A quantidade deve ser maior que 0';
    }
    if (form.prico <= 0) {
      errors.prico = 'O preço deve ser maior que 0';
    }

    if (!form.pratileira) {
      errors.pratileira = 'A pratileira é obrigatória';
    }
    if (!form.categoria) {
      errors.categoria = 'A categoria é obrigatória';
    }
    if (!form.validade || isNaN(new Date(form.validade).getTime())) {
      errors.validade = 'A validade é inválida';
    }

    setFormErrors(errors);
    return Object.values(errors).every((error) => error === '');
  };

  const handleAddProduct = () => {
    if (validateForm()) {
      // Check for duplicate based on name and categoria
      const isDuplicate = loja.some(
        (item) => item.name === form.name && item.categoria === form.categoria,
      );

      if (isDuplicate) {
        setAlert({
          type: 'error',
          message: 'Este produto já existe nesta categoria na loja!',
        });
        return;
      }

      const newProduct = {
        id: loja.length + 1,
        name: form.name,
        pratileira: form.pratileira,
        categoria: form.categoria,
        validade: form.validade,
        prico: form.prico,
        quantidade: form.quantidade,
      };

      const updatedLoja = [...loja, newProduct];
      setLoja(updatedLoja);
      localStorage.setItem('loja', JSON.stringify(updatedLoja));

      setAlert({
        type: 'success',
        message: 'Produto adicionado com sucesso!',
      });

      setForm({
        name: '',
        pratileira: '',
        categoria: '',
        validade: new Date(),
        prico: 0,
        quantidade: 0,
      });
      setFormErrors({
        name: '',
        pratileira: '',
        categoria: '',
        validade: '',
        prico: '',
        quantidade: '',
      });

      // Optional: Automatically close modal after success
      setTimeout(() => {
        setOpenProduct(false);
        setAlert(null);
      }, 2000); // Close after 2 seconds
    }
  };

  React.useEffect(() => {
    localStorage.setItem('loja', JSON.stringify(loja));
  }, [loja]);

  return (
    <>
      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Produtos Na Loja</Typography>
            <TextField
              label="Pesquisar"
              variant="outlined"
              size="small"
              value={search}
              onChange={handleSearch}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpen}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              <Typography variant="body2">Adicionar Produto</Typography>
            </Button>
          </Stack>
        </Collapse>
      </Paper>

      <Modal open={openProduct} onClose={handleClose}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%', mb: 8 }}
          >
            <Typography id="modal-modal-title" variant="h5" component="h2">
              Adicionar Produtos Na Loja
            </Typography>
            <Button onClick={handleClose} variant="outlined" color="error">
              Fechar
            </Button>
          </Stack>
          <Stack sx={{ width: '100%' }} spacing={3}>
            {alert && (
              <Alert variant="filled" severity={alert.type}>
                {alert.message}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleSelectChange}
                  displayEmpty
                  error={Boolean(formErrors.categoria)}
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Selecione a categoria
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.categoria && (
                  <FormHelperText error>{formErrors.categoria}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Select
                  name="name"
                  value={form.name}
                  onChange={handleSelectChange}
                  displayEmpty
                  error={Boolean(formErrors.name)}
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Selecione um Produto
                  </MenuItem>
                  {products.map((prod) => (
                    <MenuItem key={prod.id} value={prod.name}>
                      {prod.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.name && <FormHelperText error>{formErrors.name}</FormHelperText>}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Select
                  name="pratileira"
                  value={form.pratileira}
                  onChange={handleSelectChange}
                  displayEmpty
                  error={Boolean(formErrors.pratileira)}
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    Selecione a pratileira
                  </MenuItem>
                  <MenuItem value="baixo">Baixo</MenuItem>
                  <MenuItem value="medio">Médio</MenuItem>
                  <MenuItem value="alto">Alto</MenuItem>
                </Select>
                {formErrors.pratileira && (
                  <FormHelperText error>{formErrors.pratileira}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantidade"
                  label="Quantidade"
                  type="number"
                  sx={{ width: '100%' }}
                  value={form.quantidade}
                  onChange={handleChange}
                  error={Boolean(formErrors.quantidade)}
                  helperText={formErrors.quantidade}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="prico"
                  label="Preço"
                  type="number"
                  sx={{ width: '100%' }}
                  value={form.prico}
                  onChange={handleChange}
                  error={Boolean(formErrors.prico)}
                  helperText={formErrors.prico}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="validade"
                  label="Validade"
                  type="date"
                  sx={{ width: '100%' }}
                  value={form.validade.toISOString().split('T')[0]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validade: new Date(e.target.value) }))
                  }
                  error={Boolean(formErrors.validade)}
                  helperText={formErrors.validade}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Button variant="contained" color="secondary" onClick={handleAddProduct}>
              Cadastrar
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    'ID',
                    'Nome do Produto',
                    'Pratileira',
                    'Preço',
                    'Validade',
                    'Quantidade',
                    'Editar',
                  ].map((header) => (
                    <TableCell key={header}>
                      <strong>{header}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.pratileira}</TableCell>
                    <TableCell>{product.prico}</TableCell>
                    <TableCell>{new Date(product.validade).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{product.quantidade}</TableCell>
                    <TableCell>
                      <IconButton color="primary">
                        <Edit />
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

export default ProductLoja;
