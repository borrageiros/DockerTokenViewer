<script>
  import { Styles } from '@sveltestrap/sveltestrap';
  import { onMount } from 'svelte';
  import storage from './utils/storage';
  import Login from './routes/Login.svelte';
  import Repositories from './routes/Repositories.svelte';
  let repository = '';
  let token = '';
  let isLoggedIn = false;

  onMount(() => {
    repository = storage.get('DTVRepository');
    token = storage.get('DTVAuth');

    if (repository && token) {
      isLoggedIn = true;
    }
  });
</script>

<Styles />
<div>
  {#if isLoggedIn}
    <Repositories />
  {:else}
    <Login />
  {/if}
</div>