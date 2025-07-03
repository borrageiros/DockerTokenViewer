<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Column, Row } from './Table.types';

	export let columns: Column[] = [];
	export let rows: Row[] = [];
	export let isLoading = false;
	export let isEmpty = false;
	export let emptyMessage = 'No hay datos disponibles';
	export let onRowClick: ((row: Row) => void) | null = null;
	export let onScroll: ((event: Event) => void) | null = null;
	export let isLoadingMore = false;
	export let maxHeight = 'max-h-[32rem]';
	export let onRefresh: (() => void) | null = null;
	export let refreshTooltip = 'Refresh';
	export let onSearch: ((searchTerm: string) => void) | null = null;
	export let searchValue = '';
	export let searchPlaceholder = 'Search...';

	const dispatch = createEventDispatcher();
	let searchTimeout: number;

	let sortColumn: string | null = null;
	let sortDirection: 'asc' | 'desc' = 'asc';
	let sortedRows: Row[] = [];

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

	function handleSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		const searchTerm = target.value;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		searchTimeout = setTimeout(() => {
			if (onSearch) {
				onSearch(searchTerm);
			}
			dispatch('search', searchTerm);
		}, 500);
	}

	function handleSort(column: Column) {
		if (!column.sortable) return;

		if (sortColumn === column.key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column.key;
			sortDirection = 'asc';
		}
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

	// Reactive statement to sort rows when data or sort params change
	$: sortedRows = sortRows(rows, sortColumn, sortDirection);
</script>

<div
	class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
>
	{#if onRefresh || onSearch}
		<div
			class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
		>
			{#if onSearch}
				<div class="flex items-center space-x-2">
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					<input
						type="text"
						placeholder={searchPlaceholder}
						value={searchValue}
						on:input={handleSearch}
						class="w-64 rounded-md border border-gray-300 px-3 py-1 text-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400"
					/>
				</div>
			{:else}
				<div></div>
			{/if}

			{#if onRefresh}
				<button
					on:click={onRefresh}
					class="inline-flex items-center rounded-md p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
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
				</button>
			{/if}
		</div>
	{/if}
	<div class="{maxHeight} overflow-y-auto" on:scroll={handleScroll}>
		<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="sticky top-0 bg-gray-50 dark:bg-gray-900">
				<tr>
					{#each columns as column}
						<th
							class="px-6 py-3 text-{column.align ||
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
								<span>{column.label}</span>
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
						<td colspan={columns.length} class="px-6 py-16 text-center">
							<div class="flex items-center justify-center">
								<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
							</div>
						</td>
					</tr>
				{:else if isEmpty}
					<tr>
						<td colspan={columns.length} class="px-6 py-16 text-center">
							<p class="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
						</td>
					</tr>
				{:else}
					{#each sortedRows as row}
						<tr
							class="hover:bg-gray-50 dark:hover:bg-gray-700 {onRowClick ? 'cursor-pointer' : ''}"
							on:click={() => handleRowClick(row)}
						>
							{#each columns as column}
								<td class="px-6 py-4 {column.key === 'description' ? '' : 'whitespace-nowrap'}">
									<slot name="cell" {row} {column} value={row[column.key]}>
										<div class="text-sm text-gray-900 dark:text-white">
											{row[column.key] || '-'}
										</div>
									</slot>
								</td>
							{/each}
						</tr>
					{/each}
					{#if isLoadingMore}
						<tr>
							<td colspan={columns.length} class="px-6 py-4 text-center">
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
