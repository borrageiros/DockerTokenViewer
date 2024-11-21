<script lang="ts">
  import storage from '../utils/storage';
  import { onMount } from 'svelte';
  import { getRepositories, getRepositoryTags } from '../utils/api';
  import { Table, Modal, ModalBody, Icon, Badge } from '@sveltestrap/sveltestrap';
  import SearchBar from '../components/SearchBar.svelte';
  import ThemeToggle from '../components/ThemeToggle.svelte';

  interface Repository {
    name: string;
    description: string | null;
    pull_count: number;
    storage_size: number;
    last_updated: string;
  }

  interface Tag {
    name: string;
    full_size: number;
    last_updater_username: string;
    last_updated: string;
  }

  interface SortConfig {
    column: string;
    direction: 'asc' | 'desc';
  }

  let repositories: { results: Repository[] } = { results: [] };
  let searchTerm = '';
  let allRepositories: Repository[] = [];
  let isModalOpen = false;
  let selectedRepoTags: Tag[] = [];
  let selectedRepoName = '';
  let isLoadingTags = false;
  let isLoadingRepositories = true;
  let darkMode = false;
  let tagSearchTerm = '';
  let allTags: Tag[] = [];
  let repoSortConfig: SortConfig = { column: '', direction: 'asc' };
  let tagSortConfig: SortConfig = { column: '', direction: 'asc' };

  onMount(async () => {
    const savedTheme = storage.get('DTVTheme');
    darkMode = savedTheme === 'dark';

    try {
      const response = await getRepositories();
      allRepositories = response.results;
      repositories = { results: allRepositories };
    } catch (error) {
      console.error('Error al cargar los repositorios:', error);
    } finally {
      isLoadingRepositories = false;
    }
  });

  $: {
    if (searchTerm === '') {
      repositories = { results: allRepositories };
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filteredResults = allRepositories.filter(repo => 
        repo.name.toLowerCase().includes(searchLower) || 
        (repo.description && repo.description.toLowerCase().includes(searchLower))
      );
      repositories = { results: filteredResults };
    }
  }

  async function handleRepositoryClick(repoName: string) {
    try {
      selectedRepoName = repoName;
      isModalOpen = true;
      isLoadingTags = true;
      const tags = await getRepositoryTags(repoName);
      allTags = tags.results;
      selectedRepoTags = allTags;
    } catch (error) {
      console.error('Error al obtener los tags:', error);
    } finally {
      isLoadingTags = false;
    }
  }

  function toggleModal() {
    isModalOpen = !isModalOpen;
    if (!isModalOpen) {
      selectedRepoTags = [];
      selectedRepoName = '';
      tagSearchTerm = '';
      allTags = [];
      tagSortConfig = { column: '', direction: 'asc' };
    }
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  $: {
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
    }
  }

  function handleLogout() {
    storage.remove('DTVAuth');
    storage.remove('DTVRepository');
    window.location.reload();
  }

  $: {
    if (tagSearchTerm === '') {
      selectedRepoTags = allTags;
    } else {
      const searchLower = tagSearchTerm.toLowerCase();
      selectedRepoTags = allTags.filter(tag => 
        tag.name.toLowerCase().includes(searchLower)
      );
    }
  }

  function sortData<T>(data: T[], config: SortConfig, columnTypes: Record<string, string> = {}): T[] {
    if (!config.column) return data;
    
    return [...data].sort((a: any, b: any) => {
      let aVal = a[config.column];
      let bVal = b[config.column];
      
      if (columnTypes[config.column] === 'number') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else if (columnTypes[config.column] === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function handleSort(column: string, isRepoTable: boolean) {
    const config = isRepoTable ? repoSortConfig : tagSortConfig;
    
    if (config.column === column) {
      config.direction = config.direction === 'asc' ? 'desc' : 'asc';
    } else {
      config.column = column;
      config.direction = 'asc';
    }
    
    if (isRepoTable) {
      repoSortConfig = { ...config };
    } else {
      tagSortConfig = { ...config };
    }
  }

  $: {
    if (repositories.results.length) {
      const columnTypes = {
        pull_count: 'number',
        storage_size: 'number',
        last_updated: 'date'
      };
      repositories.results = sortData(repositories.results, repoSortConfig, columnTypes);
    }
  }

  $: {
    if (selectedRepoTags.length) {
      const columnTypes = {
        full_size: 'number',
        last_updated: 'date'
      };
      selectedRepoTags = sortData(selectedRepoTags, tagSortConfig, columnTypes);
    }
  }

  async function refreshRepositories() {
    try {
      isLoadingRepositories = true;
      const response = await getRepositories();
      allRepositories = response.results;
      repositories = { results: allRepositories };
    } catch (error) {
      console.error('Error al actualizar los repositorios:', error);
    } finally {
      isLoadingRepositories = false;
    }
  }

  async function refreshTags() {
    if (!selectedRepoName) return;
    
    try {
      isLoadingTags = true;
      const tags = await getRepositoryTags(selectedRepoName);
      allTags = tags.results;
      selectedRepoTags = allTags;
    } catch (error) {
      console.error('Error al actualizar los tags:', error);
    } finally {
      isLoadingTags = false;
    }
  }

  function isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }
</script>

<div class="app-container" class:dark={darkMode}>
  <div class="table-container" class:dark={darkMode}>
    <br/>
    <div class="controls-container">
      <SearchBar
        bind:value={searchTerm}
        placeholder="Search repositories..."
        {darkMode}
        onRefresh={refreshRepositories}
      />
      <ThemeToggle 
        {darkMode} 
        on:themeChange={(e) => darkMode = e.detail} 
      />
    </div>

    {#if isLoadingRepositories}
      <div class="loader-container">
        <div class="loader"></div>
      </div>
    {:else}
      <Table striped hover responsive class={darkMode ? 'table-dark' : ''}>
        <thead>
          <tr>
            <th on:click={() => handleSort('name', true)} style="cursor: pointer">
              Name {repoSortConfig.column === 'name' ? (repoSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th on:click={() => handleSort('description', true)} style="cursor: pointer">
              Description {repoSortConfig.column === 'description' ? (repoSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th on:click={() => handleSort('pull_count', true)} style="cursor: pointer">
              Downloads {repoSortConfig.column === 'pull_count' ? (repoSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th on:click={() => handleSort('storage_size', true)} style="cursor: pointer">
              Size {repoSortConfig.column === 'storage_size' ? (repoSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th on:click={() => handleSort('last_updated', true)} style="cursor: pointer">
              Last updated {repoSortConfig.column === 'last_updated' ? (repoSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </th>
          </tr>
        </thead>
        <tbody>
          {#each repositories.results || [] as repo}
            <tr on:click={() => handleRepositoryClick(repo.name)} style="cursor: pointer;">
              <td>{repo.name}</td>
              <td>{repo.description || '-'}</td>
              <td>{repo.pull_count.toLocaleString()}</td>
              <td>{formatSize(repo.storage_size)}</td>
              <td>
                {formatDate(repo.last_updated)}
                {#if isToday(repo.last_updated)}
                  <span class="badge bg-success rounded-pill">TODAY</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </Table>
    {/if}
  </div>

  <Modal 
    isOpen={isModalOpen} 
    toggle={toggleModal} 
    size="xl" 
    class={darkMode ? 'modal-dark' : ''}
  >
    <ModalBody>
      <h2>{selectedRepoName}</h2>
      {#if isLoadingTags}
        <div class="loader-container">
          <div class="loader"></div>
        </div>
      {:else}
        <div class="controls-container">
          <SearchBar
            bind:value={tagSearchTerm}
            placeholder="Search tags..."
            {darkMode}
            onRefresh={refreshTags}
          />
          <ThemeToggle 
            {darkMode} 
            on:themeChange={(e) => darkMode = e.detail} 
          />
        </div>
        <Table striped hover responsive class={darkMode ? 'table-dark' : ''}>
          <thead>
            <tr>
              <th on:click={() => handleSort('name', false)} style="cursor: pointer">
                Name {tagSortConfig.column === 'name' ? (tagSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th on:click={() => handleSort('full_size', false)} style="cursor: pointer">
                Size {tagSortConfig.column === 'full_size' ? (tagSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th on:click={() => handleSort('last_updater_username', false)} style="cursor: pointer">
                Pushed by {tagSortConfig.column === 'last_updater_username' ? (tagSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th on:click={() => handleSort('last_updated', false)} style="cursor: pointer">
                Last updated {tagSortConfig.column === 'last_updated' ? (tagSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {#each selectedRepoTags as tag}
              <tr>
                <td>{tag.name}</td>
                <td>{formatSize(tag.full_size)}</td>
                <td>{tag.last_updater_username}</td>
                <td>
                  {formatDate(tag.last_updated)}
                  {#if isToday(tag.last_updated)}
                    <span class="badge bg-success rounded-pill">TODAY</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </Table>
      {/if}
    </ModalBody>
  </Modal>

  <button 
    class="logout-button" 
    class:dark={darkMode} 
    on:click={handleLogout}
  >
    <span class="logout-icon">⇥</span>
    <span class="logout-text">Logout</span>
  </button>
</div>

<style>
  .app-container {
    min-height: 100vh;
    background-color: #ffffff;
    transition: all 0.3s ease;
  }

  .app-container.dark {
    background-color: #121212;
  }

  :global(.table-dark) {
    background-color: #1a1a1a !important;
    color: #ffffff !important;
  }

  :global(.table-dark thead th) {
    background-color: #2c3e50 !important;
    color: #ffffff !important;
    border-color: #34495e !important;
  }

  :global(.table-dark tbody tr) {
    background-color: #1a1a1a !important;
    color: #ffffff !important;
  }

  :global(.table-dark.table-striped tbody tr:nth-of-type(odd)) {
    background-color: #2c3e50 !important;
  }

  :global(.table-dark.table-hover tbody tr:hover) {
    background-color: #34495e !important;
  }

  :global(.modal-dark .modal-content) {
    background-color: #1a1a1a !important;
    color: #ffffff !important;
    border-radius: 8px !important;
    border: 1px solid #34495e !important;
  }

  :global(.modal-dark .modal-body) {
    background-color: #1a1a1a !important;
    color: #ffffff !important;
    border-radius: 8px !important;
  }

  :global(.modal-dark .modal-header) {
    background-color: #2c3e50 !important;
    border-color: #34495e !important;
    border-top-left-radius: 8px !important;
    border-top-right-radius: 8px !important;
  }

  .table-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 2rem 1rem;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background-color: white;
    transition: all 0.3s ease;
  }

  .table-container.dark {
    background-color: #1a1a1a;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .table-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background-color: white;
    transition: all 0.3s ease;
  }

  :global(table) {
    font-size: 0.9rem;
    margin: 0;
  }
  
  :global(th) {
    background-color: #f8f9fa;
    padding: 1rem !important;
    user-select: none;
    position: relative;
  }

  :global(th:hover) {
    background-color: #e9ecef;
  }

  .dark :global(th:hover) {
    background-color: #34495e;
  }

  :global(td) {
    padding: 0.8rem !important;
    vertical-align: middle;
  }

  @media (max-width: 768px) {
    .table-container {
      margin: 1rem;
      padding: 0;
    }
  }

  :global(.pagination) {
    margin: 0;
  }

  :global(.modal-body) {
    padding: 1rem;
  }

  :global(.modal-header) {
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  :global(.modal-content) {
    border-radius: 8px;
  }

  .loader-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
  }

  .loader {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-radius: 50%;
    border-top: 5px solid #3498db;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .table-container.dark {
    background-color: #1a1a1a;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  .dark :global(table) {
    color: #ffffff;
  }

  .dark :global(th) {
    background-color: #2c3e50;
    color: #ffffff;
  }

  .dark :global(td) {
    color: #ffffff;
  }

  .dark :global(.table-striped tbody tr:nth-of-type(odd)) {
    background-color: #2c3e50;
  }

  .dark :global(.table-hover tbody tr:hover) {
    background-color: #34495e;
  }

  .dark :global(.modal-content) {
    background-color: #1a1a1a;
    color: white;
  }

  .dark :global(.modal-header) {
    background-color: #2c3e50;
    border-color: #34495e;
  }

  :global(body) {
    background-color: #ffffff;
    transition: background-color 0.3s ease;
  }

  :global(body.dark) {
    background-color: #121212;
  }

  .dark :global(.table) {
    background-color: #1a1a1a;
    color: #ffffff;
  }

  .dark :global(.table-striped > tbody > tr:nth-of-type(odd)) {
    background-color: #2c3e50 !important;
  }

  .dark :global(.table-hover > tbody > tr:hover) {
    background-color: #34495e !important;
  }

  .dark :global(.modal-content) {
    background-color: #1a1a1a !important;
    color: white !important;
  }

  .dark :global(.modal-body) {
    background-color: #1a1a1a !important;
    color: white !important;
  }

  .table-container, :global(.modal-content), :global(.table) {
    transition: all 0.3s ease;
  }

  :global(.modal-content), :global(.modal-body), :global(.modal-header) {
    transition: all 0.3s ease !important;
  }

  .logout-button {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    border: none;
    background-color: #e74c3c;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 1000;
  }

  .logout-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    background-color: #c0392b;
  }

  .logout-button.dark {
    background-color: #c0392b;
  }

  .logout-button.dark:hover {
    background-color: #e74c3c;
  }

  .logout-icon {
    font-size: 1.2rem;
  }

  @media (max-width: 768px) {
    .logout-text {
      display: none;
    }

    .logout-button {
      padding: 1rem;
      border-radius: 50%;
    }
  }

  :global(.badge) {
    margin-left: 0.5rem;
    vertical-align: middle;
    font-size: 0.75em;
    padding: 0.35em 0.65em;
    font-weight: 700;
  }

  :global(.bg-success) {
    background-color: #198754 !important;
    color: white;
  }

  :global(.rounded-pill) {
    border-radius: 50rem !important;
  }

  .controls-container {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  :global(.controls-container > :first-child) {
    flex: 1;
  }

  :global(.controls-container > :last-child) {
    flex: 0 0 auto;
  }
</style>

<svelte:head>
  {@html `
    <script>
      document.body.className = ${darkMode ? "'dark'" : "''"};
    </script>
  `}
</svelte:head>