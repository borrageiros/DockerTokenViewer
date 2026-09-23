<script lang="ts">
	import { currentLanguage, loadLanguageTranslations, t } from '$lib/stores/i18n';
	import { copyImageTag, copyPullCommand, copyRepoImageTag, copyTag } from '$lib/utils/common';
	import Button from './Button.svelte';
	import CopiedNotice from './CopiedNotice.svelte';
	import Dropdown from './Dropdown.svelte';

	export let repository: string;
	export let tag: string;

	let open = false;
	let tooltip = '';
	let onlyTag = '';
	let imageTag = '';
	let repoImageTag = '';
	let pullCommand = '';
	let copiedLabel = '';
	let notice: { notify: () => void } | undefined;

	async function loadLabels(language: 'es' | 'en') {
		await loadLanguageTranslations(language);
		if (language !== $currentLanguage) return;
		tooltip = t('tags.copyTooltip', language);
		onlyTag = t('tags.copyOnlyTag', language);
		imageTag = t('tags.copyImageTag', language);
		repoImageTag = t('tags.copyRepoImageTag', language);
		pullCommand = t('tags.copyPullCommand', language);
		copiedLabel = t('tags.copied', language);
	}

	function copy(action: 'tag' | 'imageTag' | 'repoImageTag' | 'pullCommand') {
		switch (action) {
			case 'repoImageTag':
				copyRepoImageTag(repository, tag);
				break;
			case 'imageTag':
				copyImageTag(repository, tag);
				break;
			case 'tag':
				copyTag(tag);
				break;
			case 'pullCommand':
				copyPullCommand(repository, tag);
				break;
		}
		open = false;
		notice?.notify();
	}

	$: loadLabels($currentLanguage);
</script>

<CopiedNotice bind:this={notice} label={copiedLabel}>
	<Dropdown bind:open align="end" width="sm">
	<svelte:fragment slot="trigger" let:toggle let:open>
		<Button
			variant="icon"
			stopPropagation
			on:click={toggle}
			title={tooltip}
			aria-label={tooltip}
			aria-expanded={open}
		>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
			<rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
			</svg>
		</Button>
	</svelte:fragment>

	<Button variant="menu" stopPropagation on:click={() => copy('tag')}>
		{onlyTag}
	</Button>
	<Button variant="menu" stopPropagation on:click={() => copy('imageTag')}>
		{imageTag}
	</Button>
	<Button variant="menu" stopPropagation on:click={() => copy('repoImageTag')}>
		{repoImageTag}
	</Button>
	<Button variant="menu" stopPropagation on:click={() => copy('pullCommand')}>
		{pullCommand}
	</Button>
	</Dropdown>
</CopiedNotice>
