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
import {
  getAllCashRegisters,
  getAllClients,
  getAllProducts,
  getReportData,
} from '../../api/methods';
import { Caixa, Cliente, Produto } from '../../types/models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Mapeamento dos tipos de relatório para endpoints
const reportTypeToEndpoint: { [key: string]: string } = {
  AtividadesCaixa: 'atividades-caixas',
  AtividadesDoDia: 'atividades-do-dia',
  EntradasEstoque: 'relatorio-entradas-estoque',
  RelatorioEstoque: 'relatorio-estoque',
  RelatorioLocalizacaoProdutos: 'relatorio-produto-localizacao',
  ProdutosMaisVendidos: 'produtos-mais-vendidos',
  RelatorioTransferencias: 'transferencias',
  FaturamentoPeriodo: 'faturamento-periodo',
  Vendas: 'relatorio-vendas',
  VendasPorCliente: 'vendas-cliente',
};

const Relatorio = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<string>('Vendas');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [productId, setProductId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [cashRegisterId, setCashRegisterId] = useState<string>('');
  const [limit, setLimit] = useState<string>('');
  const [cashRegisters, setCashRegisters] = useState<Caixa[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [products, setProducts] = useState<Produto[]>([]);
  const [usuarioId, setUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reportError, setReportError] = useState<string>('');
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
    const fetchLists = async () => {
      try {
        if (usuarioId) {
          if (reportType === 'AtividadesCaixa' || reportType === 'RelatorioCaixas') {
            const cashRegisterList = await getAllCashRegisters();
            setCashRegisters(cashRegisterList);
          }
          if (reportType === 'VendasPorCliente') {
            const clientList = await getAllClients();
            setClients(clientList);
          }
          if (
            [
              'AtividadesCaixa',
              'EntradasEstoque',
              'RelatorioEstoque',
              'RelatorioLocalizacaoProdutos',
              'Vendas',
            ].includes(reportType)
          ) {
            const productList = await getAllProducts();
            setProducts(productList);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar listas:', error);
        setReportError('Erro ao carregar opções. Tente novamente.');
      }
    };

    fetchLists();
  }, [reportType, usuarioId]);

  const handleReportTypeChange = (event: SelectChangeEvent<string>) => {
    setReportType(event.target.value);
    setStartDate('');
    setEndDate('');
    setDateError('');
    setProductId('');
    setClientId('');
    setCashRegisterId('');
    setLimit('');
    setReportData([]);
    setReportError('');
    setClients([]);
    setProducts([]);
    setCashRegisters([]);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = event.target.value;
    setStartDate(newStartDate);
    if (endDate && newStartDate && new Date(newStartDate) > new Date(endDate)) {
      setDateError('A data de início não pode ser maior que a data de fim');
    } else {
      setDateError('');
    }
    setReportData([]);
    setReportError('');
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = event.target.value;
    setEndDate(newEndDate);
    if (startDate && newEndDate && new Date(newEndDate) < new Date(startDate)) {
      setDateError('A data de fim não pode ser menor que a data de início');
    } else {
      setDateError('');
    }
    setReportData([]);
    setReportError('');
  };

  const handleCashRegisterChange = (event: SelectChangeEvent<string>) => {
    setCashRegisterId(event.target.value);
    setReportData([]);
    setReportError('');
  };

  const handleClientChange = (event: SelectChangeEvent<string>) => {
    setClientId(event.target.value);
    setReportData([]);
    setReportError('');
  };

  const handleProductChange = (event: SelectChangeEvent<string>) => {
    setProductId(event.target.value);
    setReportData([]);
    setReportError('');
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(event.target.value);
    setReportData([]);
    setReportError('');
  };

  const fetchReportData = async () => {
    try {
      setReportError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado.');
      }

      if (
        reportType !== 'AtividadesDoDia' &&
        reportType !== 'RelatorioCaixas' &&
        (!startDate || !endDate)
      ) {
        setReportError('Datas de início e fim são obrigatórias.');
        return;
      }

      if (reportType === 'AtividadesDoDia' && !startDate) {
        setReportError('Data é obrigatória.');
        return;
      }

      if (reportType === 'VendasPorCliente' && !clientId) {
        setReportError('Cliente é obrigatório.');
        return;
      }

      const endpoint = reportTypeToEndpoint[reportType];
      if (!endpoint) {
        throw new Error('Tipo de relatório não suportado.');
      }

      const queryParams = new URLSearchParams({
        ...(startDate && { dataInicio: startDate }),
        ...(endDate && { dataFim: endDate }),
        ...(reportType === 'AtividadesDoDia' && startDate && { data: startDate }),
        ...(productId && { idProduto: productId }),
        ...(clientId && { idCliente: clientId }),
        ...(cashRegisterId && { idCaixa: cashRegisterId }),
        ...(limit && { limite: limit }),
      });

      const response = await getReportData(endpoint, queryParams.toString());
      const data = response.data || [];
      setReportData(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setReportError(
        error instanceof Error ? error.message : 'Erro ao buscar os dados. Tente novamente.',
      );
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const reportTitle = reportType.replace(/([A-Z])/g, ' $1').trim();

      // Cabeçalho
      doc.setFontSize(20);
      doc.text(`Relatório: ${reportTitle}`, 14, 20);
      doc.setFontSize(12);
      if (startDate && endDate && reportType !== 'AtividadesDoDia') {
        doc.text(
          `Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`,
          14,
          30,
        );
      } else if (startDate && reportType === 'AtividadesDoDia') {
        doc.text(`Data: ${format(new Date(startDate), 'dd/MM/yyyy')}`, 14, 30);
      }
      doc.text(`Data de Emissão: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 40);

      if (reportData.length === 0) {
        setReportError('Nenhum dado disponível para gerar o PDF.');
        return;
      }

      // Configuração de tabelas por tipo de relatório
      let headers: string[] = [];
      let data: string[][] = [];

      switch (reportType) {
        case 'AtividadesCaixa':
          headers = ['Caixa', 'Quantidade Faturada', 'Funcionário', 'Vendas'];
          data = reportData.map((item) => [
            item.nomeCaixa || '-',
            item.quantidadeFaturada?.toFixed(2) || '0.00',
            item.funcionarioNome || '-',
            item.vendas
              ?.map((v: any) => `Doc: ${v.numeroDocumento}, Total: ${v.valorTotal?.toFixed(2)}`)
              .join('; ') || '-',
          ]);
          break;
        case 'AtividadesDoDia':
          headers = ['Tarefa', 'Descrição', 'Funcionário', 'Status', 'Data Criação'];
          data = reportData.map((item) => [
            item.nomeTarefa || '-',
            item.descricao || '-',
            item.funcionarioNome || '-',
            item.status || '-',
            item.dataCriacao ? format(new Date(item.dataCriacao), 'dd/MM/yyyy') : '-',
          ]);
          break;
        case 'EntradasEstoque':
          headers = ['Produto', 'Quantidade', 'Data Entrada', 'Fornecedor', 'Funcionário'];
          data = reportData.map((item) => [
            item.produtoNome || '-',
            item.quantidadeRecebida?.toString() || '0',
            item.dataEntrada ? format(new Date(item.dataEntrada), 'dd/MM/yyyy') : '-',
            item.fornecedorNome || '-',
            item.funcionarioNome || '-',
          ]);
          break;
        case 'RelatorioEstoque':
          headers = ['Produto', 'Quantidade Atual', 'Localizações'];
          data = reportData.map((item) => [
            item.nomeProduto || '-',
            item.quantidadeAtual?.toString() || '0',
            item.localizacoes
              ?.map(
                (loc: any) =>
                  `${loc.nome} (Seção: ${loc.seccao}, Corredor: ${loc.corredor}, Prateleira: ${loc.prateleira})`,
              )
              .join('; ') || '-',
          ]);
          break;
        case 'RelatorioLocalizacaoProdutos':
          headers = [
            'Produto',
            'Localização',
            'Seção',
            'Corredor',
            'Prateleira',
            'Quantidade',
            'Quantidade Mínima',
          ];
          data = reportData.map((item) => [
            item.nomeProduto || '-',
            item.localizacao?.nome || '-',
            item.localizacao?.seccao || '-',
            item.localizacao?.corredor || '-',
            item.localizacao?.prateleira || '-',
            item.localizacao?.quantidade?.toString() || '0',
            item.localizacao?.quantidadeMinima?.toString() || '0',
          ]);
          break;
        case 'ProdutosMaisVendidos':
          headers = ['Produto', 'Quantidade Vendida', 'Valor Total'];
          data = reportData.map((item) => [
            item.nomeProduto || '-',
            item.quantidadeVendida?.toString() || '0',
            item.valorTotal?.toFixed(2) || '0.00',
          ]);
          break;
        case 'RelatorioTransferencias':
          headers = ['Produto', 'Quantidade', 'Data Transferência', 'Localização', 'Funcionário'];
          data = reportData.map((item) => [
            item.nomeProduto || '-',
            item.quantidadeTransferida?.toString() || '0',
            item.dataTransferencia ? format(new Date(item.dataTransferencia), 'dd/MM/yyyy') : '-',
            item.nomeLocalizacao || '-',
            item.funcionarioNome || '-',
          ]);
          break;
        case 'FaturamentoPeriodo':
          headers = ['Total Faturado', 'Vendas'];
          data = [
            [
              reportData[0]?.totalFaturado?.toFixed(2) || '0.00',
              reportData[0]?.vendas
                ?.map((v: any) => `Doc: ${v.numeroDocumento}, Total: ${v.valorTotal?.toFixed(2)}`)
                .join('; ') || '-',
            ],
          ];
          break;
        case 'Vendas':
          headers = [
            'Documento',
            'Data Emissão',
            'Valor Total',
            'Cliente',
            'Caixa',
            'Funcionário',
            'Produtos',
          ];
          data = reportData.map((item) => [
            item.numeroDocumento || '-',
            item.dataEmissao ? format(new Date(item.dataEmissao), 'dd/MM/yyyy') : '-',
            item.valorTotal?.toFixed(2) || '0.00',
            item.cliente?.nomeCliente || '-',
            item.funcionarioCaixa?.nomeCaixa || '-',
            item.funcionarioCaixa?.funcionario?.nomeFuncionario || '-',
            item.produtos
              ?.map(
                (p: any) =>
                  `${p.nomeProduto} (Qtd: ${p.quantidadeVendida}, kzs${p.precoVenda?.toFixed(2)})`,
              )
              .join('; ') || '-',
          ]);
          break;
        case 'VendasPorCliente':
          headers = ['Documento', 'Data Emissão', 'Valor Total', 'Funcionário', 'Produtos'];
          data = reportData.map((item) => [
            item.numeroDocumento || '-',
            item.dataEmissao ? format(new Date(item.dataEmissao), 'dd/MM/yyyy') : '-',
            item.valorTotal?.toFixed(2) || '0.00',
            item.funcionarioNome || '-',
            item.vendasProdutos
              ?.map((p: any) => `${p.produtos?.nomeProduto} (Qtd: ${p.quantidadeVendida})`)
              .join('; ') || '-',
          ]);
          break;
      }

      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 50,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 100, 100] },
        columnStyles: { [headers.length - 1]: { cellWidth: 80 } },
      });

      doc.save(`relatorio_${reportTypeToEndpoint[reportType]}.pdf`);
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : 'Erro ao gerar o PDF. Tente novamente.',
      );
    }
  };

  const formatTableCell = (value: any): string => {
    if (value == null) return '-';
    if (value instanceof Date) return format(value, 'dd/MM/yyyy');
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'object') {
      if (value.nomeCliente) return value.nomeCliente;
      if (value.nomeProduto) return value.nomeProduto;
      if (value.nomeCaixa) return value.nomeCaixa;
      if (value.nomeFuncionario) return value.nomeFuncionario;
      if (Array.isArray(value)) {
        return value
          .map((item: any) =>
            item.nomeProduto
              ? `${item.nomeProduto} (Qtd: ${item.quantidadeVendida}, kzs${item.precoVenda?.toFixed(2)})`
              : JSON.stringify(item),
          )
          .join('; ');
      }
      return JSON.stringify(value);
    }
    return value.toString();
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

      {reportError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {reportError}
        </Alert>
      )}

      {!authError && !isLoading && usuarioId && (
        <>
          <Box sx={{ mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <FormControl sx={{ minWidth: 300 }}>
                <InputLabel>Tipo de Relatório</InputLabel>
                <Select value={reportType} onChange={handleReportTypeChange}>
                  <MenuItem value="AtividadesCaixa">Atividades do Caixa</MenuItem>
                  <MenuItem value="AtividadesDoDia">Atividades do Dia</MenuItem>
                  <MenuItem value="EntradasEstoque">Entradas do Estoque</MenuItem>
                  <MenuItem value="RelatorioEstoque">Relatório do Estoque</MenuItem>
                  <MenuItem value="RelatorioLocalizacaoProdutos">
                    Relatório de Localização de Produtos
                  </MenuItem>
                  <MenuItem value="ProdutosMaisVendidos">Produtos Mais Vendidos</MenuItem>
                  <MenuItem value="RelatorioTransferencias">Relatório por Transferências</MenuItem>
                  <MenuItem value="FaturamentoPeriodo">Faturamento por Período</MenuItem>
                  <MenuItem value="Vendas">Vendas</MenuItem>
                  <MenuItem value="VendasPorCliente">Vendas por Cliente</MenuItem>
                </Select>
              </FormControl>

              <TextField
                type="date"
                label={reportType === 'AtividadesDoDia' ? 'Data' : 'Data de Início'}
                value={startDate}
                onChange={handleStartDateChange}
                InputLabelProps={{ shrink: true }}
                sx={{ width: { xs: '100%', sm: 180 } }}
                error={!!dateError}
                required
              />
              {reportType !== 'AtividadesDoDia' && (
                <TextField
                  type="date"
                  label="Data de Fim"
                  value={endDate}
                  onChange={handleEndDateChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: { xs: '100%', sm: 180 } }}
                  error={!!dateError}
                  required
                />
              )}

              {reportType === 'AtividadesCaixa' && (
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

              {reportType === 'VendasPorCliente' && (
                <FormControl sx={{ width: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Cliente</InputLabel>
                  <Select value={clientId} onChange={handleClientChange} label="Cliente">
                    <MenuItem value="">
                      <em>Selecionar cliente</em>
                    </MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.nomeCliente}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {[
                'AtividadesCaixa',
                'EntradasEstoque',
                'RelatorioEstoque',
                'RelatorioLocalizacaoProdutos',
                'Vendas',
              ].includes(reportType) && (
                <FormControl sx={{ width: { xs: '100%', sm: 180 } }}>
                  <InputLabel>Produto</InputLabel>
                  <Select value={productId} onChange={handleProductChange} label="Produto">
                    <MenuItem value="">
                      <em>Todos os produtos</em>
                    </MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.nomeProduto}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {reportType === 'ProdutosMaisVendidos' && (
                <TextField
                  type="number"
                  label="Limite"
                  value={limit}
                  onChange={handleLimitChange}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Limite (opcional)"
                  sx={{ width: { xs: '100%', sm: 180 } }}
                  inputProps={{ min: 1, max: 1000 }}
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
                (reportType !== 'AtividadesDoDia' && (!startDate || !endDate || !!dateError)) ||
                (reportType === 'AtividadesDoDia' && !startDate) ||
                (reportType === 'VendasPorCliente' && !clientId)
              }
            >
              Buscar Dados
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={generatePDF}
              disabled={
                (reportType !== 'AtividadesDoDia' && (!startDate || !endDate || !!dateError)) ||
                (reportType === 'AtividadesDoDia' && !startDate) ||
                (reportType === 'VendasPorCliente' && !clientId) ||
                reportData.length === 0
              }
            >
              Gerar PDF
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
                      {Object.keys(reportData[0] || {})
                        .filter((key) => !key.toLowerCase().includes('id'))
                        .map((key) => (
                          <TableCell key={key}>{key.replace(/([A-Z])/g, ' $1').trim()}</TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.entries(row)
                          .filter(([key]) => !key.toLowerCase().includes('id'))
                          .map(([key, value]) => (
                            <TableCell key={key}>{formatTableCell(value)}</TableCell>
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
        </>
      )}
    </Paper>
  );
};

export default Relatorio;
