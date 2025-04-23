import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Loader,
  Stack,
  Text,
  Title,
  Alert,
} from "@mantine/core";
import { IconCheck, IconExternalLink, IconSettings } from "@tabler/icons-react";
import {
  authErrorAtom,
  authLoadingAtom,
  deviceCodeAtom,
  isAuthenticatedAtom,
  loginWithDeviceCode,
} from "../../store/auth";
import traktService from "../../api/traktService";
import traktIcon from "../../assets/trakt.svg";
import { GITHUB_URL } from "../../config";

export function DeviceAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [loading, setLoading] = useAtom(authLoadingAtom);
  const [error, setError] = useAtom(authErrorAtom);
  const [deviceCode, setDeviceCode] = useAtom(deviceCodeAtom);
  const [authStarted, setAuthStarted] = useState(false);
  const [credentialsSet, setCredentialsSet] = useState(false);

  // Check if credentials are set
  useEffect(() => {
    const hasCredentials = traktService.hasValidCredentials();
    setCredentialsSet(hasCredentials);
  }, []);

  // Start the authentication process
  const startAuth = async () => {
    if (!credentialsSet) {
      navigate("/settings");
      return;
    }

    setAuthStarted(true);
    const success = await loginWithDeviceCode(
      setLoading,
      setError,
      setDeviceCode
    );
    if (success) {
      setIsAuthenticated(true);
    }
  };

  // Navigate to settings page
  const goToSettings = () => {
    navigate("/settings");
  };

  // Open the verification URL in a new tab
  const openVerificationUrl = () => {
    if (deviceCode?.verificationUrl) {
      window.open(deviceCode.verificationUrl, "_blank");
    }
  };

  // Reset the auth state if there's an error
  useEffect(() => {
    if (error) {
      setAuthStarted(false);
    }
  }, [error]);

  // If already authenticated, show success message
  if (isAuthenticated) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="md">
          <IconCheck size={48} color="green" />
          <Title order={3}>Successfully Authenticated</Title>
          <Text>You are now connected to Trakt</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Title
        order={2}
        ta="center"
        mb="md"
        fw={700}
        style={{ letterSpacing: "-1px" }}
      >
        Traktarr
      </Title>
      <Container size="sm">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="md">
            <img src={traktIcon} alt="Trakt" width={48} />
            <Title order={3}>Connect to Trakt</Title>

            {!credentialsSet ? (
              <>
                <Alert
                  title="API Credentials Required"
                  color="yellow"
                  icon={<IconSettings size={16} />}
                >
                  Before connecting to Trakt, you need to set up your API
                  credentials. Please go to the Settings page to enter your
                  Trakt API credentials.
                </Alert>
                <Stack mt="md">
                  <Text size="sm" fw={500}>
                    How to create a Trakt application:
                  </Text>
                  <ol style={{ paddingLeft: "20px", margin: 0 }}>
                    <li>
                      Go to{" "}
                      <a
                        href="https://trakt.tv/oauth/applications/new"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Trakt Applications
                      </a>
                    </li>
                    <li>
                      Fill in the required fields:
                      <ul style={{ paddingLeft: "20px" }}>
                        <li>
                          <strong>Name:</strong> Traktarr (or any name)
                        </li>
                        <li>
                          <strong>Description:</strong> Personal app for
                          exporting my Trakt data
                        </li>
                        <li>
                          <strong>Redirect URI:</strong>{" "}
                          {window.location.origin}/auth
                        </li>
                        <li>
                          For Device authentication, add:{" "}
                          <code>urn:ietf:wg:oauth:2.0:oob</code>
                        </li>
                        <li>
                          <strong>JavaScript Origins:</strong>{" "}
                          {window.location.origin}
                        </li>
                      </ul>
                    </li>
                    <li>
                      Check required permissions (at minimum):
                      <ul style={{ paddingLeft: "20px" }}>
                        <li>info (read your public info)</li>
                        <li>history (read your watched history)</li>
                        <li>collection (read your collection)</li>
                        <li>ratings (read your ratings)</li>
                      </ul>
                    </li>
                    <li>
                      Click "Save App" and copy your Client ID and Client Secret
                    </li>
                  </ol>
                </Stack>
                <Button
                  onClick={goToSettings}
                  color="yellow"
                  leftSection={<IconSettings size={16} />}
                >
                  Go to Settings
                </Button>
              </>
            ) : !authStarted ? (
              <>
                <Text>
                  To export your Trakt data, you need to authorize this
                  application. Click the button below to start the
                  authentication process.
                </Text>
                <Button onClick={startAuth} loading={loading} color="red">
                  Connect to Trakt
                </Button>
              </>
            ) : deviceCode ? (
              <>
                <Text>
                  Please enter the following code on Trakt to authorize this
                  application:
                </Text>
                <Box
                  p="md"
                  bg="gray.1"
                  style={{
                    borderRadius: "4px",
                    fontSize: "24px",
                    fontWeight: "bold",
                    letterSpacing: "2px",
                  }}
                >
                  {deviceCode.userCode}
                </Box>
                <Button
                  onClick={openVerificationUrl}
                  leftSection={<IconExternalLink size={16} />}
                  variant="outline"
                  color="red"
                >
                  Open Trakt Activation Page
                </Button>
                <Flex align="center" gap="md">
                  <Loader size="sm" color="red" />
                  <Text>Waiting for authorization...</Text>
                </Flex>
              </>
            ) : (
              <Center>
                <Loader color="red" />
              </Center>
            )}

            {error && (
              <Text color="red" size="sm">
                Error: {error}
              </Text>
            )}
          </Stack>
        </Card>
        <footer
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--mantine-color-dimmed, #888)",
            marginTop: "2rem",
            padding: "1rem 0 0.5rem 0",
            opacity: 0.8,
          }}
        >
          Not affiliated with Trakt or trakt, inc. |{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            GitHub
          </a>
        </footer>
      </Container>
    </Container>
  );
}
