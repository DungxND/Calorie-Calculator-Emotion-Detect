<script lang="ts">
    import { onMount, untrack } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import AlertModal from "$lib/components/model/AlertModal.svelte";
    import { aggregateInsights } from "$lib/utils/foodInsights";
    import SymptomLogger from "$lib/components/SymptomLogger.svelte";
    import GrowthTracker from "$lib/components/GrowthTracker.svelte";
    import { aiApi, childrenApi } from "$lib/api";
    import { auth } from "$lib/stores/auth";
    import {
        UploadCloud,
        X,
        Save,
        Trash2,
        Activity,
        FileText,
        Info,
        Utensils,
        AlertTriangle,
        Loader2,
        ChevronDown,
    } from "lucide-svelte";

    // --- Types ---
    interface DigestiveAnalysis {
        digestibility_score: number;
        fodmap_level: string;
        texture: string;
        fiber_content: string;
        allergens: string[];
        micronutrients?: {
            iron: string;
            zinc: string;
            vitamin_d: string;
        };
        warnings?: string[];
    }

    interface MealEntry {
        id: string;
        date: string;
        items: string[];
        calories: number;
        digestiveAnalysis: DigestiveAnalysis | null;
    }

    interface ApiResponse {
        success: boolean;
        items?: string[];
        count?: number;
        digestive_analysis?: DigestiveAnalysis;
        message?: string;
    }

    interface FAQ {
        question: string;
        answer: string;
    }

    // --- Constants ---
    const STORAGE_KEY = "mealHistory";
    const MAX_MEAL_HISTORY = 50;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_FILE_TYPES = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    const faqs: FAQ[] = [
        {
            question: "Ứng dụng đo calo hoạt động như thế nào?",
            answer: "Ứng dụng sử dụng trí tuệ nhân tạo (AI) để phân tích hình ảnh món ăn mà phụ huynh chụp hoặc tải lên. Hệ thống sẽ nhận diện các loại thực phẩm trong khẩu phần và ước tính lượng calo, chất đạm, chất béo, chất xơ... giúp theo dõi dinh dưỡng của trẻ dễ dàng hơn.",
        },
        {
            question: "Ứng dụng có miễn phí không?",
            answer: "Hiện tại, ứng dụng được cung cấp hoàn toàn miễn phí để hỗ trợ phụ huynh quản lý chế độ ăn và theo dõi dinh dưỡng cho trẻ tại nhà.",
        },
        {
            question:
                "Ứng dụng có phù hợp với trẻ biếng ăn hoặc suy dinh dưỡng không?",
            answer: "Có. Ứng dụng được thiết kế đặc biệt để giúp phụ huynh theo dõi khẩu phần ăn, lượng calo và dưỡng chất của trẻ biếng ăn, chậm tăng cân hoặc có vấn đề tiêu hóa, từ đó điều chỉnh bữa ăn hợp lý hơn.",
        },
        {
            question:
                "Ứng dụng có thể nhận diện món ăn do phụ huynh tự nấu không?",
            answer: "Hoàn toàn có thể. Chỉ cần chụp lại hình món ăn của bé, AI sẽ ước tính lượng calo và dưỡng chất dựa trên nguyên liệu phổ biến trong ẩm thực Việt.",
        },
        {
            question: "Mức độ chính xác của việc ước tính calo là bao nhiêu?",
            answer: "Kết quả ước tính có thể dao động nhẹ tùy theo khẩu phần và nguyên liệu thực tế, nhưng hệ thống AI được huấn luyện với hàng chục nghìn món ăn để đảm bảo độ chính xác cao nhất có thể.",
        },
        {
            question:
                "Tôi có thể theo dõi cân nặng và chiều cao của trẻ không?",
            answer: "Có. Ứng dụng cho phép nhập cân nặng, chiều cao và tuổi của trẻ để tự động gợi ý mức calo cần thiết mỗi ngày, giúp phụ huynh dễ dàng theo dõi tiến triển dinh dưỡng.",
        },
        {
            question:
                "Ứng dụng có tư vấn thực đơn cho trẻ suy dinh dưỡng không?",
            answer: "Ứng dụng có thể gợi ý khẩu phần mẫu theo độ tuổi và tình trạng dinh dưỡng của trẻ. Tuy nhiên, để có phác đồ chính xác, phụ huynh vẫn nên tham khảo ý kiến bác sĩ hoặc chuyên gia dinh dưỡng.",
        },
        {
            question:
                "Trẻ bị khó tiêu hoặc hay đầy bụng có thể sử dụng app này không?",
            answer: "Có thể. Ứng dụng giúp phụ huynh nhận biết những món ăn có hàm lượng chất béo hoặc đường cao – là nguyên nhân gây khó tiêu – và đưa ra gợi ý thay thế nhẹ nhàng, dễ hấp thu hơn.",
        },
        {
            question: "Tôi có thể lưu lại lịch sử bữa ăn của con không?",
            answer: "Có. Ứng dụng tự động lưu lại các món ăn đã được quét, giúp phụ huynh theo dõi tiến trình ăn uống, khẩu vị và lượng calo hằng ngày của trẻ.",
        },
        {
            question: "Ứng dụng có cần kết nối Internet không?",
            answer: "Có, để phân tích hình ảnh và tính toán chính xác, ứng dụng cần kết nối mạng Internet. Tuy nhiên, lịch sử dữ liệu của bé vẫn được lưu lại để xem khi ngoại tuyến.",
        },
        {
            question: "Dữ liệu hình ảnh của con tôi có được bảo mật không?",
            answer: "Chắc chắn. Tất cả hình ảnh và thông tin được mã hóa và lưu trữ an toàn. Ứng dụng tuân thủ các tiêu chuẩn bảo mật nhằm bảo vệ quyền riêng tư của trẻ.",
        },
        {
            question: "Ứng dụng có hỗ trợ tư vấn chuyên gia không?",
            answer: "Phiên bản sắp tới sẽ tích hợp chức năng tư vấn trực tuyến cùng chuyên gia dinh dưỡng để phụ huynh nhận được lời khuyên phù hợp hơn cho từng trường hợp cụ thể.",
        },
    ];

    // --- State ---
    let uploadedImage = $state<string | null>(null);
    let foodItems = $state<string[]>([]);
    let totalCalories = $state(0);
    let digestiveAnalysis = $state<DigestiveAnalysis | null>(null);
    let isLoading = $state(false);
    let showAlert = $state(false);
    let alertMessage = $state("");
    let alertType = $state<"error" | "success" | "info">("error");
    let showGrowthTracker = $state(false);
    let mealHistory = $state<MealEntry[]>([]);
    let showLogger = $state(false);
    let fileInput: HTMLInputElement;
    let activeTab = $state<"analysis" | "history">("analysis");

    // --- Lifecycle & Persistence ---
    onMount(async () => {
        if (!browser) return;

        // Check children if authenticated
        if ($auth.isAuthenticated) {
            try {
                const res = (await childrenApi.getAll()) as { children: any[] };
                if (res.children.length === 0) {
                    goto("/children");
                    return;
                }
            } catch (e) {
                console.error("Failed to check children:", e);
            }
        }

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                mealHistory = JSON.parse(raw);
            }
        } catch (e) {
            console.warn("Failed to load meal history", e);
        }
    });

    $effect(() => {
        if (browser) {
            untrack(() => {
                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(mealHistory),
                    );
                } catch (e) {
                    console.warn("Failed to save meal history", e);
                }
            });
        }
    });

    // --- Helper Functions ---
    const generateId = (): string => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    };

    const getBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const validateFile = (file: File): { valid: boolean; error?: string } => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: "Vui lòng chọn file ảnh (JPEG, PNG, hoặc WebP)",
            };
        }

        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `Kích thước file quá lớn. Tối đa ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            };
        }

        return { valid: true };
    };

    const sendImageToServer = async (base64Image: string): Promise<void> => {
        isLoading = true;

        try {
            const data = (await aiApi.detectFood(base64Image)) as ApiResponse;

            if (data.success && data.items && data.count !== undefined) {
                foodItems = data.items;
                totalCalories = data.count;
                digestiveAnalysis = data.digestive_analysis || null;
            } else {
                alertType = "error";
                showAlert = true;
                alertMessage = data.message || "Lỗi khi phân tích ảnh.";
            }
        } catch (error) {
            console.error("Error analyzing image:", error);
            alertType = "error";
            showAlert = true;
            alertMessage =
                "Không thể phân tích ảnh. Vui lòng kiểm tra kết nối mạng và thử lại.";
        } finally {
            isLoading = false;
        }
    };

    const handleImageUpload = async (event: Event): Promise<void> => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) return;

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            alertType = "error";
            showAlert = true;
            alertMessage = validation.error || "File không hợp lệ";
            // Reset input
            if (fileInput) fileInput.value = "";
            return;
        }

        try {
            const base64Image = await getBase64(file);
            uploadedImage = base64Image;
            await sendImageToServer(base64Image);
        } catch (error) {
            console.error("Error reading file:", error);
            alertType = "error";
            showAlert = true;
            alertMessage = "Không thể đọc file ảnh. Vui lòng thử lại.";
        }
    };

    const closeAlertModal = (): void => {
        showAlert = false;
    };

    const handleRemoveImage = (): void => {
        uploadedImage = null;
        foodItems = [];
        totalCalories = 0;
        digestiveAnalysis = null;
        // Reset file input
        if (fileInput) fileInput.value = "";
    };

    const saveMeal = (): void => {
        if (!foodItems || foodItems.length === 0) {
            alertType = "error";
            showAlert = true;
            alertMessage = "Không có món ăn nào để lưu.";
            return;
        }

        const entry: MealEntry = {
            id: generateId(),
            date: new Date().toISOString(),
            items: foodItems,
            calories: totalCalories,
            digestiveAnalysis,
        };

        mealHistory = [entry, ...mealHistory].slice(0, MAX_MEAL_HISTORY);

        alertType = "success";
        showAlert = true;
        alertMessage = "Bữa ăn đã được lưu vào lịch sử.";
    };

    const deleteMeal = (id: string): void => {
        mealHistory = mealHistory.filter((m) => m.id !== id);
    };

    const clearMeals = (): void => {
        if (confirm("Bạn có chắc muốn xóa toàn bộ lịch sử bữa ăn?")) {
            mealHistory = [];
            alertType = "info";
            showAlert = true;
            alertMessage = "Đã xóa toàn bộ lịch sử bữa ăn.";
        }
    };

    const clearResults = (): void => {
        foodItems = [];
        totalCalories = 0;
        digestiveAnalysis = null;
    };
</script>

<div class="w-full max-w-7xl mx-auto pb-20 p-4">
    <div role="alert" class="alert alert-info alert-soft shadow-sm mb-8">
        <Info class="w-5 h-5" />
        <span
            >This is a free AI analysis tool. Results are for reference only.</span
        >
    </div>

    <div class="text-center mb-10">
        <h1
            class="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
        >
            AI Digestive Assistant
        </h1>
        <p class="text-base-content/70">
            Meal Analysis & Digestive Health Tracking for Kids
        </p>
    </div>

    <!-- Tools Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <button
            class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 border border-base-200 text-left group overflow-hidden relative"
            onclick={() => (showGrowthTracker = !showGrowthTracker)}
        >
            <div class="card-body flex-row items-center gap-4 z-10">
                <div
                    class="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform"
                >
                    <Activity class="w-6 h-6" />
                </div>
                <div>
                    <h3
                        class="card-title text-lg group-hover:text-secondary transition-colors"
                    >
                        Growth Tracker
                    </h3>
                    <p class="text-sm text-base-content/60">
                        Monitor height, weight & calorie needs
                    </p>
                </div>
                <ChevronDown
                    class={`w-5 h-5 ml-auto transition-transform duration-300 ${showGrowthTracker ? "rotate-180" : ""}`}
                />
            </div>
            {#if showGrowthTracker}
                <div
                    class="absolute bottom-0 left-0 w-full h-1 bg-secondary"
                ></div>
            {/if}
        </button>

        <button
            class="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 border border-base-200 text-left group overflow-hidden relative"
            onclick={() => (showLogger = !showLogger)}
        >
            <div class="card-body flex-row items-center gap-4 z-10">
                <div
                    class="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform"
                >
                    <FileText class="w-6 h-6" />
                </div>
                <div>
                    <h3
                        class="card-title text-lg group-hover:text-accent transition-colors"
                    >
                        Symptom Logger
                    </h3>
                    <p class="text-sm text-base-content/60">
                        Track digestive issues & mood
                    </p>
                </div>
                <ChevronDown
                    class={`w-5 h-5 ml-auto transition-transform duration-300 ${showLogger ? "rotate-180" : ""}`}
                />
            </div>
            {#if showLogger}
                <div
                    class="absolute bottom-0 left-0 w-full h-1 bg-accent"
                ></div>
            {/if}
        </button>
    </div>

    <!-- Conditional Components with Animation -->
    {#if showGrowthTracker}
        <div class="mb-8">
            <GrowthTracker />
        </div>
    {/if}
    {#if showLogger}
        <div class="mb-8">
            <SymptomLogger />
        </div>
    {/if}

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-lifted tabs-lg mb-6">
        <button
            role="tab"
            class="tab {activeTab === 'analysis'
                ? 'tab-active [--tab-bg:var(--color-base-100)]'
                : ''}"
            onclick={() => (activeTab = "analysis")}
        >
            AI Analysis
        </button>
        <button
            role="tab"
            class="tab {activeTab === 'history'
                ? 'tab-active [--tab-bg:var(--color-base-100)]'
                : ''}"
            onclick={() => (activeTab = "history")}
        >
            Meal History
        </button>
        <div role="tab" class="tab flex-1 cursor-default"></div>
    </div>

    <div class="bg-base-100 border-base-300 rounded-box p-6 min-h-[500px]">
        {#if activeTab === "analysis"}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Image Upload Section -->
                <div class="w-full h-full flex flex-col">
                    <div
                        class="relative w-full h-[400px] border-2 border-dashed border-base-300 rounded-xl hover:border-primary transition-all duration-300 bg-base-50 flex flex-col items-center justify-center overflow-hidden group cursor-pointer shadow-inner"
                    >
                        {#if uploadedImage}
                            <img
                                src={uploadedImage}
                                alt="Uploaded Food"
                                class="w-full h-full object-cover"
                            />
                            <div
                                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                            >
                                <button
                                    onclick={(e) => {
                                        e.preventDefault();
                                        handleRemoveImage();
                                    }}
                                    class="btn btn-circle btn-error text-white scale-0 group-hover:scale-100 transition-transform duration-300"
                                    aria-label="Remove image"
                                >
                                    <X class="w-6 h-6" />
                                </button>
                            </div>
                        {:else}
                            <label
                                for="upload"
                                class="flex flex-col items-center justify-center w-full h-full cursor-pointer p-6 text-center group-hover:scale-105 transition-transform duration-300"
                            >
                                <div
                                    class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary shadow-sm"
                                >
                                    <UploadCloud class="w-10 h-10" />
                                </div>
                                <h3 class="text-xl font-bold mb-2">
                                    Upload Meal Photo
                                </h3>
                                <p class="text-sm text-base-content/60">
                                    Click to select or drag & drop
                                </p>
                                <p
                                    class="text-xs text-base-content/40 mt-2 badge badge-ghost"
                                >
                                    Max {MAX_FILE_SIZE / 1024 / 1024}MB • JPEG,
                                    PNG, WebP
                                </p>
                            </label>
                        {/if}
                        <input
                            id="upload"
                            type="file"
                            accept={ALLOWED_FILE_TYPES.join(",")}
                            onchange={handleImageUpload}
                            class="hidden"
                            bind:this={fileInput}
                        />
                    </div>
                </div>

                <!-- Results Section -->
                <div class="w-full h-full">
                    {#if isLoading}
                        <div
                            class="card bg-base-100 h-full flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
                        >
                            <span
                                class="loading loading-spinner loading-lg text-primary mb-4"
                            ></span>
                            <h3 class="text-xl font-bold text-base-content/80">
                                Analyzing Meal...
                            </h3>
                            <p class="text-base-content/60 mt-2 max-w-xs">
                                AI is checking ingredients and digestive safety
                                for your child.
                            </p>
                        </div>
                    {:else if foodItems.length === 0}
                        <div
                            class="card bg-base-100 h-full flex flex-col items-center justify-center p-8 text-center min-h-[300px] opacity-60"
                        >
                            <div
                                class="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4"
                            >
                                <Utensils
                                    class="w-10 h-10 text-base-content/40"
                                />
                            </div>
                            <h3
                                class="text-xl font-semibold text-base-content/70"
                            >
                                Analysis Results
                            </h3>
                            <p class="text-base-content/50 mt-2">
                                Upload a photo to see AI analysis here.
                            </p>
                        </div>
                    {:else}
                        <div
                            class="card bg-base-100 h-full flex flex-col animate-fade-in"
                        >
                            <div class="card-body p-0">
                                <h2
                                    class="card-title text-2xl mb-6 flex items-center gap-2"
                                >
                                    <Utensils class="w-6 h-6 text-primary" />
                                    Identified Items
                                </h2>

                                <!-- Food Items -->
                                <div class="flex flex-wrap gap-2 mb-8">
                                    {#each foodItems as item}
                                        <span
                                            class="badge badge-lg badge-primary badge-soft p-4 font-medium"
                                        >
                                            {item}
                                        </span>
                                    {/each}
                                </div>

                                <!-- Digestive Analysis -->
                                {#if digestiveAnalysis}
                                    <div class="w-full mb-6">
                                        <!-- Stats -->
                                        <div
                                            class="stats shadow w-full bg-base-200/50 mb-6"
                                        >
                                            <div
                                                class="stat place-items-center"
                                            >
                                                <div class="stat-title">
                                                    Digestibility Score
                                                </div>
                                                <div
                                                    class={`stat-value text-3xl ${
                                                        digestiveAnalysis.digestibility_score >=
                                                        7
                                                            ? "text-success"
                                                            : digestiveAnalysis.digestibility_score >=
                                                                5
                                                              ? "text-warning"
                                                              : "text-error"
                                                    }`}
                                                >
                                                    {digestiveAnalysis.digestibility_score}<span
                                                        class="text-lg text-base-content/40"
                                                        >/10</span
                                                    >
                                                </div>
                                            </div>
                                            <div
                                                class="stat place-items-center"
                                            >
                                                <div class="stat-title">
                                                    Calories
                                                </div>
                                                <div
                                                    class="stat-value text-secondary text-3xl"
                                                >
                                                    {totalCalories}
                                                </div>
                                                <div
                                                    class="stat-desc font-bold"
                                                >
                                                    kcal
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Details Grid -->
                                        <div
                                            class="grid grid-cols-2 gap-3 mb-6"
                                        >
                                            {#each [{ label: "FODMAP", value: digestiveAnalysis.fodmap_level, color: digestiveAnalysis.fodmap_level === "Low" ? "badge-success" : "badge-warning" }, { label: "Texture", value: digestiveAnalysis.texture, color: "badge-neutral" }, { label: "Fiber", value: digestiveAnalysis.fiber_content, color: "badge-info" }] as detail}
                                                <div
                                                    class="flex flex-col items-center p-3 bg-base-200/50 rounded-xl"
                                                >
                                                    <span
                                                        class="text-xs font-bold opacity-60 uppercase mb-1"
                                                        >{detail.label}</span
                                                    >
                                                    <span
                                                        class={`badge ${detail.color} font-semibold`}
                                                        >{detail.value}</span
                                                    >
                                                </div>
                                            {/each}

                                            <div
                                                class="flex flex-col items-center p-3 bg-base-200/50 rounded-xl"
                                            >
                                                <span
                                                    class="text-xs font-bold opacity-60 uppercase mb-1"
                                                    >Allergens</span
                                                >
                                                <div
                                                    class="flex flex-wrap justify-center gap-1"
                                                >
                                                    {#if digestiveAnalysis.allergens.length > 0 && digestiveAnalysis.allergens[0] !== "None"}
                                                        {#each digestiveAnalysis.allergens as allergen}
                                                            <span
                                                                class="badge badge-xs badge-error"
                                                                >{allergen}</span
                                                            >
                                                        {/each}
                                                    {:else}
                                                        <span
                                                            class="badge badge-xs badge-success"
                                                            >None</span
                                                        >
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Micronutrients -->
                                        {#if digestiveAnalysis.micronutrients}
                                            <div
                                                class="collapse collapse-arrow bg-base-200/30 rounded-xl mb-4"
                                            >
                                                <input type="checkbox" />
                                                <div
                                                    class="collapse-title font-medium text-sm flex items-center gap-2"
                                                >
                                                    <Activity class="w-4 h-4" />
                                                    Micronutrients
                                                </div>
                                                <div class="collapse-content">
                                                    <div
                                                        class="grid grid-cols-3 gap-2 pt-2"
                                                    >
                                                        {#each Object.entries(digestiveAnalysis.micronutrients) as [key, value]}
                                                            <div
                                                                class="text-center p-2 bg-base-100 rounded-lg border border-base-200"
                                                            >
                                                                <div
                                                                    class="text-xs uppercase font-bold opacity-60"
                                                                >
                                                                    {key.replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                </div>
                                                                <div
                                                                    class={`font-bold ${value === "High" ? "text-success" : ""}`}
                                                                >
                                                                    {value}
                                                                </div>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Warnings -->
                                        {#if digestiveAnalysis.warnings && digestiveAnalysis.warnings.length > 0}
                                            <div
                                                role="alert"
                                                class="alert alert-warning alert-soft text-sm"
                                            >
                                                <AlertTriangle
                                                    class="w-5 h-5"
                                                />
                                                <div>
                                                    <h3 class="font-bold">
                                                        Notes:
                                                    </h3>
                                                    <ul
                                                        class="list-disc list-inside opacity-90"
                                                    >
                                                        {#each digestiveAnalysis.warnings as warning}
                                                            <li>{warning}</li>
                                                        {/each}
                                                    </ul>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                {/if}

                                <!-- Action Buttons -->
                                <div
                                    class="card-actions justify-center mt-auto pt-4 border-t border-base-200 gap-3"
                                >
                                    <button
                                        class="btn btn-outline btn-error"
                                        onclick={clearResults}
                                    >
                                        <Trash2 class="w-4 h-4" /> Clear
                                    </button>
                                    <button
                                        class="btn btn-success text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                        onclick={saveMeal}
                                    >
                                        <Save class="w-4 h-4" /> Save Meal
                                    </button>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <!-- Meal History View -->
            {#if mealHistory.length > 0}
                <div>
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-2xl font-bold flex items-center gap-2">
                            <Activity class="w-6 h-6 text-primary" />
                            Meal History
                        </h3>
                        <button
                            class="btn btn-sm btn-ghost text-error gap-2"
                            onclick={clearMeals}
                        >
                            <Trash2 class="w-4 h-4" /> Clear All
                        </button>
                    </div>

                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {#each mealHistory as meal (meal.id)}
                            <div
                                class="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div class="card-body p-5">
                                    <div
                                        class="flex justify-between items-start mb-2"
                                    >
                                        <div
                                            class="text-xs text-base-content/60 uppercase tracking-wider font-semibold"
                                        >
                                            {new Date(meal.date).toLocaleString(
                                                "en-US",
                                                {
                                                    day: "2-digit",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                },
                                            )}
                                        </div>
                                        <button
                                            class="btn btn-ghost btn-xs btn-circle text-error"
                                            onclick={() => deleteMeal(meal.id)}
                                            aria-label="Delete meal"
                                        >
                                            <X class="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div
                                        class="font-bold text-lg mb-1 truncate text-primary"
                                        title={meal.items.join(", ")}
                                    >
                                        {meal.items.join(", ")}
                                    </div>
                                    <div class="flex gap-2 mt-2 flex-wrap">
                                        <div
                                            class="badge badge-secondary badge-outline font-bold"
                                        >
                                            {meal.calories} kcal
                                        </div>
                                        {#if meal.digestiveAnalysis}
                                            <div
                                                class={`badge ${
                                                    meal.digestiveAnalysis
                                                        .digestibility_score >=
                                                    7
                                                        ? "badge-success"
                                                        : "badge-warning"
                                                } badge-soft`}
                                            >
                                                Score: {meal.digestiveAnalysis
                                                    .digestibility_score}
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <div
                    class="flex flex-col items-center justify-center h-[400px] text-center opacity-60"
                >
                    <Activity class="w-16 h-16 mb-4 text-base-content/30" />
                    <h3 class="text-xl font-bold">No meals recorded yet</h3>
                    <p class="max-w-xs mt-2">
                        Analyze and save your first meal to start tracking
                        history.
                    </p>
                    <button
                        class="btn btn-primary btn-sm mt-4"
                        onclick={() => (activeTab = "analysis")}
                        >Go to Analysis</button
                    >
                </div>
            {/if}
        {/if}
    </div>

    <!-- FAQ Section Removed (Better on Landing Page) -->

    <!-- Alert Modal -->
    <AlertModal
        show={showAlert}
        onClose={closeAlertModal}
        type={alertType}
        message={alertMessage}
    />
</div>
