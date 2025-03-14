<script lang="ts">
  import storage from '../utils/storage';
  import { onMount } from 'svelte';
  import { getRepositories, getRepositoryTags } from '../utils/api';
  import { Table, Modal, ModalBody, Icon } from '@sveltestrap/sveltestrap';
  import SearchBar from '../components/SearchBar.svelte';
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import ColumnSelector from '../components/ColumnSelector.svelte';
  import Badge from '../components/Badge.svelte';
  import CopyImage from '../components/CopyImage.svelte';

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

  interface TableColumn {
    name: string;
    visible: boolean;
    width: string;
    sortKey: string;
  }

  export let darkMode: boolean;
  let repositories: { results: Repository[] } = { results: [] };
  let searchTerm = '';
  let allRepositories: Repository[] = [];
  let isModalOpen = false;
  let selectedRepoTags: Tag[] = [];
  let selectedRepoName = '';
  let isLoadingTags = false;
  let isLoadingRepositories = true;
  let tagSearchTerm = '';
  let allTags: Tag[] = [];
  let repoSortConfig: SortConfig = { column: 'name', direction: 'asc' };
  let tagSortConfig: SortConfig = { column: '', direction: 'asc' };
  let searchBarRef: HTMLInputElement;
  let modalSearchBarRef: HTMLInputElement;
  let repoTableColumns: TableColumn[] = [
    { name: 'Name', visible: true, width: '20%', sortKey: 'name' },
    { name: 'Description', visible: true, width: '35%', sortKey: 'description' },
    { name: 'Downloads', visible: true, width: '15%', sortKey: 'pull_count' },
    { name: 'Size', visible: true, width: '10%', sortKey: 'storage_size' },
    { name: 'Last update', visible: true, width: '20%', sortKey: 'last_updated' }
  ];

  let tagTableColumns: TableColumn[] = [
    { name: 'Name', visible: true, width: '25%', sortKey: 'name' },
    { name: 'Size', visible: true, width: '20%', sortKey: 'full_size' },
    { name: 'Pushed by', visible: true, width: '20%', sortKey: 'last_updater_username' },
    { name: 'Last update', visible: true, width: '25%', sortKey: 'last_updated' },
    { name: 'Copy', visible: true, width: '10%', sortKey: '' }
  ];

  let currentTagPage = 1;
  let hasMoreTags = false;
  let isLoadingMoreTags = false;
  let tagSearchTimeout: number | null = null;

  onMount(async () => {
    const savedTheme = storage.getLocal('DTVTheme');
    darkMode = savedTheme === 'dark';

    try {
      const response = await getRepositories({}, window);
      allRepositories = response?.results || [];
      repositories = { 
        results: sortData(response?.results || [], repoSortConfig, {
          pull_count: 'number',
          storage_size: 'number',
          last_updated: 'date'
        }) 
      };
    } catch (error) {
      console.error('Error:', error);
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
      currentTagPage = 1;
      
      const tags = await getRepositoryTags(repoName, { page: 1, page_size: 15 }, window);
      allTags = tags?.results || [];
      selectedRepoTags = allTags;
      hasMoreTags = tags?.next || false;
    } catch (error) {
      console.error('Error:', error);
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
      refreshTags();
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
      const response = await getRepositories({}, window);
      allRepositories = response?.results || [];
      repositories = { results: allRepositories };
    } catch (error) {
      console.error('Error:', error);
    } finally {
      isLoadingRepositories = false;
    }
  }

  async function refreshTags() {
    if (!selectedRepoName) return;
    
    try {
      isLoadingTags = true;
      currentTagPage = 1;
      const tags = await getRepositoryTags(selectedRepoName, { 
        page: 1, 
        page_size: 15,
        name: tagSearchTerm || undefined,
        ordering: tagSortConfig.column ? 
          (tagSortConfig.direction === 'asc' ? tagSortConfig.column : `-${tagSortConfig.column}`) : 
          undefined
      }, window);
      allTags = tags?.results || [];
      selectedRepoTags = allTags;
      hasMoreTags = tags?.next || false;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      isLoadingTags = false;
    }
  }

  async function loadMoreTags() {
    if (!selectedRepoName || isLoadingMoreTags || !hasMoreTags) return;
    
    try {
      isLoadingMoreTags = true;
      currentTagPage += 1;
      const tags = await getRepositoryTags(selectedRepoName, { 
        page: currentTagPage, 
        page_size: 15,
        name: tagSearchTerm || undefined,
        ordering: tagSortConfig.column ? 
          (tagSortConfig.direction === 'asc' ? tagSortConfig.column : `-${tagSortConfig.column}`) : 
          undefined
      }, window);
      
      const newTags = tags?.results || [];
      allTags = [...allTags, ...newTags];
      selectedRepoTags = [...selectedRepoTags, ...newTags];
      hasMoreTags = tags?.next || false;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      isLoadingMoreTags = false;
    }
  }

  function handleTagScroll(event: UIEvent) {
    const element = event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 200) {
      loadMoreTags();
    }
  }

  function isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);
    
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  function isYesterday(dateString: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    return date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
  }

  function isThisWeek(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && !isToday(dateString) && !isYesterday(dateString);
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    if (isModalOpen) {
      if (document.activeElement !== modalSearchBarRef) {
        tagSearchTerm = '';
      }
      modalSearchBarRef?.focus();
      tagSearchTerm += event.key;
    } else {
      if (document.activeElement !== searchBarRef) {
        searchTerm = '';
      }
      searchBarRef?.focus();
      searchTerm += event.key;
    }
  }

  function handleColumnToggle(event: CustomEvent<{column: string}>) {
    repoTableColumns = repoTableColumns.map(col => {
      if (col.name === event.detail.column) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
  }

  function handleTagColumnToggle(event: CustomEvent<{column: string}>) {
    tagTableColumns = tagTableColumns.map(col => {
      if (col.name === event.detail.column) {
        return { ...col, visible: !col.visible };
      }
      return col;
    });
  }

  onMount(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  });

  function isLatestTag(tag: Tag, allTags: Tag[]): boolean {
    if (allTags.length === 0) return false;
    const latestDate = Math.max(...allTags.map(t => new Date(t.last_updated).getTime()));
    return new Date(tag.last_updated).getTime() === latestDate;
  }

  async function handleTagSearch(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value;
    tagSearchTerm = searchValue;
    
    if (tagSearchTimeout) {
      clearTimeout(tagSearchTimeout);
    }
    
    tagSearchTimeout = setTimeout(async () => {
      try {
        isLoadingTags = true;
        currentTagPage = 1;
        
        const tags = await getRepositoryTags(selectedRepoName, { 
          page: 1, 
          page_size: 15,
          name: searchValue || undefined,
          ordering: tagSortConfig.column ? 
            (tagSortConfig.direction === 'asc' ? tagSortConfig.column : `-${tagSortConfig.column}`) : 
            undefined
        }, window);
        
        allTags = tags?.results || [];
        selectedRepoTags = allTags;
        hasMoreTags = tags?.next || false;
      } catch (error) {
        console.error('Error:', error);
      } finally {
        isLoadingTags = false;
      }
    }, 500);
  }
</script>

<div class="app-container" class:dark={darkMode}>
  <div class="table-container" class:dark={darkMode}>
    <div class="sticky-header">
      <div class="controls-container">
        <SearchBar
          bind:value={searchTerm}
          bind:inputRef={searchBarRef}
          placeholder="Search repositories..."
          {darkMode}
          onRefresh={refreshRepositories}
        />
        <ThemeToggle 
          {darkMode} 
          on:themeChange={(e) => darkMode = e.detail} 
        />
        <ColumnSelector 
          {darkMode}
          columns={repoTableColumns}
          on:select={handleColumnToggle}
        />
      </div>

      {#if !isLoadingRepositories}
        <div class="table-header">
          <Table striped hover responsive class={darkMode ? 'table-dark' : ''}>
            <thead>
              <tr>
                {#each repoTableColumns.filter(col => col.visible) as column}
                  <th 
                    style="width: {column.width}{column.name === 'Last update' ? '; white-space: nowrap' : ''}" 
                    on:click={() => handleSort(column.sortKey, true)}
                  >
                    {column.name} {#if repoSortConfig.column === column.sortKey}
                      <span>{repoSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    {/if}
                  </th>
                {/each}
              </tr>
            </thead>
          </Table>
        </div>
      {/if}
    </div>

    <div class="table-body">
      {#if isLoadingRepositories}
        <div class="loader-container">
          <div class="loader"></div>
        </div>
      {:else}
        <Table striped hover responsive class={darkMode ? 'table-dark' : ''}>
          <tbody>
            {#each repositories.results || [] as repo}
              <tr on:click={() => handleRepositoryClick(repo.name)} style="cursor: pointer;">
                {#each repoTableColumns.filter(col => col.visible) as column}
                  <td style="width: {column.width}{column.name === 'Last update' ? '; white-space: nowrap' : ''}">
                    {#if column.name === 'Name'}
                      {repo.name}
                    {:else if column.name === 'Description'}
                      {repo.description || '-'}
                    {:else if column.name === 'Downloads'}
                      {repo.pull_count.toLocaleString()}
                    {:else if column.name === 'Size'}
                      {formatSize(repo.storage_size)}
                    {:else if column.name === 'Last update'}
                      {formatDate(repo.last_updated)}
                      {#if isToday(repo.last_updated)}
                        <Badge text="TODAY" color="success" />
                      {:else if isYesterday(repo.last_updated)}
                        <Badge text="YESTERDAY" color="warning" />
                      {:else if isThisWeek(repo.last_updated)}
                        <Badge 
                          text="LAST DAYS" 
                          color="danger" 
                          tooltipText="Updated in the last 7 days"
                        />
                      {/if}
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </Table>
      {/if}
    </div>
  </div>

  <Modal 
    isOpen={isModalOpen} 
    toggle={toggleModal} 
    size="xl" 
    class={darkMode ? 'modal-dark' : ''}
  >
    <ModalBody>
      <h2 class="selected-repo-name-title">{selectedRepoName}</h2>
      <div class="table-container modal-table" class:dark={darkMode}>
        <div class="sticky-header">
          <div class="controls-container">
            <SearchBar
              bind:value={tagSearchTerm}
              bind:inputRef={modalSearchBarRef}
              placeholder="Search tags..."
              {darkMode}
              onRefresh={refreshTags}
              onInput={handleTagSearch}
            />
            <ThemeToggle 
              {darkMode} 
              on:themeChange={(e) => darkMode = e.detail} 
            />
            <ColumnSelector 
              {darkMode}
              columns={tagTableColumns}
              on:select={handleTagColumnToggle}
            />
          </div>

          {#if !isLoadingTags}
            <div class="table-header">
              <Table striped hover responsive class={darkMode ? 'table-dark' : ''}>
                <thead>
                  <tr>
                    {#each tagTableColumns.filter(col => col.visible) as column}
                      <th 
                        style="width: {column.width}{column.name === 'Last update' ? '; white-space: nowrap' : ''}" 
                        on:click={() => column.sortKey && handleSort(column.sortKey, false)}
                        class={column.sortKey ? 'sortable' : ''}
                      >
                        {column.name} {#if column.sortKey && tagSortConfig.column === column.sortKey}
                          <span>{tagSortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                        {/if}
                      </th>
                    {/each}
                  </tr>
                </thead>
              </Table>
            </div>
          {/if}
        </div>

        <div class="table-body" on:scroll={handleTagScroll}>
          {#if isLoadingTags}
            <div class="loader-container">
              <div class="loader"></div>
            </div>
          {:else}
            {#key tagTableColumns}
              <Table striped hover responsive class={darkMode ? 'table-dark' : ''}>
                <tbody>
                  {#each selectedRepoTags as tag}
                    <tr class={isLatestTag(tag, selectedRepoTags) ? 'latest-tag' : ''}>
                      {#each tagTableColumns.filter(col => col.visible) as column}
                        <td style="width: {column.width}{column.name === 'Last update' ? '; white-space: nowrap' : ''}">
                          {#if column.name === 'Name'}
                            {tag.name}
                            {#if isLatestTag(tag, selectedRepoTags)}
                              <Badge text="LATEST" color="info" />
                            {/if}
                          {:else if column.name === 'Size'}
                            {formatSize(tag.full_size)}
                          {:else if column.name === 'Pushed by'}
                            {tag.last_updater_username}
                          {:else if column.name === 'Last update'}
                            {formatDate(tag.last_updated)}
                            {#if isToday(tag.last_updated)}
                              <Badge text="TODAY" color="success" />
                            {:else if isYesterday(tag.last_updated)}
                              <Badge text="YESTERDAY" color="warning" />
                            {:else if isThisWeek(tag.last_updated)}
                              <Badge 
                                text="LAST DAYS" 
                                color="danger" 
                                tooltipText="Updated in the last 7 days"
                              />
                            {/if}
                          {:else if column.name === 'Copy'}
                            <CopyImage 
                              imageName={selectedRepoName} 
                              tagName={tag.name}
                              {darkMode}
                            />
                          {/if}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </Table>
              {#if isLoadingMoreTags}
                <div class="loader-container">
                  <div class="loader"></div>
                </div>
              {/if}
            {/key}
          {/if}
        </div>
      </div>
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
  .selected-repo-name-title {
    margin-bottom: 1rem;
  }
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
    padding: 0;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background-color: white;
    transition: all 0.3s ease;
    height: calc(100vh - 4rem);
    display: flex;
    flex-direction: column;
  }

  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: inherit;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    padding: 1rem 1rem 0 1rem;
  }

  .table-header {
    margin-bottom: -1px;
  }

  .table-header :global(table) {
    margin: 0;
  }

  .table-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 1rem;
    scrollbar-width: none; 
    -ms-overflow-style: none; 
  }

  .table-body::-webkit-scrollbar {
    display: none; 
  }

  :global(.table-body table),
  :global(.table-body tbody),
  :global(.table-body tr),
  :global(.table-body td) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  :global(.table-body table::-webkit-scrollbar),
  :global(.table-body tbody::-webkit-scrollbar),
  :global(.table-body tr::-webkit-scrollbar),
  :global(.table-body td::-webkit-scrollbar) {
    display: none;
  }

  :global(.table-responsive) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  :global(.table-responsive::-webkit-scrollbar) {
    display: none;
  }

  .dark .sticky-header {
    background-color: #1a1a1a;
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
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  :global(th span) {
    margin-left: 0.5rem;
    display: inline-block;
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

  :global(.modal-body) {
    padding: 1rem !important;
    max-height: 80vh;
    overflow: hidden;
  }

  .modal-table {
    height: calc(70vh - 4rem);
    margin: 0;
    box-shadow: none;
  }

  .modal-table .sticky-header {
    background-color: inherit;
    border-radius: 0;
  }

  .dark .modal-table .sticky-header {
    background-color: #1a1a1a;
  }

  .selected-repo-name-title {
    margin-bottom: 1rem;
    padding: 0 1rem;
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

  :global(th.sortable) {
    cursor: pointer;
  }

  :global(th:not(.sortable)) {
    cursor: default;
  }

  :global(tr.latest-tag) {
    background-color: rgba(23, 162, 184, 0.1) !important;
  }

  :global(.table-dark tr.latest-tag) {
    background-color: rgba(23, 162, 184, 0.2) !important;
  }

  :global(tr.latest-tag:hover) {
    background-color: rgba(23, 162, 184, 0.2) !important;
  }

  :global(.table-dark tr.latest-tag:hover) {
    background-color: rgba(23, 162, 184, 0.3) !important;
  }
</style>

<svelte:head>
  {@html `
    <script>
      document.body.className = ${darkMode ? "'dark'" : "''"};
    </script>
  `}
</svelte:head>
