<script lang="ts">
	import { getRepositories, type RepositoriesResponse } from '$lib/api';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Table from '$lib/components/Table.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import type { Column } from '$lib/components/Table.types';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';
	import { APP_NAME } from '$lib/consts';
	import {
		formatBytes,
		formatNumber,
		formatDate,
		isToday,
		isYesterday,
		isThisWeek
	} from '$lib/utils/common';
	import { baseRepository } from '$lib/stores/repository';
	import { config } from '$lib/stores/config';

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
	let visibleColumns: Record<string, boolean> = {};

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			repoTitle: t('repositories.title', language),
			repoTableName: t('repositories.table.name', language),
			repoTableDescription: t('repositories.table.description', language),
			repoTableDownloads: t('repositories.table.downloads', language),
			repoTableSize: t('repositories.table.size', language),
			repoTableLastUpdate: t('repositories.table.lastUpdate', language),
			repoTableNamespace: t('repositories.table.namespace', language),
			repoTableRepositoryType: t('repositories.table.repositoryType', language),
			repoTableStatus: t('repositories.table.status', language),
			repoTableStatusDescription: t('repositories.table.statusDescription', language),
			repoTableIsPrivate: t('repositories.table.isPrivate', language),
			repoTableStarCount: t('repositories.table.starCount', language),
			repoTableLastModified: t('repositories.table.lastModified', language),
			repoTableDateRegistered: t('repositories.table.dateRegistered', language),
			repoTableAffiliation: t('repositories.table.affiliation', language),
			repoTableMediaTypes: t('repositories.table.mediaTypes', language),
			repoTableContentTypes: t('repositories.table.contentTypes', language),
			repoTableCategories: t('repositories.table.categories', language),
			badgeToday: t('repositories.badges.today', language),
			badgeYesterday: t('repositories.badges.yesterday', language),
			badgeLastDays: t('repositories.badges.lastDays', language),
			badgeLastDaysTooltip: t('repositories.badges.lastDaysTooltip', language),
			noDescription: t('repositories.noDescription', language),
			repoEmpty: t('repositories.empty', language),
			repoError: t('repositories.error', language),
			refreshTooltip: t('table.refresh', language),
			searchPlaceholder: t('table.search', language),
			settingsTooltip: t('table.settings', language),
			columnsLabel: t('table.columnsLabel', language),
			emptyMessage: t('table.empty', language)
		};

		columns = [
			{ key: 'name', label: translations.repoTableName, sortable: true, visible: true },
			{
				key: 'description',
				label: translations.repoTableDescription,
				sortable: true,
				visible: true
			},
			{ key: 'pull_count', label: translations.repoTableDownloads, sortable: true, visible: true },
			{ key: 'storage_size', label: translations.repoTableSize, sortable: true, visible: true },
			{
				key: 'last_updated',
				label: translations.repoTableLastUpdate,
				width: 'w-48',
				sortable: true,
				visible: true
			},
			{ key: 'namespace', label: translations.repoTableNamespace, sortable: true, visible: false },
			{
				key: 'repository_type',
				label: translations.repoTableRepositoryType,
				sortable: true,
				visible: false
			},
			{ key: 'status', label: translations.repoTableStatus, sortable: true, visible: false },
			{
				key: 'status_description',
				label: translations.repoTableStatusDescription,
				sortable: true,
				visible: false
			},
			{ key: 'is_private', label: translations.repoTableIsPrivate, sortable: true, visible: false },
			{ key: 'star_count', label: translations.repoTableStarCount, sortable: true, visible: false },
			{
				key: 'last_modified',
				label: translations.repoTableLastModified,
				sortable: true,
				visible: false
			},
			{
				key: 'date_registered',
				label: translations.repoTableDateRegistered,
				sortable: true,
				visible: false
			},
			{
				key: 'affiliation',
				label: translations.repoTableAffiliation,
				sortable: true,
				visible: false
			},
			{
				key: 'media_types',
				label: translations.repoTableMediaTypes,
				sortable: true,
				visible: false
			},
			{
				key: 'content_types',
				label: translations.repoTableContentTypes,
				sortable: true,
				visible: false
			},
			{ key: 'categories', label: translations.repoTableCategories, sortable: true, visible: false }
		];

		const savedSettings = $config.tableSettings.repositories;
		const initialVisibleColumns: Record<string, boolean> = {};
		columns.forEach((col) => {
			initialVisibleColumns[col.key] =
				savedSettings[col.key] !== undefined ? savedSettings[col.key] : col.visible !== false;
		});
		visibleColumns = initialVisibleColumns;
	}

	function selectRepository(repoName: string) {
		goto(`/repository/${repoName}`);
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
		document.title = $baseRepository ? `${$baseRepository} - ${APP_NAME}` : APP_NAME;
		await initializeApp();
	});

	$: if (!isLoading) {
		loadTranslations($currentLanguage);
	}

	$: if (Object.keys(visibleColumns).length > 0) {
		config.setTableSettings('repositories', visibleColumns);
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
			<Breadcrumbs />
			<!-- <div class="mb-6">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{translations.repoTitle}</h2>
			</div> -->

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
				emptyMessage={translations.emptyMessage}
				onRowClick={handleRepositoryClick}
				onRefresh={() => loadRepositories()}
				refreshTooltip={translations.refreshTooltip}
				onSearch={handleSearch}
				searchValue={searchTerm}
				searchPlaceholder={translations.searchPlaceholder}
				settingsTooltip={translations.settingsTooltip}
				columnsLabel={translations.columnsLabel}
				bind:visibleColumns
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
					{:else if column.key === 'star_count'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatNumber(value as number)}
						</div>
					{:else if column.key === 'storage_size'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatBytes(value as number)}
						</div>
					{:else if column.key === 'last_updated' || column.key === 'last_modified' || column.key === 'date_registered'}
						<div class="flex items-center text-sm text-gray-900 dark:text-white">
							<span class="mr-2">{formatDate(value as string, $currentLanguage)}</span>
							{#if column.key === 'last_updated'}
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
							{/if}
						</div>
					{:else if column.key === 'is_private'}
						<div class="text-sm text-gray-900 dark:text-white">
							{value ? 'Yes' : 'No'}
						</div>
					{:else if Array.isArray(value)}
						<div class="text-sm text-gray-900 dark:text-white">
							{value.join(', ') || '-'}
						</div>
					{:else if typeof value === 'number'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatNumber(value)}
						</div>
					{:else}
						<div class="text-sm text-gray-900 dark:text-white">
							{value || '-'}
						</div>
					{/if}
				</svelte:fragment>
			</Table>
		{/if}
	</main>
</div>
