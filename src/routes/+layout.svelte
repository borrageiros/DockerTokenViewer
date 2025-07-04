<script lang="ts">
	import '../app.css';
	import theme, { type Theme } from '$lib/stores/theme';
	import { setBaseRepository } from '$lib/stores/repository';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
	let currentTheme: Theme;

	$effect(() => {
		if (data?.baseRepository !== undefined) {
			setBaseRepository(data.baseRepository);
		}
	});

	theme.subscribe((value) => {
		currentTheme = value;
	});

	onMount(() => {
		if (!browser) return;

		const applyTheme = (t: Theme) => {
			const isDark =
				t === 'dark' ||
				(t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
			document.documentElement.classList.toggle('dark', isDark);
		};

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const mediaQueryListener = () => {
			if (currentTheme === 'system') {
				applyTheme('system');
			}
		};
		mediaQuery.addEventListener('change', mediaQueryListener);

		const unsubscribe = theme.subscribe(applyTheme);

		return () => {
			unsubscribe();
			mediaQuery.removeEventListener('change', mediaQueryListener);
		};
	});
</script>

<div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
	{@render children()}
</div>
