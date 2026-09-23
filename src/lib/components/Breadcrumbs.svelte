<script lang="ts">
	import Button from './Button.svelte';
	import { currentLanguage, t } from '$lib/stores/i18n';
	import { config } from '$lib/stores/config';
	import { appPath } from '$lib/utils/common';

	export let currentRepository: string | null = null;
	export let currentTag: string | null = null;

	$: activeAccount = config.getActiveAccount();

	let translations: Record<string, string> = {};

	$: {
		const language = $currentLanguage;
		translations = {
			backToRepos: t('tags.backToRepos', language)
		};
	}

</script>

<div class="mb-6">
	<nav class="flex items-center space-x-2 text-sm">
		{#if $activeAccount?.organization}
			<Button variant="link" href="/">
				{$activeAccount?.organization}
			</Button>

			{#if currentRepository}
				<span class="text-gray-500 dark:text-gray-400">/</span>
				<Button variant="link" href={appPath(currentRepository)}>
					{currentRepository}
				</Button>

				{#if currentTag}
					<span class="text-gray-500 dark:text-gray-400">/</span>
					<Button variant="link" href={appPath(currentRepository, currentTag)}>
						{currentTag}
					</Button>
				{/if}
			{/if}
		{:else}
			<Button variant="link" href="/">
				{translations.backToRepos}
			</Button>
		{/if}
	</nav>
</div>
