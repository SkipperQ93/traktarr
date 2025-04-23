import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Center,
  Container,
  Loader,
  Stack,
  Text,
  Title,
  Alert,
} from "@mantine/core";
import { IconCheck, IconSettings } from "@tabler/icons-react";
import { isAuthenticatedAtom, authLoadingAtom, authErrorAtom } from "../../store/auth";
import traktService from "../../api/traktService";
import traktIcon from "../../assets/trakt.svg";
import { GITHUB_URL } from "../../config";

function getQueryParam(search: string, key: string): string | null {
  const params = new URLSearchParams(search);
  return params.get(key);
}

export function OAuthRedirectAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [loading, setLoading] = useAtom(authLoadingAtom);
  const [error, setError] = useAtom(authErrorAtom);
  const [credentialsSet, setCredentialsSet] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check if credentials are set
  useEffect(() => {
    setCredentialsSet(traktService.hasValidCredentials());
  }, []);

  // On mount, check for code in URL and handle callback
  useEffect(() => {
    const code = getQueryParam(location.search, "code");
    if (code) {
      setLoading(true);
      setError(null);
      traktService
        .handleAuthCallback(code)
        .then(() => {
          setIsAuthenticated(true);
          setSuccess(true);
          // Remove code/state from URL and redirect to home
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1200);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Authentication failed");
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Start OAuth redirect
  const startOAuth = () => {
    if (!credentialsSet) {
      navigate("/settings");
      return;
    }
    const url = traktService.getAuthorizationUrl();
    window.location.href = url;
  };

  // If already authenticated, show success message
  if (isAuthenticated || success) {
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
                  Trakt API credentials, then return here to connect.
                </Alert>
                <Button
                  onClick={() => navigate("/settings")}
                  color="yellow"
                  leftSection={<IconSettings size={16} />}
                >
                  Go to Settings
                </Button>
              </>
            ) : (
              <>
                <Text>
                  To export your Trakt data, you need to authorize this
                  application. Click the button below to start the
                  authentication process.
                </Text>
                <Button onClick={startOAuth} loading={loading} color="red">
                  Connect to Trakt
                </Button>
              </>
            )}

            {loading && (
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