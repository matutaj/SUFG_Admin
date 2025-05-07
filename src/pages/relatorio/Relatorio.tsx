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
  Button,
  Stack,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { getAllCashRegisters } from '../../api/methods';
import { Caixa } from '../../types/models';
import axios, { AxiosError } from 'axios';

// Mapeamento ajustado para corresponder aos endpoints do backend
const reportTypeToEndpoint: { [key: string]: string } = {
  ListarVendasPorPeriodo: 'vendas-periodo',
  ListarVendasPorCliente: 'vendas-cliente',
  ListarProdutosMaisVendidos: 'produtos-mais-vendidos',
  ListarFaturamentoPorPeriodo: 'faturamento-periodo',
  ListarQuantidadeFaturadaPorCaixa: 'faturamento-caixa',
  ListarEstoqueAtual: 'estoque-atual',
  ListarEntradasEstoquePorPeriodo: 'entradas-estoque',
  ListarTransferenciasPorPeriodo: 'transferencias',
  ListarProdutosAbaixoMinimo: 'produtos-abaixo-minimo',
  ListarAtividadeFuncionariosCaixa: 'atividade-caixa',
  ListarPeriodoMaisVendidoPorProduto: 'periodo-mais-vendido',
  ListarAtividadesCaixas: 'atividades-caixas',
  ListarTarefas: 'tarefas',
  ListarRelatorioVendas: 'relatorio-vendas',
  ListarRelatorioEstoque: 'relatorio-estoque',
  ListarRelatorioEntradasEstoque: 'relatorio-entradas-estoque',
  ListarRelatorioProdutos: 'relatorio-produtos',
  ListarRelatorioProdutoLocalizacao: 'relatorio-produto-localizacao',
  ListarAtividadesDoDia: 'atividades-do-dia',
  ListarRelatorioCaixas: 'caixas',
};

const Relatorio = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<string>('ListarVendasPorPeriodo');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [cashRegisterId, setCashRegisterId] = useState<string>('');
  const [cashRegisters, setCashRegisters] = useState<Caixa[]>([]);
  const [usuarioId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);

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
    if (usuarioId && reportType === 'ListarRelatorioCaixas') {
      fetchCashRegisters();
    }
  }, [reportType, usuarioId]);

  useEffect(() => {
    if (
      usuarioId &&
      reportType &&
      (reportType === 'ListarRelatorioCaixas' ||
        reportType === 'ListarAtividadesDoDia' ||
        (startDate && endDate && !dateError))
    ) {
      fetchReportData();
    }
  }, [reportType, startDate, endDate, productId, clientId, cashRegisterId, usuarioId]);

  const fetchCashRegisters = async () => {
    try {
      const cashRegisterList = await getAllCashRegisters();
      setCashRegisters(cashRegisterList);
    } catch (error) {
      console.error('Erro ao buscar caixas:', error);
      setCashRegisters([]);
    }
  };

  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
    setStartDate('');
    setEndDate('');
    setDateError('');
    setProductId('');
    setClientId('');
    setCashRegisterId('');
    setPdfUrl('');
    setReportData([]);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = event.target.value;
    setStartDate(newStartDate);
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      setDateError('A data de início não pode ser maior que a data de fim');
    } else {
      setDateError('');
    }
    setPdfUrl('');
    setReportData([]);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = event.target.value;
    setEndDate(newEndDate);
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      setDateError('A data de fim não pode ser menor que a data de início');
    } else {
      setDateError('');
    }
    setPdfUrl('');
    setReportData([]);
  };

  const handleCashRegisterChange = (event: SelectChangeEvent<string>) => {
    setCashRegisterId(event.target.value);
    setPdfUrl('');
    setReportData([]);
  };

  const handleClientIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setClientId(event.target.value);
    setPdfUrl('');
    setReportData([]);
  };

  const handleProductIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProductId(event.target.value);
    setPdfUrl('');
    setReportData([]);
  };

  const fetchReportData = async () => {
    try {
      setPdfError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      if (
        reportType !== 'ListarRelatorioCaixas' &&
        reportType !== 'ListarAtividadesDoDia' &&
        (!startDate || !endDate)
      ) {
        return;
      }

      if (
        [
          'ListarPeriodoMaisVendidoPorProduto',
          'ListarAtividadesCaixas',
          'ListarRelatorioVendas',
          'ListarRelatorioEstoque',
          'ListarRelatorioEntradasEstoque',
          'ListarRelatorioProdutoLocalizacao',
        ].includes(reportType) &&
        !productId
      ) {
        return;
      }

      if (reportType === 'ListarVendasPorCliente' && !clientId) {
        return;
      }

      const endpoint = reportTypeToEndpoint[reportType];
      if (!endpoint) {
        throw new Error('Tipo de relatório não suportado.');
      }

      const queryParams = new URLSearchParams({
        ...(startDate && { dataInicio: startDate }),
        ...(endDate && { dataFim: endDate }),
        ...(productId && { idProduto: productId }),
        ...(clientId && { idCliente: clientId }),
        ...(cashRegisterId && { idCaixa: cashRegisterId }),
      });

      const url = `http://localhost:3333/relatorio/${endpoint}?${queryParams.toString()}`;
      console.log('Buscando dados JSON:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Dados recebidos:', response.data);
      const data = response.data.data || [];
      setReportData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      if (error instanceof AxiosError && error.response) {
        try {
          const errorData = (await error.response.data.text?.()) || error.response.data;
          setPdfError(errorData || 'Erro ao buscar os dados. Tente novamente.');
        } catch (jsonError) {
          setPdfError('Erro ao buscar os dados: resposta inválida do servidor.');
        }
      } else {
        setPdfError(
          error instanceof Error ? error.message : 'Erro ao buscar os dados. Tente novamente.',
        );
      }
    }
  };

  const exportPDF = async () => {
    try {
      setPdfError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      if (
        reportType !== 'ListarRelatorioCaixas' &&
        reportType !== 'ListarAtividadesDoDia' &&
        (!startDate || !endDate)
      ) {
        throw new Error('Datas de início e fim são obrigatórias.');
      }

      if (
        [
          'ListarPeriodoMaisVendidoPorProduto',
          'ListarAtividadesCaixas',
          'ListarRelatorioVendas',
          'ListarRelatorioEstoque',
          'ListarRelatorioEntradasEstoque',
          'ListarRelatorioProdutoLocalizacao',
        ].includes(reportType) &&
        !productId
      ) {
        throw new Error('ID do produto é obrigatório para este relatório.');
      }

      if (reportType === 'ListarVendasPorCliente' && !clientId) {
        throw new Error('ID do cliente é obrigatório para este relatório.');
      }

      const endpoint = reportTypeToEndpoint[reportType];
      if (!endpoint) {
        throw new Error('Tipo de relatório não suportado.');
      }

      const queryParams = new URLSearchParams({
        ...(startDate && { dataInicio: startDate }),
        ...(endDate && { dataFim: endDate }),
        ...(productId && { idProduto: productId }),
        ...(clientId && { idCliente: clientId }),
        ...(cashRegisterId && { idCaixa: cashRegisterId }),
        format: 'pdf',
      });

      const url = `http://localhost:3333/relatorio/${endpoint}?${queryParams.toString()}`;
      console.log('Exportando PDF:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        responseType: 'blob',
      });

      console.log('Resposta PDF:', response);

      const pdfBlob = response.data;
      const newPdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(newPdfUrl);

      const link = document.createElement('a');
      link.href = newPdfUrl;
      link.download = `relatorio_${endpoint}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      if (error instanceof AxiosError && error.response) {
        try {
          const errorData = (await error.response.data.text?.()) || error.response.data;
          setPdfError(errorData || 'Erro ao exportar o PDF. Tente novamente.');
        } catch (jsonError) {
          setPdfError('Erro ao exportar o PDF: resposta inválida do servidor.');
        }
      } else {
        setPdfError(
          error instanceof Error ? error.message : 'Erro ao exportar o PDF. Tente novamente.',
        );
      }
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      setPdfError('Nenhum PDF disponível para impressão.');
    }
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

      {pdfError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pdfError}
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
                  <MenuItem value="ListarTarefas">Tarefas</MenuItem>
                  <MenuItem value="ListarRelatorioVendas">Relatório de Vendas</MenuItem>
                  <MenuItem value="ListarRelatorioEstoque">Relatório de Estoque</MenuItem>
                  <MenuItem value="ListarRelatorioEntradasEstoque">
                    Relatório de Entradas de Estoque
                  </MenuItem>
                  <MenuItem value="ListarRelatorioProdutos">Relatório de Produtos</MenuItem>
                  <MenuItem value="ListarRelatorioProdutoLocalizacao">
                    Relatório de Localização de Produtos
                  </MenuItem>
                  <MenuItem value="ListarAtividadesDoDia">Atividades do Dia</MenuItem>
                  <MenuItem value="ListarRelatorioCaixas">Caixas</MenuItem>
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
                required={
                  reportType !== 'ListarAtividadesDoDia' && reportType !== 'ListarRelatorioCaixas'
                }
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
                required={
                  reportType !== 'ListarAtividadesDoDia' && reportType !== 'ListarRelatorioCaixas'
                }
              />

              {reportType === 'ListarRelatorioCaixas' && (
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

              {reportType === 'ListarVendasPorCliente' && (
                <TextField
                  label="ID do Cliente"
                  value={clientId}
                  onChange={handleClientIdChange}
                  sx={{ width: { xs: '100%', sm: 180 } }}
                  required
                />
              )}

              {[
                'ListarPeriodoMaisVendidoPorProduto',
                'ListarAtividadesCaixas',
                'ListarRelatorioVendas',
                'ListarRelatorioEstoque',
                'ListarRelatorioEntradasEstoque',
                'ListarRelatorioProdutoLocalizacao',
              ].includes(reportType) && (
                <TextField
                  label="ID do Produto"
                  value={productId}
                  onChange={handleProductIdChange}
                  sx={{ width: { xs: '100%', sm: 180 } }}
                  required
                />
              )}
            </Stack>
            {dateError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {dateError}
              </Alert>
            )}
          </Box>

          <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={fetchReportData}
              disabled={
                (reportType !== 'ListarRelatorioCaixas' &&
                  reportType !== 'ListarAtividadesDoDia' &&
                  (!startDate || !endDate || !!dateError)) ||
                (reportType === 'ListarVendasPorCliente' && !clientId) ||
                ([
                  'ListarPeriodoMaisVendidoPorProduto',
                  'ListarAtividadesCaixas',
                  'ListarRelatorioVendas',
                  'ListarRelatorioEstoque',
                  'ListarRelatorioEntradasEstoque',
                  'ListarRelatorioProdutoLocalizacao',
                ].includes(reportType) &&
                  !productId)
              }
            >
              Buscar Dados
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={exportPDF}
              disabled={
                (reportType !== 'ListarRelatorioCaixas' &&
                  reportType !== 'ListarAtividadesDoDia' &&
                  (!startDate || !endDate || !!dateError)) ||
                (reportType === 'ListarVendasPorCliente' && !clientId) ||
                ([
                  'ListarPeriodoMaisVendidoPorProduto',
                  'ListarAtividadesCaixas',
                  'ListarRelatorioVendas',
                  'ListarRelatorioEstoque',
                  'ListarRelatorioEntradasEstoque',
                  'ListarRelatorioProdutoLocalizacao',
                ].includes(reportType) &&
                  !productId) ||
                reportData.length === 0
              }
            >
              Exportar PDF
            </Button>
            <Button variant="contained" color="primary" onClick={handlePrint} disabled={!pdfUrl}>
              Imprimir
            </Button>
          </Stack>

          {reportData.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dados do Relatório
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {Object.keys(reportData[0] || {}).map((key) => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i}>{String(value)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" color="textSecondary">
                Nenhum dado disponível. Preencha os filtros e clique em "Buscar Dados".
              </Typography>
            </Box>
          )}

          {pdfUrl && (
            <Box
              sx={{
                mt: 3,
                width: '100%',
                height: '80vh',
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Visualização do Relatório
              </Typography>
              <iframe
                id="pdf-preview"
                src={pdfUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="PDF Preview"
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default Relatorio;
