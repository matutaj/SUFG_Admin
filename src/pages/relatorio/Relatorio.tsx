import { Collapse, List } from '@mui/material';
import { SubItem } from 'types/types';

interface CollapsedItemProps {
  subItems: SubItem[] | undefined;
  open: boolean;
}

const Relatorio = ({ open }: CollapsedItemProps) => {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <h3>Relatório</h3>
      </List>
    </Collapse>
  );
};

export default Relatorio;
