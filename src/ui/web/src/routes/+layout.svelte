<script>
	import "../app.css";
	import Header from "$lib/components/Header.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { auth } from "$lib/stores/auth";
	import { onMount } from "svelte";

	onMount(() => {
		auth.init();
	});
</script>

<div class="min-h-screen flex flex-col bg-base-100">
	<Header />
	<main
		class="grow container mx-auto px-4 py-8 flex flex-col items-center gap-8"
	>
		<slot />
	</main>
	<Footer />
</div>
