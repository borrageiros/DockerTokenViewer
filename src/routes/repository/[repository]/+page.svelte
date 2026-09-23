<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getRepositoryTags, type Tag } from '$lib/api';
	import Header from '$lib/components/Header.svelte';
	import CopyTagButton from '$lib/components/CopyTagButton.svelte';
	import Table from '$lib/components/Table.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import type { Column, Row } from '$lib/components/Table.types';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';
	import { DEFAULT_PAGE_SIZE } from '$lib/consts';
	import { APP_NAME } from '$lib/consts';
	import {
		formatBytes,
		formatDate,
		isToday,
		isYesterday,
		isThisWeek,
		getLatestFromResults,
		formatNumber,
		appPath
	} from '$lib/utils/common';
	import { config } from '$lib/stores/config';

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
	let visibleColumns: Record<string, boolean> = {};

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
			tagsTableCreator: t('tags.table.creator', language),
			tagsTableId: t('tags.table.id', language),
			tagsTableLastUpdater: t('tags.table.lastUpdater', language),
			tagsTableRepository: t('tags.table.repository', language),
			tagsTableV2: t('tags.table.v2', language),
			tagsTableTagStatus: t('tags.table.tagStatus', language),
			tagsTableTagLastPulled: t('tags.table.tagLastPulled', language),
			tagsTableTagLastPushed: t('tags.table.tagLastPushed', language),
			tagsTableMediaType: t('tags.table.mediaType', language),
			tagsTableContentType: t('tags.table.contentType', language),
			tagsTableDigest: t('tags.table.digest', language),
			tagsEmpty: t('tags.empty', language),
			tagsError: t('tags.error', language),
			latestBadge: t('tags.latest', language),
			refreshTooltip: t('table.refresh', language),
			searchPlaceholder: t('table.search', language),
			settingsTooltip: t('table.settings', language),
			columnsLabel: t('table.columnsLabel', language),
			emptyMessage: t('table.empty', language),
			badgeToday: t('repositories.badges.today', language),
			badgeYesterday: t('repositories.badges.yesterday', language),
			badgeLastDays: t('repositories.badges.lastDays', language),
			badgeLastDaysTooltip: t('repositories.badges.lastDaysTooltip', language)
		};

		columns = [
			{ key: 'name', label: translations.tagsTableName, sortable: true, visible: true },
			{ key: 'full_size', label: translations.tagsTableSize, sortable: true, visible: true },
			{
				key: 'last_updater_username',
				label: translations.tagsTablePushedBy,
				sortable: true,
				visible: true
			},
			{
				key: 'last_updated',
				label: translations.tagsTableLastUpdate,
				sortable: true,
				visible: true
			},
			{
				key: 'copy',
				label: translations.tagsTableCopy,
				width: 'w-24',
				sortable: false,
				visible: true
			},
			{ key: 'creator', label: translations.tagsTableCreator, sortable: true, visible: false },
			{ key: 'id', label: translations.tagsTableId, sortable: true, visible: false },
			{
				key: 'last_updater',
				label: translations.tagsTableLastUpdater,
				sortable: true,
				visible: false
			},
			{
				key: 'repository',
				label: translations.tagsTableRepository,
				sortable: true,
				visible: false
			},
			{ key: 'v2', label: translations.tagsTableV2, sortable: true, visible: false },
			{ key: 'tag_status', label: translations.tagsTableTagStatus, sortable: true, visible: false },
			{
				key: 'tag_last_pulled',
				label: translations.tagsTableTagLastPulled,
				sortable: true,
				visible: false
			},
			{
				key: 'tag_last_pushed',
				label: translations.tagsTableTagLastPushed,
				sortable: true,
				visible: false
			},
			{ key: 'media_type', label: translations.tagsTableMediaType, sortable: true, visible: false },
			{
				key: 'content_type',
				label: translations.tagsTableContentType,
				sortable: true,
				visible: false
			},
			{ key: 'digest', label: translations.tagsTableDigest, sortable: true, visible: false }
		];

		const savedSettings = $config.tableSettings.tags;
		const initialVisibleColumns: Record<string, boolean> = {};
		columns.forEach((col) => {
			initialVisibleColumns[col.key] =
				savedSettings[col.key] !== undefined ? savedSettings[col.key] : col.visible !== false;
		});
		visibleColumns = initialVisibleColumns;
	}

	function tagHref(row: Row) {
		return appPath(repository, String(row.name));
	}

	async function loadTags(search?: string) {
		try {
			isLoading = true;
			error = null;
			currentPage = 1;

			const searchOptions = search ? { name: search } : {};
			const tagsResponse = await getRepositoryTags(repository, {
				page: 1,
				page_size: DEFAULT_PAGE_SIZE,
				...searchOptions
			});

			tags = tagsResponse.results;
			hasMore = tagsResponse.next;
			const latestTagResult = getLatestFromResults(tagsResponse.results);
			latestTag = latestTagResult?.name || null;
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
				page_size: DEFAULT_PAGE_SIZE,
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

	async function initializeApp() {
		try {
			await loadTranslations($currentLanguage);
			await loadTags();
		} catch (e) {
			console.error('Error loading app:', e);
			error = 'Error loading data';
		} finally {
			initialLoading = false;
		}
	}

	onMount(() => {
		document.title = `${repository} - ${APP_NAME}`;
		initializeApp();
	});

	$: if (!isLoading && repository) {
		loadTranslations($currentLanguage);
	}

	$: if (Object.keys(visibleColumns).length > 0) {
		config.setTableSettings('tags', visibleColumns);
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
			<Breadcrumbs currentRepository={repository} />

			<!-- <div class="mb-6">
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
					{translations.tagsTitle}
				</h2>
			</div> -->

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
				emptyMessage={translations.emptyMessage}
				onScroll={handleScroll}
				{isLoadingMore}
				onRefresh={() => loadTags()}
				refreshTooltip={translations.refreshTooltip}
				onSearch={handleSearch}
				searchValue={searchTerm}
				searchPlaceholder={translations.searchPlaceholder}
				settingsTooltip={translations.settingsTooltip}
				columnsLabel={translations.columnsLabel}
				getRowHref={tagHref}
				bind:visibleColumns
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
					{:else if column.key === 'last_updated' || column.key === 'tag_last_pulled' || column.key === 'tag_last_pushed'}
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
					{:else if column.key === 'v2'}
						<div class="text-sm text-gray-900 dark:text-white">
							{value ? 'Yes' : 'No'}
						</div>
					{:else if column.key === 'copy'}
						<CopyTagButton {repository} tag={row.name as string} />
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
