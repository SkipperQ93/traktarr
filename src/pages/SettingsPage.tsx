import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  Container, 
  Divider, 
  Group, 
  PasswordInput, 
  Stack, 
  Text, 
  TextInput, 
  Title 
} from '@mantine/core';
import { useAtom } from 'jotai';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconSettings } from '@tabler/icons-react';
import traktService from '../api/traktService';
import { isAuthenticatedAtom } from '../store/auth';

export default function SettingsPage() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = traktService.getCredentials();
    if (savedCredentials) {
      setClientId(savedCredentials.clientId || '');
      setClientSecret(savedCredentials.clientSecret || '');
      setRedirectUri(savedCredentials.redirectUri || '');
    }
  }, []);

  const handleSave = () => {
    // Validate inputs
    if (!clientId.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Client ID is required',
        color: 'red',
      });
      return;
    }

    if (!clientSecret.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Client Secret is required',
        color: 'red',
      });
      return;
    }

    if (!redirectUri.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Redirect URI is required',
        color: 'red',
      });
      return;
    }

    // Save credentials
    traktService.saveCredentials({
      clientId,
      clientSecret,
      redirectUri,
    });

    // Show success notification
    notifications.show({
      title: 'Success',
      message: 'Trakt API credentials saved successfully. Go back to the home page to log in and start using the app.',
      color: 'green',
    });

    setIsSaved(true);

    // Reset authentication if credentials have changed
    if (isAuthenticated) {
      traktService.logout();
    }
  };

  return (
    <Container size="md" className="page-container">
      <Title order={2} mb="xl">
        <Group gap="xs">
          <IconSettings size={24} />
          <span>Settings</span>
        </Group>
      </Title>

      <Card shadow="sm" padding="xl" radius="md" withBorder mb="xl" className="data-card">
        <Stack>
          <Title order={3}>Trakt API Credentials</Title>
          <Text size="sm" c="dimmed">
            To use this app, you need to provide your own Trakt API credentials. 
            These credentials are stored locally in your browser and are never sent to any server other than Trakt.
          </Text>

          <Divider my="sm" />

          <Box>
            <TextInput
              label="Client ID"
              placeholder="Your Trakt API Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              mb="md"
            />

            <PasswordInput
              label="Client Secret"
              placeholder="Your Trakt API Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              required
              mb="md"
            />

            <TextInput
              label="Redirect URI"
              placeholder="Your Trakt API Redirect URI"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              required
              mb="md"
              description={
                "Set this to the URL where this app is running, ending with /auth. For example: " +
                window.location.origin + "/auth"
              }
            />
          </Box>

          <Group justify="space-between">
            <Button
              onClick={handleSave}
              color="red"
              size="md"
              leftSection={isSaved ? <IconCheck size={16} /> : undefined}
            >
              {isSaved ? 'Saved' : 'Save Credentials'}
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card shadow="sm" padding="xl" radius="md" withBorder className="data-card">
        <Stack>
          <Title order={3}>How to Create a Trakt Application</Title>

          <Card withBorder p="md" bg="var(--mantine-color-gray-light)">
            <Title order={5} mb="sm" c="red" fw={700}>Important Notes</Title>
            <ul style={{ paddingLeft: "20px", margin: 0 }}>
              <li>
                <strong>Redirect URIs:</strong> You <u>must</u> add the URL where this app is running, ending with <code>/auth</code> (e.g., <code>{window.location.origin}/auth</code>), as the Redirect URI in your Trakt application.
              </li>
              <li>
                <strong>CORS Issues:</strong> If you are a developer, authentication may not work on localhost due to CORS restrictions. If you encounter issues, try using a browser extension that disables CORS or deploy to a proper domain.
              </li>
            </ul>
          </Card>
          <ol style={{ paddingLeft: '20px' }}>
            <li><strong>Go to Trakt API Applications:</strong><br/>
               Visit <a href="https://trakt.tv/oauth/applications" target="_blank" rel="noopener noreferrer">Trakt API Applications</a> and sign in</li>
            
            <li><strong>Create New Application:</strong><br/>
               Click the "New Application" button</li>
            
            <li><strong>Fill in the application details:</strong>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Name:</strong> Traktarr (or any name)</li>
                <li><strong>Description:</strong> Personal app for exporting my Trakt data</li>
                <li>
                  <strong>Redirect URI:</strong> Add <code>{window.location.origin}/auth</code> (or your deployed URL ending with <code>/auth</code>)
                </li>
                <li>
                  <strong>JavaScript Origins:</strong> <code>{window.location.origin}</code>
                </li>
              </ul>
            </li>
            
            <li><strong>Click "Save App"</strong> at the bottom of the form</li>
            <li><strong>Copy credentials:</strong> Copy the Client ID and Client Secret to the form above</li>
          </ol>
        </Stack>
      </Card>
    </Container>
  );
}