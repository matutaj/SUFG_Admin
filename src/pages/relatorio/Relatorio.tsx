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
  Box,
  Alert,
} from '@mui/material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SelectChangeEvent } from '@mui/material';

// Tipagem para jsPDF com autoTable
type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: {
    head: string[][];
    body: (string | number)[][];
    startY: number;
    theme: string;
    headStyles?: { fillColor: [number, number, number] };
  }) => void;
};

// Interfaces ajustadas para os dados reais
interface StoreProduct {
  id: number;
  name: string;
  shelf: string;
  prico: number;
  validade: string;
  quantidade: number;
}

interface FaturaProduct {
  produto: StoreProduct;
  quantidade: number;
}

interface Fatura {
  id: number;
  cliente: string;
  nif: string;
  telefone: string;
  localizacao: string;
  email: string;
  data: string;
  total: number;
  status: string;
  produtos: FaturaProduct[];
}

interface ReportData {
  id: string;
  name: string;
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
  cliente?: string;
}

const ReportPage = () => {
  const [reportType, setReportType] = useState<string>('vendas_por_periodo');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');

  useEffect(() => {
    const faturas: Fatura[] = JSON.parse(localStorage.getItem('faturas') || '[]');
    const loja: StoreProduct[] = JSON.parse(localStorage.getItem('loja') || '[]');
    generateReportData(faturas, loja);
  }, [reportType]);

  const generateReportData = (faturas: Fatura[], loja: StoreProduct[]) => {
    let data: ReportData[] = [];
    switch (reportType) {
      case 'vendas_por_periodo':
        data = faturas.flatMap((fatura) =>
          fatura.produtos.map((p) => ({
            id: `${fatura.id}-${p.produto.id}`,
            name: p.produto.name,
            quantidadeVendida: p.quantidade,
            valorTotal: p.produto.prico * p.quantidade,
            dataVenda: fatura.data,
            cliente: fatura.cliente,
            status: fatura.status,
          })),
        );
        break;
      case 'produtos_mais_vendidos': {
        const productSales: { [key: string]: { name: string; quantidadeVendida: number } } = {};
        faturas.forEach((fatura) => {
          fatura.produtos.forEach((p) => {
            if (productSales[p.produto.id]) {
              productSales[p.produto.id].quantidadeVendida += p.quantidade;
            } else {
              productSales[p.produto.id] = {
                name: p.produto.name,
                quantidadeVendida: p.quantidade,
              };
            }
          });
        });
        data = Object.entries(productSales).map(([id, info]) => ({
          id,
          name: info.name,
          quantidadeVendida: info.quantidadeVendida,
        }));
        data.sort((a, b) => (b.quantidadeVendida || 0) - (a.quantidadeVendida || 0));
        break;
      }
      case 'movimentacao_stock':
        data = loja.map((product) => ({
          id: product.id.toString(),
          name: product.name,
          prico: product.prico,
          validade: product.validade,
          quantidade: product.quantidade,
          status: product.quantidade > 0 ? 'Em Estoque' : 'Fora de Estoque',
        }));
        break;
      case 'transacao_clientes_fornecedores':
        data = faturas.map((fatura) => ({
          id: fatura.id.toString(),
          name: fatura.cliente,
          tipo: 'Cliente',
          valorTransacao: fatura.total,
          dataTransacao: fatura.data,
          cliente: fatura.cliente,
          status: fatura.status,
        }));
        break;
      default:
        data = [];
    }
    setReportData(data);
  };

  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
    setStartDate('');
    setEndDate('');
    setDateError('');
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

    const start = new Date(startDate);
    const end = new Date(endDate);

    return reportData.filter((item) => {
      const date = new Date(item.dataVenda || item.dataTransacao || item.validade || '');
      return date >= start && date <= end;
    });
  };

  const getTableHeaders = () => {
    switch (reportType) {
      case 'vendas_por_periodo':
        return ['ID', 'Produto', 'Quantidade Vendida', 'Valor Total', 'Data', 'Cliente', 'Status'];
      case 'produtos_mais_vendidos':
        return ['ID', 'Produto', 'Quantidade Vendida'];
      case 'movimentacao_stock':
        return ['ID', 'Produto', 'Preço', 'Validade', 'Quantidade', 'Status'];
      case 'transacao_clientes_fornecedores':
        return ['ID', 'Cliente', 'Tipo', 'Valor', 'Data', 'Status'];
      default:
        return [];
    }
  };

  const getRowData = (item: ReportData) => {
    switch (reportType) {
      case 'vendas_por_periodo':
        return [
          item.id,
          item.name,
          item.quantidadeVendida || 0,
          `Kz${item.valorTotal?.toFixed(2) || '0.00'}`,
          new Date(item.dataVenda || '').toLocaleDateString('pt-BR'),
          item.cliente || '-',
          item.status || '-',
        ];
      case 'produtos_mais_vendidos':
        return [item.id, item.name, item.quantidadeVendida || 0];
      case 'movimentacao_stock':
        return [
          item.id,
          item.name,
          `Kz${item.prico?.toFixed(2) || '0.00'}`,
          new Date(item.validade || '').toLocaleDateString('pt-BR'),
          item.quantidade || 0,
          item.status || '-',
        ];
      case 'transacao_clientes_fornecedores':
        return [
          item.id,
          item.name,
          item.tipo || '-',
          `Kz${item.valorTransacao?.toFixed(2) || '0.00'}`,
          new Date(item.dataTransacao || '').toLocaleDateString('pt-BR'),
          item.status || '-',
        ];
      default:
        return [];
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as JsPDFWithAutoTable;
    const headers = getTableHeaders();
    const rows = filterReportData().map((item) => getRowData(item));

    // Título e informações
    doc.setFontSize(18);
    doc.text('Relatório de Gestão', 14, 20);
    doc.setFontSize(12);
    doc.text(`Tipo: ${reportType.replace(/_/g, ' ').toUpperCase()}`, 14, 30);
    doc.text(`Período: ${startDate || 'N/A'} a ${endDate || 'N/A'}`, 14, 40);

    // Tabela
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`relatorio_${reportType}.pdf`);
  };

  const exportExcel = () => {
    const headers = getTableHeaders();
    const filteredData = filterReportData();
    const data = filteredData.map((item) => {
      const row = getRowData(item);
      return headers.reduce((obj: { [key: string]: string | number }, header, index) => {
        obj[header] = row[index];
        return obj;
      }, {});
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${reportType}.xlsx`);
  };

  return (
    <Paper sx={{ p: 3, width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Relatórios
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Tipo de Relatório</InputLabel>
            <Select value={reportType} onChange={handleReportTypeChange}>
              <MenuItem value="vendas_por_periodo">Vendas por Período</MenuItem>
              <MenuItem value="produtos_mais_vendidos">Produtos Mais Vendidos</MenuItem>
              <MenuItem value="movimentacao_stock">Movimentação do Estoque</MenuItem>
              <MenuItem value="transacao_clientes_fornecedores">Transações por Clientes</MenuItem>
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Data de Início"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 180 } }}
            error={!!dateError}
          />
          <TextField
            type="date"
            label="Data de Fim"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 180 } }}
            error={!!dateError}
          />
        </Stack>
        {dateError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {dateError}
          </Alert>
        )}
      </Box>

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
            {filterReportData().length > 0 ? (
              filterReportData().map((item) => (
                <TableRow key={item.id}>
                  {getRowData(item).map((cell, index) => (
                    <TableCell key={index}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={getTableHeaders().length} align="center">
                  Nenhum dado disponível para o relatório selecionado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          onClick={exportPDF}
          disabled={reportData.length === 0}
        >
          Exportar PDF
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={exportExcel}
          disabled={reportData.length === 0}
        >
          Exportar Excel
        </Button>
      </Stack>
    </Paper>
  );
};

export default ReportPage;
