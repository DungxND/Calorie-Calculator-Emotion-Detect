<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { browser } from "$app/environment";
    import {
        Activity,
        Calculator,
        RotateCcw,
        Trash2,
        User,
    } from "lucide-svelte";
    import { childrenApi, logsApi } from "$lib/api";
    import { auth } from "$lib/stores/auth";

    // --- Types ---
    type Gender = "male" | "female";

    interface ChildData {
        age: number | null | "";
        weight: number | null | "";
        height: number | null | "";
        gender: Gender;
    }

    interface HistoryEntry
        extends Omit<ChildData, "age" | "weight" | "height"> {
        age: number;
        weight: number;
        height: number;
        id: string;
        date: string;
        calories: number;
    }

    interface Child {
        id: number;
        name: string;
        birth_date: string;
        gender: Gender;
    }

    // --- Constants ---
    const MAX_HISTORY_ENTRIES = 50;

    // --- State ---
    let children = $state<Child[]>([]);
    let selectedChildId = $state<number | null>(null);

    let childData = $state<ChildData>({
        age: null,
        weight: null,
        height: null,
        gender: "male",
    });
    let activityLevel = $state(1.5);
    let isSubmitting = $state(false);
    let history = $state<HistoryEntry[]>([]);
    let recommendedCalories = $state<number | null>(null);
    let errorMessage = $state<string | null>(null);

    // --- Derived State ---
    const isValidNumber = (val: number | null | ""): val is number => {
        return val !== null && val !== "" && Number(val) > 0;
    };

    let isValid = $derived(
        isValidNumber(childData.age) &&
            isValidNumber(childData.weight) &&
            isValidNumber(childData.height),
    );

    // --- Lifecycle & Persistence ---
    onMount(async () => {
        if (!browser) return;

        if ($auth.isAuthenticated) {
            try {
                const res = (await childrenApi.getAll()) as {
                    children: Child[];
                };
                children = res.children;
                if (children.length > 0) {
                    selectedChildId = children[0].id;
                }
            } catch (e) {
                console.error("Failed to load children", e);
            }
        }

        // Legacy local storage load if no user
        if (!$auth.isAuthenticated) {
            try {
                const savedHistory = localStorage.getItem("growthHistory");
                if (savedHistory) {
                    history = JSON.parse(savedHistory);
                }
            } catch (e) {
                console.error("Failed to load history from localStorage", e);
            }
        }
    });

    $effect(() => {
        if (selectedChildId && $auth.isAuthenticated) {
            loadHistoryForChild(selectedChildId);
        }
    });

    const loadHistoryForChild = async (childId: number) => {
        try {
            const res = await logsApi.getGrowth(childId);
            // Map backend logs to history format
            history = res.logs.map((log: any) => {
                const child = children.find((c) => c.id === childId);
                const birthDate = new Date(child?.birth_date || Date.now());
                const logDate = new Date(log.date);
                // Calculate age at time of log
                const age =
                    (logDate.getTime() - birthDate.getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25);

                // Recalculate calories if not stored (backend doesn't store calories yet, maybe we should add it or calc on fly)
                // For now, re-calculate BMR to display
                const bmr = calculateBMR(
                    log.weight,
                    log.height,
                    age,
                    (child?.gender as Gender) || "male",
                );
                // Assuming moderate activity for history display if not stored
                const calories = Math.round(bmr * 1.5);

                return {
                    id: log.id.toString(),
                    date: log.date,
                    age: Number(age.toFixed(1)),
                    weight: log.weight,
                    height: log.height,
                    gender: child?.gender || "male",
                    calories: calories,
                };
            });
        } catch (e) {
            console.error("Failed to load growth logs", e);
        }
    };

    $effect(() => {
        if (browser && !$auth.isAuthenticated) {
            localStorage.setItem("growthHistory", JSON.stringify(history));
        }
    });

    // Effect to clear results when form data changes
    $effect(() => {
        childData.age;
        childData.weight;
        childData.height;
        childData.gender;
        activityLevel;

        untrack(() => {
            if (recommendedCalories !== null) {
                recommendedCalories = null;
            }
            if (errorMessage !== null) {
                errorMessage = null;
            }
        });
    });

    // --- Logic ---
    const generateId = (): string => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    };

    /**
     * Calculates BMR in kcal/day using the Schofield (weight + height) equations.
     * Equations output kJ/day which are converted to kcal.
     * Source: https://naspghan.org/files/documents/pdfs/cme/jpgn/Accurate_Estimation_of_Energy_Requirements_of.5.pdf
     */
    const calculateBMR = (
        weight: number,
        height: number,
        age: number,
        gender: Gender,
    ): number => {
        let energyKJ; // Energy in kilojoules
        const heightM = height / 100;

        if (age < 3) {
            energyKJ =
                gender === "male"
                    ? 0.167 * weight + 15.174 * heightM - 617.6
                    : 16.252 * weight + 10.232 * heightM - 413.5;
        } else if (age < 10) {
            energyKJ =
                gender === "male"
                    ? 19.59 * weight + 1.303 * heightM + 414.9
                    : 16.969 * weight + 1.618 * heightM + 371.2;
        } else {
            // Ages 10-18
            energyKJ =
                gender === "male"
                    ? 16.25 * weight + 1.372 * heightM + 515.5
                    : 8.365 * weight + 4.65 * heightM + 200.0;
        }

        // Convert kJ to kcal (1 kcal = 4.184 kJ)
        return energyKJ / 4.184;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!isValid || isSubmitting) return;

        isSubmitting = true;
        errorMessage = null;

        try {
            const { age, weight, height, gender } = childData;

            // Type guard - should never happen due to isValid check
            if (
                !isValidNumber(age) ||
                !isValidNumber(weight) ||
                !isValidNumber(height)
            ) {
                errorMessage = "Vui lòng điền đầy đủ thông tin hợp lệ";
                return;
            }

            const bmr = calculateBMR(weight, height, age, gender);
            const calories = Math.round(bmr * activityLevel);

            recommendedCalories = calories;

            const entry: HistoryEntry = {
                id: generateId(),
                date: new Date().toISOString(),
                age,
                weight,
                height,
                gender,
                calories,
            };

            // Save to backend if authenticated
            if ($auth.isAuthenticated && selectedChildId) {
                await logsApi.createGrowth({
                    child_id: selectedChildId,
                    date: new Date().toISOString(),
                    weight,
                    height,
                    note: `Calorie calculation: ${calories} kcal`,
                });
                // Refresh history
                await loadHistoryForChild(selectedChildId);
            } else {
                // Prepend new entry and limit history size for local storage
                history = [entry, ...history].slice(0, MAX_HISTORY_ENTRIES);
            }
        } catch (error) {
            console.error("Calculation error:", error);
            errorMessage = "Có lỗi xảy ra khi tính toán. Vui lòng thử lại.";
        } finally {
            // Prevent multiple rapid submissions
            setTimeout(() => {
                isSubmitting = false;
            }, 500);
        }
    };

    const resetData = () => {
        childData = { age: null, weight: null, height: null, gender: "male" };
        recommendedCalories = null;
        errorMessage = null;
    };
</script>

<div class="card bg-base-100 mt-6 w-full shadow-xl">
    <div class="card-body">
        <h2 class="card-title flex items-center gap-2 text-lg font-bold">
            <Activity class="h-5 w-5 text-primary" />
            Theo dõi tăng trưởng
        </h2>
        <p class="text-base-content/70 mb-4 text-sm">
            Nhập thông tin của trẻ để ước tính lượng calo khuyến nghị hàng ngày.
        </p>

        {#if $auth.isAuthenticated && children.length > 0}
            <div class="form-control w-full mb-4">
                <label class="label" for="childSelect">
                    <span class="label-text font-medium flex gap-2 items-center"
                        ><User class="w-4 h-4" /> Chọn trẻ</span
                    >
                </label>
                <select
                    id="childSelect"
                    bind:value={selectedChildId}
                    class="select select-bordered w-full"
                >
                    {#each children as child}
                        <option value={child.id}>{child.name}</option>
                    {/each}
                </select>
            </div>
        {/if}

        <form onsubmit={handleSubmit}>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <!-- Age Input -->
                <div class="form-control w-full">
                    <label class="label" for="age">
                        <span class="label-text font-medium">Tuổi (năm)</span>
                    </label>
                    <input
                        type="number"
                        id="age"
                        min="0"
                        max="18"
                        step="0.1"
                        bind:value={childData.age}
                        placeholder="Ví dụ: 5.5"
                        class="input input-bordered w-full"
                        required
                    />
                </div>

                <!-- Weight Input -->
                <div class="form-control w-full">
                    <label class="label" for="weight">
                        <span class="label-text font-medium">Cân nặng (kg)</span
                        >
                    </label>
                    <input
                        type="number"
                        id="weight"
                        min="0"
                        step="0.1"
                        bind:value={childData.weight}
                        placeholder="Ví dụ: 18.5"
                        class="input input-bordered w-full"
                        required
                    />
                </div>

                <!-- Height Input -->
                <div class="form-control w-full">
                    <label class="label" for="height">
                        <span class="label-text font-medium"
                            >Chiều cao (cm)</span
                        >
                    </label>
                    <input
                        type="number"
                        id="height"
                        min="0"
                        step="0.1"
                        bind:value={childData.height}
                        placeholder="Ví dụ: 110"
                        class="input input-bordered w-full"
                        required
                    />
                </div>

                <!-- Gender Select -->
                <div class="form-control w-full">
                    <label class="label" for="gender">
                        <span class="label-text font-medium">Giới tính</span>
                    </label>
                    <select
                        id="gender"
                        bind:value={childData.gender}
                        class="select select-bordered w-full"
                    >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                    </select>
                </div>

                <!-- Activity Level -->
                <div class="form-control w-full md:col-span-2">
                    <label class="label" for="activityLevel">
                        <span class="label-text font-medium"
                            >Mức độ hoạt động</span
                        >
                    </label>
                    <select
                        id="activityLevel"
                        bind:value={activityLevel}
                        class="select select-bordered w-full"
                    >
                        <option value={1.3}>Nhẹ (ít vận động)</option>
                        <option value={1.5}>Vừa phải (chơi đùa, đi bộ)</option>
                        <option value={1.7}
                            >Nhiều (chơi thể thao, hoạt động mạnh)</option
                        >
                    </select>
                </div>
            </div>

            <div class="card-actions mt-6 justify-end">
                <button
                    type="button"
                    class="btn btn-ghost gap-2"
                    onclick={resetData}
                >
                    <RotateCcw class="h-4 w-4" /> Đặt lại
                </button>
                <button
                    type="submit"
                    class="btn btn-primary gap-2"
                    disabled={!isValid || isSubmitting}
                >
                    <Calculator class="h-4 w-4" />
                    {#if isSubmitting}
                        Đang tính...
                    {:else}
                        Tính toán
                    {/if}
                </button>
            </div>
        </form>

        <!-- Error Message -->
        {#if errorMessage}
            <div role="alert" class="alert alert-error mt-6">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span>{errorMessage}</span>
            </div>
        {/if}

        <!-- Success Result -->
        {#if recommendedCalories}
            <div role="alert" class="alert alert-success mt-6 shadow-lg">
                <Calculator class="h-6 w-6" />
                <div>
                    <h3 class="text-lg font-bold">Khuyến nghị hàng ngày:</h3>
                    <div class="text-xl">
                        Cần khoảng <span class="text-3xl font-black"
                            >{recommendedCalories}</span
                        > calories/ngày
                    </div>
                    <div class="mt-1 text-xs opacity-70">
                        * Dựa trên công thức Schofield (cân nặng + chiều cao) và
                        chỉ mang tính tham khảo. Độ chính xác có thể thay đổi
                        tùy thuộc vào từng trẻ. Luôn tham khảo ý kiến bác sĩ để
                        có chỉ định chính xác.
                    </div>
                </div>
            </div>
        {/if}

        <!-- History Table -->
        {#if history.length > 0}
            <div class="mt-8">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Lịch sử theo dõi</h3>
                    <button
                        class="btn btn-error btn-outline btn-xs gap-1"
                        onclick={() => (history = [])}
                    >
                        <Trash2 class="h-3 w-3" /> Xóa lịch sử
                    </button>
                </div>

                <div class="border-base-200 overflow-x-auto rounded-lg border">
                    <table class="table table-zebra w-full">
                        <thead class="bg-base-200">
                            <tr>
                                <th>Ngày</th>
                                <th>Tuổi</th>
                                <th>Cân nặng</th>
                                <th>Chiều cao</th>
                                <th>Calo/ngày</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each history as entry (entry.id)}
                                <tr>
                                    <td class="whitespace-nowrap text-sm">
                                        {new Date(
                                            entry.date,
                                        ).toLocaleDateString("vi-VN", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </td>
                                    <td>{entry.age}</td>
                                    <td>{entry.weight} kg</td>
                                    <td>{entry.height} cm</td>
                                    <td class="text-primary font-bold"
                                        >{entry.calories}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}
    </div>
</div>
