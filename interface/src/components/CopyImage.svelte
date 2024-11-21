<script lang="ts">
  import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Icon } from '@sveltestrap/sveltestrap';

  export let darkMode = false;
  export let imageName: string;
  export let tagName: string;

  let dropdownOpen = false;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .catch(err => console.error('Error al copiar:', err));
  }

  function copyImageTag() {
    copyToClipboard(`${imageName}:${tagName}`);
  }

  function copyPullCommand() {
    copyToClipboard(`docker pull ${imageName}:${tagName}`);
  }
</script>

<Dropdown bind:isOpen={dropdownOpen} direction="left" theme={darkMode ? 'dark' : 'light'}>
  <DropdownToggle caret color={darkMode ? 'dark' : 'light'}>
    <Icon name="copy" />
  </DropdownToggle>
  <DropdownMenu>
    <DropdownItem on:click={copyImageTag}>
      Copy image name + tag
    </DropdownItem>
    <DropdownItem on:click={copyPullCommand}>
      Copy pull command
    </DropdownItem>
  </DropdownMenu>
</Dropdown>

<style>
  :global(.dropdown-toggle) {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  :global(.dropdown-menu) {
    font-size: 0.875rem;
    min-width: 200px;
  }

  :global(.dropdown-item) {
    cursor: pointer;
    padding: 0.5rem 1rem;
  }
</style>