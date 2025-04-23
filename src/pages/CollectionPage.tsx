import { Box, Title, Paper } from '@mantine/core';
import { CollectionList } from '../components/Data/CollectionList';

export default function CollectionPage() {
  return (
    <Box className="page-container">
      <Title order={2} mb="xl">My Collection</Title>
      
      <Paper shadow="sm" p="xl" withBorder className="data-card">
        <CollectionList />
      </Paper>
    </Box>
  );
}