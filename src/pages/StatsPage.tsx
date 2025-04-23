import { Box, Title, Paper } from '@mantine/core';
import { StatsDisplay } from '../components/Data/StatsDisplay';

export default function StatsPage() {
  return (
    <Box className="page-container">
      <Title order={2} mb="xl">My Statistics</Title>
      
      <Paper shadow="sm" p="xl" withBorder className="data-card">
        <StatsDisplay />
      </Paper>
    </Box>
  );
}