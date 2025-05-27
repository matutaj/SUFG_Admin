import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import PasswordTextField from 'components/common/PasswordTextField';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import paths from 'routes/paths';

import { login } from '../../api/methods';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from 'components/icons/common/Logo';

// Esquema de validação
const schema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
});

interface LoginFormValues {
  email: string;
  password: string; // Alterado de senha para password
}

const checkBoxLabel = { inputProps: { 'aria-label': 'Checkbox' } };

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(schema),
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      navigate(paths.dashboard);
    }
  }, [navigate]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await login({ email: data.email, senha: data.password });

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', response.result.token);

      navigate(paths.dashboard);
    } catch (error) {
      setErrorMessage('Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ width: { xs: 1, sm: 506 }, px: { xs: 2, sm: 0 }, py: 10 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center">
          <IconButton color="inherit" aria-label="logo">
            <Logo sx={{ fontSize: 107 }} />
          </IconButton>
          <Typography variant="h1">S . U . F . G</Typography>
        </Box>

        <Divider></Divider>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Paper sx={(theme) => ({ padding: theme.spacing(2.5), my: 3, boxShadow: 1 })}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <InputLabel htmlFor="email">Email</InputLabel>
                <TextField
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  fullWidth
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12}>
                <InputLabel htmlFor="password">Senha</InputLabel>
                <PasswordTextField
                  id="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  fullWidth
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>
          </Paper>

          {errorMessage && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {errorMessage}
            </Typography>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3.75}>
            <FormControlLabel
              control={
                <Checkbox
                  {...checkBoxLabel}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{ color: 'neutral.light' }}
                  icon={<IconifyIcon icon="fluent:checkbox-unchecked-24-regular" />}
                  checkedIcon={<IconifyIcon icon="fluent:checkbox-checked-24-regular" />}
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="h6" component="p" sx={{ color: 'neutral.light' }}>
                  Lembre me
                </Typography>
              }
            />

            <Typography variant="h6" component={Link} href="#!" color="secondary">
              Esqueceu a senha?
            </Typography>
          </Stack>

          <Button
            variant="contained"
            type="submit"
            fullWidth
            color="secondary"
            sx={{ py: 2.25 }}
            disabled={!!errors.email || !!errors.password || isLoading}
          >
            <Typography variant="h4" sx={{ color: 'HighlightText' }}>
              {isLoading ? 'Entrando ...' : 'Entrar'}
            </Typography>
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
