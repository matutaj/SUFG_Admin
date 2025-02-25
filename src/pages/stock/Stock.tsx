import { useState, useEffect } from 'react';
import {
  Paper,
  TableCell,
  Table,
  TableRow,
  TableHead,
  TableBody,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  useMediaQuery,
  TableContainer,
  Typography,
  Box,
  Stack,
} from '@mui/material';
import Search from 'components/icons/common/Search';
import { SelectChangeEvent } from '@mui/material';

interface Product {
  id: string;
  name: string;
  categoria: string;
  custoAqui: number;
  detalhes: string;
  validade: string;
  preco: number;
  quantidade: number;
}
interface Vendalist {
  id: string;
  nomeProduto: string;
  referencia: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  data: string;
  tipoDocumento: string;
  cliente: string;
  funcionario: string;
}

const Stock = () => {
  const [vendas, setVendas] = useState<Vendalist[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Carrega os produtos do localStorage e converte corretamente
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
      try {
        const parsedProducts: Product[] = JSON.parse(storedProducts);
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Erro ao analisar os produtos do localStorage', error);
      }
    }
  }, []);

  useEffect(() => {
    const storedVendas = localStorage.getItem('vendas');
    if (storedVendas) {
      try {
        const parsedVendas: Vendalist[] = JSON.parse(storedVendas);
        setVendas(parsedVendas);
      } catch (error) {
        console.error('Erro ao carregar vendas do localStorage', error);
      }
    }
  }, []);

  const handleProductChange = (event: SelectChangeEvent<string>) => {
    setSelectedProduct(event.target.value);
  };

  return (
    <>
      <Paper sx={{ p: 3, width: '100%' }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          sx={{ gap: 2 }}
        >
          <FormControl sx={{ flex: 1, minWidth: 200 }}>
            <InputLabel>Produto</InputLabel>
            <Select value={selectedProduct} onChange={handleProductChange}>
              <MenuItem value="">Todos os Produtos</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ flex: 1, minWidth: 200 }}>
            <InputLabel>Caixa</InputLabel>
            <Select value={selectedProduct} onChange={handleProductChange}>
              <MenuItem value="">Todos os caixas</MenuItem>
              <MenuItem value="#">caixa 1</MenuItem>
              <MenuItem value="#">caixa 1</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" color="primary" startIcon={<Search />} sx={{ minWidth: 150 }}>
            Aplicar Filtro
          </Button>
        </Stack>
      </Paper>
      <br />
      <Paper sx={{ p: 2, textAlign: 'center', color: 'gray', width: '100%' }}>
        {isSmallScreen ? (
          vendas.map((venda) => (
            <Paper key={venda.id} sx={{ p: 2, mb: 2, boxShadow: 2 }}>
              <Typography variant="h6">{venda.nomeProduto}</Typography>
              <Box>
                <strong>Ref.:</strong> {venda.referencia}
              </Box>
              <Box>
                <strong>Quant.:</strong> {venda.quantidade}
              </Box>
              <Box>
                <strong>P. Unitário:</strong> {venda.precoUnitario.toFixed(2)} Kzs
              </Box>
              <Box>
                <strong>Valor Total:</strong> {venda.valorTotal.toFixed(2)} Kzs
              </Box>
              <Box>
                <strong>Data:</strong> {new Date(venda.data).toLocaleDateString()}
              </Box>
              <Box>
                <strong>T. Documento:</strong> {venda.tipoDocumento}
              </Box>
              <Box>
                <strong>Cliente:</strong> {venda.cliente}
              </Box>
              <Box>
                <strong>Funcionário:</strong> {venda.funcionario}
              </Box>
            </Paper>
          ))
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome do Produto</TableCell>
                  <TableCell>Referência</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Preço Unitário</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vendas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>{venda.nomeProduto}</TableCell>
                    <TableCell>{venda.referencia}</TableCell>
                    <TableCell>{venda.quantidade}</TableCell>
                    <TableCell>{venda.precoUnitario.toFixed(2)} Kzs</TableCell>
                    <TableCell>{venda.valorTotal.toFixed(2)} Kzs</TableCell>
                    <TableCell>{new Date(venda.data).toLocaleDateString()}</TableCell>
                    <TableCell>{venda.tipoDocumento}</TableCell>
                    <TableCell>{venda.cliente}</TableCell>
                    <TableCell>{venda.funcionario}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </>
  );
};

export default Stock;
