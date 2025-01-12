import { GridColDef } from '@mui/x-data-grid';

interface IProdutoData {
  id: number;
  description: string;
  data: string;
  Validade: string;
  fornecedor: string;
  quantidade: number;
}

export const columns: GridColDef<(typeof rows)[number]>[] = [
  {
    field: 'description',
    headerName: 'Nome do Produto',
    flex: 1.5,
    minWidth: 200,
  },
  {
    field: 'data',
    headerName: 'data de Cadastro',
    flex: 1,
    minWidth: 150,
    sortable: false,
  },
  {
    field: 'Validade',
    headerName: 'Validade',
    flex: 1,
    minWidth: 150,
    sortable: false,
  },
  {
    field: 'fornecedor',
    headerName: 'Fornecedor',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'quantidade',
    headerName: 'Quantidade',
  },
];

export const rows: IProdutoData[] = [
  {
    id: 1,
    description: 'Urgent Safety Recall',
    data: '06/04/2022',
    Validade: '08/04/2022',
    fornecedor: 'David Demo',
    quantidade: 29,
  },
  {
    id: 2,
    description: 'Maintenance Checkup',
    data: '12/04/2022',
    Validade: '15/04/2022',
    fornecedor: 'John Smith',
    quantidade: 40,
  },
  {
    id: 3,
    description: 'Oil Change',
    data: '18/04/2022',
    Validade: '20/04/2022',
    fornecedor: 'Emma Johnson',
    quantidade: 50,
  },
  {
    id: 4,
    description: 'Tire Replacement',
    data: '25/04/2022',
    Validade: '27/04/2022',
    fornecedor: 'Sophia Brown',
    quantidade: 35,
  },
  {
    id: 5,
    description: 'Brake Inspection',
    data: '30/04/2022',
    Validade: '02/05/2022',
    fornecedor: 'James Wilson',
    quantidade: 54,
  },
  {
    id: 6,
    description: 'Annual Health Checkup',
    data: '10/05/2022',
    Validade: '12/05/2022',
    fornecedor: 'Emily Taylor',
    quantidade: 100,
  },
  {
    id: 7,
    description: 'Dentist Appointment',
    data: '15/05/2022',
    Validade: '18/05/2022',
    fornecedor: 'Michael Brown',
    quantidade: 89,
  },
  {
    id: 8,
    description: 'Home Maintenance',
    data: '20/05/2022',
    Validade: '22/05/2022',
    fornecedor: 'Olivia Martinez',
    quantidade: 90,
  },
  {
    id: 9,
    description: 'Grocery Shopping',
    data: '25/05/2022',
    Validade: '27/05/2022',
    fornecedor: 'Daniel Johnson',
    quantidade: 70,
  },
  {
    id: 10,
    description: 'Travel Planning',
    data: '30/05/2022',
    Validade: '01/06/2022',
    fornecedor: 'Ava Wilson',
    quantidade: 9,
  },
  {
    id: 11,
    description: 'Financial Audit',
    data: '05/06/2022',
    Validade: '08/06/2022',
    fornecedor: 'Noah Garcia',
    quantidade: 98,
  },
  {
    id: 12,
    description: 'Project Deadline',
    data: '10/06/2022',
    Validade: '12/06/2022',
    fornecedor: 'Isabella Smith',
    quantidade: 34,
  },
];
