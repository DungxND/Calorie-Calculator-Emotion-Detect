import { writable } from "svelte/store";

export interface Toast {
	message: string;
	type: "success" | "error";
}

export const toastStore = writable<Toast | null>(null);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function showToast(toast: Toast, duration = 5000) {
	// Clear any existing timeout to avoid overlapping
	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
	toastStore.set(toast);
	// Auto-hide after specified duration
	timeoutId = setTimeout(() => {
		toastStore.set(null);
		timeoutId = null;
	}, duration);
	// return a function to manually clear the toast and timeout
	return () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		toastStore.set(null);
	};
}

export function hideToast() {
	if (timeoutId) {
		clearTimeout(timeoutId);
		timeoutId = null;
	}
	toastStore.set(null);
}
