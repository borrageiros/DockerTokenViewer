<script lang="ts">
	import {
		getRepositories,
		searchTagsAcrossRepositories,
		type RepositoriesResponse,
		type Repository,
		type TagSearchMatch
	} from '$lib/api';
	import { onDestroy, onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import CopyTagButton from '$lib/components/CopyTagButton.svelte';
	import FavoriteButton from '$lib/components/FavoriteButton.svelte';
	import Table from '$lib/components/Table.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import type { Column, Row } from '$lib/components/Table.types';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';
	import { APP_NAME } from '$lib/consts';
	import {
		formatBytes,
		formatNumber,
		formatDate,
		isToday,
		isYesterday,
		isThisWeek,
		appPath,
		truncateText
	} from '$lib/utils/common';
	import { baseRepository } from '$lib/stores/repository';
	import { config, getAccountTableSort, type TableSortKey } from '$lib/stores/config';

	let repositories: RepositoriesResponse = {
		count: 0,
		results: []
	};
	let isLoading = false;
	let error: string | null = null;
	let translations: Record<string, string> = {};
	let columns: Column[] = [];
	const TAG_SEARCH_MIN_LENGTH = 3;

	type SearchMode = 'repositories' | 'tags';
	type TagSearchState = 'idle' | 'short' | 'searching' | 'done';
	type TagSearchRow = {
		repository: string;
		name: string;
		full_size: number;
		last_updated: string;
		last_updater_username: string;
	};

	let searchTerm = '';
	let initialLoading = true;
	let visibleColumns: Record<string, boolean> = {};
	let repoVisibleColumns: Record<string, boolean> = {};
	let tagVisibleColumns: Record<string, boolean> = {};
	let searchMode: SearchMode = 'repositories';
	let tagColumns: Column[] = [];
	let tagRows: TagSearchRow[] = [];
	let tagSearchState: TagSearchState = 'idle';
	let tagSearchInfo = '';
	let latestOnly = false;
	let tagSearchProgress: { completed: number; total: number } | null = null;
	let allRepositories: Repository[] = [];
	let tagSearchAbort: AbortController | null = null;
	let tagSearchGeneration = 0;

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			repoTitle: t('repositories.title', language),
			repoTableFavorite: t('repositories.table.favorite', language),
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
			emptyMessage: t('table.empty', language),
			searchModeLabel: t('repositories.searchModeLabel', language),
			searchModeRepositories: t('repositories.searchModeRepositories', language),
			searchModeTags: t('repositories.searchModeTags', language),
			tagSearchHint: t('repositories.tagSearchHint', language),
			tagSearchTooShort: t('repositories.tagSearchTooShort', language),
			tagSearchStarting: t('repositories.tagSearchStarting', language),
			tagSearchProgress: t('repositories.tagSearchProgress', language),
			tagSearchDone: t('repositories.tagSearchDone', language),
			tagSearchFailed: t('repositories.tagSearchFailed', language),
			tagSearchLatestOnly: t('repositories.tagSearchLatestOnly', language),
			tagSearchEmpty: t('repositories.tagSearchEmpty', language),
			tagSearchError: t('repositories.tagSearchError', language),
			tagTableRepository: t('tags.table.repository', language),
			tagTableName: t('repositories.tagSearchTag', language),
			tagTableSize: t('tags.table.size', language),
			tagTablePushedBy: t('tags.table.pushedBy', language),
			tagTableLastUpdate: t('tags.table.lastUpdate', language),
			tagTableCopy: t('tags.table.copy', language)
		};

		columns = [
			{
				key: 'favorite',
				label: translations.repoTableFavorite,
				header: '',
				sortable: true,
				visible: true,
				width: 'w-12',
				align: 'center'
			},
			{ key: 'name', label: translations.repoTableName, sortable: true, visible: true },
			{
				key: 'description',
				label: translations.repoTableDescription,
				sortable: true,
				visible: true,
				width: 'w-[30%]'
			},
			{ key: 'pull_count', label: translations.repoTableDownloads, sortable: true, visible: true },
			{ key: 'storage_size', label: translations.repoTableSize, sortable: true, visible: true },
			{
				key: 'last_updated',
				label: translations.repoTableLastUpdate,
				width: 'w-64',
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

		tagColumns = [
			{
				key: 'repository',
				label: translations.tagTableRepository,
				sortable: true,
				visible: true
			},
			{ key: 'name', label: translations.tagTableName, sortable: true, visible: true },
			{ key: 'full_size', label: translations.tagTableSize, sortable: true, visible: true },
			{
				key: 'last_updater_username',
				label: translations.tagTablePushedBy,
				sortable: true,
				visible: true
			},
			{
				key: 'last_updated',
				label: translations.tagTableLastUpdate,
				sortable: true,
				visible: true
			},
			{
				key: 'copy',
				label: translations.tagTableCopy,
				width: 'w-24',
				sortable: false,
				visible: true
			}
		];

		const savedSettings = $config.tableSettings.repositories;
		const initialVisibleColumns: Record<string, boolean> = {};
		columns.forEach((col) => {
			initialVisibleColumns[col.key] =
				savedSettings[col.key] !== undefined ? savedSettings[col.key] : col.visible !== false;
		});
		repoVisibleColumns = initialVisibleColumns;

		const nextTagVisibleColumns = { ...tagVisibleColumns };
		let tagVisibleColumnsChanged = Object.keys(tagVisibleColumns).length === 0;
		tagColumns.forEach((col) => {
			if (nextTagVisibleColumns[col.key] === undefined) {
				nextTagVisibleColumns[col.key] = col.visible !== false;
				tagVisibleColumnsChanged = true;
			}
		});
		if (tagVisibleColumnsChanged) {
			tagVisibleColumns = nextTagVisibleColumns;
		}

		visibleColumns = searchMode === 'tags' ? { ...tagVisibleColumns } : initialVisibleColumns;
	}

	function rowHref(row: Record<string, unknown>) {
		if (searchMode === 'tags') {
			return appPath(String(row.repository), String(row.name));
		}
		return appPath(String(row.name));
	}

	function isAbortError(value: unknown): boolean {
		return value instanceof Error && value.name === 'AbortError';
	}

	function abortTagSearch() {
		tagSearchGeneration += 1;
		tagSearchAbort?.abort();
		tagSearchAbort = null;
	}

	function toTagRow(match: TagSearchMatch): TagSearchRow {
		return {
			repository: match.repository,
			name: match.tag.name,
			full_size: match.tag.full_size,
			last_updated: match.tag.last_updated,
			last_updater_username: match.tag.last_updater_username
		};
	}

	function formatTagSearchProgress(completed: number, total: number) {
		return translations.tagSearchProgress
			.replace('{completed}', String(completed))
			.replace('{total}', String(total));
	}

	function formatTagSearchFailed(failed: number) {
		if (failed <= 0) return '';
		return translations.tagSearchFailed.replace('{failed}', String(failed));
	}

	function latestTagPerRepository(rows: TagSearchRow[]) {
		const byRepository = new Map<string, TagSearchRow>();
		for (const row of rows) {
			const current = byRepository.get(row.repository);
			const rowTime = new Date(row.last_updated).getTime();
			const currentTime = current ? new Date(current.last_updated).getTime() : 0;
			if (!current || rowTime > currentTime) {
				byRepository.set(row.repository, row);
			}
		}
		return [...byRepository.values()];
	}

	async function loadRepositories(search?: string) {
		try {
			isLoading = true;
			error = null;
			const searchOptions = search ? { name: search } : {};
			repositories = await getRepositories(searchOptions);
			if (!search) {
				allRepositories = repositories.results;
			}
		} catch (e) {
			console.error('Error loading repositories:', e);
			error = 'Error loading data';
		} finally {
			isLoading = false;
		}
	}

	async function searchTags(search: string) {
		const query = search.trim();
		abortTagSearch();
		const generation = tagSearchGeneration;
		const controller = new AbortController();
		tagSearchAbort = controller;

		tagRows = [];
		tagSearchProgress = null;
		error = null;

		if (query.length < TAG_SEARCH_MIN_LENGTH) {
			tagSearchState = query.length === 0 ? 'idle' : 'short';
			tagSearchInfo = '';
			return;
		}

		tagSearchState = 'searching';
		tagSearchInfo = translations.tagSearchStarting;

		try {
			let repos = allRepositories;
			if (repos.length === 0) {
				const data = await getRepositories({ signal: controller.signal });
				if (generation !== tagSearchGeneration) return;
				allRepositories = data.results;
				repos = allRepositories;
			}

			tagSearchProgress = { completed: 0, total: repos.length };
			tagSearchInfo = formatTagSearchProgress(0, repos.length);

			const result = await searchTagsAcrossRepositories(query, repos, {
				signal: controller.signal,
				onRepositoryDone: ({ completed, total, failed, matches }) => {
					if (generation !== tagSearchGeneration) return;
					if (matches.length > 0) {
						tagRows = [...tagRows, ...matches.map(toTagRow)];
					}
					tagSearchProgress = { completed, total };
					tagSearchInfo =
						failed > 0 && completed === total
							? formatTagSearchFailed(failed)
							: formatTagSearchProgress(completed, total);
				}
			});

			if (generation !== tagSearchGeneration) return;
			tagSearchState = 'done';
			tagSearchProgress = null;
			tagSearchInfo = formatTagSearchFailed(result.failed);
		} catch (e) {
			if (generation !== tagSearchGeneration || isAbortError(e) || controller.signal.aborted)
				return;
			abortTagSearch();
			console.error('Error searching tags:', e);
			error = translations.tagSearchError || 'Error searching tags';
			tagSearchState = 'idle';
			tagSearchInfo = '';
			tagSearchProgress = null;
			tagRows = [];
		}
	}

	function handleSearch(search: string) {
		searchTerm = search;
		if (searchMode === 'tags') {
			searchTags(search);
			return;
		}
		loadRepositories(search);
	}

	function handleSearchModeChange(mode: string) {
		abortTagSearch();
		searchMode = mode === 'tags' ? 'tags' : 'repositories';
		searchTerm = '';
		tagRows = [];
		tagSearchState = 'idle';
		tagSearchInfo = '';
		tagSearchProgress = null;
		error = null;

		if (searchMode === 'tags') {
			visibleColumns = { ...tagVisibleColumns };
			return;
		}

		visibleColumns = { ...repoVisibleColumns };
		loadRepositories();
	}

	async function handleRefresh() {
		if (searchMode === 'tags') {
			allRepositories = [];
			if (searchTerm.trim().length < TAG_SEARCH_MIN_LENGTH) {
				try {
					const data = await getRepositories();
					allRepositories = data.results;
				} catch (e) {
					console.error('Error refreshing repositories:', e);
					error = translations.repoError || 'Error loading data';
				}
				return;
			}
			await searchTags(searchTerm);
			return;
		}

		await loadRepositories();
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

	onDestroy(() => {
		abortTagSearch();
	});

	$: if (!isLoading) {
		loadTranslations($currentLanguage);
	}

	$: if (searchMode === 'repositories' && Object.keys(visibleColumns).length > 0) {
		repoVisibleColumns = visibleColumns;
		config.setTableSettings('repositories', visibleColumns);
	}

	$: if (searchMode === 'tags' && Object.keys(visibleColumns).length > 0) {
		tagVisibleColumns = visibleColumns;
	}

	$: displayedTagRows = latestOnly ? latestTagPerRepository(tagRows) : tagRows;
	$: activeAccount = $config.accounts.find((account) => account.isActive);
	$: favorites = activeAccount?.favorites ?? [];
	$: tableSortKey = (searchMode === 'repositories' ? 'repositories' : 'tagSearch') as TableSortKey;
	$: currentSort = getAccountTableSort(activeAccount, tableSortKey);
	$: repositoryRows = repositories.results.map((repository) => ({
		...repository,
		favorite: favorites.includes(repository.name)
	}));
	$: tableRows = (searchMode === 'tags' ? displayedTagRows : repositoryRows) as unknown as Row[];
	$: tableColumns = searchMode === 'tags' ? tagColumns : columns;
	$: tableLoading =
		searchMode === 'tags' ? tagSearchState === 'searching' && tagRows.length === 0 : isLoading;
	$: tableLoadingMore =
		searchMode === 'tags' && tagSearchState === 'searching' && tagRows.length > 0;
	$: tableEmpty = searchMode === 'tags' ? displayedTagRows.length === 0 : repositories.results.length === 0;
	$: tableEmptyMessage =
		searchMode === 'tags'
			? tagSearchState === 'done'
				? translations.tagSearchEmpty
				: tagSearchState === 'short'
					? translations.tagSearchTooShort
					: translations.tagSearchHint
			: translations.emptyMessage;
	$: tableInfo = searchMode === 'tags' ? tagSearchInfo : '';
	$: tableMatchCount =
		searchMode === 'tags' && (tagSearchState === 'searching' || tagSearchState === 'done')
			? translations.tagSearchDone.replace('{matches}', String(displayedTagRows.length))
			: '';
	$: tableProgress =
		searchMode === 'tags' && tagSearchState === 'searching' ? tagSearchProgress : null;
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
				columns={tableColumns}
				rows={tableRows}
				isLoading={tableLoading}
				isLoadingMore={tableLoadingMore}
				isEmpty={tableEmpty}
				emptyMessage={tableEmptyMessage}
				getRowHref={rowHref}
				onRefresh={handleRefresh}
				refreshTooltip={translations.refreshTooltip}
				onSearch={handleSearch}
				searchValue={searchTerm}
				searchPlaceholder={translations.searchPlaceholder}
				settingsTooltip={translations.settingsTooltip}
				columnsLabel={translations.columnsLabel}
				searchModes={[
					{ id: 'repositories', label: translations.searchModeRepositories },
					{ id: 'tags', label: translations.searchModeTags }
				]}
				{searchMode}
				searchModesLabel={translations.searchModeLabel}
				onSearchModeChange={handleSearchModeChange}
				submitSearchOnly={searchMode === 'tags'}
				infoMessage={tableInfo}
				progress={tableProgress}
				bind:latestOnly
				latestOnlyLabel={searchMode === 'tags' ? translations.tagSearchLatestOnly : ''}
				matchCountText={tableMatchCount}
				defaultSortColumn={currentSort.column}
				defaultSortDirection={currentSort.direction}
				onSort={(sort) => config.setTableSort(tableSortKey, sort)}
				bind:visibleColumns
			>
				<svelte:fragment slot="cell" let:row let:column let:value>
					{#if column.key === 'favorite'}
						<FavoriteButton repository={row.name as string} />
					{:else if column.key === 'name' || column.key === 'repository'}
						<div class="truncate text-sm font-medium text-gray-900 dark:text-white" title={String(value || '-')}>
							{value || '-'}
						</div>
					{:else if column.key === 'description'}
						{@const description = (value as string) || translations.noDescription}
						<div class="truncate text-sm text-gray-900 dark:text-white" title={description}>
							{truncateText(description, 72)}
						</div>
					{:else if column.key === 'pull_count'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatNumber(value as number)}
						</div>
					{:else if column.key === 'star_count'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatNumber(value as number)}
						</div>
					{:else if column.key === 'full_size' || column.key === 'storage_size'}
						<div class="text-sm text-gray-900 dark:text-white">
							{formatBytes(value as number)}
						</div>
					{:else if column.key === 'last_updated' || column.key === 'last_modified' || column.key === 'date_registered'}
						<div class="flex items-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
							<span class="mr-2 shrink-0">{formatDate(value as string, $currentLanguage)}</span>
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
					{:else if column.key === 'copy'}
						<CopyTagButton repository={row.repository as string} tag={row.name as string} />
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
