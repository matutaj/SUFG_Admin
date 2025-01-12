import { Collapse, List } from '@mui/material';
import ProdutoTable from 'components/sections/dashboard/ProdutoTable';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const Produt = ({ open }: CollapsedItemProps) => {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <ProdutoTable />
      </List>
    </Collapse>
  );
};

export default Produt;
