import { Grid } from '@mui/material';
import Car from './CadaProduto';
import { ICar } from 'types/types';

const Cars = ({ cars }: { cars: ICar[] }) => {
  return (
    <>
      <h3>Produtos Mais Vendidos</h3>
      <Grid container spacing={3.75}>
        {cars.map((car) => (
          <Grid item key={car.id} xs={12} sm={6} lg>
            <Car car={car} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Cars;
