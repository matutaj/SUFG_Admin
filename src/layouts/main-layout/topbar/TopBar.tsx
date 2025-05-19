import {
  AppBar,
  IconButton,
  Link,
  Stack,
  Toolbar,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import AccountMenu from './AccountMenu';
import LanguagePopover from './LanguagePopover';
import OutlinedBadge from 'components/styled/OutlinedBadge';
import { rootPaths } from 'routes/paths';
import Logo from 'components/icons/common/Logo';
import ElevationScroll from './ElevationScroll';
import Search from 'components/icons/common/Search';
import Notification from 'components/icons/appbar/Notification';
import { useNotifications } from '../../../NotificationContext';
import { useState } from 'react';

interface TopBarProps {
  drawerWidth: number;
  onHandleDrawerToggle: () => void;
}

const TopBar = ({ drawerWidth, onHandleDrawerToggle }: TopBarProps) => {
  const { notifications, removeNotification } = useNotifications(); // Use o contexto
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleClearNotification = (id: string) => {
    removeNotification(id);
  };

  return (
    <ElevationScroll>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth + 1}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'end' }}>
          <Stack
            direction="row"
            alignItems="center"
            columnGap={{ xs: 1, sm: 2 }}
            sx={{ display: { md: 'none' } }}
          >
            <Link href={rootPaths.root}>
              <IconButton color="inherit" aria-label="logo">
                <Logo sx={{ fontSize: 27 }} />
              </IconButton>
            </Link>

            <IconButton color="inherit" aria-label="open drawer" onClick={onHandleDrawerToggle}>
              <IconifyIcon icon="mdi:hamburger-menu" />
            </IconButton>
          </Stack>

          <Stack direction="row" alignItems="center" columnGap={{ xs: 1, sm: 2, md: 3 }}>
            <IconButton
              aria-label="notifications"
              color="inherit"
              onClick={handleOpenNotifications}
            >
              <OutlinedBadge
                badgeContent={notifications.length > 0 ? notifications.length : ' '}
                color="error"
                variant={notifications.length > 0 ? 'standard' : 'dot'}
                overlap="circular"
              >
                <Notification />
              </OutlinedBadge>
            </IconButton>
            <AccountMenu />
          </Stack>
        </Toolbar>

        {/* Popover para exibir notificações */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseNotifications}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, minWidth: 300, maxHeight: 400, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Notificações ({notifications.length})
            </Typography>
            {notifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma notificação
              </Typography>
            ) : (
              <List>
                {notifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleClearNotification(notification.id)}
                      >
                        <IconifyIcon icon="mdi:close" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={notification.message}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Popover>
      </AppBar>
    </ElevationScroll>
  );
};

export default TopBar;
