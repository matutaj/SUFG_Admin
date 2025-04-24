import { Box, Paper, Stack, Typography } from '@mui/material';
import { useRef, useState, useEffect } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { getSalesByPeriod } from '../../../../api/methods';
import { VendaComFuncionario } from '../../../../types/models';
import MilesStatisticsChart from './MilesStatisticsChart';
import ChartLegend from './ChartLegend';

const MilesStatistics = () => {
  const barChartRef = useRef<null | EChartsReactCore>(null);
  const [selectedOption, setSelectedOption] = useState('day');
  const [dailySalesData, setDailySalesData] = useState<number[]>([]);
  const [todayQuantity, setTodayQuantity] = useState<number>(0);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Get current date and date 7 days ago
        const today = new Date('2025-04-23'); // Using provided context date
        const startDate = new Date();
        startDate.setDate(today.getDate() - 6); // Last 7 days including today
        const startDateStr = startDate.toISOString().split('T')[0]; // e.g., '2025-04-17'
        const endDateStr = today.toISOString().split('T')[0]; // e.g., '2025-04-23'

        // Fetch sales data for the last 7 days
        const sales: VendaComFuncionario[] = await getSalesByPeriod(startDateStr, endDateStr);

        // Aggregate sales by day (total quantity sold per day)
        const dailyQuantities: { [key: string]: number } = {};
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          dailyQuantities[dateStr] = 0;
        }
        sales.forEach((sale) => {
          const saleDate = sale.data.split('T')[0];
          if (dailyQuantities.hasOwnProperty(saleDate)) {
            dailyQuantities[saleDate] += sale.quantidade || 0;
          }
        });

        // Convert to array for chart (in chronological order)
        const chartData = Object.keys(dailyQuantities)
          .sort()
          .map((date) => dailyQuantities[date]);
        setDailySalesData(chartData);

        // Calculate total quantity sold today
        const todaySales = sales.filter((sale) => sale.data.split('T')[0] === endDateStr);
        const totalToday = todaySales.reduce((sum, sale) => sum + (sale.quantidade || 0), 0);
        setTodayQuantity(totalToday);

        // Update chart
        if (barChartRef.current) {
          const chartInstance = barChartRef.current.getEchartsInstance();
          chartInstance.setOption({
            series: [
              {
                data: chartData,
              },
            ],
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados de vendas:', error);
        setDailySalesData([]);
        setTodayQuantity(0);
      }
    };

    fetchSalesData();
  }, []);

  const handleChartLegend = (value: string) => {
    setSelectedOption(value);
    // For now, only 'day' is supported; extend here for other periods if needed
    if (barChartRef.current) {
      const chartInstance = barChartRef.current.getEchartsInstance();
      chartInstance.setOption({
        series: [
          {
            data: dailySalesData,
          },
        ],
      });
    }
  };

  return (
    <Paper
      sx={(theme) => ({
        p: theme.spacing(1.875, 3, 1.25, 3),
      })}
    >
      <Stack rowGap={3} sx={{ mb: 1.75 }}>
        <Typography variant="h3">
          Balanço{' '}
          <Box component="span" sx={{ fontWeight: 'fontWeightRegular' }}>
            de Venda
          </Box>
        </Typography>

        <Stack
          sx={{
            flexDirection: { sm: 'row' },
            justifyContent: { sm: 'space-between' },
            alignItems: { sm: 'center' },
            rowGap: { xs: 'inherit' },
          }}
        >
          <Stack direction="row" columnGap={1.25} alignItems={'center'}>
            <ChartLegend
              active={selectedOption === 'day'}
              label="Day"
              onHandleClick={handleChartLegend}
            />
          </Stack>

          <Typography variant="subtitle2" component="p" sx={{ color: 'grey.700' }}>
            {todayQuantity} vendidos
          </Typography>
        </Stack>
      </Stack>

      <MilesStatisticsChart
        barChartRef={barChartRef}
        data={dailySalesData}
        style={{ height: 223 }}
      />
    </Paper>
  );
};

export default MilesStatistics;
