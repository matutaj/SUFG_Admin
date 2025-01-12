import { ICar } from 'types/types';
import car1 from 'assets/car-1.webp';
import monitor from 'assets/monitor.png';
import ssd from 'assets/SSD-Transparent.png';

const carImages: Record<number, string> = { 1: car1, 2: monitor, 3: ssd };

export const cars: ICar[] = [
  {
    id: 1,
    imageUrl: carImages[1],
    recommendation: 64,
    modelName: 'Mini Cooper',
    mileage: 132,
    costPerHour: 32,
    backgroundColor: 'warning.lighter',
  },
  {
    id: 2,
    recommendation: 74,
    imageUrl: carImages[2],
    modelName: 'Monitor 24G15N',
    mileage: 130,
    costPerHour: 28,
    backgroundColor: 'primary.lighter',
  },
  {
    id: 3,
    recommendation: 74,
    imageUrl: carImages[3],
    modelName: 'SSD (Solid State Drive)',
    mileage: 130,
    costPerHour: 28,
    backgroundColor: 'error.lighter',
  },
];
