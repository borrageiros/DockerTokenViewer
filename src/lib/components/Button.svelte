<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { openInApp } from '$lib/utils/common';

	let className = '';
	export { className as class };
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled = false;
	export let stopPropagation = false;
	export let active = false;
	export let href = '';
	export let variant: 'primary' | 'secondary' | 'icon' | 'menu' | 'link' = 'primary';

	const dispatch = createEventDispatcher<{ click: MouseEvent }>();

	const variants = {
		primary:
			'inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 active:translate-y-px active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400',
		secondary:
			'inline-flex h-10 justify-center rounded-lg bg-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
		icon: 'inline-flex h-8 w-8 justify-center rounded-md p-1.5 text-sm font-medium text-gray-600 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white',
		menu: 'flex w-full justify-start px-4 py-2 text-left text-sm whitespace-normal text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
		link: 'inline-flex justify-center font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
	};

	const activeVariants = {
		menu: 'flex w-full justify-start bg-blue-50 px-4 py-2 text-left text-sm whitespace-normal text-blue-900 dark:bg-blue-900/20 dark:text-blue-300',
		icon: 'inline-flex h-8 w-8 justify-center rounded-md bg-white p-1.5 text-sm font-medium text-blue-500 dark:bg-gray-900'
	};

	$: variantClass =
		active && variant in activeVariants
			? activeVariants[variant as keyof typeof activeVariants]
			: variants[variant];

	function handleClick(event: MouseEvent) {
		if (stopPropagation) event.stopPropagation();
		if (href) openInApp(event, href);
		dispatch('click', event);
	}

	$: controlClass = `shrink-0 cursor-pointer items-center transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none disabled:opacity-50 ${variantClass} ${className}`;
</script>

{#if href && !disabled}
	<a {href} class={controlClass} {...$$restProps} on:click={handleClick}>
		<slot />
	</a>
{:else}
	<button {type} {disabled} class={controlClass} {...$$restProps} on:click={handleClick}>
		<slot />
	</button>
{/if}
