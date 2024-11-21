<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '@sveltestrap/sveltestrap';
  import storage from '../utils/storage';
  
  export let darkMode = false;

  const dispatch = createEventDispatcher();
  
  function toggleDarkMode() {
    darkMode = !darkMode;
    storage.save('DTVTheme', darkMode ? 'dark' : 'light');
    dispatch('themeChange', darkMode);
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }

</script>

<button class="dark-mode-toggle" on:click={toggleDarkMode} class:dark={darkMode}>
  {#if darkMode}
    <Icon name="sun-fill" class="sun-icon" />
  {/if}
  {#if !darkMode}
    <Icon name="moon-fill" />
  {/if}
</button>

<style>
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

  :global(.sun-icon) {
    color: #f39c12;
  }
</style>