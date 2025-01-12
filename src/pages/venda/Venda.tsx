import { Collapse, List } from '@mui/material';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const Venda = ({ open }: CollapsedItemProps) => {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <h2>venda</h2>
      </List>
    </Collapse>
  );
};

export default Venda;
