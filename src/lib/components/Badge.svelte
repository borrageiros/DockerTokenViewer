<script lang="ts">
	export let text: string;
	export let color: 'success' | 'warning' | 'danger' = 'success';
	export let tooltipText: string = '';

	const colorClasses = {
		success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
	};
</script>

<span
	class="ml-2 inline-flex min-w-[3.5rem] items-center justify-center rounded-full px-2 py-1 text-xs font-medium {colorClasses[
		color
	]}"
	title={tooltipText}
>
	{text}
</span>
