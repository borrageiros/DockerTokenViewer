<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { Column, Row } from './Table.types';
	import Button from './Button.svelte';
	import Dropdown from './Dropdown.svelte';
	import { openInApp } from '$lib/utils/common';

	export let columns: Column[] = [];
	export let rows: Row[] = [];
	export let isLoading = false;
	export let isEmpty = false;
	export let emptyMessage = 'No data available';
	export let onRowClick: ((row: Row) => void) | null = null;
	export let getRowHref: ((row: Row) => string) | null = null;
	export let onScroll: ((event: Event) => void) | null = null;
	export let isLoadingMore = false;
	export let maxHeight = 'h-[calc(100vh-15rem)]';
	export let onRefresh: (() => void) | null = null;
	export let refreshTooltip = 'Refresh';
	export let onSearch: ((searchTerm: string) => void) | null = null;
	export let searchValue = '';
	export let searchPlaceholder = 'Search...';
	export let settingsTooltip = 'Configure columns';
	export let columnsLabel = 'Visible columns';
	export let visibleColumns: Record<string, boolean> = {};
	export let searchModes: { id: string; label: string }[] = [];
	export let searchMode = '';
	export let searchModesLabel = 'Search mode';
	export let onSearchModeChange: ((mode: string) => void) | null = null;
	export let submitSearchOnly = false;
	export let infoMessage = '';
	export let progress: { completed: number; total: number } | null = null;
	export let latestOnly = false;
	export let latestOnlyLabel = '';
	export let matchCountText = '';
	export let defaultSortColumn: string | null = null;
	export let defaultSortDirection: 'asc' | 'desc' = 'asc';
	export let onSort: ((sort: { column: string | null; direction: 'asc' | 'desc' }) => void) | null =
		null;

	const dispatch = createEventDispatcher();
	let searchTimeout: ReturnType<typeof setTimeout>;
	let isSettingsOpen = false;
	let isSearchModeOpen = false;
	let inputValue = '';
	let appliedSearchValue = '';
	let searchInput: HTMLInputElement | undefined;
	let infoBarHeight = 0;

	$: showInfoBar = Boolean(latestOnlyLabel || infoMessage || progress || matchCountText);
	$: if (!showInfoBar) infoBarHeight = 0;

	let sortColumn: string | null = defaultSortColumn;
	let sortDirection: 'asc' | 'desc' = defaultSortDirection;
	let lastDefaultSort = `${defaultSortColumn}:${defaultSortDirection}`;
	let sortedRows: Row[] = [];
	let filteredColumns: Column[] = [];

	function isActionColumn(key: string) {
		return key === 'copy' || key === 'favorite';
	}

	function handleRowClick(row: Row) {
		if (onRowClick) {
			onRowClick(row);
		}
		dispatch('rowClick', row);
	}

	function handleScroll(event: Event) {
		if (onScroll) {
			onScroll(event);
		}
		dispatch('scroll', event);
	}

	function submitCurrentSearch() {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		if (onSearch) {
			onSearch(inputValue);
		}
		dispatch('search', inputValue);
	}

	function handleSearchInput() {
		if (submitSearchOnly) return;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(() => {
			submitCurrentSearch();
		}, 500);
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		submitCurrentSearch();
	}

	function selectSearchMode(mode: string) {
		isSearchModeOpen = false;
		searchMode = mode;
		inputValue = '';
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		if (onSearchModeChange) {
			onSearchModeChange(mode);
		}
	}

	function handleSort(column: Column) {
		if (!column.sortable) return;

		if (sortColumn === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column.key;
			sortDirection = 'asc';
		}

		const sort = { column: sortColumn, direction: sortDirection };
		if (onSort) onSort(sort);
		dispatch('sort', sort);
	}

	function sortRows(rows: Row[], column: string | null, direction: 'asc' | 'desc'): Row[] {
		if (!column) return rows;

		return [...rows].sort((a, b) => {
			const aVal = a[column];
			const bVal = b[column];

			// Handle null/undefined values
			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return direction === 'asc' ? 1 : -1;
			if (bVal == null) return direction === 'asc' ? -1 : 1;

			// Convert to string for comparison if needed
			const aStr = String(aVal).toLowerCase();
			const bStr = String(bVal).toLowerCase();

			// Try numeric comparison first
			const aNum = Number(aVal);
			const bNum = Number(bVal);

			if (!isNaN(aNum) && !isNaN(bNum)) {
				return direction === 'asc' ? aNum - bNum : bNum - aNum;
			}

			// Date comparison
			const aDate = new Date(aVal as string);
			const bDate = new Date(bVal as string);

			if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
				return direction === 'asc'
					? aDate.getTime() - bDate.getTime()
					: bDate.getTime() - aDate.getTime();
			}

			// String comparison
			if (aStr < bStr) return direction === 'asc' ? -1 : 1;
			if (aStr > bStr) return direction === 'asc' ? 1 : -1;
			return 0;
		});
	}

	function initializeVisibleColumns() {
		const newVisibleColumns: Record<string, boolean> = {};
		let hasChanged = false;

		columns.forEach((column) => {
			if (visibleColumns[column.key] === undefined) {
				newVisibleColumns[column.key] = column.visible !== false;
				hasChanged = true;
			} else {
				newVisibleColumns[column.key] = visibleColumns[column.key];
			}
		});

		if (hasChanged) {
			visibleColumns = newVisibleColumns;
		}
	}

	function toggleColumnVisibility(columnKey: string) {
		const currentValue = visibleColumns[columnKey];
		const newValue = !currentValue;

		// Ensure at least one column remains visible
		if (newValue === false) {
			const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
			if (visibleCount <= 1) {
				return; // Don't allow hiding the last visible column
			}
		}

		visibleColumns = {
			...visibleColumns,
			[columnKey]: newValue
		};
	}

	function canCaptureTyping(event: KeyboardEvent): boolean {
		if (!onSearch || !searchInput) return false;
		if (event.defaultPrevented || event.isComposing) return false;
		if (event.ctrlKey || event.metaKey || event.altKey) return false;
		if (event.key.length !== 1) return false;

		const target = event.target;
		if (!(target instanceof HTMLElement)) return true;
		if (target.isContentEditable) return false;

		const tag = target.tagName;
		return tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && tag !== 'BUTTON';
	}

	async function handleWindowKeydown(event: KeyboardEvent) {
		if (!canCaptureTyping(event)) return;

		event.preventDefault();
		inputValue += event.key;
		await tick();
		searchInput?.focus();
		searchInput?.setSelectionRange(inputValue.length, inputValue.length);
		handleSearchInput();
	}

	$: if (searchValue !== appliedSearchValue) {
		appliedSearchValue = searchValue;
		const typingAhead =
			!!searchInput && document.activeElement === searchInput && inputValue.startsWith(searchValue);
		if (!typingAhead) {
			inputValue = searchValue;
		}
	}

	$: {
		const nextDefaultSort = `${defaultSortColumn}:${defaultSortDirection}`;
		if (nextDefaultSort !== lastDefaultSort) {
			lastDefaultSort = nextDefaultSort;
			sortColumn = defaultSortColumn;
			sortDirection = defaultSortDirection;
		}
	}

	$: filteredColumns = columns.filter((column) => visibleColumns[column.key]);

	$: sortedRows = sortRows(rows, sortColumn, sortDirection);

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleWindowKeydown, true);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleWindowKeydown, true);
		}
	});
</script>

<div
	class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
>
	{#if onRefresh || onSearch}
		<div
			class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
		>
			{#if onSearch}
				<div class="flex flex-wrap items-center gap-2">
					<Button
						variant="primary"
						on:click={submitCurrentSearch}
						title={searchPlaceholder}
						aria-label={searchPlaceholder}
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</Button>
					<input
						type="text"
						placeholder={searchPlaceholder}
						bind:this={searchInput}
						bind:value={inputValue}
						on:input={handleSearchInput}
						on:keydown={handleSearchKeydown}
						autocomplete="off"
						spellcheck="false"
						class="w-64 rounded-md border border-gray-300 px-3 py-1 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400"
					/>
					{#if searchModes.length > 0}
						<Dropdown bind:open={isSearchModeOpen} align="start" width="md">
							<svelte:fragment slot="trigger" let:toggle let:open>
								<button
									type="button"
									on:click={toggle}
									aria-label={searchModesLabel}
									aria-expanded={open}
									class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white py-1 pr-2 pl-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
								>
									{searchModes.find((mode) => mode.id === searchMode)?.label}
									<svg
										class="h-4 w-4 text-gray-500 dark:text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 9l6 6 6-6"
										/>
									</svg>
								</button>
							</svelte:fragment>
							{#each searchModes as mode (mode.id)}
								<Button
									variant="menu"
									active={mode.id === searchMode}
									on:click={() => selectSearchMode(mode.id)}
								>
									{mode.label}
								</Button>
							{/each}
						</Dropdown>
					{/if}
				</div>
			{:else}
				<div></div>
			{/if}

			<div class="flex items-center space-x-2">
				{#if onRefresh}
					<Button
						variant="icon"
						on:click={onRefresh}
						title={refreshTooltip}
						aria-label={refreshTooltip}
						disabled={isLoading}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="feather feather-refresh-cw {isLoading ? 'animate-spin' : ''}"
							><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path
								d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
							/></svg
						>
					</Button>
				{/if}

				<Dropdown bind:open={isSettingsOpen} align="end" width="md">
					<svelte:fragment slot="trigger" let:toggle let:open>
					<Button
						variant="icon"
						on:click={toggle}
						title={settingsTooltip}
						aria-label={settingsTooltip}
						aria-expanded={open}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="3" />
							<path
								d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
							/>
						</svg>
					</Button>
					</svelte:fragment>

					<div class="px-4 py-2 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
						{columnsLabel}
					</div>
					{#each columns as column}
						<div
							class="flex cursor-pointer items-center px-4 py-2 text-sm whitespace-normal text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
							on:click|preventDefault={() => toggleColumnVisibility(column.key)}
							on:keydown|preventDefault={(e) => {
								if (e.key === 'Enter' || e.key === ' ') toggleColumnVisibility(column.key);
							}}
							tabindex="0"
							role="checkbox"
							aria-checked={visibleColumns[column.key]}
							aria-label={column.label}
						>
							<input
								type="checkbox"
								checked={visibleColumns[column.key]}
								class="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
								readonly
							/>
							{column.label}
						</div>
					{/each}
				</Dropdown>
			</div>
		</div>
		{#if showInfoBar}
			<div
				bind:offsetHeight={infoBarHeight}
				class="border-b border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
			>
				<div class="flex items-center gap-4">
					{#if latestOnlyLabel}
						<label class="flex shrink-0 cursor-pointer items-center gap-2">
							<input
								type="checkbox"
								bind:checked={latestOnly}
								class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
							/>
							{latestOnlyLabel}
						</label>
					{/if}
					{#if infoMessage}
						<p class="min-w-0 flex-1 truncate">{infoMessage}</p>
					{:else}
						<div class="flex-1"></div>
					{/if}
					{#if matchCountText}
						<p class="shrink-0">{matchCountText}</p>
					{/if}
				</div>
				{#if progress && progress.total > 0 && progress.completed < progress.total}
					<div class="mt-2 h-1 w-full overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
						<div
							class="h-full bg-blue-600 transition-[width] duration-200"
							style="width: {(progress.completed / progress.total) * 100}%"
						></div>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
	<div
		class="{infoBarHeight > 0 ? '' : maxHeight} custom-scrollbar overflow-y-auto"
		style={infoBarHeight > 0 ? `height: calc(100vh - 15rem - ${infoBarHeight}px)` : undefined}
		on:scroll={handleScroll}
	>
		<table class="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
				<tr>
					{#each filteredColumns as column}
						<th
							class="px-4 py-3 text-{column.align ||
								'left'} text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400 {column.width ||
								''} {column.sortable
								? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800'
								: ''}"
							on:click={() => handleSort(column)}
						>
							<div
								class="flex items-center {column.align === 'center'
									? 'justify-center'
									: column.align === 'right'
										? 'justify-end'
										: 'justify-start'}"
							>
								<span>{column.header ?? column.label}</span>
								{#if column.sortable}
									<div class="ml-1 flex flex-col">
										{#if sortColumn === column.key}
											{#if sortDirection === 'asc'}
												<svg
													class="h-3 w-3 text-gray-900 dark:text-white"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fill-rule="evenodd"
														d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
														clip-rule="evenodd"
													/>
												</svg>
											{:else}
												<svg
													class="h-3 w-3 text-gray-900 dark:text-white"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fill-rule="evenodd"
														d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
														clip-rule="evenodd"
													/>
												</svg>
											{/if}
										{:else}
											<svg class="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
												<path d="M5 12l5-5 5 5H5z" />
											</svg>
										{/if}
									</div>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
				{#if isLoading}
					<tr>
						<td colspan={filteredColumns.length} class="px-6 py-16 text-center">
							<div class="flex items-center justify-center">
								<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
							</div>
						</td>
					</tr>
				{:else if isEmpty}
					<tr>
						<td colspan={filteredColumns.length} class="px-6 py-16 text-center">
							<p class="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
						</td>
					</tr>
				{:else}
					{#each sortedRows as row}
						{@const href = getRowHref ? getRowHref(row) : ''}
						<tr
							class="hover:bg-gray-50 dark:hover:bg-gray-700 {onRowClick || href
								? 'cursor-pointer'
								: ''}"
							on:click={() => {
								if (!href) handleRowClick(row);
							}}
						>
							{#each filteredColumns as column}
								<td class="whitespace-nowrap">
									{#if href && !isActionColumn(column.key)}
										<a
											{href}
											class="block cursor-pointer px-4 py-4 text-inherit no-underline"
											on:click={(event) => openInApp(event, href)}
										>
											<slot name="cell" {row} {column} value={row[column.key]}>
												<div class="text-sm text-gray-900 dark:text-white">
													{row[column.key] || '-'}
												</div>
											</slot>
										</a>
									{:else}
										<div class="px-4 py-4">
											<slot name="cell" {row} {column} value={row[column.key]}>
												<div class="text-sm text-gray-900 dark:text-white">
													{row[column.key] || '-'}
												</div>
											</slot>
										</div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
					{#if isLoadingMore}
						<tr>
							<td colspan={filteredColumns.length} class="px-6 py-4 text-center">
								<div class="flex items-center justify-center">
									<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
								</div>
							</td>
						</tr>
					{/if}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 8px;
	}

	.custom-scrollbar::-webkit-scrollbar-track {
		background-color: rgb(243 244 246);
		border-radius: 4px;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgb(209 213 219);
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: rgb(156 163 175);
	}

	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: rgb(209 213 219) rgb(243 244 246);
	}

	:global(.dark) .custom-scrollbar::-webkit-scrollbar-track {
		background-color: rgb(31 41 55);
	}

	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background-color: rgb(75 85 99);
	}

	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background-color: rgb(107 114 128);
	}

	:global(.dark) .custom-scrollbar {
		scrollbar-color: rgb(75 85 99) rgb(31 41 55);
	}
</style>
