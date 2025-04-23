import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
  CircularProgress,
} from '@mui/material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SelectChangeEvent } from '@mui/material';
import {
  getSalesByPeriod,
  getTopSellingProducts,
  getRevenueByPeriod,
  getRevenueByCashRegister,
  getTransfersByPeriod,
  getProductsBelowMinimum,
  getCashierActivity,
  getTopSellingPeriodByProduct,
  getCashRegistersActivity,
  getProductsReport,
  getProductLocationReport,
  getDailyActivitiesReport,
  getCashRegistersReport,
  getAllCashRegisters,
} from '../../api/methods';
import {
  VendaComFuncionario,
  ProdutoMaisVendido,
  FaturamentoPorPeriodo,
  QuantidadeFaturadaPorCaixa,
  TransferenciaComFuncionario,
  ProdutoAbaixoMinimo,
  PeriodoMaisVendidoPorProduto,
  Caixa,
  Produto,
  ProdutoLocalizacao,
  AtividadeDoDia,
  FuncionarioCaixaComNome,
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
  funcionarioNome?: string;
  caixaNome?: string;
}

const ReportPage = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<string>('ListarVendasPorPeriodo');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [cashRegisterId, setCashRegisterId] = useState<string>('');
  const [cashRegisters, setCashRegisters] = useState<Caixa[]>([]);
  const [usuarioId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token não encontrado. Faça login novamente.');
        }

        const user = localStorage.getItem('user');
        let parsedUser: { userId?: string } | null = null;
        if (user) {
          parsedUser = JSON.parse(user);
        }

        let userId: string | null = null;
        const decoded: { userId?: string } = jwtDecode(token);
        if (decoded.userId) {
          userId = decoded.userId;
        } else if (parsedUser && parsedUser.userId) {
          userId = parsedUser.userId;
        }

        if (!userId) {
          throw new Error('ID do usuário não encontrado.');
        }

        setUserId(userId);
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Erro ao autenticar usuário. Tente novamente.',
        );
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserId();
  }, [navigate]);

  useEffect(() => {
    if (usuarioId) {
      fetchReportData();
      if (reportType === 'ListarCaixas') {
        fetchCashRegisters();
      }
    }
  }, [reportType, startDate, endDate, productId, cashRegisterId, usuarioId]);

  const fetchCashRegisters = async () => {
    try {
      const cashRegisterList = await getAllCashRegisters();
      setCashRegisters(cashRegisterList);
    } catch (error) {
      console.error('Erro ao buscar caixas:', error);
      setCashRegisters([]);
    }
  };

  const fetchReportData = async () => {
    try {
      if (!usuarioId) {
        throw new Error('Usuário não autenticado');
      }

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

        case 'ListarCaixas': {
          if (hasDateRange) {
            const cashRegisters: Caixa[] = await getCashRegistersReport(
              startDate,
              endDate,
              cashRegisterId,
            );
            data = cashRegisters.map((cr) => ({
              id: cr.id ?? '',
              name: cr.nomeCaixa,
              extra: cr.descricao || '-',
              dataTransacao: cr.createdAt || '-',
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
          if (hasDateRange) {
            const belowMin: ProdutoAbaixoMinimo[] = await getProductsBelowMinimum(
              startDate,
              endDate,
            );
            data = belowMin.map((item) => ({
              id: item.id_produto,
              name: item.nomeProduto,
              quantidade: item.quantidadeAtual || 0,
              extra: `Mínimo: ${item.quantidadeMinima}, Localização: ${item.localizacao || '-'}`,
              dataTransacao: new Date().toISOString().split('T')[0],
            }));
          }
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
          if (hasDateRange && productId) {
            const period: PeriodoMaisVendidoPorProduto = await getTopSellingPeriodByProduct(
              productId,
              startDate,
              endDate,
            );
            data = [
              {
                id: period.id_produto,
                name: period.nomeProduto,
                quantidadeVendida: period.quantidadeVendida || 0,
                valorTotal: period.valorTotal || 0,
                extra: period.periodo || '-',
                dataTransacao: period.periodo.split(' a ')[0] || '-',
              },
            ];
          }
          break;
        }

        case 'ListarAtividadesCaixas': {
          if (hasDateRange) {
            const activities: FuncionarioCaixaComNome[] = await getCashRegistersActivity(
              startDate,
              endDate,
              productId || undefined,
            );
            data = activities.map((act) => ({
              id: act.id,
              name: act.funcionarioNome,
              extra: `Caixa: ${act.caixa?.nome || '-'}`,
              dataTransacao: act.data,
            }));
          }
          break;
        }

        case 'ListarRelatorioProdutos': {
          if (hasDateRange) {
            const products: Produto[] = await getProductsReport(startDate, endDate);
            data = products.map((product) => ({
              id: product.id,
              name: product.nomeProduto,
              extra: `Categoria: ${product.id_categoriaProduto}`,
              dataTransacao: product.createdAt,
            }));
          }
          break;
        }

        case 'ListarRelatorioProdutoLocalizacao': {
          if (hasDateRange) {
            const locations: ProdutoLocalizacao[] = await getProductLocationReport(
              startDate,
              endDate,
              productId || undefined,
            );
            data = locations.map((loc) => ({
              id: loc.id,
              name: loc.produtos?.nomeProduto || 'Produto Desconhecido',
              extra: `Localização: ${loc.localizacoes?.nomeLocalizacao || '-'}`,
              dataTransacao: new Date().toISOString().split('T')[0],
            }));
          }
          break;
        }

        case 'ListarAtividadesDoDia': {
          if (hasDateRange) {
            const activities: AtividadeDoDia[] = await getDailyActivitiesReport(startDate, endDate);
            data = activities.map((activity) => ({
              id: activity.id || '',
              name: activity.tarefa?.nome || '-',
              status: activity.status || '-',
              extra: activity.funcionario?.nome || '-',
              dataTransacao: activity.data || '-',
            }));
          }
          break;
        }

        case 'ListarDefinicaoMetas': {
          if (hasDateRange) {
            const goals: GoalData[] = [
              {
                id: '1',
                description: 'Aumentar vendas mensais',
                objective: 'Atingir 10.000 Kz em vendas',
                results: '8.500 Kz alcançados',
                startDate: startDate,
                deadline: endDate,
                status: 'Em andamento',
                observations: 'Foco em produtos de alta demanda',
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
              dataTransacao: goal.startDate,
            }));
          }
          break;
        }

        default:
          data = [];
      }
      setReportData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      setReportData([]);
      setAuthError(
        'Erro ao carregar dados: ' + (error instanceof Error ? error.message : 'Desconhecido'),
      );
    }
  };

  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
    setStartDate('');
    setEndDate('');
    setDateError('');
    setProductId('');
    setCashRegisterId('');
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

  const handleCashRegisterChange = (event: SelectChangeEvent<string>) => {
    setCashRegisterId(event.target.value);
  };

  const getTableHeaders = () => {
    switch (reportType) {
      case 'ListarVendasPorPeriodo':
        return ['Produto', 'Quantidade Vendida', 'Valor Total', 'Data', 'Cliente', 'Status'];
      case 'ListarProdutosMaisVendidos':
        return ['Produto', 'Quantidade Vendida', 'Valor Total'];
      case 'ListarFaturamentoPorPeriodo':
        return ['Cliente', 'Valor', 'Data', 'Extra'];
      case 'ListarQuantidadeFaturadaPorCaixa':
        return ['Caixa', 'Quantidade Faturada', 'Funcionários'];
      case 'ListarCaixas':
        return ['Caixa', 'Descrição', 'Data Criação'];
      case 'ListarTransferenciasPorPeriodo':
        return ['Produto', 'Quantidade', 'Data', 'Extra'];
      case 'ListarProdutosAbaixoMinimo':
        return ['Produto', 'Quantidade Atual', 'Detalhes', 'Data'];
      case 'ListarAtividadeFuncionariosCaixa':
      case 'ListarAtividadesCaixas':
        return ['Funcionário', 'Caixa', 'Data'];
      case 'ListarPeriodoMaisVendidoPorProduto':
        return ['Produto', 'Quantidade Vendida', 'Valor Total', 'Período'];
      case 'ListarRelatorioProdutos':
        return ['Produto', 'Categoria', 'Data Criação'];
      case 'ListarRelatorioProdutoLocalizacao':
        return ['Produto', 'Localização', 'Data'];
      case 'ListarAtividadesDoDia':
        return ['Tarefa', 'Status', 'Funcionário', 'Data'];
      case 'ListarDefinicaoMetas':
        return [
          'Nº Meta',
          'Descrição',
          'Objetivo',
          'Resultados',
          'Data de Início',
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
      case 'ListarCaixas':
        return [
          item.name || '-',
          item.extra || '-',
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
        ];
      case 'ListarTransferenciasPorPeriodo':
        return [
          item.name || '-',
          item.quantidade ?? 0,
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
          item.extra || '-',
        ];
      case 'ListarProdutosAbaixoMinimo':
        return [
          item.name || '-',
          item.quantidade ?? 0,
          item.extra || '-',
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
        ];
      case 'ListarAtividadeFuncionariosCaixa':
      case 'ListarAtividadesCaixas':
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
      case 'ListarRelatorioProdutos':
        return [
          item.name || '-',
          item.extra || '-',
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
        ];
      case 'ListarRelatorioProdutoLocalizacao':
        return [
          item.name || '-',
          item.extra || '-',
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
        ];
      case 'ListarAtividadesDoDia':
        return [
          item.name || '-',
          item.status || '-',
          item.extra || '-',
          item.dataTransacao ? new Date(item.dataTransacao).toLocaleDateString('pt-BR') : '-',
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

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {authError && !isLoading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}

      {!authError && !isLoading && usuarioId && (
        <>
          <Box sx={{ mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Tipo de Relatório</InputLabel>
                <Select value={reportType} onChange={handleReportTypeChange}>
                  <MenuItem value="ListarVendasPorPeriodo">Vendas por Período</MenuItem>
                  <MenuItem value="ListarProdutosMaisVendidos">Produtos Mais Vendidos</MenuItem>
                  <MenuItem value="ListarFaturamentoPorPeriodo">Faturamento por Período</MenuItem>
                  <MenuItem value="ListarQuantidadeFaturadaPorCaixa">
                    Quantidade Faturada por Caixa
                  </MenuItem>
                  <MenuItem value="ListarCaixas">Caixas</MenuItem>
                  <MenuItem value="ListarTransferenciasPorPeriodo">
                    Transferências por Período
                  </MenuItem>
                  <MenuItem value="ListarProdutosAbaixoMinimo">Produtos Abaixo do Mínimo</MenuItem>
                  <MenuItem value="ListarAtividadeFuncionariosCaixa">
                    Atividade de Funcionários no Caixa
                  </MenuItem>
                  <MenuItem value="ListarPeriodoMaisVendidoPorProduto">
                    Período Mais Vendido por Produto
                  </MenuItem>
                  <MenuItem value="ListarAtividadesCaixas">Atividades de Caixas</MenuItem>
                  <MenuItem value="ListarRelatorioProdutos">Relatório de Produtos</MenuItem>
                  <MenuItem value="ListarRelatorioProdutoLocalizacao">
                    Relatório de Localização de Produtos
                  </MenuItem>
                  <MenuItem value="ListarAtividadesDoDia">Atividades do Dia</MenuItem>
                  <MenuItem value="ListarDefinicaoMetas">Definição de Metas</MenuItem>
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
                disabled={reportType === 'ListarAtividadesDoDia'}
              />
              <TextField
                type="date"
                label="Data de Fim"
                value={endDate}
                onChange={handleEndDateChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: '100%', sm: 180 } }}
                error={!!dateError}
                disabled={reportType === 'ListarAtividadesDoDia'}
              />

              {reportType === 'ListarCaixas' && (
                <FormControl sx={{ width: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Caixa</InputLabel>
                  <Select value={cashRegisterId} onChange={handleCashRegisterChange} label="Caixa">
                    <MenuItem value="">
                      <em>Todos os caixas</em>
                    </MenuItem>
                    {cashRegisters.map((cashRegister) => (
                      <MenuItem key={cashRegister.id} value={cashRegister.id}>
                        {cashRegister.nomeCaixa}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {[
                'ListarPeriodoMaisVendidoPorProduto',
                'ListarAtividadesCaixas',
                'ListarRelatorioProdutoLocalizacao',
              ].includes(reportType) && (
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
        </>
      )}
    </Paper>
  );
};

export default ReportPage;
