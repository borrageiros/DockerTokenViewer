<script>
  import { Form, FormGroup, Input, Label, Button, Container, Row, Col } from '@sveltestrap/sveltestrap';
  import storage from "../utils/storage";
  import { onMount } from 'svelte';

  let repository = '';
  let token = '';
  let darkMode = false;
  let mounted = false;

  onMount(() => {
    darkMode = storage.get('DTVTheme') === 'dark';
    mounted = true;
    if (darkMode) {
      document.body.classList.add('dark');
    }
  });

  const handleSubmit = () => {
    storage.save('DTVAuth', token);
    storage.save('DTVRepository', repository);
    window.location.reload();
  };

  function toggleDarkMode() {
    darkMode = !darkMode;
    storage.save('DTVTheme', darkMode ? 'dark' : 'light');
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }
</script>

{#if mounted}
  <div class="app-container" class:dark={darkMode}>
    <Container class="mt-5">
      <Row>
        <Col sm="12" md={{ size: 6, offset: 3 }}>
          <div class="login-container" class:dark={darkMode}>
            <div class="header-container">
              <h2 class="text-center mb-4">Docker Token Viewer</h2>
              <button class="dark-mode-toggle" on:click={toggleDarkMode} class:dark={darkMode}>
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <Form on:submit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}>
              <FormGroup>
                <Label for="repository">Repository</Label>
                <Input
                  type="text"
                  id="repository"
                  placeholder="Enter the repository name"
                  bind:value={repository}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label for="token">Token</Label>
                <Input
                  type="password"
                  id="token"
                  placeholder="Enter your token"
                  bind:value={token}
                  required
                />
              </FormGroup>

              <Button color="primary" type="submit" block>
                Login
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background-color: #ffffff;
    transition: background-color 0.3s ease;
  }

  :global(body.dark) {
    background-color: #121212;
  }

  .app-container {
    min-height: 100vh;
    background-color: #ffffff;
    transition: all 0.3s ease;
  }

  .app-container.dark {
    background-color: #121212;
  }

  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .dark-mode-toggle {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid #ced4da;
    background-color: white;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .dark-mode-toggle.dark {
    background-color: #2c3e50;
    color: white;
    border-color: #34495e;
  }

  .login-container {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .login-container.dark {
    background-color: #1a1a1a;
    color: white;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .dark :global(.form-control) {
    background-color: #2c3e50;
    border-color: #34495e;
    color: white;
  }

  .dark :global(.form-control::placeholder) {
    color: #95a5a6;
  }

  .dark :global(.form-label) {
    color: white;
  }
</style>