import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Pagination,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getAllSales,
  getAllProductLocations,
  getAllProducts,
  getAllLocations,
  getAllStockEntries,
  getAllDailyActivities,
  getAllEmployeeCashRegisters,
} from '../../api/methods';
import {
  Venda,
  Produto,
  Localizacao,
  ProdutoLocalizacao,
  DadosEntradaEstoque,
  AtividadeDoDia,
  FuncionarioCaixa,
} from '../../types/models';

const ITEMS_PER_PAGE = 5;

interface ProdutoLocalizacaoDisplay {
  id: string | undefined;
  nomeProduto: string;
  nomeLocalizacao: string;
  tipoLocalizacao: string;
  quantidadeProduto: number;
  quantidadeMinimaProduto: number;
}

interface EntradaEstoqueDisplay {
  id: string | undefined;
  nomeProduto: string;
  quantidadeRecebida: number;
  dataEntrada: string;
  lote: string;
}

interface FaturamentoPorCaixa {
  idCaixa: string;
  nomeCaixa: string;
  quantidadeFaturada: number;
}

interface FaturamentoPorPeriodo {
  periodo: string;
  quantidadeFaturada: number;
}

type PeriodoFaturamento = 'dia' | 'mes' | 'ano';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    vendas: Venda[];
    faturamentoPorCaixa: FaturamentoPorCaixa[];
    produtosLocalizacoes: ProdutoLocalizacaoDisplay[];
    entradasEstoque: EntradaEstoqueDisplay[];
    tarefasPendentes: number;
  } | null>(null);
  const [pageProdutos, setPageProdutos] = useState(1);
  const [pageEntradas, setPageEntradas] = useState(1);
  const [searchTermProdutos, setSearchTermProdutos] = useState('');
  const [searchTermEntradas, setSearchTermEntradas] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodoFaturamento, setPeriodoFaturamento] = useState<PeriodoFaturamento>('dia');
  const [faturamentoPorPeriodo, setFaturamentoPorPeriodo] = useState<FaturamentoPorPeriodo[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const [
        vendas,
        produtosLocalizacoes,
        produtos,
        localizacoes,
        entradasEstoque,
        atividades,
        funcionariosCaixa,
      ] = await Promise.all([
        getAllSales().catch(() => []),
        getAllProductLocations().catch(() => []),
        getAllProducts().catch(() => []),
        getAllLocations().catch(() => []),
        getAllStockEntries().catch(() => []),
        getAllDailyActivities().catch(() => []),
        getAllEmployeeCashRegisters().catch(() => []),
      ]);

      const produtoMap = new Map(produtos.map((p: Produto) => [p.id, p.nomeProduto]));
      const localizacaoMap = new Map(
        localizacoes.map((l: Localizacao) => [l.id, l.nomeLocalizacao]),
      );
      const caixaMap = new Map(
        funcionariosCaixa.map((fc: FuncionarioCaixa) => [
          fc.id_funcionario,
          fc.caixas?.nomeCaixa || 'Desconhecido',
        ]),
      );

      const produtosLocalizacoesMapped: ProdutoLocalizacaoDisplay[] = produtosLocalizacoes.map(
        (loc: ProdutoLocalizacao) => ({
          id: loc.id,
          nomeProduto: produtoMap.get(loc.id_produto) || 'Desconhecido',
          nomeLocalizacao: localizacaoMap.get(loc.id_localizacao) || 'Desconhecido',
          tipoLocalizacao: loc.localizacoes?.tipo || 'Desconhecido', // Adicione esta linha
          quantidadeProduto: loc.quantidadeProduto,
          quantidadeMinimaProduto: loc.quantidadeMinimaProduto,
        }),
      );

      const entradasEstoqueMapped: EntradaEstoqueDisplay[] = entradasEstoque.map(
        (entrada: DadosEntradaEstoque) => {
          const dataEntrada =
            entrada.dataEntrada instanceof Date
              ? entrada.dataEntrada
              : new Date(entrada.dataEntrada);
          return {
            id: entrada.id,
            nomeProduto: produtoMap.get(entrada.id_produto) || 'Desconhecido',
            quantidadeRecebida: entrada.quantidadeRecebida,
            dataEntrada: dataEntrada.toLocaleDateString('pt-AO'),
            lote: entrada.lote,
          };
        },
      );

      const faturamentoMap = new Map<string, { nomeCaixa: string; quantidadeFaturada: number }>();
      vendas.forEach((venda: Venda) => {
        if (venda.id_funcionarioCaixa) {
          const nomeCaixa = caixaMap.get(venda.id_funcionarioCaixa) || 'Desconhecido';
          const current = faturamentoMap.get(venda.id_funcionarioCaixa) || {
            nomeCaixa,
            quantidadeFaturada: 0,
          };
          current.quantidadeFaturada += Number(venda.valorTotal || 0);
          faturamentoMap.set(venda.id_funcionarioCaixa, current);
        }
      });
      const faturamentoPorCaixa: FaturamentoPorCaixa[] = Array.from(faturamentoMap.entries()).map(
        ([idCaixa, data]) => ({
          idCaixa,
          nomeCaixa: data.nomeCaixa,
          quantidadeFaturada: data.quantidadeFaturada,
        }),
      );

      const tarefasPendentes = atividades.filter(
        (atividade: AtividadeDoDia) => atividade.status.toLowerCase() === 'pendente',
      ).length;

      setDashboardData({
        vendas,
        faturamentoPorCaixa,
        produtosLocalizacoes: produtosLocalizacoesMapped,
        entradasEstoque: entradasEstoqueMapped,
        tarefasPendentes,
      });

      processarFaturamentoPorPeriodo(vendas, periodoFaturamento, selectedMonth);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      processarFaturamentoPorPeriodo(dashboardData.vendas, periodoFaturamento, selectedMonth);
    }
  }, [periodoFaturamento, dashboardData, selectedMonth]);

  const processarFaturamentoPorPeriodo = (
    vendas: Venda[],
    periodo: PeriodoFaturamento,
    selectedMonth: string,
  ) => {
    const faturamentoMap = new Map<string, number>();
    const hoje = new Date();
    const nomesDiasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    if (periodo === 'dia') {
      // Criar um mapa com todos os dias da semana atual
      const hoje = new Date();
      const startOfWeek = new Date(hoje);
      startOfWeek.setDate(hoje.getDate() - hoje.getDay()); // Domingo da semana atual
      startOfWeek.setHours(0, 0, 0, 0);

      // Inicializar o mapa com todos os dias da semana
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      diasSemana.forEach((dia) => faturamentoMap.set(dia, 0));

      // Processar todas as vendas, não apenas as da semana atual
      vendas.forEach((venda) => {
        if (!venda.dataEmissao) return;

        const dataVenda = venda.dataEmissao.includes('/')
          ? new Date(venda.dataEmissao.split('/').reverse().join('-'))
          : new Date(venda.dataEmissao);

        // Verificar se é da semana atual
        if (dataVenda >= startOfWeek && dataVenda <= hoje) {
          const diaSemana = dataVenda.getDay();
          const chavePeriodo = diasSemana[diaSemana];
          const valorAtual = faturamentoMap.get(chavePeriodo) || 0;
          faturamentoMap.set(chavePeriodo, valorAtual + Number(venda.valorTotal || 0));
        }
      });
    } else if (periodo === 'mes') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const primeiroDiaMes = new Date(year, month - 1, 1);
      const ultimoDiaMes = new Date(year, month, 0);

      // Calcular número de semanas no mês
      const semanasNoMes = Math.ceil((ultimoDiaMes.getDate() + primeiroDiaMes.getDay()) / 7);

      // Inicializar todas as semanas
      for (let i = 1; i <= semanasNoMes; i++) {
        faturamentoMap.set(`Semana ${i}`, 0);
      }

      vendas.forEach((venda) => {
        if (!venda.dataEmissao) return;

        const dataVenda = venda.dataEmissao.includes('/')
          ? new Date(venda.dataEmissao.split('/').reverse().join('-'))
          : new Date(venda.dataEmissao);

        if (dataVenda.getMonth() === month - 1 && dataVenda.getFullYear() === year) {
          const diaMes = dataVenda.getDate();
          const semana = Math.ceil((diaMes + primeiroDiaMes.getDay()) / 7);
          const chavePeriodo = `Semana ${semana}`;
          const valorAtual = faturamentoMap.get(chavePeriodo) || 0;
          faturamentoMap.set(chavePeriodo, valorAtual + Number(venda.valorTotal || 0));
        }
      });
    } else if (periodo === 'ano') {
      const meses = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];

      meses.forEach((mes) => faturamentoMap.set(mes, 0));

      vendas.forEach((venda) => {
        if (!venda.dataEmissao) return;

        const dataVenda = venda.dataEmissao.includes('/')
          ? new Date(venda.dataEmissao.split('/').reverse().join('-'))
          : new Date(venda.dataEmissao);

        const mesIndex = dataVenda.getMonth();
        const chavePeriodo = meses[mesIndex];
        const valorAtual = faturamentoMap.get(chavePeriodo) || 0;
        faturamentoMap.set(chavePeriodo, valorAtual + Number(venda.valorTotal || 0));
      });
    }

    const faturamentoArray: FaturamentoPorPeriodo[] = Array.from(faturamentoMap.entries())
      .map(([periodo, quantidadeFaturada]) => ({
        periodo,
        quantidadeFaturada,
      }))
      .sort((a, b) => {
        if (periodo === 'dia') {
          const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
          return diasSemana.indexOf(a.periodo) - diasSemana.indexOf(b.periodo);
        } else if (periodo === 'mes') {
          return parseInt(a.periodo.split(' ')[1]) - parseInt(b.periodo.split(' ')[1]);
        } else {
          const meses = [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
          ];
          return meses.indexOf(a.periodo) - meses.indexOf(b.periodo);
        }
      });

    setFaturamentoPorPeriodo(faturamentoArray);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  const handlePageChangeProdutos = (event: React.ChangeEvent<unknown>, value: number) => {
    setPageProdutos(value);
  };

  const handlePageChangeEntradas = (event: React.ChangeEvent<unknown>, value: number) => {
    setPageEntradas(value);
  };

  const handleSearchChangeProdutos = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermProdutos(event.target.value);
    setPageProdutos(1);
  };

  const handleSearchChangeEntradas = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermEntradas(event.target.value);
    setPageEntradas(1);
  };

  const handleSearchEntradas = () => {
    setPageEntradas(1);
  };

  const handlePeriodoFaturamentoChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriodo: PeriodoFaturamento,
  ) => {
    if (newPeriodo !== null) {
      setPeriodoFaturamento(newPeriodo);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography variant="h6">Não foi possível carregar os dados do dashboard</Typography>
      </Box>
    );
  }

  const dateRangeEnd = new Date();
  const dateRangeStart = new Date(dateRangeEnd);
  dateRangeStart.setDate(dateRangeEnd.getDate() - 30);

  const vendasLast30Days = dashboardData.vendas.filter((venda) => {
    const vendaDate = venda.dataEmissao.includes('/')
      ? new Date(venda.dataEmissao.split('/').reverse().join('-'))
      : new Date(venda.dataEmissao);
    return vendaDate >= dateRangeStart && vendaDate <= dateRangeEnd;
  });

  const totalFaturado = vendasLast30Days.reduce(
    (sum, venda) => sum + Number(venda.valorTotal || 0),
    0,
  );

  const produtosVendidos = vendasLast30Days.reduce(
    (sum, venda) =>
      sum +
      (venda.vendasProdutos?.reduce((subSum, vp) => subSum + (vp.quantidadeVendida || 0), 0) || 0),
    0,
  );
  const produtosEmFalta = dashboardData.produtosLocalizacoes.filter(
    (loc) => loc.quantidadeProduto <= loc.quantidadeMinimaProduto,
  ).length;

  const filteredProdutos = dashboardData.produtosLocalizacoes.filter(
    (loc) =>
      loc.nomeProduto.toLowerCase().includes(searchTermProdutos.toLowerCase()) ||
      loc.nomeLocalizacao.toLowerCase().includes(searchTermProdutos.toLowerCase()),
  );

  const filteredEntradas = dashboardData.entradasEstoque.filter((entrada) => {
    const matchesSearch = entrada.nomeProduto
      .toLowerCase()
      .includes(searchTermEntradas.toLowerCase());
    const entradaDate = new Date(entrada.dataEntrada.split('/').reverse().join('-'));
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesDate = (!start || entradaDate >= start) && (!end || entradaDate <= end);
    return matchesSearch && matchesDate;
  });

  const totalPagesProdutos = Math.ceil(filteredProdutos.length / ITEMS_PER_PAGE);
  const paginatedProdutos = filteredProdutos.slice(
    (pageProdutos - 1) * ITEMS_PER_PAGE,
    pageProdutos * ITEMS_PER_PAGE,
  );

  const totalPagesEntradas = Math.ceil(filteredEntradas.length / ITEMS_PER_PAGE);
  const paginatedEntradas = filteredEntradas.slice(
    (pageEntradas - 1) * ITEMS_PER_PAGE,
    pageEntradas * ITEMS_PER_PAGE,
  );

  return (
    <Box sx={{ flexGrow: 1, p: 4, bgcolor: '#f5f5f5' }}>
      <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Visão Geral do Sistema
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        {[
          {
            title: 'Faturamento Total',
            value: formatCurrency(totalFaturado),
            gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            caption: 'Últimos 30 dias',
          },
          {
            title: 'Produtos Vendidos',
            value: produtosVendidos.toString(),
            gradient: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
            caption: 'Últimos 30 dias',
          },
          {
            title: 'Produtos em Falta',
            value: produtosEmFalta.toString(),
            gradient: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
            caption: (
              <Box>
                {dashboardData.produtosLocalizacoes
                  .filter((loc) => loc.quantidadeProduto <= loc.quantidadeMinimaProduto)
                  .slice(0, 3) // Mostra apenas os 3 primeiros para não sobrecarregar
                  .map((loc, idx) => (
                    <Typography key={idx} variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                      Na {loc.nomeLocalizacao}
                    </Typography>
                  ))}
              </Box>
            ),
          },
          {
            title: 'Atividades Pendentes',
            value: dashboardData.tarefasPendentes.toString(),
            gradient: 'linear-gradient(135deg, #fbc02d 0%, #ffca28 100%)',
            caption: 'Hoje',
          },
        ].map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                minHeight: 160,
                boxShadow: 6,
                borderRadius: 3,
                background: card.gradient,
                color: 'white',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 12,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 'medium' }}>
                  {card.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {card.caption}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              boxShadow: 4,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'medium', color: '#333' }}>
              Faturamento por Período
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {periodoFaturamento === 'mes' && (
                <TextField
                  label="Selecionar Mês"
                  type="month"
                  variant="outlined"
                  size="small"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{ maxWidth: 200 }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
              <ToggleButtonGroup
                value={periodoFaturamento}
                exclusive
                onChange={handlePeriodoFaturamentoChange}
                aria-label="Período de faturamento"
              >
                <ToggleButton value="dia" aria-label="Dia">
                  Semana Atual
                </ToggleButton>
                <ToggleButton value="mes" aria-label="Mês">
                  Semanas do Mês
                </ToggleButton>
                <ToggleButton value="ano" aria-label="Ano">
                  Meses do Ano
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', position: 'relative' }}>
            {isRefreshing && (
              <CircularProgress size={24} sx={{ position: 'absolute', top: 10, right: 10 }} />
            )}
            {faturamentoPorPeriodo.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={faturamentoPorPeriodo}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                      value: 'Valor (AOA)',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 14 },
                    }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Período: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="quantidadeFaturada"
                    name="Valor Faturado"
                    fill="#8884d8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" align="center">
                Nenhum dado de faturamento disponível
              </Typography>
            )}
          </Paper>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              boxShadow: 4,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'medium', color: '#333', mb: 2 }}>
              Produtos por Localização
            </Typography>
            <TextField
              label="Pesquisar Produto ou Localização"
              variant="outlined"
              size="small"
              value={searchTermProdutos}
              onChange={handleSearchChangeProdutos}
              sx={{ maxWidth: 300 }}
            />
          </Box>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Produto</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Quantidade
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Quantidade Mínima
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Localização</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProdutos.map((loc) => (
                    <TableRow
                      key={loc.id}
                      sx={{
                        bgcolor:
                          loc.quantidadeProduto <= loc.quantidadeMinimaProduto
                            ? 'error.main'
                            : 'inherit',
                        '&:hover': {
                          bgcolor:
                            loc.quantidadeProduto <= loc.quantidadeMinimaProduto
                              ? 'error.dark'
                              : 'action.hover',
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          color:
                            loc.quantidadeProduto <= loc.quantidadeMinimaProduto
                              ? 'white'
                              : 'inherit',
                        }}
                      >
                        {loc.nomeProduto}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            loc.quantidadeProduto <= loc.quantidadeMinimaProduto
                              ? 'white'
                              : 'inherit',
                        }}
                      >
                        {loc.quantidadeProduto}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            loc.quantidadeProduto <= loc.quantidadeMinimaProduto
                              ? 'white'
                              : 'inherit',
                        }}
                      >
                        {loc.quantidadeMinimaProduto}
                      </TableCell>
                      <TableCell
                        sx={{
                          color:
                            loc.quantidadeProduto <= loc.quantidadeMinimaProduto
                              ? 'white'
                              : 'inherit',
                        }}
                      >
                        {loc.nomeLocalizacao}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPagesProdutos}
                page={pageProdutos}
                onChange={handlePageChangeProdutos}
                color="primary"
                size="large"
                sx={{ '& .MuiPaginationItem-root': { fontSize: 16 } }}
              />
            </Box>
          </Paper>
        </CardContent>
      </Card>

      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              boxShadow: 4,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'medium', color: '#333', mb: 2 }}>
              Entradas de Estoque
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="Pesquisar Produto ou Funcionário"
                variant="outlined"
                size="small"
                value={searchTermEntradas}
                onChange={handleSearchChangeEntradas}
                sx={{ maxWidth: 300 }}
              />
              <TextField
                label="Data Início"
                type="date"
                variant="outlined"
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ maxWidth: 150 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Data Fim"
                type="date"
                variant="outlined"
                size="small"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ maxWidth: 150 }}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearchEntradas}
                sx={{ height: 36 }}
              >
                Filtrar
              </Button>
            </Box>
          </Box>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Produto</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#333' }}>
                      Quantidade
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                      Data de Entrada
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEntradas.map((entrada) => (
                    <TableRow key={entrada.id}>
                      <TableCell>{entrada.nomeProduto}</TableCell>
                      <TableCell align="right">{entrada.quantidadeRecebida}</TableCell>
                      <TableCell>{entrada.dataEntrada}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPagesEntradas}
                page={pageEntradas}
                onChange={handlePageChangeEntradas}
                color="primary"
                size="large"
                sx={{ '& .MuiPaginationItem-root': { fontSize: 16 } }}
              />
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
