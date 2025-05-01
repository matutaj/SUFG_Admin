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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material';
import { getAllCashRegisters } from '../../api/methods';
import { Caixa } from '../../types/models';
import axios, { AxiosError } from 'axios';

// Mapeamento dos tipos de relatórios para endpoints do back-end
const reportTypeToEndpoint: { [key: string]: string } = {
  ListarVendasPorPeriodo: '/relatorio/vendas-periodo',
  ListarProdutosMaisVendidos: '/relatorio/produtos-mais-vendidos',
  ListarFaturamentoPorPeriodo: '/relatorio/faturamento-periodo',
  ListarQuantidadeFaturadaPorCaixa: '/relatorio/faturamento-caixa',
  ListarCaixas: '/relatorio/caixas',
  ListarTransferenciasPorPeriodo: '/relatorio/transferencias',
  ListarProdutosAbaixoMinimo: '/relatorio/produtos-abaixo-minimo',
  ListarAtividadeFuncionariosCaixa: '/relatorio/atividade-caixa',
  ListarPeriodoMaisVendidoPorProduto: '/relatorio/periodo-mais-vendido',
  ListarAtividadesCaixas: '/relatorio/atividades-caixas',
  ListarRelatorioProdutos: '/relatorio/relatorio-produtos',
  ListarRelatorioProdutoLocalizacao: '/relatorio/relatorio-produto-localizacao',
  ListarAtividadesDoDia: '/relatorio/atividades-do-dia',
};

const Relatorio = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<string>('ListarVendasPorPeriodo');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [cashRegisterId, setCashRegisterId] = useState<string>('');
  const [cashRegisters, setCashRegisters] = useState<Caixa[]>([]);
  const [usuarioId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfError, setPdfError] = useState<string>('');

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
    if (usuarioId && reportType === 'ListarCaixas') {
      fetchCashRegisters();
    }
  }, [reportType, usuarioId]);

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
    setCashRegisterId('');
    setPdfUrl('');
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
  };

  const handleCashRegisterChange = (event: SelectChangeEvent<string>) => {
    setCashRegisterId(event.target.value);
    setPdfUrl('');
  };

  const exportPDF = async () => {
    try {
      setPdfError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      // Validar datas obrigatórias
      if (!startDate || !endDate) {
        throw new Error('Datas de início e fim são obrigatórias.');
      }

      // Validar idProduto para relatórios específicos
      if (
        [
          'ListarPeriodoMaisVendidoPorProduto',
          'ListarAtividadesCaixas',
          'ListarRelatorioProdutoLocalizacao',
        ].includes(reportType) &&
        !productId
      ) {
        throw new Error('ID do produto é obrigatório para este relatório.');
      }

      let endpoint = reportTypeToEndpoint[reportType];
      const body: any = {
        dataInicio: startDate, // String YYYY-MM-DD
        dataFim: endDate, // String YYYY-MM-DD
      };

      // Adicionar idProduto ao body
      if (productId) {
        body.idProduto = productId;
      }

      // Adicionar idCaixa ao body
      if (cashRegisterId) {
        body.idCaixa = cashRegisterId;
      }

      // Ajustar endpoint para parâmetros na URL
      if (productId && reportType === 'ListarPeriodoMaisVendidoPorProduto') {
        endpoint = `${endpoint}/${productId}`;
        delete body.idProduto; // Remover do body, pois está na URL
      }
      if (cashRegisterId && reportType === 'ListarCaixas') {
        endpoint = `${endpoint}/${cashRegisterId}`;
        delete body.idCaixa; // Remover do body, pois está na URL
      }

      if (!endpoint) {
        throw new Error('Tipo de relatório não suportado.');
      }

      console.log('Enviando requisição POST:', { endpoint, body });

      const response = await axios.get(`http://localhost:3333${endpoint}`, body);

      const pdfBlob = response.data;
      const newPdfUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(newPdfUrl);

      // Download do PDF
      const link = document.createElement('a');
      link.href = newPdfUrl;
      link.download = `relatorio_${reportType}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revogar URLs antigas
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {
      console.error('Erro ao buscar PDF:', error);
      if (error instanceof AxiosError && error.response && error.response.data) {
        try {
          const errorData = await new Response(error.response.data).json();
          setPdfError(errorData.message || 'Erro ao buscar o PDF. Tente novamente.');
        } catch (jsonError) {
          setPdfError('Erro ao buscar o PDF: resposta inválida do servidor.');
        }
      } else {
        setPdfError(
          error instanceof Error ? error.message : 'Erro ao buscar o PDF. Tente novamente.',
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
                required
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
                required
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
              onClick={exportPDF}
              disabled={
                !startDate ||
                !endDate ||
                !!dateError ||
                ([
                  'ListarPeriodoMaisVendidoPorProduto',
                  'ListarAtividadesCaixas',
                  'ListarRelatorioProdutoLocalizacao',
                ].includes(reportType) &&
                  !productId)
              }
            >
              Exportar PDF
            </Button>
            <Button variant="contained" color="primary" onClick={handlePrint} disabled={!pdfUrl}>
              Imprimir
            </Button>
          </Stack>

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
