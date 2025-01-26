import * as React from 'react';
import { Collapse, Paper, Button, Stack, Typography, Box } from '@mui/material';
import { SubItem } from 'types/types';
import IconifyIcon from 'components/base/IconifyIcon';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CardContent from '@mui/material/CardContent';
interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const style = {
  position: 'absolute',
  top: '40%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 700 }, // Responsivo: 90% na tela pequena, 80% média, 900px maior
  maxWidth: '100%', // Limita a largura máxima
  height: { xs: '65%', sm: '55%', md: 750 }, // Responsivo: 90% da altura na tela pequena
  maxHeight: '60%', // Limita a altura máxima
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

const Categoria = ({ open }: CollapsedItemProps) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [categoria, setCategoria] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [lista, setLista] = React.useState<{ id: number; categoria: string; descricao: string }[]>(
    () => {
      try {
        const stored = localStorage.getItem('listaCategoria');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  );

  function onAddCategoriaSubmit(categoria: string, descricao: string) {
    const novaCategoria = {
      id: categoria.length + 1,
      categoria,
      descricao,
    };
    setLista([...lista, novaCategoria]);
  }
  React.useEffect(() => {
    localStorage.setItem('listaCategoria', JSON.stringify(lista));
  }, [lista]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  return (
    <>
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
            sx={{ width: '100%' }}
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
              <Typography variant="body2" onClick={handleOpen}>
                Adicionar
              </Typography>
            </Button>
            <Modal
              open={openModal}
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
                    CADASTRAR CATEGORIA
                  </Typography>
                  <Button onClick={handleClose} variant="outlined" color="error">
                    Fechar
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <TextField
                    onChange={(e) => setCategoria(e.target.value)}
                    id="Categoria-name"
                    label="Nome da Categoria"
                    value={categoria}
                    variant="filled"
                    sx={{ width: '100%' }}
                  />
                  <TextField
                    onChange={(e) => setDescricao(e.target.value)}
                    id="descricao"
                    label="Descrição"
                    variant="filled"
                    value={descricao}
                    multiline
                    rows={4}
                    sx={{ width: '100%' }}
                  />

                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ height: 40, width: '100%' }}
                    onClick={() => onAddCategoriaSubmit(categoria, descricao)}
                  >
                    <Typography variant="body2">Cadastrar</Typography>
                  </Button>
                </Stack>
              </Box>
            </Modal>
          </Stack>
        </Collapse>
      </Paper>
      <br />
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgb(179, 179, 179)',
            }}
          >
            {/* Títulos */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
                fontWeight: 'bold',
              }}
            >
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                Categoria
              </Typography>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                Descrição
              </Typography>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 'bold' }}>
                Ações
              </Typography>
            </div>
          </div>

          {lista.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '19px 0',
                borderBottom: '1px solid #ddd',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <Typography
                  variant="body1"
                  component="div"
                  sx={{ fontSize: '16px', fontWeight: 'bold' }}
                >
                  {item.categoria}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '14px', color: 'gray' }}>
                  {item.descricao}
                </Typography>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#1976d2',
                    }}
                    onClick={() => {}} // Função para atualizar
                  >
                    <i className="material-icons">
                      <EditIcon />
                    </i>
                  </button>
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#d32f2f',
                    }}
                    onClick={() => {}} // Função para deletar
                  >
                    <i className="material-icons">
                      <DeleteIcon />
                    </i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
};

export default Categoria;
