import { Link, List, Stack, Toolbar, Typography } from '@mui/material';
import { drawerItems, DrawerItem } from 'data/drawerItems';
import Logo from 'components/icons/common/Logo';
import paths from 'routes/paths';
import DrawerListItem from './DrawerListItem';
import { useEffect, useState } from 'react';
import { filterDrawerItems } from '../../../api/authUtils';
import LinearLoader from 'components/loading/LinearLoader';

const DrawerList = () => {
  const [filteredItems, setFilteredItems] = useState<DrawerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilteredItems = async () => {
      try {
        setLoading(true);
        const items = await filterDrawerItems(drawerItems);
        console.log('[DrawerList] Itens filtrados:', items);
        setFilteredItems(items);
      } catch (error) {
        console.error('[DrawerList] Erro ao carregar itens filtrados:', error);
        setFilteredItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadFilteredItems();
  }, []);

  return (
    <div>
      <Toolbar disableGutters>
        <Stack
          component={Link}
          href={paths.dashboard}
          direction="row"
          alignItems="center"
          columnGap={1.5}
        >
          <Logo sx={{ fontSize: 27 }} />
          <Typography variant="h2" component="h1" sx={{ color: 'neutral.darker' }}>
            SUFG
          </Typography>
        </Stack>
      </Toolbar>

      <Stack
        sx={(theme) => ({
          height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
          p: theme.spacing(2, 3),
          justifyContent: 'space-between',
          overflowY: 'auto',
        })}
      >
        {loading ? (
          <LinearLoader />
        ) : (
          <>
            <List sx={{ pt: 0 }}>
              {filteredItems.slice(0).map((drawerItem) => (
                <DrawerListItem key={drawerItem.id} item={drawerItem} />
              ))}
            </List>

      
          </>
        )}
      </Stack>
    </div>
  );
};

export default DrawerList;
