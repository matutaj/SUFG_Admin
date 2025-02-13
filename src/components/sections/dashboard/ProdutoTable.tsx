import * as React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
//import IconifyIcon from 'components/base/IconifyIcon';
import SearchFilter from 'components/common/SearchFilter';
import CustomPagination from 'components/common/CustomPagination';
import { columns, rows } from 'data/dashboard/produtoTableData';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 900 }, // Responsivo: 90% na tela pequena, 80% média, 900px maior
  maxWidth: '100%', // Limita a largura máxima
  height: { xs: '90%', sm: '80%', md: 650 }, // Responsivo: 90% da altura na tela pequena
  maxHeight: '100%', // Limita a altura máxima
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  backgroundColor: '#f9f9f9',
  p: 4,
  overflowY: 'auto', // Ativa o scroll vertical
  scrollbarWidth: 'thin', // Estilo para Firefox
  scrollbarColor: '#6c63ff #f1f1f1', // Cores para Firefox
};

export default function ProdutoTable() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [categoria, setCategoria] = React.useState('');
  const apiRef = useGridApiRef();

  const handleChange = (event: SelectChangeEvent) => {
    setCategoria(event.target.value);
  };

  return (
    <Paper
      sx={(theme) => ({
        p: theme.spacing(2, 2.5),
        width: '100%',
      })}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
      >
        <Typography variant="h5" color="common.black">
          Produtos
        </Typography>

        <SearchFilter apiRef={apiRef} />
        <Modal
          open={open}
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
                Cadastrar Produto
              </Typography>
              <Button onClick={handleClose} variant="outlined" color="error">
                Fechar
              </Button>
            </Stack>

            <Stack spacing={2} sx={{ width: '100%' }}>
              <TextField
                id="product-name"
                label="Nome do Produto"
                variant="filled"
                sx={{ width: '100%' }}
              />
              <InputLabel id="demo-simple-select-standard-label">Categoria</InputLabel>
              <Select
                labelId="demo-simple-select-standard-label"
                id="demo-simple-select-standard"
                value={categoria}
                onChange={handleChange}
                label="categoria"
                fullWidth
              >
                <MenuItem value="">
                  <em>Categoria</em>
                </MenuItem>
                <MenuItem value={10}>Alimentar</MenuItem>
                <MenuItem value={20}>Electrodomesticos</MenuItem>
                <MenuItem value={30}>Bebida</MenuItem>
              </Select>
              <TextField
                id="product-ref"
                label="Ref. Produto"
                variant="filled"
                sx={{ width: '100%' }}
              />
              <TextField
                id="product-cost"
                label="Custo de Aquisão"
                variant="filled"
                sx={{ width: '100%' }}
              />
              <TextField
                id="product-name-duplicate"
                label="Nome do Produto"
                variant="filled"
                sx={{ width: '100%' }}
              />
              <TextField
                id="product-name-duplicate"
                label="Nome do Produto"
                variant="filled"
                sx={{ width: '100%' }}
              />
              <TextField
                id="product-name-duplicate"
                label="Nome do Produto"
                variant="filled"
                sx={{ width: '100%' }}
              />
              <Button
                variant="contained"
                color="secondary"
                sx={{ height: 40, width: '100%' }}
                onClick={handleOpen}
              >
                <Typography variant="body2">Cadastrar</Typography>
              </Button>
            </Stack>
          </Box>
        </Modal>
      </Stack>

      <Box
        sx={{
          height: 330,
          width: '100%',
          mt: 1.75,
        }}
      >
        <DataGrid
          apiRef={apiRef}
          columns={columns}
          rows={rows}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          autoHeight
          sx={{ width: '100%' }}
        />
      </Box>

      <CustomPagination apiRef={apiRef} />
    </Paper>
  );
}
