import { Avatar, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import avatar from 'assets/9706583.png';
import IconifyIcon from 'components/base/IconifyIcon';
import { MouseEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paths from 'routes/paths';

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar o token:', error);
    return null;
  }
};

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userData, setUserData] = useState<{
    id?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    morada?: string;
    role?: string;
    profilePic?: string;
  } | null>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        setUserData({
          id: decoded.id,
          nome: decoded.nome,
          email: decoded.email,
          telefone: decoded.telefone,
          morada: decoded.morada,
          role: decoded.role,
          profilePic: localStorage.getItem('profilePic') || undefined,
        });
        console.log('Decoded token:', decoded);
      }
    }
  }, []);

  const menuItems = [
    {
      id: 0,
      label: userData?.nome ? `Olá, ${userData.nome}` : 'Perfil',
      icon: 'material-symbols:person',
    },
    {
      id: 1,
      label: userData?.role || 'Função',
      icon: 'material-symbols:account-box-sharp',
    },
    {
      id: 2,
      label: 'Logout',
      icon: 'uiw:logout',
    },
  ];

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = async (itemId: number) => {
    if (itemId === 0 || itemId === 1) {
      navigate(paths.perfil, { state: { user: userData } });
    } else if (itemId === 2) {
      // Handle logout
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="account"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar sx={{ width: 40, height: 40 }} alt="avatar" src={userData?.profilePic || avatar} />
      </IconButton>

      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {menuItems.map((menuItem) => (
          <MenuItem key={menuItem.id} onClick={() => handleMenuItemClick(menuItem.id)}>
            <ListItemIcon>
              <IconifyIcon icon={menuItem.icon} />
            </ListItemIcon>
            <Typography variant="body2">{menuItem.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default AccountMenu;
