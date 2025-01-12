import { Grid } from '@mui/material';
import ReminderTable from 'components/sections/dashboard/ProdutoTable';
import Statistics from 'components/sections/dashboard/statistics/Statistics';
import Factors from 'components/sections/dashboard/factors/Factors';
import Cars from 'components/sections/dashboard/maisVendidos/TodosProdutos';
import { factors } from 'data/dashboard/factors';
import { cars } from 'data/dashboard/produtoMaisVendidos';

const Dashboard = () => {
  return (
    <Grid container rowGap={3.75}>
      <Grid item xs={12}>
        <Factors factors={factors} />
      </Grid>

      <Grid item xs={12}>
        <Statistics />
      </Grid>

      <Grid item xs={12}>
        <Cars cars={cars} />
      </Grid>

      <Grid item xs={12}>
        <ReminderTable />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
