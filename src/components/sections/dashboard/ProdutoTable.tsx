import * as React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import IconifyIcon from 'components/base/IconifyIcon';
import SearchFilter from 'components/common/SearchFilter';
import CustomPagination from 'components/common/CustomPagination';
import { columns, rows } from 'data/dashboard/produtoTableData';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1080,
  height: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
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
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Text in a modal
            </Typography>
            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
              Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
            </Typography>
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
