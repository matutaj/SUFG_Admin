import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  TextField,
} from '@mui/material';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SelectChangeEvent } from '@mui/material';

interface Product {
  id: string;
  name: string;
  categoria: string;
  quantidadeVendida?: number;
  valorTotal?: number;
  dataVenda?: string;
  prico?: number;
  validade?: string;
  quantidade?: number;
  tipo?: string;
  valorTransacao?: number;
  dataTransacao?: string;
  status?: string;
}

const ReportPage = () => {
  const [reportType, setReportType] = useState<string>('vendas_por_periodo');
  const [reportData, setReportData] = useState<Product[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('products') || '[]');
    setReportData(storedData);
  }, []);

  // Atualizado para o tipo correto SelectChangeEvent
  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = event.target.value;
    setStartDate(newStartDate);
    if (endDate && new Date(newStartDate) > new Date(endDate)) {
      setDateError('A data de início não pode ser maior que a data de fim');
    } else {
      setDateError('');
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = event.target.value;
    setEndDate(newEndDate);
    if (startDate && new Date(newEndDate) < new Date(startDate)) {
      setDateError('A data de fim não pode ser menor que a data de início');
    } else {
      setDateError('');
    }
  };

  const filterReportData = () => {
    if (!startDate || !endDate || dateError) return reportData;

    const filteredData = reportData.filter((product) => {
      const productDate = new Date(product.validade || '');
      return productDate >= new Date(startDate) && productDate <= new Date(endDate);
    });

    return filteredData;
  };

  const getTableHeaders = () => {
    switch (reportType) {
      case 'vendas_por_periodo':
        return ['ID', 'Produto', 'Categoria', 'Quantidade Vendida', 'Valor Total', 'Data de Venda'];
      case 'produtos_mais_vendidos':
        return ['ID', 'Nome', 'Categoria', 'Quantidade Vendida'];
      case 'movimentacao_stock':
        return [
          'ID',
          'Nome',
          'Categoria',
          'Preço',
          'Validade',
          'Quantidade',
          'Entrada',
          'Saída',
          'Status',
        ];
      case 'transacao_clientes_fornecedores':
        return [
          'ID',
          'Nome',
          'Tipo',
          'Valor Transacionado',
          'Data',
          'Cliente',
          'Fornecedor',
          'Status',
        ];
      default:
        return ['ID', 'Nome', 'Categoria', 'Preço', 'Validade', 'Quantidade', 'Status'];
    }
  };

  const getRowData = (product: Product) => {
    switch (reportType) {
      case 'vendas_por_periodo':
        return [
          product.id,
          product.name,
          product.categoria,
          product.quantidadeVendida || 0,
          product.valorTotal || 0,
          new Date(product.dataVenda || '').toLocaleDateString(),
        ];
      case 'produtos_mais_vendidos':
        return [product.id, product.name, product.categoria, product.quantidadeVendida || 0];
      case 'movimentacao_stock':
        return [
          product.id,
          product.name,
          product.categoria,
          product.prico,
          new Date(product.validade || '').toLocaleDateString(),
          product.quantidade,
          product.quantidade && product.quantidade > 0 ? 'Em Estoque' : 'Fora de Estoque',
        ];
      case 'transacao_clientes_fornecedores':
        return [
          product.id,
          product.name,
          product.tipo,
          product.valorTransacao || 0,
          new Date(product.dataTransacao || '').toLocaleDateString(),
          product.status,
        ];
      default:
        return [];
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Adicionando o logotipo (se houver)
    const logo = 'data:image/png;base64,...'; // Substitua com o caminho para a imagem base64 do seu logotipo
    doc.addImage(logo, 'PNG', 10, 10, 50, 20);

    // Título do relatório
    doc.setFontSize(18);
    doc.text('Relatório de Produtos', 60, 20);

    // Informações do tipo de relatório e datas
    doc.setFontSize(12);
    doc.text(`Tipo de Relatório: ${reportType.replace(/_/g, ' ')}`, 10, 30);
    doc.text(`Data de Início: ${startDate || 'Não especificada'}`, 10, 40);
    doc.text(`Data de Fim: ${endDate || 'Não especificada'}`, 10, 50);

    // Adicionando os dados do relatório
    const headers = getTableHeaders();
    const rows = filterReportData().map((product) => getRowData(product));

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 60,
      theme: 'striped',
    });

    doc.save('relatorio.pdf');
  };

  const exportExcel = () => {
    const filteredData = filterReportData();
    const ws = XLSX.utils.json_to_sheet(
      filteredData.map((product) => ({
        ...getRowData(product),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, 'relatorio.xlsx');
  };

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Relatório de Produtos</Typography>
      </Stack>

      <Stack direction="row" spacing={2} mb={3}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Tipo de Relatório</InputLabel>
          <Select value={reportType} onChange={handleReportTypeChange}>
            <MenuItem value="vendas_por_periodo">Vendas por Período</MenuItem>
            <MenuItem value="produtos_mais_vendidos">Produtos Mais Vendidos</MenuItem>
            <MenuItem value="movimentacao_stock">Movimentação do Estoque</MenuItem>
            <MenuItem value="transacao_clientes_fornecedores">
              Transação por Clientes/Fornecedores
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          type="date"
          label="Data de Início"
          value={startDate}
          onChange={handleStartDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          error={!!dateError}
          helperText={dateError}
        />
        <TextField
          type="date"
          label="Data de Fim"
          value={endDate}
          onChange={handleEndDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          error={!!dateError}
          helperText={dateError}
        />
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {getTableHeaders().map((header) => (
                <TableCell key={header}>
                  <strong>{header}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filterReportData().map((product: Product) => (
              <TableRow key={product.id}>
                {getRowData(product).map((cell, index) => (
                  <TableCell key={index}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2} mt={3}>
        <Button variant="contained" color="primary" onClick={exportPDF}>
          Exportar PDF
        </Button>
        <Button variant="contained" color="secondary" onClick={exportExcel}>
          Exportar Excel
        </Button>
      </Stack>
    </Paper>
  );
};

export default ReportPage;
