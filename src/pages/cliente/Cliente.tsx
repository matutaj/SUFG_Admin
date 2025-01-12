import { Collapse, List } from '@mui/material';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const Cliente = ({ open }: CollapsedItemProps) => {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <h2>Cliente</h2>
      </List>
    </Collapse>
  );
};

export default Cliente;
