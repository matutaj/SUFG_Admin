import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  Paper,
  Button,
  Stack,
  Typography,
  TextField,
  Box,
  Card,
  CardContent,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Collapse,
  Modal,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  SelectChangeEvent,
  Divider,
  Autocomplete,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import Delete from 'components/icons/factor/Delete';
import Edit from 'components/icons/factor/Edit';
import { SubItem } from 'types/types';
import {
  FuncionarioCaixa,
  Funcionario,
  Caixa,
  Venda,
  TipoDocumento,
  ProdutoLocalizacao,
  Localizacao,
  Produto,
  DadosWrapper,
  Cliente,
} from '../../types/models';
import {
  getAllEmployeeCashRegisters,
  createEmployeeCashRegister,
  updateEmployeeCashRegister,
  getAllEmployees,
  getAllCashRegisters,
  createSale,
  getAllSales,
  getAllProducts,
  getAllProductLocations,
  updateProductLocation,
  getAllLocations,
  updateProduct,
  updateStock,
  getStockByProduct,
  getAllClients,
} from '../../api/methods';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Fatura {
  id: number;
  cliente: string;
  nif: string;
  telefone: string;
  localizacao: string;
  email: string;
  data: string;
  status: string;
  produtos: { produto: Produto; quantidade: number }[];
  funcionariosCaixa?: FuncionarioCaixa;
}

interface CollapsedItemProps {
  subItems?: SubItem[];
  open: boolean;
}

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95vw', sm: '85vw', md: 900 },
  maxWidth: '100%',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  overflowY: 'auto' as const,
};

const Faturacao: React.FC<CollapsedItemProps> = ({ open }) => {
  const [openFaturaModal, setOpenFaturaModal] = useState(false);
  const [openCaixaModal, setOpenCaixaModal] = useState(false);
  const [openCaixaListModal, setOpenCaixaListModal] = useState(false);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [productLocations, setProductLocations] = useState<ProdutoLocalizacao[]>([]);
  const [locations, setLocations] = useState<Localizacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [faturaForm, setFaturaForm] = useState({
    cliente: '',
    nif: '',
    telefone: '',
    localizacao: '',
    email: '',
    data: '',
    status: 'Pendente',
    produtosSelecionados: [] as { id: string; quantidade: number }[],
    funcionariosCaixaId: '',
  });
  const [faturaErrors, setFaturaErrors] = useState<{ [key: string]: string }>({});

  const [caixaForm, setCaixaForm] = useState({
    funcionarioId: '',
    caixaId: '',
  });
  const [caixaErrors, setCaixaErrors] = useState<{ [key: string]: string }>({});

  const [funcionariosCaixa, setFuncionariosCaixa] = useState<FuncionarioCaixa[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [loggedInFuncionarioId, setLoggedInFuncionarioId] = useState<string>('');

  useEffect(() => {
    const id = localStorage.getItem('loggedInFuncionarioId') || '';
    setLoggedInFuncionarioId(id);
    setCaixaForm((prev) => ({ ...prev, funcionarioId: id }));
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          salesData,
          funcionariosCaixaData,
          funcionariosData,
          caixasData,
          locationsData,
          productsData,
          productLocationsData,
          clientsData,
        ] = await Promise.all([
          getAllSales(),
          getAllEmployeeCashRegisters(),
          getAllEmployees(),
          getAllCashRegisters(),
          getAllLocations(),
          getAllProducts(),
          getAllProductLocations(),
          getAllClients(),
        ]);

        setClientes(clientsData as Cliente[]);

        const mappedFaturas = salesData.map((venda: Venda, index: number) => {
          const cliente = clientsData.find((c: Cliente) => c.id === venda.id_cliente);
          return {
            id: index + 1,
            cliente: cliente ? cliente.nomeCliente : venda.id_cliente || 'Desconhecido',
            nif: cliente?.numeroContribuinte || venda.clientes?.numeroContribuinte || '',
            telefone: cliente?.telefoneCliente || venda.clientes?.telefoneCliente || '',
            localizacao: cliente?.moradaCliente || venda.clientes?.moradaCliente || '',
            email: cliente?.emailCliente || venda.clientes?.emailCliente || '',
            data: venda.dataEmissao.split('T')[0],
            status: 'Pendente',
            produtos:
              venda.vendasProdutos?.map((vp) => {
                const produto = productsData.find((p) => p.id === vp.id_produto);
                return {
                  produto: {
                    id: vp.id_produto,
                    id_categoriaProduto: produto?.id_categoriaProduto || '',
                    referenciaProduto: produto?.referenciaProduto || '',
                    nomeProduto: produto?.nomeProduto || '',
                    precoVenda: produto?.precoVenda || 0,
                    quantidadePorUnidade: produto?.quantidadePorUnidade || 0,
                    unidadeMedida: produto?.unidadeMedida || '',
                    unidadeConteudo: produto?.unidadeConteudo || '',
                  },
                  quantidade: vp.quantidadeVendida,
                };
              }) || [],
            funcionariosCaixa: venda.funcionariosCaixa,
          };
        });

        setFaturas(mappedFaturas);
        setFuncionariosCaixa(funcionariosCaixaData);
        setFuncionarios(funcionariosData);
        setCaixas(caixasData);
        setLocations(locationsData);
        setProdutos(productsData);
        setProductLocations(productLocationsData);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    fetchInitialData();
  }, [loggedInFuncionarioId]);

  const fetchProductsAndLocations = async () => {
    try {
      const [productsData, productLocationsData] = await Promise.all([
        getAllProducts(),
        getAllProductLocations(),
      ]);
      setProdutos(productsData);
      setProductLocations(productLocationsData);
    } catch (error) {
      console.error('Erro ao buscar produtos e localizações:', error);
    }
  };

  const handleOpenFaturaModal = () => setOpenFaturaModal(true);
  const handleCloseFaturaModal = () => {
    setOpenFaturaModal(false);
    resetFaturaForm();
  };

  const resetFaturaForm = () => {
    setFaturaForm({
      cliente: '',
      nif: '',
      telefone: '',
      localizacao: '',
      email: '',
      data: '',
      status: 'Pendente',
      produtosSelecionados: [],
      funcionariosCaixaId: '',
    });
    setFaturaErrors({});
  };

  const handleTextFieldChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFaturaForm((prev) => ({ ...prev, [name]: value }));
    setFaturaErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target as { name?: string; value: string };
    setFaturaForm((prev) => ({ ...prev, [name!]: value }));
    setFaturaErrors((prev) => ({ ...prev, [name!]: '' }));
  };

  const handleProdutoChange = (index: number, field: string, value: string | number) => {
    const updatedProdutos = [...faturaForm.produtosSelecionados];
    updatedProdutos[index] = { ...updatedProdutos[index], [field]: value };
    setFaturaForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));

    if (field === 'quantidade') {
      const produto = produtos.find((p) => p.id === updatedProdutos[index].id);
      const quantidade = Number(value);
      if (produto && quantidade > produto.quantidadePorUnidade) {
        setFaturaErrors((prev) => ({
          ...prev,
          [`produto_${index}`]: `Quantidade indisponível. Estoque total: ${produto.quantidadePorUnidade}`,
        }));
      } else {
        setFaturaErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`produto_${index}`];
          return newErrors;
        });
      }
    }
  };

  const adicionarNovoProdutoInput = () => {
    setFaturaForm((prev) => ({
      ...prev,
      produtosSelecionados: [...prev.produtosSelecionados, { id: '', quantidade: 1 }],
    }));
  };

  const removerProdutoInput = (index: number) => {
    const updatedProdutos = faturaForm.produtosSelecionados.filter((_, i) => i !== index);
    setFaturaForm((prev) => ({ ...prev, produtosSelecionados: updatedProdutos }));
    setFaturaErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`produto_${index}`];
      return newErrors;
    });
  };

  const calcularTotal = () => {
    return faturaForm.produtosSelecionados.reduce((acc, curr) => {
      const produto = produtos.find((p) => p.id === curr.id);
      return acc + (produto ? produto.precoVenda * curr.quantidade : 0);
    }, 0);
  };

  const validateFaturaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!faturaForm.cliente.trim()) newErrors.cliente = 'Nome do cliente é obrigatório';
    if (!faturaForm.data.trim()) newErrors.data = 'Data é obrigatória';
    if (faturaForm.produtosSelecionados.length === 0) {
      newErrors.produtos = 'Adicione pelo menos um produto';
    }
    if (!faturaForm.funcionariosCaixaId) {
      newErrors.funcionariosCaixaId = 'Selecione um caixa';
    } else if (
      !funcionariosCaixa.some((fc) => fc.id === faturaForm.funcionariosCaixaId && fc.estadoCaixa)
    ) {
      newErrors.funcionariosCaixaId = 'Nenhum caixa aberto disponível';
    }
    faturaForm.produtosSelecionados.forEach((p, index) => {
      if (!p.id) {
        newErrors[`produto_${index}`] = 'Selecione um produto';
      } else {
        const produto = produtos.find((prod) => prod.id === p.id);
        if (produto && p.quantidade > produto.quantidadePorUnidade) {
          newErrors[`produto_${index}`] =
            `Quantidade indisponível. Estoque total: ${produto.quantidadePorUnidade}`;
        }
      }
    });
    setFaturaErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePDF = (fatura: Fatura) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Configurações de fonte e cores
    doc.setFont('helvetica');
    const blueColor = '#1E90FF'; // Cor azul da imagem
    const blackColor = '#000000';

    // Cabeçalho
    doc.setFillColor(blueColor);
    doc.rect(0, 0, 210, 20, 'F'); // Retângulo azul no topo
    doc.setTextColor(blackColor);
    doc.setFontSize(18);
    doc.text('SISTEMA UNIFICADO DE FATURAÇÃO E GESTÃO', 105, 10, { align: 'center' }); // Nome centralizado
    doc.setFontSize(10);
    doc.text('Contato: lorem@empresa.com', 150, 15); // Contato
    doc.text('CNPJ: 00.000.000/0000-00', 150, 18);

    // Título e número da fatura
    doc.setFontSize(40);
    doc.text('Fatura.', 20, 30);
    doc.setFontSize(12);
    doc.text(`Fatura: 00-0000-0000`, 160, 30); // Substitua por fatura.id se disponível
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 160, 35);

    // Emitido Para e Valor Total
    doc.setFontSize(14);
    doc.text('CLIENTE', 20, 50);
    doc.setFontSize(12);
    doc.text(fatura.cliente, 20, 55);
    doc.text(`Tel: ${fatura.telefone || 'N/A'}`, 20, 60);
    doc.setFontSize(20);
    doc.text(`${calcularTotalFatura(fatura).toFixed(2)}`, 160, 55);
    doc.setFontSize(12);

    // Tabela de itens
    doc.setFontSize(12);
    doc.setFillColor(blueColor);
    doc.rect(10, 70, 190, 10, 'F'); // Cabeçalho da tabela
    doc.setTextColor(blackColor);
    doc.text('Descrição do Produto', 15, 76);
    doc.text('Qtd', 90, 76, { align: 'center' });
    doc.text('Preço', 130, 76, { align: 'center' });
    doc.text('Total', 170, 76, { align: 'center' });

    const produtosTable = fatura.produtos.map((p) => {
      const precoVenda = Number(p.produto.precoVenda) || 0; // Converte para número, usa 0 se inválido
      return [
        p.produto.nomeProduto || 'Produto sem nome',
        p.quantidade.toString(),
        `Kzs ${precoVenda.toFixed(2)}`,
        `Kzs ${(precoVenda * p.quantidade).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 80,
      head: [['', '', '', '']],
      body: produtosTable,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        textColor: blackColor,
      },
      columnStyles: {
        0: { cellWidth: 75 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
      },
      didDrawCell: (data) => {
        if (
          data.section === 'body' &&
          data.column.index === 0 &&
          data.cell.raw === fatura.produtos[0]?.produto.nomeProduto
        ) {
          doc.setFillColor(blueColor);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(blackColor);
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY;

    doc.setFontSize(12);
    doc.text('Subtotal', 130, finalY + 10);
    doc.text(`Kzs ${calcularTotalFatura(fatura).toFixed(2)}`, 170, finalY + 10, { align: 'right' });
    doc.text('Imposto', 130, finalY + 15);
    doc.text('Kzs 0.00', 170, finalY + 15, { align: 'right' }); // Ajuste conforme lógica de imposto
    doc.setFillColor(blueColor);
    doc.rect(10, finalY + 20, 190, 10, 'F');
    doc.setTextColor(blackColor);
    doc.text('Total', 130, finalY + 26);
    doc.text(`Kzs ${calcularTotalFatura(fatura).toFixed(2)}`, 170, finalY + 26, { align: 'right' });

    // Informações de pagamento
    doc.setFontSize(10);
    doc.text('Informação de pagamento', 20, finalY + 40);
    doc.text(
      'Se você tiver alguma dúvida sobre esta fatura, favor entrar em contato:',
      20,
      finalY + 45,
    );
    doc.setFillColor(blueColor);
    doc.rect(10, finalY + 50, 190, 10, 'F');
    doc.setTextColor(blackColor);
    doc.text('Tel: +00 0123 345', 20, finalY + 56);
    doc.text('sufggeral@gmail.com', 70, finalY + 56);
    doc.text('www.sufggeral.com', 120, finalY + 56);

    // Forçar download do PDF
    const pdfBlob = doc.output('blob');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(pdfBlob);
    link.download = `Fatura_${fatura.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onAddFaturaSubmit = async () => {
    if (!validateFaturaForm()) return;

    try {
      const dadosWrapper: DadosWrapper = {
        Dados: {
          dadosVenda: {
            dataEmissao: new Date(faturaForm.data),
            dataValidade: new Date(
              new Date(faturaForm.data).setDate(new Date(faturaForm.data).getDate() + 30),
            ),
            id_funcionarioCaixa: faturaForm.funcionariosCaixaId,
            numeroDocumento: `FAT-${Date.now()}`,
            tipoDocumento: TipoDocumento.FATURA,
            valorTotal: calcularTotal(),
            vendasProdutos: faturaForm.produtosSelecionados.map((p) => ({
              id_produto: p.id,
              quantidade: p.quantidade,
            })),
          },
          cliente: [
            {
              nomeCliente: faturaForm.cliente,
              numeroContribuinte: faturaForm.nif || '',
              telefoneCliente: faturaForm.telefone || '',
              moradaCliente: faturaForm.localizacao || '',
              emailCliente: faturaForm.email || '',
            },
          ],
        },
      };

      const createdVenda = await createSale(dadosWrapper);

      const lojaLocation = locations.find((loc) => isStoreLocation(loc.id, locations));
      if (lojaLocation) {
        for (const produtoSelecionado of faturaForm.produtosSelecionados) {
          const produtoLocation = productLocations.find(
            (loc) =>
              loc.id_produto === produtoSelecionado.id && loc.id_localizacao === lojaLocation.id,
          );

          if (produtoLocation && produtoLocation.id_produto) {
            const newQuantity =
              (produtoLocation.quantidadeProduto ?? 0) - produtoSelecionado.quantidade;
            if (newQuantity >= 0) {
              const updatedLocation: ProdutoLocalizacao = {
                ...produtoLocation,
                quantidadeProduto: newQuantity,
                id_produto: produtoLocation.id_produto,
              };
              await updateProductLocation(produtoLocation.id ?? '', updatedLocation);

              const armazemLocation = locations.find((loc) =>
                loc.nomeLocalizacao.toLowerCase().includes('armazém'),
              );
              const armazemProdutoLocation = armazemLocation
                ? productLocations.find(
                    (loc) =>
                      loc.id_produto === produtoSelecionado.id &&
                      loc.id_localizacao === armazemLocation.id,
                  )
                : null;

              const lojaQuantity = Number(produtoLocation.quantidadeProduto) || 0;
              const armazemQuantity = Number(armazemProdutoLocation?.quantidadeProduto) || 0;
              const estoqueGeral = lojaQuantity + armazemQuantity - produtoSelecionado.quantidade;

              // Buscar o estoque existente
              const existingStock = await getStockByProduct(produtoSelecionado.id);

              if (existingStock) {
                // Se o estoque existe, atualize apenas a quantidade, mantendo os outros campos
                const updatedStockData = {
                  id_produto: produtoSelecionado.id,
                  quantidadeAtual: estoqueGeral, // Atualiza apenas a quantidade
                  lote: existingStock.lote, // Mantém o lote existente
                  dataValidadeLote: existingStock.dataValidadeLote, // Mantém a data existente
                };

                await updateStock(existingStock.id!, updatedStockData);
              } else {
                // Se não houver estoque existente, lance um erro ou ignore (dependendo da lógica)
                throw new Error(
                  `Nenhum estoque encontrado para o produto ${produtoSelecionado.id}. Atualização não permitida.`,
                );
              }

              const produto = produtos.find((p) => p.id === produtoSelecionado.id);
              if (produto) {
                const updatedProduto: Produto = {
                  ...produto,
                  quantidadePorUnidade: estoqueGeral,
                };
                await updateProduct(produto.id!, updatedProduto);
              }
            } else {
              throw new Error(
                `Quantidade insuficiente na loja para o produto ${produtoSelecionado.id}`,
              );
            }
          } else {
            console.warn(
              `Localização do produto ${produtoSelecionado.id} não encontrada ou sem id_produto`,
            );
          }
        }
      }

      // Resto do código (criação da fatura, geração de PDF, etc.) permanece igual
      const novosProdutosFatura = faturaForm.produtosSelecionados.map((p) => {
        const produto = produtos.find((prod) => prod.id === p.id);
        return {
          produto: {
            id: produto!.id!,
            id_categoriaProduto: produto!.id_categoriaProduto,
            referenciaProduto: produto!.referenciaProduto,
            nomeProduto: produto!.nomeProduto,
            precoVenda: produto!.precoVenda,
            quantidadePorUnidade: produto!.quantidadePorUnidade - p.quantidade,
            unidadeMedida: produto!.unidadeMedida,
            unidadeConteudo: produto!.unidadeConteudo,
          },
          quantidade: p.quantidade,
        };
      });

      const newFatura: Fatura = {
        id: createdVenda.id ? Number(createdVenda.id) : faturas.length + 1,
        cliente: faturaForm.cliente,
        nif: faturaForm.nif,
        telefone: faturaForm.telefone,
        localizacao: faturaForm.localizacao,
        email: faturaForm.email,
        data: createdVenda.dataEmissao.split('T')[0],
        status: faturaForm.status,
        produtos: novosProdutosFatura,
        funcionariosCaixa: funcionariosCaixa.find(
          (fc) => fc.id === createdVenda.id_funcionarioCaixa,
        ),
      };

      setFaturas((prev) => [...prev, newFatura]);
      setProdutos((prev) =>
        prev.map((produto) => {
          const produtoSelecionado = faturaForm.produtosSelecionados.find(
            (p) => p.id === produto.id,
          );
          if (produtoSelecionado) {
            const lojaLoc = productLocations.find(
              (loc) => loc.id_produto === produto.id && loc.id_localizacao === lojaLocation?.id,
            );
            const armazemLoc = productLocations.find(
              (loc) =>
                loc.id_produto === produto.id &&
                loc.id_localizacao ===
                  locations.find((l) => l.nomeLocalizacao.toLowerCase().includes('armazém'))?.id,
            );
            const newStock =
              (lojaLoc?.quantidadeProduto ?? 0) + (armazemLoc?.quantidadeProduto ?? 0);
            return { ...produto, quantidadePorUnidade: newStock };
          }
          return produto;
        }),
      );
      generatePDF(newFatura);
      handleCloseFaturaModal();
      await fetchProductsAndLocations();

      // Atualiza a lista de clientes se um novo cliente foi criado
      const clienteExistente = clientes.find((c) => c.id === createdVenda.id_cliente);
      if (!clienteExistente && createdVenda.id_cliente) {
        const novoCliente: Cliente = {
          id: createdVenda.id_cliente,
          nomeCliente: faturaForm.cliente,
          numeroContribuinte: faturaForm.nif || '',
          telefoneCliente: faturaForm.telefone || '',
          moradaCliente: faturaForm.localizacao || '',
          emailCliente: faturaForm.email || '',
        };
        setClientes((prev) => [...prev, novoCliente]);
      }
    } catch (error) {
      console.error('Erro ao criar fatura:', error);
      alert('Falha ao cadastrar fatura. Verifique sua conexão ou tente novamente.');
    }
  };

  const excluirFatura = (faturaId: number) => {
    setFaturas((prev) => prev.filter((f) => f.id !== faturaId));
  };

  const editarFatura = (faturaId: number) => {
    const fatura = faturas.find((f) => f.id === faturaId);
    if (fatura) {
      setFaturaForm({
        cliente: fatura.cliente,
        nif: fatura.nif,
        telefone: fatura.telefone,
        localizacao: fatura.localizacao,
        email: fatura.email,
        data: fatura.data,
        status: fatura.status,
        produtosSelecionados: fatura.produtos.map((p) => ({
          id: p.produto.id!,
          quantidade: p.quantidade,
        })),
        funcionariosCaixaId: fatura.funcionariosCaixa?.id || '',
      });
      setOpenFaturaModal(true);
    }
  };

  const handleOpenCaixaModal = () => setOpenCaixaModal(true);
  const handleCloseCaixaModal = () => {
    setOpenCaixaModal(false);
  };

  const handleOpenCaixaListModal = () => setOpenCaixaListModal(true);
  const handleCloseCaixaListModal = () => setOpenCaixaListModal(false);

  const handleCaixaSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target as { name?: string; value: string };
    setCaixaForm((prev) => ({ ...prev, [name!]: value }));
    setCaixaErrors((prev) => ({ ...prev, [name!]: '' }));
  };

  const validateCaixaForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!caixaForm.funcionarioId) {
      newErrors.funcionarioId = 'Funcionário é obrigatório';
    } else if (!funcionarios.some((f) => f.id === caixaForm.funcionarioId)) {
      newErrors.funcionarioId = 'Funcionário não encontrado';
    }
    if (!caixaForm.caixaId) {
      newErrors.caixaId = 'Selecione um caixa';
    } else if (!caixas.some((c) => c.id === caixaForm.caixaId)) {
      newErrors.caixaId = 'Caixa não encontrado';
    }
    if (
      funcionariosCaixa.some(
        (fc) => fc.id_funcionario === caixaForm.funcionarioId && fc.estadoCaixa,
      )
    ) {
      newErrors.funcionarioId = 'Este funcionário já tem um caixa aberto';
    }
    setCaixaErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onAddCaixaSubmit = async () => {
    if (!validateCaixaForm()) return;

    try {
      const newFuncionarioCaixa: FuncionarioCaixa = {
        id_caixa: caixaForm.caixaId,
        id_funcionario: caixaForm.funcionarioId,
        estadoCaixa: true,
        quantidadaFaturada: 0,
        horarioAbertura: new Date(),
        horarioFechamento: null,
      };

      const createdCaixa = await createEmployeeCashRegister(newFuncionarioCaixa);
      setFuncionariosCaixa((prev) => [...prev, createdCaixa]);
      handleCloseCaixaModal();
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      alert('Falha ao abrir o caixa. Tente novamente.');
    }
  };

  const handleFecharCaixa = async (caixaId: string) => {
    try {
      const caixaAtual = funcionariosCaixa.find((c) => c.id === caixaId);
      if (!caixaAtual) {
        console.error('Caixa não encontrado para o ID:', caixaId);
        alert('Caixa não encontrado.');
        return;
      }

      // Verifica se horarioAbertura é válido
      if (!caixaAtual.horarioAbertura) {
        console.error('horarioAbertura inválido para o caixa:', caixaId);
        alert('Erro: Horário de abertura não definido.');
        return;
      }

      const faturasDoCaixa = faturas.filter((f) => {
        const dataFatura = new Date(f.data);
        const abertura = caixaAtual.horarioAbertura;
        const fechamento = caixaAtual.horarioFechamento
          ? new Date(caixaAtual.horarioFechamento)
          : new Date();
        return (
          f.funcionariosCaixa?.id === caixaId &&
          dataFatura >= abertura &&
          (!caixaAtual.horarioFechamento || dataFatura <= fechamento)
        );
      });

      const totalFaturado = faturasDoCaixa.reduce(
        (acc, fatura) => acc + calcularTotalFatura(fatura),
        0,
      );

      const updatedCaixa: FuncionarioCaixa = {
        ...caixaAtual,
        estadoCaixa: false,
        quantidadaFaturada: totalFaturado,
        horarioFechamento: new Date(),
      };

      console.log('Enviando para updateEmployeeCashRegister:', updatedCaixa);
      const response = await updateEmployeeCashRegister(caixaId, updatedCaixa);
      console.log('Resposta da API:', response);
      setFuncionariosCaixa((prev) => prev.map((c) => (c.id === caixaId ? response : c)));
      handleCloseCaixaListModal();
    } catch (error) {
      console.error('Erro ao fechar o caixa:', error);
      alert('Falha ao fechar o caixa. Verifique o console para mais detalhes.');
    }
  };

  const calcularTotalFatura = (fatura: Fatura) => {
    return fatura.produtos.reduce(
      (acc, curr) => acc + (Number(curr.produto.precoVenda) || 0) * curr.quantidade,
      0,
    );
  };

  const handleClientSelect = (_event: React.SyntheticEvent, newValue: string | Cliente | null) => {
    if (newValue) {
      if (typeof newValue === 'string') {
        setFaturaForm((prev) => ({
          ...prev,
          cliente: newValue,
          nif: '',
          telefone: '',
          localizacao: '',
          email: '',
        }));
      } else {
        setFaturaForm((prev) => ({
          ...prev,
          cliente: newValue.nomeCliente,
          nif: newValue.numeroContribuinte || '',
          telefone: newValue.telefoneCliente || '',
          localizacao: newValue.moradaCliente || '',
          email: newValue.emailCliente || '',
        }));
      }
      setFaturaErrors((prev) => ({ ...prev, cliente: '' }));
    } else {
      setFaturaForm((prev) => ({
        ...prev,
        cliente: '',
        nif: '',
        telefone: '',
        localizacao: '',
        email: '',
      }));
    }
  };

  return (
    <>
      <Paper sx={{ p: { xs: 1, sm: 2 }, width: '100%', borderRadius: 2 }}>
        <Collapse in={open}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1}
          >
            <Typography variant="h5" fontWeight="bold">
              Faturação (Vendas)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleOpenFaturaModal}
                startIcon={<IconifyIcon icon="heroicons-solid:plus" />}
                size="small"
                fullWidth
              >
                Nova Venda
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCaixaModal}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
                size="small"
                fullWidth
              >
                Abrir Caixa
              </Button>
              <Button
                variant="contained"
                color="info"
                onClick={handleOpenCaixaListModal}
                startIcon={<IconifyIcon icon="mdi:cash-register" />}
                size="small"
                fullWidth
              >
                Ver Caixas
              </Button>
            </Stack>
          </Stack>
        </Collapse>
      </Paper>

      {/* Modal de Nova Venda */}
      <Modal open={openFaturaModal} onClose={handleCloseFaturaModal}>
        <Box sx={modalStyle}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
            Nova Venda (Loja)
          </Typography>
          <Stack spacing={3}>
            <Divider sx={{ borderColor: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
              Dados do Cliente
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.nomeCliente
                  }
                  onChange={handleClientSelect}
                  value={
                    clientes.find((c) => c.nomeCliente === faturaForm.cliente) ||
                    (faturaForm.cliente ? faturaForm.cliente : null)
                  }
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      variant="outlined"
                      label="Selecione ou Digite Cliente"
                      error={Boolean(faturaErrors.cliente)}
                      helperText={faturaErrors.cliente}
                      sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                      onChange={(e) => {
                        setFaturaForm((prev) => ({
                          ...prev,
                          cliente: e.target.value,
                        }));
                        setFaturaErrors((prev) => ({ ...prev, cliente: '' }));
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="nif"
                  label="NIF/BI"
                  value={faturaForm.nif}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="telefone"
                  label="Telefone"
                  type="tel"
                  value={faturaForm.telefone}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="localizacao"
                  label="Localização"
                  value={faturaForm.localizacao}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="email"
                  label="Email"
                  type="email"
                  value={faturaForm.email}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
              Dados da Venda
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="data"
                  type="date"
                  label="Data"
                  value={faturaForm.data}
                  onChange={handleTextFieldChange}
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(faturaErrors.data)}
                  helperText={faturaErrors.data}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  name="status"
                  label="Status"
                  value={faturaForm.status}
                  onChange={handleTextFieldChange}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={Boolean(faturaErrors.funcionariosCaixaId)}
                  sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                >
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="funcionariosCaixaId"
                    value={faturaForm.funcionariosCaixaId}
                    onChange={handleSelectChange}
                  >
                    {funcionariosCaixa
                      .filter((fc) => fc.estadoCaixa)
                      .map((fc) => (
                        <MenuItem key={fc.id} value={fc.id}>
                          {fc.caixas?.nomeCaixa} - {fc.funcionarios?.nomeFuncionario || 'N/A'}
                        </MenuItem>
                      ))}
                  </Select>
                  {faturaErrors.funcionariosCaixaId && (
                    <FormHelperText>{faturaErrors.funcionariosCaixaId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Typography variant="h6" color="text.secondary">
              Produtos
            </Typography>
            {faturaForm.produtosSelecionados.map((produto, index) => (
              <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={5}>
                  <FormControl
                    fullWidth
                    variant="outlined"
                    error={Boolean(faturaErrors[`produto_${index}`])}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    <InputLabel>Produto</InputLabel>
                    <Select
                      value={produto.id}
                      onChange={(e) => handleProdutoChange(index, 'id', e.target.value)}
                    >
                      {produtos.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.nomeProduto} - {p.precoVenda}kzs (Estoque: {p.quantidadePorUnidade})
                        </MenuItem>
                      ))}
                    </Select>
                    {faturaErrors[`produto_${index}`] && (
                      <FormHelperText>{faturaErrors[`produto_${index}`]}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={8} sm={4} md={5}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    label="Quantidade"
                    value={produto.quantidade}
                    onChange={(e) =>
                      handleProdutoChange(index, 'quantidade', parseInt(e.target.value) || 1)
                    }
                    inputProps={{ min: 1 }}
                    error={Boolean(faturaErrors[`produto_${index}`])}
                    helperText={faturaErrors[`produto_${index}`]}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  />
                </Grid>
                <Grid item xs={4} sm={2} md={2}>
                  <IconButton color="error" onClick={() => removerProdutoInput(index)}>
                    <Delete />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            {faturaErrors.produtos && (
              <Typography color="error" variant="body2">
                {faturaErrors.produtos}
              </Typography>
            )}

            <Divider sx={{ borderColor: 'primary.main' }} />
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                color="primary"
                onClick={adicionarNovoProdutoInput}
                startIcon={<IconifyIcon icon="mdi:plus" />}
                sx={{ borderRadius: 1 }}
              >
                Adicionar Produto
              </Button>
              <Typography variant="h6" color="text.primary">
                Total a Pagar: {calcularTotal()} Kz
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={onAddFaturaSubmit}
                sx={{ borderRadius: 1, px: 4 }}
              >
                Finalizar Venda
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {/* Modal de Abrir Caixa */}
      <Modal open={openCaixaModal} onClose={handleCloseCaixaModal}>
        <Box sx={modalStyle}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
            Abrir Novo Caixa
          </Typography>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={Boolean(caixaErrors.funcionarioId)}
                >
                  <InputLabel>Funcionário</InputLabel>
                  <Select
                    name="funcionarioId"
                    value={caixaForm.funcionarioId}
                    onChange={handleCaixaSelectChange}
                    disabled={!!loggedInFuncionarioId}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    {funcionarios.map((funcionario) => (
                      <MenuItem key={funcionario.id} value={funcionario.id}>
                        {funcionario.nomeFuncionario}
                      </MenuItem>
                    ))}
                  </Select>
                  {caixaErrors.funcionarioId && (
                    <FormHelperText>{caixaErrors.funcionarioId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" error={Boolean(caixaErrors.caixaId)}>
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    name="caixaId"
                    value={caixaForm.caixaId}
                    onChange={handleCaixaSelectChange}
                    sx={{ bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    {caixas.map((caixa) => (
                      <MenuItem key={caixa.id} value={caixa.id}>
                        {caixa.nomeCaixa}
                      </MenuItem>
                    ))}
                  </Select>
                  {caixaErrors.caixaId && <FormHelperText>{caixaErrors.caixaId}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>
            <Button
              variant="contained"
              color="primary"
              onClick={onAddCaixaSubmit}
              sx={{ alignSelf: 'flex-end', borderRadius: 1 }}
            >
              Abrir Caixa
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Modal de Lista de Caixas */}
      <Modal open={openCaixaListModal} onClose={handleCloseCaixaListModal}>
        <Box sx={modalStyle}>
          <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
            Caixas Abertos
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Funcionário</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Quantidade Faturada</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {funcionariosCaixa.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.caixas?.nomeCaixa || 'N/A'}</TableCell>
                    <TableCell>{item.funcionarios?.nomeFuncionario || 'N/A'}</TableCell>
                    <TableCell>{item.estadoCaixa ? 'Aberto' : 'Fechado'}</TableCell>
                    <TableCell>{item.quantidadaFaturada} kz</TableCell>
                    <TableCell>
                      {item.estadoCaixa && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleFecharCaixa(item.id!)}
                          size="small"
                        >
                          Fechar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Modal>

      <Card sx={{ mt: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Caixa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {faturas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.cliente}</TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(item.data))}
                    </TableCell>
                    <TableCell>{calcularTotalFatura(item)}kzs</TableCell>
                    <TableCell>{item.funcionariosCaixa?.caixas?.nomeCaixa || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          color="primary"
                          onClick={() => editarFatura(item.id)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => excluirFatura(item.id)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => generatePDF(item)}
                          size="small"
                        >
                          <IconifyIcon icon="mdi:file-pdf" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );
};

export default Faturacao;

function isStoreLocation(id_localizacao: string | undefined, locations: Localizacao[]): boolean {
  if (!id_localizacao) return false;
  return locations.some(
    (loc) => loc.id === id_localizacao && loc.nomeLocalizacao.toLowerCase().includes('loja'),
  );
}
