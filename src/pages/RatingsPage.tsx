import { Box, Title, Paper } from '@mantine/core';
import { RatingsList } from '../components/Data/RatingsList';

export default function RatingsPage() {
  return (
    <Box className="page-container">
      <Title order={2} mb="xl">My Ratings</Title>
      
      <Paper shadow="sm" p="xl" withBorder className="data-card">
        <RatingsList />
      </Paper>
    </Box>
  );
}