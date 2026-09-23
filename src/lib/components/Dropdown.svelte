<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount, tick } from 'svelte';

	export let open = false;
	export let align: 'start' | 'end' = 'end';
	export let width: 'sm' | 'md' | 'lg' = 'md';

	const widths = {
		sm: 'w-48',
		md: 'w-56',
		lg: 'w-80'
	};

	let root: HTMLDivElement;
	let trigger: HTMLDivElement;
	let panelStyle = '';

	function toggle() {
		if (!open) updatePosition();
		open = !open;
	}

	function updatePosition() {
		if (!trigger) return;
		const rect = trigger.getBoundingClientRect();
		const top = rect.bottom + 4;
		panelStyle =
			align === 'end'
				? `top:${top}px;right:${window.innerWidth - rect.right}px;`
				: `top:${top}px;left:${rect.left}px;`;
	}

	async function place() {
		await tick();
		if (open) updatePosition();
	}

	function handleClickOutside(event: MouseEvent) {
		if (!open || root?.contains(event.target as Node)) return;
		open = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') open = false;
	}

	$: if (open) place();

	onMount(() => {
		document.addEventListener('click', handleClickOutside, true);
		document.addEventListener('keydown', handleKeydown);
		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);
	});

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('click', handleClickOutside, true);
		document.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('resize', updatePosition);
		window.removeEventListener('scroll', updatePosition, true);
	});
</script>

<div class="relative inline-block" bind:this={root}>
	<div bind:this={trigger}>
		<slot name="trigger" {open} {toggle} />
	</div>

	{#if open}
		<div
			class="fixed z-[100] flex max-h-[70vh] flex-col overflow-y-auto rounded-md bg-white py-1 whitespace-normal shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10 {widths[
				width
			]}"
			style={panelStyle}
			role="menu"
		>
			<slot />
		</div>
	{/if}
</div>
