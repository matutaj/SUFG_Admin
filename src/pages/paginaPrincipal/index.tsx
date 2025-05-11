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

const ITEMS_PER_PAGE = 10;

interface ProdutoLocalizacaoDisplay {
  id: string | undefined;
  nomeProduto: string;
  nomeLocalizacao: string;
  quantidadeProduto: number;
  quantidadeMinimaProduto: number;
}

interface EntradaEstoqueDisplay {
  id: string | undefined;
  nomeProduto: string;
  quantidadeRecebida: number;
  dataEntrada: string;
  nomeFuncionario: string;
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data in parallel
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

        // Create lookup maps
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

        // Map produtosLocalizacoes
        const produtosLocalizacoesMapped: ProdutoLocalizacaoDisplay[] = produtosLocalizacoes.map(
          (loc: ProdutoLocalizacao) => ({
            id: loc.id,
            nomeProduto: produtoMap.get(loc.id_produto) || 'Desconhecido',
            nomeLocalizacao: localizacaoMap.get(loc.id_localizacao) || 'Desconhecido',
            quantidadeProduto: loc.quantidadeProduto,
            quantidadeMinimaProduto: loc.quantidadeMinimaProduto,
          }),
        );

        // Map entradasEstoque
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
              nomeFuncionario: entrada.funcionarioNome || 'Desconhecido',
              lote: entrada.lote,
            };
          },
        );

        // Calculate faturamento por caixa
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

        // Count pending tasks
        const tarefasPendentes = atividades.filter(
          (atividade: AtividadeDoDia) => atividade.status === 'Pendente',
        ).length;

        setDashboardData({
          vendas,
          faturamentoPorCaixa,
          produtosLocalizacoes: produtosLocalizacoesMapped,
          entradasEstoque: entradasEstoqueMapped,
          tarefasPendentes,
        });

        // Processar faturamento por período
        processarFaturamentoPorPeriodo(vendas, periodoFaturamento);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      processarFaturamentoPorPeriodo(dashboardData.vendas, periodoFaturamento);
    }
  }, [periodoFaturamento, dashboardData]);

  const processarFaturamentoPorPeriodo = (vendas: Venda[], periodo: PeriodoFaturamento) => {
    const faturamentoMap = new Map<string, number>();
    const hoje = new Date();
    const nomesDiasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Inicializar períodos com zero
    if (periodo === 'dia') {
      // Últimos 7 dias
      for (let i = 6; i >= 0; i--) {
        const date = new Date(hoje);
        date.setDate(date.getDate() - i);
        const diaSemana = date.getDay(); // 0=Domingo, 1=Segunda, etc.
        faturamentoMap.set(nomesDiasSemana[diaSemana], 0);
      }
    } else if (periodo === 'mes') {
      // Semanas do mês atual
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      let semanaAtual = 1;
      for (let d = new Date(primeiroDiaMes); d <= ultimoDiaMes; d.setDate(d.getDate() + 1)) {
        const semana = Math.ceil((d.getDate() + primeiroDiaMes.getDay()) / 7);
        faturamentoMap.set(`Semana ${semana}`, 0);
      }
    } else if (periodo === 'ano') {
      // Meses do ano
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
    }

    // Preencher com valores reais
    vendas.forEach((venda) => {
      if (!venda.dataEmissao) return;

      const dataVenda = new Date(venda.dataEmissao);
      let chavePeriodo = '';

      switch (periodo) {
        case 'dia':
          const diaSemana = dataVenda.getDay();
          chavePeriodo = nomesDiasSemana[diaSemana];
          break;
        case 'mes':
          const semanaMes = Math.ceil(
            (dataVenda.getDate() +
              new Date(dataVenda.getFullYear(), dataVenda.getMonth(), 1).getDay()) /
              7,
          );
          chavePeriodo = `Semana ${semanaMes}`;
          break;
        case 'ano':
          chavePeriodo = dataVenda.toLocaleDateString('pt-AO', { month: 'long' });
          break;
      }

      if (faturamentoMap.has(chavePeriodo)) {
        const valorAtual = faturamentoMap.get(chavePeriodo) || 0;
        faturamentoMap.set(chavePeriodo, valorAtual + Number(venda.valorTotal || 0));
      }
    });

    const faturamentoArray: FaturamentoPorPeriodo[] = Array.from(faturamentoMap.entries())
      .map(([periodo, quantidadeFaturada]) => ({
        periodo,
        quantidadeFaturada,
      }))
      .sort((a, b) => {
        // Ordenar por ordem cronológica
        if (periodo === 'dia') {
          return nomesDiasSemana.indexOf(a.periodo) - nomesDiasSemana.indexOf(b.periodo);
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

  // Filter sales for the last 30 days
  const dateRangeEnd = new Date();
  const dateRangeStart = new Date(dateRangeEnd);
  dateRangeStart.setDate(dateRangeEnd.getDate() - 30);

  const vendasLast30Days = dashboardData.vendas.filter((venda) => {
    const vendaDate = new Date(venda.dataEmissao);
    return vendaDate >= dateRangeStart && vendaDate <= dateRangeEnd;
  });

  // Calculate metrics for summary cards
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

  // Filter products based on search term
  const filteredProdutos = dashboardData.produtosLocalizacoes.filter(
    (loc) =>
      loc.nomeProduto.toLowerCase().includes(searchTermProdutos.toLowerCase()) ||
      loc.nomeLocalizacao.toLowerCase().includes(searchTermProdutos.toLowerCase()),
  );

  // Filter entradas based on search term and date range
  const filteredEntradas = dashboardData.entradasEstoque.filter((entrada) => {
    const matchesSearch =
      entrada.nomeProduto.toLowerCase().includes(searchTermEntradas.toLowerCase()) ||
      entrada.nomeFuncionario.toLowerCase().includes(searchTermEntradas.toLowerCase());
    const entradaDate = new Date(entrada.dataEntrada.split('/').reverse().join('-')); // Assume DD/MM/YYYY
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const matchesDate = (!start || entradaDate >= start) && (!end || entradaDate <= end);
    return matchesSearch && matchesDate;
  });

  // Pagination logic
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

      {/* Summary Cards */}
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
            caption: 'Abaixo do mínimo',
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

      {/* Faturamento por Período */}
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
            <ToggleButtonGroup
              value={periodoFaturamento}
              exclusive
              onChange={handlePeriodoFaturamentoChange}
              aria-label="Período de faturamento"
            >
              <ToggleButton value="dia" aria-label="Dia">
                Dia da Semana
              </ToggleButton>
              <ToggleButton value="mes" aria-label="Mês">
                Semana do Mês
              </ToggleButton>
              <ToggleButton value="ano" aria-label="Ano">
                Mês do Ano
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff' }}>
            {faturamentoPorPeriodo.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={faturamentoPorPeriodo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 14, fill: '#555' }} />
                  <YAxis
                    tick={{ fontSize: 14, fill: '#555' }}
                    label={{
                      value: 'Valor (AOA)',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Período: ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 14, paddingTop: 10 }} />
                  <Bar
                    dataKey="quantidadeFaturada"
                    fill="#8884d8"
                    name="Valor Faturado"
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

      {/* Produtos por Localização */}
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

      {/* Entradas de Estoque */}
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
