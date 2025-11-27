<script lang="ts">
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/toastStore';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

{#if mounted && $toastStore}
	<div class="toast toast-center toast-top z-50 p-3">
		<div
			class="alert text-base"
			class:alert-success={$toastStore.type === 'success'}
			class:alert-error={$toastStore.type === 'error'}
		>
			<span>{$toastStore.message}</span>
		</div>
	</div>
{/if}
