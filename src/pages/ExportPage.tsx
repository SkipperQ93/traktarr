import { Box, Title, Paper } from '@mantine/core';
import { ExportOptionsForm } from '../components/Export/ExportOptions';

export default function ExportPage() {
  return (
    <Box className="page-container">
      <Title order={2} mb="xl">Export Your Data</Title>
      
      <Paper shadow="sm" p="xl" withBorder className="data-card">
        <ExportOptionsForm />
      </Paper>
    </Box>
  );
}