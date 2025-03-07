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
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

interface Store {
  id: number;
  name: string;
  sections: StoreSection[];
}

interface StoreSection {
  id: number;
  name: string;
  shelves: StoreShelf[];
}

interface StoreShelf {
  id: number;
  name: string;
}

interface StoreProduct {
  id: number;
  name: string;
  shelf: string;
  prico: number;
  validade: string;
  quantidade: number;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: '80%', md: 980 },
  maxWidth: '100%',
  height: { xs: '100%', sm: '50%', md: 500 },
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

const StoreManager: React.FC<CollapsedItemProps> = ({ open }) => {
  const [stores, setStores] = React.useState<Store[]>(() => {
    const savedStores = localStorage.getItem('stores');
    return savedStores ? JSON.parse(savedStores) : [];
  });
  const [selectedStoreId, setSelectedStoreId] = React.useState<number | null>(() => {
    const savedStoreId = localStorage.getItem('selectedStoreId');
    return savedStoreId ? Number(savedStoreId) : null;
  });
  const [selectedSectionId, setSelectedSectionId] = React.useState<number | null>(() => {
    const savedSectionId = localStorage.getItem('selectedStoreSectionId');
    return savedSectionId ? Number(savedSectionId) : null;
  });
  const [openStoreModal, setOpenStoreModal] = React.useState(false);
  const [openSectionModal, setOpenSectionModal] = React.useState(false);
  const [openShelfModal, setOpenShelfModal] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const [storeForm, setStoreForm] = React.useState({ name: '' });
  const [sectionForm, setSectionForm] = React.useState({ name: '' });
  const [shelfForm, setShelfForm] = React.useState({ name: '' });

  const [storeProducts] = React.useState<StoreProduct[]>(() => {
    const savedStoreProducts = localStorage.getItem('loja');
    return savedStoreProducts ? JSON.parse(savedStoreProducts) : [];
  });

  React.useEffect(() => {
    localStorage.setItem('stores', JSON.stringify(stores));
  }, [stores]);

  React.useEffect(() => {
    localStorage.setItem('selectedStoreId', String(selectedStoreId));
  }, [selectedStoreId]);

  React.useEffect(() => {
    localStorage.setItem('selectedStoreSectionId', String(selectedSectionId));
  }, [selectedSectionId]);

  React.useEffect(() => {
    localStorage.setItem('loja', JSON.stringify(storeProducts));
  }, [storeProducts]);

  // Handlers for Store
  const handleOpenStoreModal = () => setOpenStoreModal(true);
  const handleCloseStoreModal = () => {
    setOpenStoreModal(false);
    setStoreForm({ name: '' });
  };
  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setStoreForm({ name: e.target.value });
  const handleAddStore = () => {
    if (storeForm.name) {
      const newStore: Store = {
        id: stores.length + 1,
        name: storeForm.name,
        sections: [],
      };
      setStores([...stores, newStore]);
      handleCloseStoreModal();
      setAlert({ severity: 'success', message: 'Loja criada com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteStore = (storeId: number) => {
    if (
      window.confirm(
        'Tem certeza que deseja eliminar esta loja? Isso removerá todas as suas seções e prateleiras.',
      )
    ) {
      const updatedStores = stores.filter((s) => s.id !== storeId);
      setStores(updatedStores);
      if (selectedStoreId === storeId) {
        setSelectedStoreId(null);
        setSelectedSectionId(null);
      }
      setAlert({ severity: 'success', message: 'Loja eliminada com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Handlers for Section
  const handleOpenSectionModal = () => setOpenSectionModal(true);
  const handleCloseSectionModal = () => {
    setOpenSectionModal(false);
    setSectionForm({ name: '' });
  };
  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSectionForm({ name: e.target.value });
  const handleAddSection = () => {
    if (sectionForm.name && selectedStoreId) {
      const updatedStores = stores.map((s) =>
        s.id === selectedStoreId
          ? {
              ...s,
              sections: [
                ...s.sections,
                { id: s.sections.length + 1, name: sectionForm.name, shelves: [] },
              ],
            }
          : s,
      );
      setStores(updatedStores);
      handleCloseSectionModal();
      setAlert({ severity: 'success', message: 'Seção criada com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Handlers for Shelf
  const handleOpenShelfModal = () => setOpenShelfModal(true);
  const handleCloseShelfModal = () => {
    setOpenShelfModal(false);
    setShelfForm({ name: '' });
  };
  const handleShelfChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setShelfForm({ name: e.target.value });
  const handleAddShelf = () => {
    if (shelfForm.name && selectedStoreId && selectedSectionId) {
      const updatedStores = stores.map((s) =>
        s.id === selectedStoreId
          ? {
              ...s,
              sections: s.sections.map((sec) =>
                sec.id === selectedSectionId
                  ? {
                      ...sec,
                      shelves: [
                        ...sec.shelves,
                        { id: sec.shelves.length + 1, name: shelfForm.name },
                      ],
                    }
                  : sec,
              ),
            }
          : s,
      );
      setStores(updatedStores);
      handleCloseShelfModal();
      setAlert({ severity: 'success', message: 'Prateleira criada com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const sections = selectedStore?.sections || [];
  const selectedSection = sections.find((sec) => sec.id === selectedSectionId);
  const shelves = selectedSection?.shelves || [];

  return (
    <>
      {alert && (
        <Box sx={{ position: 'fixed', top: 20, right: 40, zIndex: 9999 }}>
          <Alert severity={alert.severity}>{alert.message}</Alert>
        </Box>
      )}

      <Paper sx={{ p: 2, width: '100%' }}>
        <Collapse in={open}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h5">Lojas</Typography>
            <Select
              value={selectedStoreId || ''}
              onChange={(e) => {
                setSelectedStoreId(Number(e.target.value));
                setSelectedSectionId(null);
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Selecione uma Loja
              </MenuItem>
              {stores.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
            {selectedStoreId && (
              <Select
                value={selectedSectionId || ''}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Selecione uma Seção
                </MenuItem>
                {sections.map((sec) => (
                  <MenuItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </MenuItem>
                ))}
              </Select>
            )}
            <Button
              variant="contained"
              color="secondary"
              onClick={handleOpenStoreModal}
              startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
            >
              Nova Loja
            </Button>
            {selectedStoreId && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenSectionModal}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              >
                Nova Seção
              </Button>
            )}
            {selectedSectionId && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenShelfModal}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
              >
                Nova Prateleira
              </Button>
            )}
          </Stack>
        </Collapse>
      </Paper>

      {/* Store List */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Lojas Criadas
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Nome</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Seções</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Prateleiras</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>{store.id}</TableCell>
                    <TableCell>{store.name}</TableCell>
                    <TableCell>
                      {store.sections.length > 0
                        ? store.sections.map((s) => s.name).join(', ')
                        : 'Nenhuma seção'}
                    </TableCell>
                    <TableCell>
                      {store.sections.length > 0
                        ? store.sections
                            .flatMap((s) => s.shelves.map((sh) => ` ${sh.name}`))
                            .join(', ') || 'Nenhuma prateleira'
                        : 'Nenhuma prateleira'}
                    </TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => handleDeleteStore(store.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {stores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhuma loja criada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Store Modal */}
      <Modal open={openStoreModal} onClose={handleCloseStoreModal}>
        <Box sx={style}>
          <Typography variant="h5" mb={2}>
            Criar Loja
          </Typography>
          <TextField
            label="Nome da Loja"
            value={storeForm.name}
            onChange={handleStoreChange}
            fullWidth
          />
          <Button variant="contained" color="secondary" onClick={handleAddStore} sx={{ mt: 2 }}>
            Criar
          </Button>
        </Box>
      </Modal>

      {/* Section Modal */}
      <Modal open={openSectionModal} onClose={handleCloseSectionModal}>
        <Box sx={style}>
          <Typography variant="h5" mb={2}>
            Criar Seção
          </Typography>
          <TextField
            label="Nome da Seção"
            value={sectionForm.name}
            onChange={handleSectionChange}
            fullWidth
          />
          <Button variant="contained" color="secondary" onClick={handleAddSection} sx={{ mt: 2 }}>
            Criar
          </Button>
        </Box>
      </Modal>

      {/* Shelf Modal */}
      <Modal open={openShelfModal} onClose={handleCloseShelfModal}>
        <Box sx={style}>
          <Typography variant="h5" mb={2}>
            Criar Prateleira
          </Typography>
          <TextField
            label="Nome da Prateleira"
            value={shelfForm.name}
            onChange={handleShelfChange}
            fullWidth
          />
          <Button variant="contained" color="secondary" onClick={handleAddShelf} sx={{ mt: 2 }}>
            Criar
          </Button>
        </Box>
      </Modal>

      {/* Store Products Table */}
      {selectedSectionId && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Produtos na Loja
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {['ID', 'Nome', 'Prateleira', 'Preço', 'Validade', 'Quantidade'].map(
                      (header) => (
                        <TableCell key={header}>
                          <strong>{header}</strong>
                        </TableCell>
                      ),
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {storeProducts
                    .filter((p) => shelves.some((shelf) => shelf.name === p.shelf))
                    .map((product) => (
                      <TableRow key={`${product.id}-${product.shelf}`}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell>{product.name || '-'}</TableCell>
                        <TableCell>{product.shelf || '-'}</TableCell>
                        <TableCell>{Number(product.prico) || 0}</TableCell>
                        <TableCell>
                          {product.validade && !isNaN(new Date(product.validade).getTime())
                            ? new Intl.DateTimeFormat('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }).format(new Date(product.validade))
                            : '-'}
                        </TableCell>
                        <TableCell>{Number(product.quantidade) || 0}</TableCell>
                      </TableRow>
                    ))}
                  {storeProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Nenhum produto transferido para a loja ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default StoreManager;
