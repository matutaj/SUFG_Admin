import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
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

// Definição do esquema de validação
const schema = yup.object().shape({
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
});

interface LoginFormValues {
  email: string;
  password: string;
}

const checkBoxLabel = { inputProps: { 'aria-label': 'Checkbox' } };

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(schema), // Aplicando validação
  });

  const onSubmit: SubmitHandler<LoginFormValues> = (data) => console.log(data);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh', // 🔥 Centraliza verticalmente
        width: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ width: { xs: 1, sm: 506 }, px: { xs: 2, sm: 0 }, py: 10 }}>
        <Typography variant="h1">Bem-Vindo Ao SUFG</Typography>
        <Typography
          variant="subtitle1"
          component="p"
          sx={{
            color: 'neutral.main',
            mt: 2,
            mb: 6.75,
          }}
        >
          Não tenho conta?{' '}
          <Typography variant="button" component={Link} href={paths.signup} color="secondary">
            Criar Conta
          </Typography>
        </Typography>

        <Stack gap={1.75} mb={3} direction={{ xs: 'column', sm: 'row' }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<IconifyIcon icon="flat-color-icons:google" />}
            sx={{ width: { sm: 1 / 1 }, py: 2.375, px: 4.375 }}
          >
            Entra com Google
          </Button>
        </Stack>

        <Divider>or</Divider>

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
                />
              </Grid>

              <Grid item xs={12}>
                <InputLabel htmlFor="password">Password</InputLabel>
                <PasswordTextField
                  id="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  fullWidth
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              </Grid>
            </Grid>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3.75}>
            <FormControlLabel
              control={
                <Checkbox
                  {...checkBoxLabel}
                  sx={{
                    color: 'neutral.light',
                  }}
                  icon={<IconifyIcon icon="fluent:checkbox-unchecked-24-regular" />}
                  checkedIcon={<IconifyIcon icon="fluent:checkbox-checked-24-regular" />}
                />
              }
              label={
                <Typography variant="h6" component="p" sx={{ color: 'neutral.light' }}>
                  Remember me
                </Typography>
              }
            />

            <Typography variant="h6" component={Link} href="#!" color="secondary">
              Forgot your password?
            </Typography>
          </Stack>

          <Button
            variant="contained"
            type="submit"
            fullWidth
            color="secondary"
            sx={{ py: 2.25 }}
            disabled={!!errors.email || !!errors.password} // Desabilita se houver erros
          >
            <Typography
              variant="h4"
              component={Link}
              href={paths.dashboard}
              sx={{ color: 'HighlightText' }}
            >
              Sign in
            </Typography>
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
