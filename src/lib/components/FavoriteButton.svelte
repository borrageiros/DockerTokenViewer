<script lang="ts">
	import { config } from '$lib/stores/config';
	import { currentLanguage, loadLanguageTranslations, t } from '$lib/stores/i18n';
	import Button from './Button.svelte';

	export let repository: string;

	let addLabel = '';
	let removeLabel = '';

	$: favorites = $config.accounts.find((account) => account.isActive)?.favorites ?? [];
	$: active = favorites.includes(repository);
	$: label = active ? removeLabel : addLabel;

	async function loadLabels(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		if (language !== $currentLanguage) return;
		addLabel = t('repositories.favoriteAdd', language);
		removeLabel = t('repositories.favoriteRemove', language);
	}

	$: loadLabels($currentLanguage);
</script>

<Button
	variant="icon"
	stopPropagation
	on:click={() => config.toggleFavorite(repository)}
	title={label}
	aria-label={label}
	aria-pressed={active}
>
	<svg
		class="h-4 w-4 text-blue-600 dark:text-blue-400"
		viewBox="0 0 24 24"
		fill={active ? 'currentColor' : 'none'}
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<polygon
			points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
		/>
	</svg>
</Button>
