<script lang="ts">
	import { getRepositories, type RepositoriesResponse } from '$lib/api';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Table from '$lib/components/Table.svelte';
	import type { Column } from '$lib/components/Table.types';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';

	let repositories: RepositoriesResponse = {
		count: 0,
		results: []
	};
	let isLoading = false;
	let error: string | null = null;
	let translations: Record<string, string> = {};
	let columns: Column[] = [];
	let searchTerm = '';
	let initialLoading = true;

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			repoTitle: t('repositories.title', language),
			repoTableName: t('repositories.table.name', language),
			repoTableDescription: t('repositories.table.description', language),
			repoTableDownloads: t('repositories.table.downloads', language),
			repoTableSize: t('repositories.table.size', language),
			repoTableLastUpdate: t('repositories.table.lastUpdate', language),
			badgeToday: t('repositories.badges.today', language),
			badgeYesterday: t('repositories.badges.yesterday', language),
			badgeLastDays: t('repositories.badges.lastDays', language),
			badgeLastDaysTooltip: t('repositories.badges.lastDaysTooltip', language),
			noDescription: t('repositories.noDescription', language),
			repoEmpty: t('repositories.empty', language),
			repoError: t('repositories.error', language),
			refreshTooltip: t('table.refresh', language),
			searchPlaceholder: t('table.search', language)
		};

		columns = [
			{ key: 'name', label: translations.repoTableName, sortable: true },
			{ key: 'description', label: translations.repoTableDescription, sortable: true },
			{ key: 'pull_count', label: translations.repoTableDownloads, sortable: true },
			{ key: 'storage_size', label: translations.repoTableSize, sortable: true },
			{
				key: 'last_updated',
				label: translations.repoTableLastUpdate,
				width: 'w-48',
				sortable: true
			}
		];
	}

	function formatBytes(bytes: number | undefined | null): string {
		if (!bytes || bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatNumber(num: number | undefined | null): string {
		if (num === undefined || num === null) return '0';
		return num.toLocaleString();
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

	function isToday(dateString: string | undefined | null): boolean {
		if (!dateString) return false;
		const today = new Date();
		const date = new Date(dateString);

		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	}

	function isYesterday(dateString: string | undefined | null): boolean {
		if (!dateString) return false;
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const date = new Date(dateString);
		return (
			date.getDate() === yesterday.getDate() &&
			date.getMonth() === yesterday.getMonth() &&
			date.getFullYear() === yesterday.getFullYear()
		);
	}

	function isThisWeek(dateString: string | undefined | null): boolean {
		if (!dateString) return false;
		const today = new Date();
		const date = new Date(dateString);
		const diffTime = Math.abs(today.getTime() - date.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays <= 7 && !isToday(dateString) && !isYesterday(dateString);
	}

	function selectRepository(repoName: string) {
		goto(`/tags/${repoName}`);
	}

	function handleRepositoryClick(row: any) {
		selectRepository(row.name as string);
	}

	async function loadRepositories(search?: string) {
		try {
			isLoading = true;
			error = null;
			const searchOptions = search ? { name: search } : {};
			repositories = await getRepositories(searchOptions);
		} catch (e) {
			console.error('Error loading repositories:', e);
			error = 'Error loading data';
		} finally {
			isLoading = false;
		}
	}

	function handleSearch(search: string) {
		searchTerm = search;
		loadRepositories(search);
	}

	async function initializeApp() {
		try {
			currentLanguage.init();
			await loadTranslations($currentLanguage);
			await loadRepositories();
		} catch (e) {
			console.error('Error loading app:', e);
			error = 'Error loading data';
		} finally {
			initialLoading = false;
		}
	}

	onMount(async () => {
		document.title = 'DockerTokenViewer';
		await initializeApp();
	});

	$: if (!isLoading) {
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
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{translations.repoTitle}</h2>
			</div>

			{#if error}
				<div class="border-l-4 border-red-400 bg-red-50 p-4 dark:border-red-400 dark:bg-red-900/20">
					<p class="text-sm text-red-700 dark:text-red-400">{error}</p>
				</div>
			{/if}

			<Table
				{columns}
				rows={repositories.results as any[]}
				{isLoading}
				isEmpty={repositories.results.length === 0}
				emptyMessage={translations.repoEmpty}
				onRowClick={handleRepositoryClick}
				onRefresh={() => loadRepositories()}
				refreshTooltip={translations.refreshTooltip}
				onSearch={handleSearch}
				searchValue={searchTerm}
				searchPlaceholder={translations.searchPlaceholder}
			>
				<svelte:fragment slot="cell" let:row let:column let:value>
					{#if column.key === 'name'}
						<div class="text-sm font-medium text-gray-900 dark:text-white">
							{value || '-'}
						</div>
					{:else if column.key === 'description'}
						<div class="text-sm text-gray-900 dark:text-white">
							{value || translations.noDescription}
						</div>
					{:else if column.key === 'pull_count'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatNumber(value as number)}
						</div>
					{:else if column.key === 'storage_size'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatBytes(value as number)}
						</div>
					{:else if column.key === 'last_updated'}
						<div class="flex items-center text-sm text-gray-900 dark:text-white">
							<span class="mr-2">{formatDate(value as string)}</span>
							{#if isToday(value as string)}
								<Badge text={translations.badgeToday} color="success" />
							{:else if isYesterday(value as string)}
								<Badge text={translations.badgeYesterday} color="warning" />
							{:else if isThisWeek(value as string)}
								<Badge
									text={translations.badgeLastDays}
									color="danger"
									tooltipText={translations.badgeLastDaysTooltip}
								/>
							{/if}
						</div>
					{/if}
				</svelte:fragment>
			</Table>
		{/if}
	</main>
</div>
