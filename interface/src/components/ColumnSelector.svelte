<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from '@sveltestrap/sveltestrap';

  export let darkMode = false;
  export let columns: { name: string; visible: boolean; }[] = [];
  let isOpen = false;

  const dispatch = createEventDispatcher();
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectOption(column: string) {
    dispatch('select', { column });
    isOpen = false;
  }
</script>

<Dropdown {isOpen} toggle={toggleDropdown}>
  <DropdownToggle nav>
    <button class="dark-mode-toggle" class:dark={darkMode}>
      <Icon name="gear-wide" />
    </button>
  </DropdownToggle>
  
  <DropdownMenu class={darkMode ? 'dark' : ''}>
    {#each columns as column}
      <DropdownItem on:click={() => selectOption(column.name)}>
        <div class="column-item">
          <span>{column.name}</span>
          <Icon name={column.visible ? 'check-square' : 'square'} />
        </div>
      </DropdownItem>
    {/each}
  </DropdownMenu>
</Dropdown>

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

  :global(.dropdown-menu.dark) {
    background-color: #2c3e50;
    border-color: #34495e;
  }

  :global(.dropdown-menu.dark .dropdown-item) {
    color: white;
  }

  :global(.dropdown-menu.dark .dropdown-item:hover) {
    background-color: #34495e;
    color: white;
  }

  :global(.dropdown-menu .dropdown-item:active),
  :global(.dropdown-menu .dropdown-item:focus) {
    background-color: transparent;
    color: inherit;
  }

  :global(.dropdown-menu.dark .dropdown-item:active),
  :global(.dropdown-menu.dark .dropdown-item:focus) {
    background-color: transparent;
    color: white;
  }

  :global(.dropdown-menu .dropdown-item:hover) {
    background-color: #f8f9fa;
  }

  :global(.dropdown-menu.dark .dropdown-item:hover) {
    background-color: #34495e;
  }

  .column-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  :global(.dropdown-item) {
    padding: 0.5rem 1rem;
    outline: none;
  }
</style>