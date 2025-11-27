<script lang="ts">
	import { Lock, Mail } from "lucide-svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { showToast } from "$lib/toastStore";
	import { auth } from "$lib/stores/auth";

	let submitting = $state(false);
	let email = $state("");
	let password = $state("");
	let errorMessage = $state<string | null>(null);

	async function handleLogin(e: Event) {
		e.preventDefault();
		submitting = true;
		errorMessage = null;
		try {
			await auth.login({ email, password });
			showToast({
				message: "Logged in successfully!",
				type: "success",
			});
			await goto("/");
		} catch (error: any) {
			console.error("Login error:", error);
			errorMessage =
				error.response?.status === 401
					? "Invalid email or password."
					: "Login failed. Please try again.";
		} finally {
			submitting = false;
		}
	}
</script>

<div class="grid min-h-screen w-full overflow-x-hidden lg:grid-cols-[2fr_3fr]">
	<div
		class="bg-base-100 flex flex-col items-center justify-center p-6 sm:p-8"
	>
		<div class="w-full max-w-md px-6">
			<a
				href="/"
				class="mb-8 flex items-center gap-3 self-start"
				style="view-transition-name: brand-logo"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="50"
					height="50"
					viewBox="0 0 100 100"
				>
					<g fill-rule="evenodd">
						<path fill="#282828" d="M46 12 15 88q-30-38 31-76Z" />
						<path fill="#825F41" d="m54 12 31 76q30-38-31-76Z" />
					</g>
				</svg>
				<span class="text-2xl font-bold">L'Artelier</span>
			</a>

			<h1 class="font-josefin text-4xl font-bold">Welcome back</h1>
			<p class="text-base-content/70 mt-2">
				Login to continue your journey.
			</p>

			<form class="mt-8 space-y-4" onsubmit={handleLogin}>
				<div
					id="email-field"
					style="view-transition-name: auth-email"
					class="form-control"
				>
					<div class="relative">
						<Mail
							class="pointer-events-none absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2 transform text-gray-600"
						/>
						<input
							type="email"
							id="email"
							name="email"
							class="input input-bordered w-full pl-10"
							required
							placeholder="Enter your email"
							bind:value={email}
						/>
					</div>
				</div>

				<div
					id="password-field"
					class="form-control"
					style="view-transition-name: auth-password"
				>
					<div class="relative">
						<Lock
							class="pointer-events-none absolute top-1/2 left-3 z-10 size-5 -translate-y-1/2 transform text-gray-600"
						/>
						<input
							type="password"
							id="password"
							name="password"
							class="input input-bordered w-full pl-10"
							required
							placeholder="Password"
							bind:value={password}
						/>
					</div>
				</div>

				{#if errorMessage}
					<div class="text-error min-h-[1rem] w-fit text-sm">
						{errorMessage}
					</div>
				{:else}
					<div class="min-h-[1rem]"></div>
				{/if}

				<div class="form-control pt-2">
					<button
						type="submit"
						class="btn btn-primary px-6"
						disabled={submitting}
						style="view-transition-name: auth-submit"
					>
						{#if submitting}
							<span class="loading loading-spinner"></span>
							Logging In...
						{:else}
							Login
						{/if}
					</button>
				</div>

				<div class=" text-sm">
					Don't have an account?
					<a href="/register" class="link-primary link">Register</a>
				</div>
			</form>
		</div>
	</div>

	<div
		class="hidden h-full items-center justify-center overflow-visible p-5 pr-0 lg:flex lg:translate-x-20"
	>
		<enhanced:img
			src="$lib/assets/backgrounds/signin_background.jpg"
			class="h-[70vh] max-h-[70vh] w-auto max-w-none rounded-xl object-cover shadow-xl"
			alt="Login Background"
		>
		</enhanced:img>
	</div>
</div>
