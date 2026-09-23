<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	export let label = '';

	let anchor: HTMLSpanElement;
	let visible = false;
	let style = '';
	let timer: ReturnType<typeof setTimeout> | undefined;

	export function notify() {
		visible = true;
		updatePosition();
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			visible = false;
		}, 1500);
	}

	function updatePosition() {
		if (!anchor) return;
		const rect = anchor.getBoundingClientRect();
		const gap = 6;
		const right = Math.max(8, window.innerWidth - rect.right);
		style =
			rect.top > 40
				? `top:${rect.top - gap}px;right:${right}px;transform:translateY(-100%);`
				: `top:${rect.bottom + gap}px;right:${right}px;`;
	}

	function handleViewportChange() {
		if (visible) updatePosition();
	}

	onMount(() => {
		window.addEventListener('resize', handleViewportChange);
		window.addEventListener('scroll', handleViewportChange, true);
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
		if (!browser) return;
		window.removeEventListener('resize', handleViewportChange);
		window.removeEventListener('scroll', handleViewportChange, true);
	});
</script>

<span class="inline-flex" bind:this={anchor}>
	<slot />
</span>

{#if visible}
	<div
		class="pointer-events-none fixed z-[110] rounded-md bg-white px-2 py-1 text-xs font-medium whitespace-nowrap text-gray-700 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:text-gray-200 dark:ring-white/10"
		style={style}
		role="status"
	>
		{label}
	</div>
{/if}
