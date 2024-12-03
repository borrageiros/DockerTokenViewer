<script lang="ts">
  import { Icon } from '@sveltestrap/sveltestrap';
  
  export let value = '';
  export let placeholder = 'Search...';
  export let darkMode = false;
  export let onRefresh: () => void;
  export let inputRef: HTMLInputElement | null = null;
</script>

<div class="search-container">
  <input
    type="text"
    bind:value
    bind:this={inputRef}
    {placeholder}
    class:dark={darkMode}
  />
  <button class="refresh-button" on:click={onRefresh} class:dark={darkMode}>
    <Icon name="arrow-repeat" />
  </button>
</div>

<style>
  .search-container {
    display: flex;
    gap: 0.5rem;
  }

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  input.dark {
    background-color: #2c3e50;
    color: white;
    border-color: #34495e;
  }

  input.dark::placeholder {
    color: #95a5a6;
  }

  .refresh-button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid #ced4da;
    background-color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .refresh-button:hover {
    background-color: #e9ecef;
  }

  .refresh-button.dark {
    background-color: #2c3e50;
    color: white;
    border-color: #34495e;
  }

  .refresh-button.dark:hover {
    background-color: #34495e;
  }
</style>
