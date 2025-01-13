import * as React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import IconifyIcon from 'components/base/IconifyIcon';
import SearchFilter from 'components/common/SearchFilter';
import CustomPagination from 'components/common/CustomPagination';
import { columns, rows } from 'data/dashboard/produtoTableData';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1080,
  height: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'start',
  alignItems: 'center',
  backgroundColor: '#f9f9f9',
  p: 4,
};

export default function ProdutoTable() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const apiRef = useGridApiRef();

  return (
    <Paper
      sx={(theme) => ({
        p: theme.spacing(2, 2.5),
        width: 1,
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

        <Button
          variant="contained"
          color="secondary"
          sx={(theme) => ({
            p: theme.spacing(0.625, 1.5),
            borderRadius: 1.5,
          })}
          startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
          onClick={handleOpen}
        >
          <Typography variant="body2">Adiciona</Typography>
        </Button>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style} component="form" noValidate autoComplete="on">
            <Typography id="modal-modal-title" variant="h1" component="h2">
              Cadastrar Produto
            </Typography>

            <div>
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
            </div>
            <div>
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
            </div>
            <div>
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
              <TextField
                id="filled-multiline-flexible"
                label="Multiline"
                multiline
                maxRows={4}
                variant="filled"
                sx={{
                  padding: '16px',
                  width: '300px',
                }}
              />
            </div>
            <br />
            <Button
              variant="contained"
              color="secondary"
              sx={(theme) => ({
                p: theme.spacing(0.625, 1.5),
                borderRadius: 1.5,
                height: 40,
                width: 150,
              })}
              onClick={handleOpen}
            >
              <Typography variant="body2">Cadastrar</Typography>
            </Button>
          </Box>
        </Modal>
      </Stack>

      <Box
        sx={{
          height: 330,
          width: 1,
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
        />
      </Box>

      <CustomPagination apiRef={apiRef} />
    </Paper>
  );
}
