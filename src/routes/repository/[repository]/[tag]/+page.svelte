<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getTagDetails, type Tag } from '$lib/api';
	import Header from '$lib/components/Header.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import { currentLanguage, t, loadLanguageTranslations } from '$lib/stores/i18n';

	let tagDetails: Tag | null = null;
	let isLoading = false;
	let error: string | null = null;
	let translations: Record<string, any> = {};
	let repository: string = '';
	let tag: string = '';
	let initialLoading = true;

	$: repository = $page.params.repository;
	$: tag = $page.params.tag;

	async function loadTranslations(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		translations = {
			title: t('tagDetails.title', language).replace('{tag}', tag),
			loading: t('tagDetails.loading', language),
			error: t('tagDetails.error', language),
			info: {
				title: t('tagDetails.info.title', language),
				name: t('tagDetails.info.name', language),
				size: t('tagDetails.info.size', language),
				lastUpdated: t('tagDetails.info.lastUpdated', language),
				pushedBy: t('tagDetails.info.pushedBy', language),
				digest: t('tagDetails.info.digest', language),
				mediaType: t('tagDetails.info.mediaType', language)
			},
			images: {
				title: t('tagDetails.images.title', language),
				architecture: t('tagDetails.images.architecture', language),
				os: t('tagDetails.images.os', language),
				size: t('tagDetails.images.size', language),
				digest: t('tagDetails.images.digest', language),
				status: t('tagDetails.images.status', language)
			},
			commands: {
				title: t('tagDetails.commands.title', language),
				pullCommand: t('tagDetails.commands.pullCommand', language),
				copy: t('tagDetails.commands.copy', language),
				copied: t('tagDetails.commands.copied', language)
			}
		};
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
				month: 'long',
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
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	}

	function copyPullCommand() {
		copyToClipboard(`docker pull ${repository}:${tag}`);
	}

	async function loadTagDetails() {
		try {
			isLoading = true;
			error = null;
			tagDetails = await getTagDetails(repository, tag);
		} catch (e) {
			console.error('Error loading tag details:', e);
			error = translations.error || 'Error loading tag details';
		} finally {
			isLoading = false;
		}
	}

	async function initializePage() {
		try {
			currentLanguage.init();
			await loadTranslations($currentLanguage);
			await loadTagDetails();
		} catch (e) {
			console.error('Error initializing page:', e);
			error = 'Error loading data';
		} finally {
			initialLoading = false;
		}
	}

	onMount(() => {
		document.title = `Tag ${tag} - ${repository} - DockerTokenViewer`;
		initializePage();
	});

	$: if (!isLoading && repository && tag) {
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
			<Breadcrumbs currentRepository={repository} currentTag={tag} />

			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">
					{translations.title}
				</h1>
			</div>

			{#if error}
				<div class="border-l-4 border-red-400 bg-red-50 p-4 dark:border-red-400 dark:bg-red-900/20">
					<p class="text-sm text-red-700 dark:text-red-400">{error}</p>
				</div>
			{:else if isLoading}
				<div class="flex items-center justify-center py-16">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<span class="ml-3 text-gray-600 dark:text-gray-400">{translations.loading}</span>
				</div>
			{:else if tagDetails}
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<!-- Información General -->
					<div class="lg:col-span-2">
						<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
							<div
								class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
							>
								<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
									{translations.info.title}
								</h2>
							</div>
							<div class="p-6">
								<dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
									<div>
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{translations.info.name}
										</dt>
										<dd class="mt-1 font-mono text-sm text-gray-900 dark:text-white">
											{tagDetails.name}
										</dd>
									</div>
									<div>
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{translations.info.size}
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{formatBytes(tagDetails.full_size)}
										</dd>
									</div>
									<div>
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{translations.info.lastUpdated}
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{formatDate(tagDetails.last_updated)}
										</dd>
									</div>
									<div>
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{translations.info.pushedBy}
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{tagDetails.last_updater_username || '-'}
										</dd>
									</div>
									<div class="sm:col-span-2">
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{translations.info.digest}
										</dt>
										<dd class="mt-1 font-mono text-sm break-all text-gray-900 dark:text-white">
											{tagDetails.digest}
										</dd>
									</div>
									<div>
										<dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
											{translations.info.mediaType}
										</dt>
										<dd class="mt-1 text-sm text-gray-900 dark:text-white">
											{tagDetails.media_type}
										</dd>
									</div>
								</dl>
							</div>
						</div>

						<!-- Imágenes -->
						{#if tagDetails.images && tagDetails.images.length > 0}
							<div class="mt-8 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
								<div
									class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
								>
									<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
										{translations.images.title}
									</h2>
								</div>
								<div class="p-6">
									<div class="overflow-x-auto">
										<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
											<thead>
												<tr>
													<th
														class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
													>
														{translations.images.architecture}
													</th>
													<th
														class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
													>
														{translations.images.os}
													</th>
													<th
														class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
													>
														{translations.images.size}
													</th>
													<th
														class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
													>
														{translations.images.status}
													</th>
												</tr>
											</thead>
											<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
												{#each tagDetails.images as image}
													<tr>
														<td
															class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
														>
															{image.architecture}
														</td>
														<td
															class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
														>
															{image.os}
														</td>
														<td
															class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
														>
															{formatBytes(image.size)}
														</td>
														<td class="px-6 py-4 text-sm whitespace-nowrap">
															<span
																class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {image.status ===
																'active'
																	? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
																	: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}"
															>
																{image.status}
															</span>
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Comandos -->
					<div class="lg:col-span-1">
						<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
							<div
								class="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
							>
								<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
									{translations.commands.title}
								</h2>
							</div>
							<div class="p-6">
								<div class="space-y-4">
									<div>
										<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
											{translations.commands.pullCommand}
										</label>
										<div class="flex">
											<input
												type="text"
												value={`docker pull ${repository}:${tag}`}
												readonly
												class="flex-1 rounded-l-md border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
											/>
											<button
												on:click={copyPullCommand}
												class="rounded-r-md border border-l-0 border-gray-300 bg-blue-50 px-3 py-2 text-blue-600 hover:bg-blue-100 dark:border-gray-600 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
												title={translations.commands.copy}
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
													/>
												</svg>
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</main>
</div>
