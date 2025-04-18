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
  getAllClients,
} from '../../api/methods';
import {
  VendaComFuncionario,
  ProdutoMaisVendido,
  FaturamentoPorPeriodo,
  QuantidadeFaturadaPorCaixa,
  EntradaEstoqueComFuncionario,
  FuncionarioCaixaComNome,
  ProdutoAbaixoMinimo,
  TransferenciaComFuncionario,
  PeriodoMaisVendidoPorProduto,
  DadosEstoque,
  Cliente,
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

// Interface para o relatório de Definição de Metas
interface GoalData {
  id: string;
  description: string;
  objective: string;
  results: string;
  startDate: string;
  deadline: string;
  status: string;
  observations: string;
}

interface ReportData {
  id: string;
  name?: string;
  description?: string;
  objective?: string;
  results?: string;
  startDate?: string;
  deadline?: string;
  status?: string;
  observations?: string;
  quantidadeVendida?: number;
  valorTotal?: number;
  dataTransacao?: string;
  cliente?: string;
  extra?: string;
  quantidade?: number;
}

const ReportPage = () => {
  const [reportType, setReportType] = useState<string>('ListarVendasPorPeriodo');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [clients, setClients] = useState<Cliente[]>([]);

  useEffect(() => {
    fetchReportData();
    if (reportType === 'ListarVendasPorCliente') {
      fetchClients();
    }
  }, [reportType, startDate, endDate, clientId, productId]);

  const fetchClients = async () => {
    try {
      const clientList = await getAllClients();
      setClients(clientList);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
    }
  };

  const fetchReportData = async () => {
    try {
      let data: ReportData[] = [];
      const hasDateRange = startDate && endDate && !dateError;

      switch (reportType) {
        case 'ListarVendasPorPeriodo': {
          if (hasDateRange) {
            const sales: VendaComFuncionario[] = await getSalesByPeriod(startDate, endDate);
            data = sales.map((sale) => ({
              id: sale.id,
              name: sale.produto?.nomeProduto || 'Produto Desconhecido',
              quantidadeVendida: sale.quantidade || 0,
              valorTotal: sale.valorTotal || 0,
              dataTransacao: sale.data,
              cliente: sale.cliente?.nome || '-',
              status: sale.status || 'Concluída',
            }));
          }
          break;
        }

        case 'ListarVendasPorCliente': {
          if (hasDateRange && clientId) {
            const sales: VendaComFuncionario[] = await getSalesByClient(
              clientId,
              startDate,
              endDate,
            );
            data = sales.map((sale) => ({
              id: sale.id,
              name: sale.produto?.nomeProduto || 'Produto Desconhecido',
              quantidadeVendida: sale.quantidade || 0,
              valorTotal: sale.valorTotal || 0,
              dataTransacao: sale.data,
              cliente: sale.cliente?.nome || '-',
              status: sale.status || 'Concluída',
            }));
          }
          break;
        }

        case 'ListarProdutosMaisVendidos': {
          if (hasDateRange) {
            const products: ProdutoMaisVendido[] = await getTopSellingProducts(startDate, endDate);
            data = products.map((product) => ({
              id: product.id_produto,
              name: product.nomeProduto,
              quantidadeVendida: product.quantidadeVendida || 0,
              valorTotal: product.valorTotal || 0,
            }));
          }
          break;
        }

        case 'ListarFaturamentoPorPeriodo': {
          if (hasDateRange) {
            const revenue: FaturamentoPorPeriodo = await getRevenueByPeriod(startDate, endDate);
            data = revenue.vendas.map((sale) => ({
              id: sale.id,
              name: sale.cliente?.nome || '-',
              valorTotal: sale.valorTotal || 0,
              dataTransacao: sale.data,
              extra: `Total Faturado: Kz${revenue.totalFaturado || 0}`,
            }));
          }
          break;
        }

        case 'ListarQuantidadeFaturadaPorCaixa': {
          if (hasDateRange) {
            const cashiers: QuantidadeFaturadaPorCaixa[] = await getRevenueByCashRegister(
              startDate,
              endDate,
            );
            data = cashiers.map((cashier) => ({
              id: cashier.idCaixa,
              name: cashier.nomeCaixa,
              quantidade: cashier.quantidadeFaturada || 0,
              extra: cashier.funcionarios.join(', ') || '-',
            }));
          }
          break;
        }

        case 'ListarEstoqueAtual': {
          const stock: DadosEstoque[] = await getCurrentStock();
          data = stock.map((item) => ({
            id: item.id_produto,
            name: item.produtos?.nomeProduto || 'Produto Desconhecido',
            quantidade: item.quantidadeAtual || 0,
            extra: 'Sem localização',
          }));
          break;
        }

        case 'ListarEntradasEstoquePorPeriodo': {
          if (hasDateRange) {
            const entries: EntradaEstoqueComFuncionario[] = await getStockEntriesByPeriod(
              startDate,
              endDate,
            );
            data = entries.map((entry) => ({
              id: entry.id,
              name: entry.produto?.nomeProduto || 'Produto Desconhecido',
              quantidade: entry.quantidade || 0,
              dataTransacao: entry.data,
              extra: entry.funcionarioNome || '-',
            }));
          }
          break;
        }

        case 'ListarTransferenciasPorPeriodo': {
          if (hasDateRange) {
            const transfers: TransferenciaComFuncionario[] = await getTransfersByPeriod(
              startDate,
              endDate,
            );
            data = transfers.map((transfer) => ({
              id: transfer.id,
              name: transfer.produto?.nomeProduto || 'Produto Desconhecido',
              quantidade: transfer.quantidade || 0,
              dataTransacao: transfer.data,
              extra: transfer.funcionarioNome || '-',
            }));
          }
          break;
        }

        case 'ListarProdutosAbaixoMinimo': {
          const belowMin: ProdutoAbaixoMinimo[] = await getProductsBelowMinimum();
          data = belowMin.map((item) => ({
            id: item.id_produto,
            name: item.nomeProduto,
            quantidade: item.quantidadeAtual || 0,
            extra: `Mínimo: ${item.quantidadeMinima}, Localização: ${item.localizacao || '-'}`,
          }));
          break;
        }

        case 'ListarAtividadeFuncionariosCaixa': {
          if (hasDateRange) {
            const activity: FuncionarioCaixaComNome[] = await getCashierActivity(
              startDate,
              endDate,
            );
            data = activity.map((act) => ({
              id: act.id,
              name: act.funcionarioNome,
              extra: `Caixa: ${act.caixa?.nome || '-'}`,
              dataTransacao: act.data,
            }));
          }
          break;
        }

        case 'ListarPeriodoMaisVendidoPorProduto': {
          if (productId) {
            const period: PeriodoMaisVendidoPorProduto =
              await getTopSellingPeriodByProduct(productId);
            data = [
              {
                id: period.id_produto,
                name: period.nomeProduto,
                quantidadeVendida: period.quantidadeVendida || 0,
                valorTotal: period.valorTotal || 0,
                extra: period.periodo || '-',
              },
            ];
          }
          break;
        }

        case 'ListarDefinicaoMetas': {
          // Simulação de dados (substitua por uma chamada de API real se disponível)
          const goals: GoalData[] = [
            {
              id: '1',
              description: 'Aumentar vendas mensais',
              objective: 'Atingir 10.000 Kz em vendas',
              results: '8.500 Kz alcançados',
              startDate: '2025-01-01',
              deadline: '2025-01-31',
              status: 'Em andamento',
              observations: 'Foco em produtos de alta demanda',
            },
            {
              id: '2',
              description: 'Reduzir custos operacionais',
              objective: 'Diminuir custos em 15%',
              results: 'Redução de 10% até o momento',
              startDate: '2025-02-01',
              deadline: '2025-02-28',
              status: 'Em andamento',
              observations: 'Revisar fornecedores',
            },
            {
              id: '3',
              description: 'Treinar equipe de vendas',
              objective: 'Treinar 100% da equipe',
              results: '80% concluído',
              startDate: '2025-03-01',
              deadline: '2025-03-15',
              status: 'Em andamento',
              observations: 'Faltam 2 funcionários',
            },
          ];

          data = goals.map((goal) => ({
            id: goal.id,
            description: goal.description,
            objective: goal.objective,
            results: goal.results,
            startDate: goal.startDate,
            deadline: goal.deadline,
            status: goal.status,
            observations: goal.observations,
          }));
          break;
        }

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

  const handleClientChange = (event: SelectChangeEvent<string>) => {
    setClientId(event.target.value);
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
      case 'ListarDefinicaoMetas':
        return [
          'Nº Meta',
          'Descrição',
          'Objetivo',
          'Resultados',
          'Data de início',
          'Prazo',
          'Status',
          'Observações',
        ];
      default:
        return [];
    }
  };

  const getRowData = (item: ReportData, index: number) => {
    switch (reportType) {
      case 'ListarVendasPorPeriodo':
      case 'ListarVendasPorCliente':
        return [
          item.name || '-',
          item.quantidadeVendida ?? 0,
          `Kz${item.valorTotal ?? 0}`,
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
          item.cliente || '-',
          item.status || '-',
        ];
      case 'ListarProdutosMaisVendidos':
        return [item.name || '-', item.quantidadeVendida ?? 0, `Kz${item.valorTotal ?? 0}`];
      case 'ListarFaturamentoPorPeriodo':
        return [
          item.name || '-',
          `Kz${item.valorTotal ?? 0}`,
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
          item.extra || '-',
        ];
      case 'ListarQuantidadeFaturadaPorCaixa':
        return [item.name || '-', item.quantidade ?? 0, item.extra || '-'];
      case 'ListarEstoqueAtual':
        return [item.name || '-', item.quantidade ?? 0, item.extra || '-'];
      case 'ListarEntradasEstoquePorPeriodo':
      case 'ListarTransferenciasPorPeriodo':
        return [
          item.name || '-',
          item.quantidade ?? 0,
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
          item.extra || '-',
        ];
      case 'ListarProdutosAbaixoMinimo':
        return [item.name || '-', item.quantidade ?? 0, item.extra || '-'];
      case 'ListarAtividadeFuncionariosCaixa':
        return [
          item.name || '-',
          item.extra || '-',
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
        ];
      case 'ListarPeriodoMaisVendidoPorProduto':
        return [
          item.name || '-',
          item.quantidadeVendida ?? 0,
          `Kz${item.valorTotal ?? 0}`,
          item.extra || '-',
        ];
      case 'ListarDefinicaoMetas':
        return [
          index + 1,
          item.description || '-',
          item.objective || '-',
          item.results || '-',
          item.startDate ? new Date(item.startDate).toLocaleDateString('pt-BR') : '-',
          item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR') : '-',
          item.status || '-',
          item.observations || '-',
        ];
      default:
        return [];
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF() as JsPDFWithAutoTable;
    const headers = getTableHeaders();
    const rows = reportData.map((item, index) => getRowData(item, index));

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
    if (reportType !== 'ListarDefinicaoMetas') {
      doc.text(`Período: ${startDate || 'N/A'} a ${endDate || 'N/A'}`, 14, 40);
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 50,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
      });
    } else {
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [255, 147, 0] },
      });
    }

    doc.save(`relatorio_${reportType}.pdf`);
  };

  const exportExcel = () => {
    const headers = getTableHeaders();
    const data = reportData.map((item, index) => {
      const row = getRowData(item, index);
      return headers.reduce((obj: { [key: string]: string | number }, header, index) => {
        const value = row[index] ?? '-';
        obj[header] = value;
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
              <MenuItem value="ListarDefinicaoMetas">Definição de Metas</MenuItem>
            </Select>
          </FormControl>

          {reportType !== 'ListarEstoqueAtual' &&
            reportType !== 'ListarProdutosAbaixoMinimo' &&
            reportType !== 'ListarPeriodoMaisVendidoPorProduto' &&
            reportType !== 'ListarDefinicaoMetas' && (
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
            <FormControl sx={{ width: { xs: '100%', sm: 180 } }}>
              <InputLabel>Cliente</InputLabel>
              <Select value={clientId} onChange={handleClientChange} label="Cliente">
                <MenuItem value="">
                  <em>Selecione um cliente</em>
                </MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.nomeCliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              reportData.map((item, index) => (
                <TableRow key={item.id}>
                  {getRowData(item, index).map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
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
