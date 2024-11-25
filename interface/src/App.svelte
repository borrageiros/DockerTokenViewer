<script lang="ts">
  import { Styles } from '@sveltestrap/sveltestrap';
  import { onMount } from 'svelte';
  import storage from './utils/storage';
  import Login from './routes/Login.svelte';
  import Repositories from './routes/Repositories.svelte';

  let repository = '';
  let token = '';
  let isLoggedIn = false;
  let darkMode = false;

  onMount(() => {
    repository = storage.getCookie('DTVRepository');
    token = storage.getCookie('DTVAuth');

    if (repository && token) {
      isLoggedIn = true;
    }

    darkMode = storage.getLocal('DTVTheme') === 'dark';
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  });
</script>

<Styles />
<div>
  {#if isLoggedIn}
    <Repositories {darkMode} />
  {:else}
    <Login {darkMode} />
  {/if}
</div>