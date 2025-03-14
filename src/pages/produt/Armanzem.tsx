import {
  Collapse,
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
  Grid,
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
  SelectChangeEvent,
  FormHelperText,
  Alert,
} from '@mui/material';
import React from 'react';
import IconifyIcon from 'components/base/IconifyIcon';
import Edit from 'components/icons/factor/Edit';
import Delete from 'components/icons/factor/Delete';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

interface Warehouse {
  id: number;
  name: string;
  description: string;
  sections: Section[];
}

interface Section {
  id: number;
  name: string;
  description: string;
  corridors: Corridor[];
}

interface Corridor {
  id: number;
  name: string;
  description: string;
  shelves: Shelf[];
}

interface Shelf {
  id: number;
  name: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  categoria: string;
  custoAqui: number;
  detalhes: string;
  fornecedor: string;
  validade: string;
  prico: number;
  quantidade: number;
  warehouseId: number;
  sectionId: number;
  corridorId: number;
  shelfId: number;
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
  height: { xs: '100%', sm: 'auto', md: 600 },
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
  name: string;
  custoAqui: string;
  quantidade: string;
  validade: string;
  prico: string;
  categoria: string;
}

interface TransferFormErrors {
  transferQuantity: string;
  storeId: string;
  sectionId: string;
  shelfId: string;
}

interface TransferForm {
  transferQuantity: number;
  storeId: number;
  sectionId: number;
  shelfId: number;
}

interface WarehouseForm {
  name: string;
  description: string;
  sections: { id: number; corridorIds: number[]; shelfIds: number[] }[];
}

const ProductManager: React.FC<CollapsedItemProps> = ({ open }) => {
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>(() => {
    const savedWarehouses = localStorage.getItem('warehouses');
    return savedWarehouses ? JSON.parse(savedWarehouses) : [];
  });
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<number | null>(() => {
    const savedWarehouseId = localStorage.getItem('selectedWarehouseId');
    return savedWarehouseId ? Number(savedWarehouseId) : null;
  });
  const [selectedSectionId, setSelectedSectionId] = React.useState<number | null>(() => {
    const savedSectionId = localStorage.getItem('selectedSectionId');
    return savedSectionId ? Number(savedSectionId) : null;
  });
  const [selectedCorridorId, setSelectedCorridorId] = React.useState<number | null>(() => {
    const savedCorridorId = localStorage.getItem('selectedCorridorId');
    return savedCorridorId ? Number(savedCorridorId) : null;
  });
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [openTransferModal, setOpenTransferModal] = React.useState(false);
  const [alert, setAlert] = React.useState<{
    severity: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const [warehouseForm, setWarehouseForm] = React.useState<WarehouseForm>({
    name: '',
    description: '',
    sections: [],
  });
  const [editProductId, setEditProductId] = React.useState<number | null>(null);
  const [transferProductId, setTransferProductId] = React.useState<number | null>(null);

  const [productForm, setProductForm] = React.useState({
    name: '',
    categoria: '',
    custoAqui: 0,
    detalhes: '',
    fornecedor: '',
    validade: '',
    prico: 0,
    quantidade: 0,
    warehouseId: selectedWarehouseId || 0,
    sectionId: selectedSectionId || 0,
    corridorId: selectedCorridorId || 0,
    shelfId: 0,
  });

  const [transferForm, setTransferForm] = React.useState<TransferForm>({
    transferQuantity: 0,
    storeId: 0,
    sectionId: 0,
    shelfId: 0,
  });

  const [formErrors, setFormErrors] = React.useState<FormErrors>({
    name: '',
    custoAqui: '',
    quantidade: '',
    validade: '',
    prico: '',
    categoria: '',
  });

  const [transferFormErrors, setTransferFormErrors] = React.useState<TransferFormErrors>({
    transferQuantity: '',
    storeId: '',
    sectionId: '',
    shelfId: '',
  });

  const [products, setProducts] = React.useState<Product[]>(() => {
    const savedProducts = localStorage.getItem('products');
    return savedProducts ? JSON.parse(savedProducts) : [];
  });

  const [stores] = React.useState<Store[]>(() => {
    const savedStores = localStorage.getItem('stores');
    return savedStores ? JSON.parse(savedStores) : [];
  });

  const [storeProducts, setStoreProducts] = React.useState<StoreProduct[]>(() => {
    const savedStoreProducts = localStorage.getItem('loja');
    return savedStoreProducts ? JSON.parse(savedStoreProducts) : [];
  });

  const [categories] = React.useState<{ id: number; name: string }[]>(() => {
    const savedCategories = localStorage.getItem('categoria');
    return savedCategories ? JSON.parse(savedCategories) : [];
  });

  const [sections] = React.useState<Section[]>(() => {
    const savedSections = localStorage.getItem('secao');
    return savedSections ? JSON.parse(savedSections) : [];
  });

  const [corridors] = React.useState<Corridor[]>(() => {
    const savedCorridors = localStorage.getItem('corredor');
    return savedCorridors ? JSON.parse(savedCorridors) : [];
  });

  const [shelves] = React.useState<Shelf[]>(() => {
    const savedShelves = localStorage.getItem('prateleira');
    return savedShelves ? JSON.parse(savedShelves) : [];
  });

  React.useEffect(() => {
    localStorage.setItem('warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  React.useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  React.useEffect(() => {
    localStorage.setItem('selectedWarehouseId', String(selectedWarehouseId));
  }, [selectedWarehouseId]);

  React.useEffect(() => {
    localStorage.setItem('selectedSectionId', String(selectedSectionId));
  }, [selectedSectionId]);

  React.useEffect(() => {
    localStorage.setItem('selectedCorridorId', String(selectedCorridorId));
  }, [selectedCorridorId]);

  React.useEffect(() => {
    localStorage.setItem('stores', JSON.stringify(stores));
  }, [stores]);

  React.useEffect(() => {
    localStorage.setItem('loja', JSON.stringify(storeProducts));
  }, [storeProducts]);

  // Handlers for Warehouse
  const handleOpenWarehouseModal = () => setOpenWarehouseModal(true);
  const handleCloseWarehouseModal = () => {
    setOpenWarehouseModal(false);
    setWarehouseForm({ name: '', description: '', sections: [] });
  };

  const handleWarehouseChange = (
    e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<number[]>,
    sectionId?: number,
    field?: 'corridorIds' | 'shelfIds',
  ) => {
    const { name, value } = e.target;

    if (!sectionId && name === 'sections') {
      const newSectionIds = value as number[];
      /*       const currentSectionIds = warehouseForm.sections.map((s) => s.id);
       */ const newSections = newSectionIds.map((id) => {
        const existingSection = warehouseForm.sections.find((s) => s.id === id);
        return existingSection || { id, corridorIds: [], shelfIds: [] };
      });
      setWarehouseForm((prev) => ({
        ...prev,
        sections: newSections,
      }));
    } else if (sectionId && field) {
      setWarehouseForm((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, [field]: value as number[] } : s,
        ),
      }));
    } else {
      setWarehouseForm((prev) => ({
        ...prev,
        [name]: value as string,
      }));
    }
  };

  const handleAddWarehouse = () => {
    if (warehouseForm.name && warehouseForm.sections.length > 0) {
      const newWarehouse: Warehouse = {
        id: warehouses.length + 1,
        name: warehouseForm.name,
        description: warehouseForm.description,
        sections: warehouseForm.sections.map((sectionForm) => {
          const sectionData = sections.find((s) => s.id === sectionForm.id) || {
            id: sectionForm.id,
            name: `Seção ${sectionForm.id}`,
            description: '',
            corridors: [],
          };
          return {
            ...sectionData,
            corridors: corridors
              .filter((c) => sectionForm.corridorIds.includes(c.id))
              .map((corridor) => ({
                ...corridor,
                shelves: [],
              })),
            shelves: shelves.filter((s) => sectionForm.shelfIds.includes(s.id)),
          };
        }),
      };
      setWarehouses([...warehouses, newWarehouse]);
      handleCloseWarehouseModal();
      setAlert({ severity: 'success', message: 'Armazém criado com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    } else {
      setAlert({ severity: 'error', message: 'Nome e pelo menos uma seção são obrigatórios!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleDeleteWarehouse = (warehouseId: number) => {
    if (
      window.confirm(
        'Tem certeza que deseja eliminar este armazém? Isso removerá todos os produtos associados.',
      )
    ) {
      const updatedWarehouses = warehouses.filter((w) => w.id !== warehouseId);
      setWarehouses(updatedWarehouses);
      const updatedProducts = products.filter((p) => p.warehouseId !== warehouseId);
      setProducts(updatedProducts);
      if (selectedWarehouseId === warehouseId) {
        setSelectedWarehouseId(null);
        setSelectedSectionId(null);
        setSelectedCorridorId(null);
      }
      setAlert({ severity: 'success', message: 'Armazém eliminado com sucesso!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Handlers for Product
  const handleOpenProductModal = (productId?: number) => {
    if (productId) {
      const productToEdit = products.find((p) => p.id === productId);
      if (productToEdit) {
        setProductForm(productToEdit);
        setEditProductId(productId);
      }
    } else {
      setProductForm({
        name: '',
        categoria: '',
        custoAqui: 0,
        detalhes: '',
        fornecedor: '',
        validade: '',
        prico: 0,
        quantidade: 0,
        warehouseId: selectedWarehouseId || 0,
        sectionId: selectedSectionId || 0,
        corridorId: selectedCorridorId || 0,
        shelfId: 0,
      });
      setEditProductId(null);
    }
    setOpenProductModal(true);
  };

  const handleCloseProductModal = () => {
    setOpenProductModal(false);
    setEditProductId(null);
    setProductForm({
      name: '',
      categoria: '',
      custoAqui: 0,
      detalhes: '',
      fornecedor: '',
      validade: '',
      prico: 0,
      quantidade: 0,
      warehouseId: selectedWarehouseId || 0,
      sectionId: selectedSectionId || 0,
      corridorId: selectedCorridorId || 0,
      shelfId: 0,
    });
    setFormErrors({
      name: '',
      custoAqui: '',
      quantidade: '',
      validade: '',
      prico: '',
      categoria: '',
    });
  };

  const handleOpenTransferModal = (productId: number) => {
    setTransferProductId(productId);
    setTransferForm({ transferQuantity: 0, storeId: 0, sectionId: 0, shelfId: 0 });
    setOpenTransferModal(true);
  };

  const handleCloseTransferModal = () => {
    setOpenTransferModal(false);
    setTransferProductId(null);
    setTransferForm({ transferQuantity: 0, storeId: 0, sectionId: 0, shelfId: 0 });
    setTransferFormErrors({ transferQuantity: '', storeId: '', sectionId: '', shelfId: '' });
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]:
        name === 'custoAqui' || name === 'prico' || name === 'quantidade'
          ? value === ''
            ? 0
            : Number(value) || 0
          : value,
    }));
  };

  const handleTransferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTransferForm((prev) => ({
      ...prev,
      [name]: name === 'transferQuantity' ? (value === '' ? 0 : Number(value) || 0) : value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: typeof value === 'string' ? value : Number(value) || 0,
    }));
  };

  const handleTransferSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setTransferForm((prev) => ({
      ...prev,
      [name]: Number(value) || 0,
      ...(name === 'storeId' && { sectionId: 0, shelfId: 0 }),
      ...(name === 'sectionId' && { shelfId: 0 }),
    }));
  };

  const validateProductForm = () => {
    const errors: FormErrors = {
      name: '',
      custoAqui: '',
      quantidade: '',
      validade: '',
      prico: '',
      categoria: '',
    };
    if (!productForm.name) errors.name = 'Nome do produto é obrigatório';
    if (productForm.custoAqui <= 0) errors.custoAqui = 'O custo de aquisição deve ser maior que 0';
    if (productForm.quantidade <= 0) errors.quantidade = 'A quantidade deve ser maior que 0';
    if (productForm.prico <= 0) errors.prico = 'O preço deve ser maior que 0';
    if (!productForm.categoria) errors.categoria = 'A categoria é obrigatória';
    if (!productForm.validade || isNaN(new Date(productForm.validade).getTime()))
      errors.validade = 'A validade é inválida';

    setFormErrors(errors);
    return Object.values(errors).every((error) => error === '');
  };

  const validateTransferForm = () => {
    const errors: TransferFormErrors = {
      transferQuantity: '',
      storeId: '',
      sectionId: '',
      shelfId: '',
    };
    const product = products.find((p) => p.id === transferProductId);
    if (!transferForm.transferQuantity || transferForm.transferQuantity <= 0)
      errors.transferQuantity = 'A quantidade deve ser maior que 0';
    else if (product && transferForm.transferQuantity > product.quantidade)
      errors.transferQuantity = 'Quantidade maior que o estoque disponível';
    if (!transferForm.storeId) errors.storeId = 'A loja é obrigatória';
    if (!transferForm.sectionId) errors.sectionId = 'A seção é obrigatória';
    if (!transferForm.shelfId) errors.shelfId = 'A prateleira é obrigatória';

    setTransferFormErrors(errors);
    return Object.values(errors).every((error) => error === '');
  };

  const handleAddProduct = () => {
    if (validateProductForm()) {
      if (editProductId) {
        const updatedProducts = products.map((product) =>
          product.id === editProductId ? { ...productForm, id: editProductId } : product,
        );
        setProducts(updatedProducts);
        setAlert({ severity: 'success', message: 'Produto atualizado com sucesso!' });
      } else {
        const newProduct = {
          id: products.length + 1,
          ...productForm,
        };
        setProducts([...products, newProduct]);
        setAlert({ severity: 'success', message: 'Produto cadastrado com sucesso!' });
      }
      handleCloseProductModal();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleTransferProduct = () => {
    if (validateTransferForm() && transferProductId !== null) {
      const productToTransfer = products.find((p) => p.id === transferProductId);
      if (!productToTransfer) return;

      const updatedProducts = products.map((product) =>
        product.id === transferProductId
          ? { ...product, quantidade: product.quantidade - transferForm.transferQuantity }
          : product,
      );
      setProducts(updatedProducts);

      const destStore = stores.find((s) => s.id === transferForm.storeId);
      const destSection = destStore?.sections.find((s) => s.id === transferForm.sectionId);
      const destShelf = destSection?.shelves.find((s) => s.id === transferForm.shelfId)?.name;

      if (destShelf) {
        const newStoreProduct: StoreProduct = {
          id: storeProducts.length + 1,
          name: productToTransfer.name,
          shelf: destShelf,
          prico: productToTransfer.prico,
          validade: productToTransfer.validade,
          quantidade: transferForm.transferQuantity,
        };
        setStoreProducts([...storeProducts, newStoreProduct]);
      }

      const destStoreName = destStore?.name;
      const destSectionName = destSection?.name;

      setAlert({
        severity: 'success',
        message: `Transferido ${transferForm.transferQuantity} de ${productToTransfer.name} para ${destStoreName}, seção ${destSectionName}, prateleira ${destShelf}.`,
      });

      handleCloseTransferModal();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);
  const warehouseSections = selectedWarehouse?.sections || [];
  const warehouseCorridors =
    warehouseSections.find((s) => s.id === selectedSectionId)?.corridors || [];
  const warehouseShelves =
    warehouseCorridors.find((c) => c.id === selectedCorridorId)?.shelves || [];

  const transferStore = stores.find((s) => s.id === transferForm.storeId);
  const transferSections = transferStore?.sections || [];
  const transferSection = transferSections.find((s) => s.id === transferForm.sectionId);
  const transferShelves = transferSection?.shelves || [];

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
            <Typography variant="h5">Armazéns</Typography>
            <Select
              value={selectedWarehouseId || ''}
              onChange={(e) => {
                setSelectedWarehouseId(Number(e.target.value));
                setSelectedSectionId(null);
                setSelectedCorridorId(null);
              }}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Selecione um Armazém
              </MenuItem>
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </Select>
            {selectedWarehouseId && (
              <Select
                value={selectedSectionId || ''}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Selecione uma Seção
                </MenuItem>
                {warehouseSections.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            )}
            {selectedSectionId && (
              <Select
                value={selectedCorridorId || ''}
                onChange={(e) => setSelectedCorridorId(Number(e.target.value))}
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Selecione um Corredor
                </MenuItem>
                {warehouseCorridors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            )}
            <Button variant="contained" color="secondary" onClick={handleOpenWarehouseModal}>
              Novo Armazém
            </Button>
            {selectedCorridorId && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => handleOpenProductModal()}
              >
                Novo Produto
              </Button>
            )}
          </Stack>
        </Collapse>
      </Paper>

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Armazéns Criados
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
                    <strong>Descrição</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Seções</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>{warehouse.id}</TableCell>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>{warehouse.description}</TableCell>
                    <TableCell>
                      {warehouse.sections?.length > 0
                        ? warehouse.sections.map((s) => (
                            <div key={s.id}>
                              <strong>{s.name}</strong>: Corredores (
                              {s.corridors?.map((c) => c.name).join(', ') || 'Nenhum'}), Prateleiras
                              {/*                               ({s.description?.map((sh) => sh.name).join(', ') || 'Nenhuma'})
                               */}{' '}
                            </div>
                          ))
                        : 'Nenhuma seção'}
                    </TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => handleDeleteWarehouse(warehouse.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {warehouses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum armazém criado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Modal open={openWarehouseModal} onClose={handleCloseWarehouseModal}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            Criar Armazém
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome do Armazém"
                name="name"
                value={warehouseForm.name}
                onChange={handleWarehouseChange as React.ChangeEventHandler<HTMLInputElement>}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Descrição"
                name="description"
                value={warehouseForm.description}
                onChange={handleWarehouseChange as React.ChangeEventHandler<HTMLInputElement>}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Select
                multiple
                name="sections"
                value={warehouseForm.sections.map((s) => s.id) || []}
                onChange={(e) => handleWarehouseChange(e)}
                displayEmpty
                fullWidth
                renderValue={(selected) =>
                  selected.length === 0
                    ? 'Selecione várias seções'
                    : sections
                        .filter((s) => selected.includes(s.id))
                        .map((s) => s.name)
                        .join(', ')
                }
              >
                {sections.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            {warehouseForm.sections?.map((section) => (
              <React.Fragment key={section.id}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">{`Corredores da ${sections.find((s) => s.id === section.id)?.name || 'Seção ' + section.id}`}</Typography>
                  <Select
                    multiple
                    value={section.corridorIds || []}
                    onChange={(e) => handleWarehouseChange(e, section.id, 'corridorIds')}
                    displayEmpty
                    fullWidth
                    renderValue={(selected) =>
                      selected.length === 0
                        ? 'Selecione vários corredores'
                        : corridors
                            .filter((c) => selected.includes(c.id))
                            .map((c) => c.name)
                            .join(', ')
                    }
                  >
                    {corridors.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1">{`Prateleiras da ${sections.find((s) => s.id === section.id)?.name || 'Seção ' + section.id}`}</Typography>
                  <Select
                    multiple
                    value={section.shelfIds || []}
                    onChange={(e) => handleWarehouseChange(e, section.id, 'shelfIds')}
                    displayEmpty
                    fullWidth
                    renderValue={(selected) =>
                      selected.length === 0
                        ? 'Selecione várias prateleiras'
                        : shelves
                            .filter((s) => selected.includes(s.id))
                            .map((s) => s.name)
                            .join(', ')
                    }
                  >
                    {shelves.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </React.Fragment>
            ))}
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleAddWarehouse}
                fullWidth
                sx={{ mt: 2 }}
              >
                Criar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Modal open={openProductModal} onClose={handleCloseProductModal}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            Cadastrar Produto
          </Typography>
          <Stack sx={{ width: '100%' }} spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="name"
                  label="Nome do Produto"
                  value={productForm.name}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="custoAqui"
                  label="Custo de Aquisição"
                  type="number"
                  value={productForm.custoAqui}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.custoAqui)}
                  helperText={formErrors.custoAqui}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="quantidade"
                  label="Quantidade"
                  type="number"
                  value={productForm.quantidade}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.quantidade)}
                  helperText={formErrors.quantidade}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="validade"
                  label="Validade"
                  type="date"
                  value={productForm.validade}
                  onChange={handleProductChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(formErrors.validade)}
                  helperText={formErrors.validade}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="prico"
                  label="Preço"
                  type="number"
                  value={productForm.prico}
                  onChange={handleProductChange}
                  error={Boolean(formErrors.prico)}
                  helperText={formErrors.prico}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Select
                  name="categoria"
                  value={productForm.categoria}
                  onChange={handleSelectChange}
                  displayEmpty
                  fullWidth
                  error={Boolean(formErrors.categoria)}
                >
                  <MenuItem value="" disabled>
                    Selecione uma Categoria
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
                <TextField
                  name="detalhes"
                  label="Detalhes"
                  value={productForm.detalhes}
                  onChange={handleProductChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="fornecedor"
                  label="Fornecedor"
                  value={productForm.fornecedor}
                  onChange={handleProductChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Select
                  name="shelfId"
                  value={productForm.shelfId}
                  onChange={handleSelectChange}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value={0} disabled>
                    Selecione uma Prateleira
                  </MenuItem>
                  {warehouseShelves.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
            <Button variant="contained" color="secondary" onClick={handleAddProduct}>
              Cadastrar
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openTransferModal} onClose={handleCloseTransferModal}>
        <Box sx={style} component="form" noValidate autoComplete="off">
          <Typography variant="h5" mb={2}>
            Transferir Produto para Loja
          </Typography>
          <Stack sx={{ width: '100%' }} spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="transferQuantity"
                  label="Quantidade"
                  type="number"
                  value={transferForm.transferQuantity}
                  onChange={handleTransferChange}
                  error={Boolean(transferFormErrors.transferQuantity)}
                  helperText={
                    transferFormErrors.transferQuantity ||
                    `Estoque disponível: ${
                      products.find((p) => p.id === transferProductId)?.quantidade || 0
                    }`
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select
                  name="storeId"
                  value={transferForm.storeId}
                  onChange={handleTransferSelectChange}
                  displayEmpty
                  fullWidth
                  error={Boolean(transferFormErrors.storeId)}
                >
                  <MenuItem value={0} disabled>
                    Selecione uma Loja
                  </MenuItem>
                  {stores.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
                {transferFormErrors.storeId && (
                  <FormHelperText error>{transferFormErrors.storeId}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select
                  name="sectionId"
                  value={transferForm.sectionId}
                  onChange={handleTransferSelectChange}
                  displayEmpty
                  fullWidth
                  disabled={!transferForm.storeId}
                  error={Boolean(transferFormErrors.sectionId)}
                >
                  <MenuItem value={0} disabled>
                    Selecione uma Seção
                  </MenuItem>
                  {transferSections.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
                {transferFormErrors.sectionId && (
                  <FormHelperText error>{transferFormErrors.sectionId}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select
                  name="shelfId"
                  value={transferForm.shelfId}
                  onChange={handleTransferSelectChange}
                  displayEmpty
                  fullWidth
                  disabled={!transferForm.sectionId}
                  error={Boolean(transferFormErrors.shelfId)}
                >
                  <MenuItem value={0} disabled>
                    Selecione uma Prateleira
                  </MenuItem>
                  {transferShelves.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
                {transferFormErrors.shelfId && (
                  <FormHelperText error>{transferFormErrors.shelfId}</FormHelperText>
                )}
              </Grid>
            </Grid>
            <Button variant="contained" color="secondary" onClick={handleTransferProduct}>
              Transferir
            </Button>
          </Stack>
        </Box>
      </Modal>

      {selectedCorridorId && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      'ID',
                      'Nome',
                      'Categoria',
                      'Custo de Aquisição',
                      'Fornecedor',
                      'Quantidade',
                      'Seção',
                      'Corredor',
                      'Prateleira',
                      'Ações',
                    ].map((header) => (
                      <TableCell key={header}>
                        <strong>{header}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products
                    .filter(
                      (p) =>
                        p.warehouseId === selectedWarehouseId &&
                        p.sectionId === selectedSectionId &&
                        p.corridorId === selectedCorridorId,
                    )
                    .map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.categoria}</TableCell>
                        <TableCell>
                          {isNaN(product.custoAqui) ? 'N/A' : product.custoAqui}
                        </TableCell>
                        <TableCell>{product.fornecedor}</TableCell>
                        <TableCell>
                          {isNaN(product.quantidade) ? 'N/A' : product.quantidade}
                        </TableCell>
                        <TableCell>
                          {warehouseSections.find((s) => s.id === product.sectionId)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {warehouseCorridors.find((c) => c.id === product.corridorId)?.name ||
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {warehouseShelves.find((s) => s.id === product.shelfId)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenProductModal(product.id)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleOpenTransferModal(product.id)}
                          >
                            <IconifyIcon icon="mdi:store" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ProductManager;
