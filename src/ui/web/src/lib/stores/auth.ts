import { writable } from "svelte/store";
import { authApi } from "$lib/api";
import { browser } from "$app/environment";

interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
}

function createAuthStore() {
    const { subscribe, set, update } = writable<{
        user: User | null;
        isAuthenticated: boolean;
        loading: boolean;
    }>({
        user: null,
        isAuthenticated: false,
        loading: true,
    });

    return {
        subscribe,
        init: async () => {
            if (!browser) return;
            try {
                const { user } = await authApi.me();
                set({ user, isAuthenticated: !!user, loading: false });
            } catch (error) {
                set({ user: null, isAuthenticated: false, loading: false });
            }
        },
        login: async (credentials: any) => {
            update(s => ({ ...s, loading: true }));
            try {
                await authApi.login(credentials);
                const { user } = await authApi.me();
                set({ user, isAuthenticated: true, loading: false });
                return true;
            } catch (error) {
                update(s => ({ ...s, loading: false }));
                throw error;
            }
        },
        logout: async () => {
            try {
                await authApi.logout();
            } finally {
                set({ user: null, isAuthenticated: false, loading: false });
            }
        }
    };
}

export const auth = createAuthStore();