<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentLanguage, t } from '$lib/stores/i18n';
	import { baseRepository } from '$lib/stores/repository';

	export let currentRepository: string | null = null;
	export let currentTag: string | null = null;

	let translations: Record<string, string> = {};

	$: {
		const language = $currentLanguage;
		translations = {
			backToRepos: t('tags.backToRepos', language)
		};
	}

	function backToRepositories() {
		goto('/');
	}

	function navigateToRepository(repoName: string) {
		goto(`/repository/${repoName}`);
	}

	function navigateToTag(repoName: string, tagName: string) {
		goto(`/repository/${repoName}/${tagName}`);
	}
</script>

<div class="mb-6">
	<nav class="flex items-center space-x-2 text-sm">
		{#if $baseRepository}
			<button
				on:click={backToRepositories}
				class="font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
			>
				{$baseRepository}
			</button>

			{#if currentRepository}
				<span class="text-gray-500 dark:text-gray-400">/</span>
				<button
					on:click={() => navigateToRepository(currentRepository)}
					class="font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
				>
					{currentRepository}
				</button>

				{#if currentTag}
					<span class="text-gray-500 dark:text-gray-400">/</span>
					<button
						on:click={() => navigateToTag(currentRepository, currentTag)}
						class="font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
					>
						{currentTag}
					</button>
				{/if}
			{/if}
		{:else}
			<button
				on:click={backToRepositories}
				class="font-medium text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
			>
				{translations.backToRepos}
			</button>
		{/if}
	</nav>
</div>
