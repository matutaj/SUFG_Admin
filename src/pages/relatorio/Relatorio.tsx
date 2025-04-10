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
import {
  getSalesByPeriod,
  getSalesByClient,
  getTopSellingProducts,
  getRevenueByPeriod,
  getRevenueByCashRegister,
  getCurrentStock,
  getStockEntriesByPeriod,
  getTransfersByPeriod,
  getProductsBelowMinimum,
  getCashierActivity,
  getTopSellingPeriodByProduct,
} from '../../api/methods';
import {
  VendaComFuncionario,
  ProdutoMaisVendido,
  FaturamentoPorPeriodo,
  QuantidadeFaturadaPorCaixa,
  EstoqueAtual,
  EntradaEstoqueComFuncionario,
  FuncionarioCaixaComNome,
  ProdutoAbaixoMinimo,
  TransferenciaComFuncionario,
  PeriodoMaisVendidoPorProduto,
} from '../../types/models';

type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: {
    head: string[][];
    body: (string | number)[][];
    startY: number;
    theme: string;
    headStyles?: { fillColor: [number, number, number] };
  }) => void;
};

interface ReportData {
  id: string; // Mantido para chave única, mas não exibido
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
  extra?: string;
}

const ReportPage = () => {
  const [reportType, setReportType] = useState<string>('ListarVendasPorPeriodo');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [clientId, setClientId] = useState<string>(''); // Para ListarVendasPorCliente
  const [productId, setProductId] = useState<string>(''); // Para ListarPeriodoMaisVendidoPorProduto

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate, clientId, productId]);

  const fetchReportData = async () => {
    try {
      let data: ReportData[] = [];
      const hasDateRange = startDate && endDate && !dateError;

      switch (reportType) {
        case 'ListarVendasPorPeriodo':
          if (hasDateRange) {
            const sales: VendaComFuncionario[] = await getSalesByPeriod(startDate, endDate);
            data = sales.map((sale: VendaComFuncionario) => ({
              id: sale.id,
              name: sale.produto?.nomeProduto || 'Produto Desconhecido',
              quantidadeVendida: sale.quantidade || 0,
              valorTotal: sale.valorTotal,
              dataVenda: sale.data,
              cliente: sale.cliente?.nome || '-',
              status: sale.status || 'Concluída',
            }));
          }
          break;

        case 'ListarVendasPorCliente':
          if (hasDateRange && clientId) {
            const sales: VendaComFuncionario[] = await getSalesByClient(
              clientId,
              startDate,
              endDate,
            );
            data = sales.map((sale: VendaComFuncionario) => ({
              id: sale.id,
              name: sale.produto?.nomeProduto || 'Produto Desconhecido',
              quantidadeVendida: sale.quantidade || 0,
              valorTotal: sale.valorTotal,
              dataVenda: sale.data,
              cliente: sale.cliente?.nome || '-',
              status: sale.status || 'Concluída',
            }));
          }
          break;

        case 'ListarProdutosMaisVendidos':
          if (hasDateRange) {
            const products: ProdutoMaisVendido[] = await getTopSellingProducts(startDate, endDate);
            data = products.map((product: ProdutoMaisVendido) => ({
              id: product.id_produto,
              name: product.nomeProduto,
              quantidadeVendida: product.quantidadeVendida,
              valorTotal: product.valorTotal,
            }));
          }
          break;

        case 'ListarFaturamentoPorPeriodo':
          if (hasDateRange) {
            const revenue: FaturamentoPorPeriodo = await getRevenueByPeriod(startDate, endDate);
            data = revenue.vendas.map((sale: VendaComFuncionario) => ({
              id: sale.id,
              name: sale.cliente?.nome || '-',
              valorTransacao: sale.valorTotal,
              dataTransacao: sale.data,
              extra: `Total Faturado: ${revenue.totalFaturado}`,
            }));
          }
          break;

        case 'ListarQuantidadeFaturadaPorCaixa':
          if (hasDateRange) {
            const cashiers: QuantidadeFaturadaPorCaixa[] = await getRevenueByCashRegister(
              startDate,
              endDate,
            );
            data = cashiers.map((cashier: QuantidadeFaturadaPorCaixa) => ({
              id: cashier.idCaixa,
              name: cashier.nomeCaixa,
              quantidadeVendida: cashier.quantidadeFaturada,
              extra: cashier.funcionarios.join(', '),
            }));
          }
          break;

        case 'ListarEstoqueAtual': {
          const stock: EstoqueAtual[] = await getCurrentStock();
          data = stock.map((item: EstoqueAtual) => ({
            id: item.id_produto,
            name: item.nomeProduto,
            quantidade: item.quantidadeEstoque,
            extra: item.localizacoes
              .map((loc: { id: string; nome: string }) => loc.nome)
              .join(', '),
          }));
          break;
        }

        case 'ListarEntradasEstoquePorPeriodo':
          if (hasDateRange) {
            const entries: EntradaEstoqueComFuncionario[] = await getStockEntriesByPeriod(
              startDate,
              endDate,
            );
            data = entries.map((entry: EntradaEstoqueComFuncionario) => ({
              id: entry.id,
              name: entry.produto?.nomeProduto || 'Produto Desconhecido',
              quantidade: entry.quantidade,
              dataTransacao: entry.data,
              extra: entry.funcionarioNome,
            }));
          }
          break;

        case 'ListarTransferenciasPorPeriodo':
          if (hasDateRange) {
            const transfers: TransferenciaComFuncionario[] = await getTransfersByPeriod(
              startDate,
              endDate,
            );
            data = transfers.map((transfer: TransferenciaComFuncionario) => ({
              id: transfer.id,
              name: transfer.produto?.nomeProduto || 'Produto Desconhecido',
              quantidade: transfer.quantidade,
              dataTransacao: transfer.data,
              extra: transfer.funcionarioNome,
            }));
          }
          break;

        case 'ListarProdutosAbaixoMinimo': {
          const belowMin: ProdutoAbaixoMinimo[] = await getProductsBelowMinimum();
          data = belowMin.map((item: ProdutoAbaixoMinimo) => ({
            id: item.id_produto,
            name: item.nomeProduto,
            quantidade: item.quantidadeAtual,
            extra: `Mínimo: ${item.quantidadeMinima}, Localização: ${item.localizacao}`,
          }));
          break;
        }

        case 'ListarAtividadeFuncionariosCaixa':
          if (hasDateRange) {
            const activity: FuncionarioCaixaComNome[] = await getCashierActivity(
              startDate,
              endDate,
            );
            data = activity.map((act: FuncionarioCaixaComNome) => ({
              id: act.id,
              name: act.funcionarioNome,
              extra: `Caixa: ${act.caixa?.nome || '-'}`,
              dataTransacao: act.data,
            }));
          }
          break;

        case 'ListarPeriodoMaisVendidoPorProduto':
          if (productId) {
            const period: PeriodoMaisVendidoPorProduto =
              await getTopSellingPeriodByProduct(productId);
            data = [
              {
                id: period.id_produto,
                name: period.nomeProduto,
                quantidadeVendida: period.quantidadeVendida,
                valorTotal: period.valorTotal,
                extra: period.periodo,
              },
            ];
          }
          break;

        default:
          data = [];
      }
      setReportData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      setReportData([]);
    }
  };

  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
    setStartDate('');
    setEndDate('');
    setDateError('');
    setClientId('');
    setProductId('');
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

  const getTableHeaders = () => {
    switch (reportType) {
      case 'ListarVendasPorPeriodo':
      case 'ListarVendasPorCliente':
        return ['Produto', 'Quantidade Vendida', 'Valor Total', 'Data', 'Cliente', 'Status'];
      case 'ListarProdutosMaisVendidos':
        return ['Produto', 'Quantidade Vendida', 'Valor Total'];
      case 'ListarFaturamentoPorPeriodo':
        return ['Cliente', 'Valor', 'Data', 'Extra'];
      case 'ListarQuantidadeFaturadaPorCaixa':
        return ['Caixa', 'Quantidade Faturada', 'Funcionários'];
      case 'ListarEstoqueAtual':
        return ['Produto', 'Quantidade', 'Localizações'];
      case 'ListarEntradasEstoquePorPeriodo':
      case 'ListarTransferenciasPorPeriodo':
        return ['Produto', 'Quantidade', 'Data', 'Funcionário'];
      case 'ListarProdutosAbaixoMinimo':
        return ['Produto', 'Quantidade Atual', 'Detalhes'];
      case 'ListarAtividadeFuncionariosCaixa':
        return ['Funcionário', 'Caixa', 'Data'];
      case 'ListarPeriodoMaisVendidoPorProduto':
        return ['Produto', 'Quantidade Vendida', 'Valor Total', 'Período'];
      default:
        return [];
    }
  };

  const getRowData = (item: ReportData) => {
    switch (reportType) {
      case 'ListarVendasPorPeriodo':
      case 'ListarVendasPorCliente':
        return [
          item.name,
          item.quantidadeVendida || 0,
          `Kz${item.valorTotal?.toFixed(2) || '0.00'}`,
          new Date(item.dataVenda || '').toLocaleDateString('pt-BR'),
          item.cliente || '-',
          item.status || '-',
        ];
      case 'ListarProdutosMaisVendidos':
        return [
          item.name,
          item.quantidadeVendida || 0,
          `Kz${item.valorTotal?.toFixed(2) || '0.00'}`,
        ];
      case 'ListarFaturamentoPorPeriodo':
        return [
          item.name,
          `Kz${item.valorTransacao?.toFixed(2) || '0.00'}`,
          new Date(item.dataTransacao || '').toLocaleDateString('pt-BR'),
          item.extra || '-',
        ];
      case 'ListarQuantidadeFaturadaPorCaixa':
        return [item.name, item.quantidadeVendida || 0, item.extra || '-'];
      case 'ListarEstoqueAtual':
        return [item.name, item.quantidade || 0, item.extra || '-'];
      case 'ListarEntradasEstoquePorPeriodo':
      case 'ListarTransferenciasPorPeriodo':
        return [
          item.name,
          item.quantidade || 0,
          new Date(item.dataTransacao || '').toLocaleDateString('pt-BR'),
          item.extra || '-',
        ];
      case 'ListarProdutosAbaixoMinimo':
        return [item.name, item.quantidade || 0, item.extra || '-'];
      case 'ListarAtividadeFuncionariosCaixa':
        return [
          item.name,
          item.extra || '-',
          new Date(item.dataTransacao || '').toLocaleDateString('pt-BR'),
        ];
      case 'ListarPeriodoMaisVendidoPorProduto':
        return [
          item.name,
          item.quantidadeVendida || 0,
          `Kz${item.valorTotal?.toFixed(2) || '0.00'}`,
          item.extra || '-',
        ];
      default:
        return [];
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as JsPDFWithAutoTable;
    const headers = getTableHeaders();
    const rows = reportData.map((item) => getRowData(item));

    doc.setFontSize(18);
    doc.text('Relatório de Gestão', 14, 20);
    doc.setFontSize(12);
    doc.text(
      `Tipo: ${reportType
        .replace(/Listar/g, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()}`,
      14,
      30,
    );
    doc.text(`Período: ${startDate || 'N/A'} a ${endDate || 'N/A'}`, 14, 40);

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
    const data = reportData.map((item) => {
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
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Tipo de Relatório</InputLabel>
            <Select value={reportType} onChange={handleReportTypeChange}>
              <MenuItem value="ListarVendasPorPeriodo">Vendas por Período</MenuItem>
              <MenuItem value="ListarVendasPorCliente">Vendas por Cliente</MenuItem>
              <MenuItem value="ListarProdutosMaisVendidos">Produtos Mais Vendidos</MenuItem>
              <MenuItem value="ListarFaturamentoPorPeriodo">Faturamento por Período</MenuItem>
              <MenuItem value="ListarQuantidadeFaturadaPorCaixa">
                Quantidade Faturada por Caixa
              </MenuItem>
              <MenuItem value="ListarEstoqueAtual">Estoque Atual</MenuItem>
              <MenuItem value="ListarEntradasEstoquePorPeriodo">
                Entradas de Estoque por Período
              </MenuItem>
              <MenuItem value="ListarTransferenciasPorPeriodo">Transferências por Período</MenuItem>
              <MenuItem value="ListarProdutosAbaixoMinimo">Produtos Abaixo do Mínimo</MenuItem>
              <MenuItem value="ListarAtividadeFuncionariosCaixa">
                Atividade de Funcionários no Caixa
              </MenuItem>
              <MenuItem value="ListarPeriodoMaisVendidoPorProduto">
                Período Mais Vendido por Produto
              </MenuItem>
            </Select>
          </FormControl>

          {reportType !== 'ListarEstoqueAtual' &&
            reportType !== 'ListarProdutosAbaixoMinimo' &&
            reportType !== 'ListarPeriodoMaisVendidoPorProduto' && (
              <>
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
              </>
            )}

          {reportType === 'ListarVendasPorCliente' && (
            <TextField
              label="ID do Cliente"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
          )}

          {reportType === 'ListarPeriodoMaisVendidoPorProduto' && (
            <TextField
              label="ID do Produto"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              sx={{ width: { xs: '100%', sm: 180 } }}
            />
          )}
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
            {reportData.length > 0 ? (
              reportData.map((item) => (
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
