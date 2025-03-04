import { Grid } from '@mui/material';
import MilesStatistics from './MilesStatistics';

const Statistics = () => {
  return (
    <Grid container spacing={3.75}>
      <Grid item xs={12} lg={12}>
        <MilesStatistics />
      </Grid>
    </Grid>
  );
};

export default Statistics;
