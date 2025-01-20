import { Collapse, Paper, Button, Stack, Typography } from '@mui/material';
import { SubItem } from 'types/types';

import IconifyIcon from 'components/base/IconifyIcon';
interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const Funcionario = ({ open }: CollapsedItemProps) => {
  return (
    <Paper
      sx={(theme) => ({
        p: theme.spacing(2, 2.5),
        width: '100%',
      })}
    >
      <Collapse in={open}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ width: '100%', mb: 2 }}
        >
          <Typography id="modal-modal-title" variant="h5" component="h2">
            Cadastrar Categoria
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            sx={(theme) => ({
              p: theme.spacing(0.625, 1.5),
              borderRadius: 1.5,
            })}
            startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
          >
            <Typography variant="body2">Adicionar</Typography>
          </Button>
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default Funcionario;
