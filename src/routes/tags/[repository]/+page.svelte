<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getRepositoryTags, type Tag } from '$lib/api';
	import Header from '$lib/components/Header.svelte';
	import Table from '$lib/components/Table.svelte';
	import type { Column } from '$lib/components/Table.types';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';

	let tags: Tag[] = [];
	let isLoading = false;
	let isLoadingMore = false;
	let error: string | null = null;
	let translations: Record<string, string> = {};
	let repository: string = '';
	let currentPage = 1;
	let hasMore = true;
	let columns: Column[] = [];
	let latestTag: string | null = null;
	let searchTerm = '';
	let initialLoading = true;

	$: repository = $page.params.repository;

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			tagsTitle: t('tags.title', language).replace('{repository}', repository),
			backToRepos: t('tags.backToRepos', language),
			tagsTableName: t('tags.table.name', language),
			tagsTableSize: t('tags.table.size', language),
			tagsTablePushedBy: t('tags.table.pushedBy', language),
			tagsTableLastUpdate: t('tags.table.lastUpdate', language),
			tagsTableCopy: t('tags.table.copy', language),
			copyTooltip: t('tags.copyTooltip', language),
			copied: t('tags.copied', language),
			tagsEmpty: t('tags.empty', language),
			tagsError: t('tags.error', language),
			latestBadge: t('tags.latest', language),
			refreshTooltip: t('table.refresh', language),
			searchPlaceholder: t('table.search', language)
		};

		columns = [
			{ key: 'name', label: translations.tagsTableName, sortable: true },
			{ key: 'full_size', label: translations.tagsTableSize, sortable: true },
			{ key: 'last_updater_username', label: translations.tagsTablePushedBy, sortable: true },
			{ key: 'last_updated', label: translations.tagsTableLastUpdate, sortable: true },
			{ key: 'copy', label: translations.tagsTableCopy, width: 'w-24', sortable: false }
		];
	}

	function formatBytes(bytes: number | undefined | null): string {
		if (!bytes || bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDate(dateString: string | undefined | null): string {
		if (!dateString) return '-';
		try {
			const localeCode = $currentLanguage === 'es' ? 'es-ES' : 'en-US';
			return new Date(dateString).toLocaleDateString(localeCode, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (error) {
			return '-';
		}
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			// TODO: Show temporary "copied" feedback
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	}

	function backToRepositories() {
		goto('/');
	}

	async function getLatestTag() {
		try {
			const response = await getRepositoryTags(repository, {
				page_size: 100
			});

			if (response.results.length === 0) return null;

			const latestTag = response.results.reduce((latest, current) => {
				const latestDate = new Date(latest.last_updated);
				const currentDate = new Date(current.last_updated);
				return currentDate > latestDate ? current : latest;
			});

			return latestTag.name;
		} catch (error) {
			console.error('Error loading latest tag:', error);
			return null;
		}
	}

	async function loadTags(search?: string) {
		try {
			isLoading = true;
			error = null;
			currentPage = 1;

			const searchOptions = search ? { name: search } : {};
			const [tagsResponse, latest] = await Promise.all([
				getRepositoryTags(repository, { page: 1, page_size: 20, ...searchOptions }),
				getLatestTag()
			]);

			tags = tagsResponse.results;
			hasMore = tagsResponse.next;
			latestTag = latest;
		} catch (e) {
			console.error('Error loading tags:', e);
			error = translations.tagsError || 'Error loading tags';
		} finally {
			isLoading = false;
		}
	}

	function handleSearch(search: string) {
		searchTerm = search;
		loadTags(search);
	}

	async function loadMoreTags() {
		if (isLoadingMore || !hasMore) return;

		try {
			isLoadingMore = true;
			currentPage += 1;

			const searchOptions = searchTerm ? { name: searchTerm } : {};
			const tagsResponse = await getRepositoryTags(repository, {
				page: currentPage,
				page_size: 20,
				...searchOptions
			});
			tags = [...tags, ...tagsResponse.results];
			hasMore = tagsResponse.next;
		} catch (e) {
			console.error('Error loading more tags:', e);
		} finally {
			isLoadingMore = false;
		}
	}

	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		if (target.scrollTop + target.clientHeight >= target.scrollHeight - 5) {
			loadMoreTags();
		}
	}

	async function initializePage() {
		try {
			currentLanguage.init();
			await loadTranslations($currentLanguage);
			await loadTags();
		} catch (e) {
			console.error('Error initializing page:', e);
			error = 'Error loading data';
		} finally {
			initialLoading = false;
		}
	}

	onMount(() => {
		document.title = `Tags - ${repository} - DockerTokenViewer`;
		initializePage();
	});

	$: if (!isLoading && repository) {
		loadTranslations($currentLanguage);
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	<Header />

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if initialLoading}
			<div class="flex items-center justify-center py-32">
				<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
			</div>
		{:else}
			<div class="mb-6">
				<div class="flex items-center space-x-4">
					<button
						on:click={backToRepositories}
						class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
					>
						{translations.backToRepos}
					</button>
				</div>
				<h2 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
					{translations.tagsTitle}
				</h2>
			</div>

			{#if error}
				<div class="border-l-4 border-red-400 bg-red-50 p-4 dark:border-red-400 dark:bg-red-900/20">
					<p class="text-sm text-red-700 dark:text-red-400">{error}</p>
				</div>
			{/if}

			<Table
				{columns}
				rows={tags as any[]}
				{isLoading}
				isEmpty={tags.length === 0}
				emptyMessage={translations.tagsEmpty}
				onScroll={handleScroll}
				{isLoadingMore}
				onRefresh={() => loadTags()}
				refreshTooltip={translations.refreshTooltip}
				onSearch={handleSearch}
				searchValue={searchTerm}
				searchPlaceholder={translations.searchPlaceholder}
			>
				<svelte:fragment slot="cell" let:row let:column let:value>
					{#if column.key === 'name'}
						<div class="flex items-center space-x-2">
							<div class="text-sm font-medium text-gray-900 dark:text-white">
								{value}
							</div>
							{#if latestTag && value === latestTag}
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
								>
									{translations.latestBadge}
								</span>
							{/if}
						</div>
					{:else if column.key === 'full_size'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatBytes(value as number)}
						</div>
					{:else if column.key === 'last_updater_username'}
						<div class="text-sm text-gray-900 dark:text-white">
							{value || '-'}
						</div>
					{:else if column.key === 'last_updated'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatDate(value as string)}
						</div>
					{:else if column.key === 'copy'}
						<button
							on:click={() => copyToClipboard(`docker pull ${repository}:${row.name}`)}
							class="rounded p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							title={translations.copyTooltip}
							aria-label={translations.copyTooltip}
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
								/>
							</svg>
						</button>
					{/if}
				</svelte:fragment>
			</Table>
		{/if}
	</main>
</div>
