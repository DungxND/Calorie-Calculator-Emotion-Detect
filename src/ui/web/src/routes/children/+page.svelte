<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { childrenApi } from "$lib/api";
    import { auth } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { showToast } from "$lib/toastStore";
    import {
        PlusCircle,
        Edit,
        Trash2,
        User,
        X,
        Loader2,
        Baby,
    } from "lucide-svelte";

    // --- Types ---
    interface Child {
        id: number;
        name: string;
        birth_date: string;
        gender: "male" | "female" | "other";
    }

    interface FormData {
        name: string;
        birth_date: string;
        gender: "male" | "female" | "other";
    }

    interface FormErrors {
        name?: string;
        birth_date?: string;
    }

    // --- State ---
    let children = $state<Child[]>([]);
    let loading = $state(true);
    let submitting = $state(false);
    let isEditing = $state(false);
    let editingId = $state<number | null>(null);
    let formData = $state<FormData>({
        name: "",
        birth_date: "",
        gender: "male",
    });
    let formErrors = $state<FormErrors>({});
    let modalElement = $state<HTMLDialogElement>();
    let firstFocusableElement: HTMLElement;

    // --- Derived State ---
    let isFormValid = $derived(
        formData.name.trim() !== "" &&
            formData.birth_date !== "" &&
            Object.keys(formErrors).length === 0,
    );

    // Fixed: Use $derived.by for conditional logic
    let todayDate = $derived.by(() => {
        if (!browser) return "";
        return new Date().toISOString().split("T")[0];
    });

    // --- Helper Functions ---
    function calculateAge(birthDate: string): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
            age--;
        }

        return age;
    }

    function getAgeDisplay(birthDate: string): string {
        const age = calculateAge(birthDate);
        if (age === 0) {
            const months = Math.floor(
                (new Date().getTime() - new Date(birthDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 30),
            );
            return months < 1 ? "Dưới 1 tháng" : `${months} tháng`;
        }
        return `${age} tuổi`;
    }

    function validateForm(): boolean {
        const errors: FormErrors = {};

        if (formData.name.trim().length === 0) {
            errors.name = "Vui lòng nhập họ tên";
        } else if (formData.name.trim().length < 2) {
            errors.name = "Họ tên phải có ít nhất 2 ký tự";
        } else if (formData.name.trim().length > 100) {
            errors.name = "Họ tên không được quá 100 ký tự";
        }

        if (!formData.birth_date) {
            errors.birth_date = "Vui lòng chọn ngày sinh";
        } else {
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            if (birthDate > today) {
                errors.birth_date = "Ngày sinh không thể trong tương lai";
            }
        }

        formErrors = errors;
        return Object.keys(errors).length === 0;
    }

    function trapFocus(e: KeyboardEvent) {
        if (!modalElement || !modalElement.open) return;

        const focusableElements = modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements?.[0] as HTMLElement;
        const lastElement = focusableElements?.[
            focusableElements.length - 1
        ] as HTMLElement;

        if (e.key === "Tab") {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    }

    // --- Lifecycle ---
    $effect(() => {
        if (!$auth.loading) {
            if ($auth.isAuthenticated) {
                loadChildren();
            } else {
                goto("/login");
            }
        }
    });

    $effect(() => {
        if (browser && modalElement?.open) {
            document.body.style.overflow = "hidden";
            // Focus first input when modal opens
            setTimeout(() => {
                const firstInput = modalElement?.querySelector("input");
                firstInput?.focus();
            }, 100);
        } else if (browser) {
            document.body.style.overflow = "";
        }

        return () => {
            if (browser) {
                document.body.style.overflow = "";
            }
        };
    });

    // --- API Functions ---
    async function loadChildren() {
        loading = true;
        try {
            const res = (await childrenApi.getAll()) as { children: Child[] };
            children = res.children || [];
        } catch (error) {
            console.error("Failed to load children:", error);
            showToast({
                message: "Không thể tải danh sách. Vui lòng thử lại.",
                type: "error",
            });
        } finally {
            loading = false;
        }
    }

    // --- Modal Functions ---
    function openAddModal() {
        isEditing = false;
        editingId = null;
        formData = { name: "", birth_date: "", gender: "male" };
        formErrors = {};
        modalElement?.showModal();
    }

    function openEditModal(child: Child) {
        isEditing = true;
        editingId = child.id;
        formData = {
            name: child.name,
            birth_date: child.birth_date,
            gender: child.gender,
        };
        formErrors = {};
        modalElement?.showModal();
    }

    function closeModal() {
        modalElement?.close();
        formData = { name: "", birth_date: "", gender: "male" };
        formErrors = {};
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && modalElement?.open) {
            closeModal();
        }
        trapFocus(e);
    }

    // --- Form Handlers ---
    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!validateForm() || submitting) return;

        submitting = true;

        try {
            const payload = {
                ...formData,
                name: formData.name.trim(),
            };

            if (isEditing && editingId) {
                await childrenApi.update(editingId, payload);
                showToast({
                    message: "Cập nhật thông tin thành công",
                    type: "success",
                });
            } else {
                await childrenApi.create(payload);
                showToast({
                    message: "Thêm hồ sơ thành công",
                    type: "success",
                });
            }

            closeModal();
            await loadChildren();
        } catch (error: any) {
            console.error("Failed to save child:", error);
            const message =
                error.response?.data?.message ||
                "Không thể lưu thông tin. Vui lòng thử lại.";
            showToast({ message, type: "error" });
        } finally {
            submitting = false;
        }
    }

    async function handleDelete(child: Child) {
        // Custom confirmation dialog would be better, but using built-in for now
        const confirmed = confirm(
            `Bạn có chắc muốn xóa hồ sơ của ${child.name}?`,
        );
        if (!confirmed) return;

        try {
            await childrenApi.delete(child.id);
            showToast({
                message: `Đã xóa hồ sơ của ${child.name}`,
                type: "success",
            });
            await loadChildren();
        } catch (error) {
            console.error("Failed to delete child:", error);
            showToast({
                message: "Không thể xóa hồ sơ. Vui lòng thử lại.",
                type: "error",
            });
        }
    }

    function handleFieldBlur(field: keyof FormData) {
        validateForm();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
    >
        <h1 class="text-3xl font-bold flex items-center gap-3">
            <User class="w-8 h-8 text-primary" aria-hidden="true" />
            Quản lý hồ sơ trẻ
        </h1>
        <button class="btn btn-primary gap-2" onclick={openAddModal}>
            <PlusCircle class="w-5 h-5" aria-hidden="true" />
            Thêm hồ sơ
        </button>
    </div>

    <!-- Loading State -->
    {#if loading}
        <div class="flex flex-col items-center justify-center p-16">
            <Loader2 class="w-12 h-12 text-primary animate-spin mb-4" />
            <p class="text-base-content/60">Đang tải danh sách...</p>
        </div>

        <!-- Empty State -->
    {:else if children.length === 0}
        <div class="text-center p-12 bg-base-200 rounded-2xl">
            <Baby
                class="w-16 h-16 text-base-content/40 mx-auto mb-4"
                aria-hidden="true"
            />
            <p class="text-xl font-semibold mb-2">Chưa có hồ sơ nào</p>
            <p class="text-base-content/60 mb-6">
                Bắt đầu bằng cách tạo hồ sơ đầu tiên cho con bạn
            </p>
            <button class="btn btn-primary gap-2" onclick={openAddModal}>
                <PlusCircle class="w-5 h-5" aria-hidden="true" />
                Tạo hồ sơ đầu tiên
            </button>
        </div>

        <!-- Children Grid -->
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each children as child (child.id)}
                <div
                    class="card bg-base-100 shadow-md border border-base-200 hover:shadow-xl transition-shadow"
                >
                    <div class="card-body">
                        <div class="flex justify-between items-start mb-2">
                            <h2 class="card-title text-xl">{child.name}</h2>
                            <div class="badge badge-outline badge-lg">
                                {child.gender === "male"
                                    ? "Nam"
                                    : child.gender === "female"
                                      ? "Nữ"
                                      : "Khác"}
                            </div>
                        </div>

                        <div class="space-y-2 text-sm">
                            <p
                                class="flex items-center gap-2 text-base-content/70"
                            >
                                <span class="font-medium">Ngày sinh:</span>
                                {new Date(child.birth_date).toLocaleDateString(
                                    "vi-VN",
                                    {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    },
                                )}
                            </p>
                            <p
                                class="flex items-center gap-2 text-base-content/70"
                            >
                                <span class="font-medium">Tuổi:</span>
                                <span class="badge badge-primary badge-sm">
                                    {getAgeDisplay(child.birth_date)}
                                </span>
                            </p>
                        </div>

                        <div
                            class="card-actions justify-end mt-4 pt-4 border-t border-base-200"
                        >
                            <button
                                class="btn btn-sm btn-ghost gap-2 text-primary"
                                onclick={() => openEditModal(child)}
                                aria-label={`Chỉnh sửa hồ sơ ${child.name}`}
                            >
                                <Edit class="w-4 h-4" aria-hidden="true" />
                                Sửa
                            </button>
                            <button
                                class="btn btn-sm btn-ghost gap-2 text-error"
                                onclick={() => handleDelete(child)}
                                aria-label={`Xóa hồ sơ ${child.name}`}
                            >
                                <Trash2 class="w-4 h-4" aria-hidden="true" />
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Modal -->
    <dialog
        id="child_modal"
        class="modal modal-bottom sm:modal-middle"
        bind:this={modalElement}
    >
        <div class="modal-box">
            <!-- Modal Header -->
            <div class="flex justify-between items-center mb-6">
                <h3 id="modal-title" class="font-bold text-2xl">
                    {isEditing ? "Cập nhật hồ sơ" : "Thêm hồ sơ mới"}
                </h3>
                <button
                    type="button"
                    class="btn btn-sm btn-circle btn-ghost"
                    onclick={closeModal}
                    aria-label="Đóng"
                >
                    <X class="w-5 h-5" aria-hidden="true" />
                </button>
            </div>

            <!-- Form -->
            <form onsubmit={handleSubmit} class="space-y-5">
                <!-- Name Field -->
                <div class="form-control w-full">
                    <label class="label" for="child-name">
                        <span class="label-text font-medium">Họ và tên</span>
                        <span class="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="child-name"
                        name="name"
                        class="input input-bordered w-full"
                        class:input-error={formErrors.name}
                        required
                        placeholder="Nguyễn Văn A"
                        bind:value={formData.name}
                        onblur={() => handleFieldBlur("name")}
                        aria-invalid={formErrors.name ? "true" : "false"}
                        aria-describedby={formErrors.name
                            ? "name-error"
                            : undefined}
                    />
                    {#if formErrors.name}
                        <label class="label" for="child-name">
                            <span
                                id="name-error"
                                class="label-text-alt text-error"
                                role="alert"
                            >
                                {formErrors.name}
                            </span>
                        </label>
                    {/if}
                </div>

                <!-- Birth Date Field -->
                <div class="form-control w-full">
                    <label class="label" for="child-dob">
                        <span class="label-text font-medium">Ngày sinh</span>
                        <span class="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="date"
                        id="child-dob"
                        name="birth_date"
                        class="input input-bordered w-full"
                        class:input-error={formErrors.birth_date}
                        required
                        max={todayDate}
                        bind:value={formData.birth_date}
                        onblur={() => handleFieldBlur("birth_date")}
                        aria-invalid={formErrors.birth_date ? "true" : "false"}
                        aria-describedby={formErrors.birth_date
                            ? "dob-error"
                            : undefined}
                    />
                    {#if formErrors.birth_date}
                        <label class="label" for="child-dob">
                            <span
                                id="dob-error"
                                class="label-text-alt text-error"
                                role="alert"
                            >
                                {formErrors.birth_date}
                            </span>
                        </label>
                    {/if}
                </div>

                <!-- Gender Field -->
                <div class="form-control w-full">
                    <label class="label" for="child-gender">
                        <span class="label-text font-medium">Giới tính</span>
                    </label>
                    <select
                        id="child-gender"
                        name="gender"
                        class="select select-bordered w-full"
                        bind:value={formData.gender}
                    >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>

                <!-- Form Actions -->
                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        onclick={closeModal}
                        disabled={submitting}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={!isFormValid || submitting}
                    >
                        {#if submitting}
                            <Loader2
                                class="w-4 h-4 animate-spin"
                                aria-hidden="true"
                            />
                            {isEditing ? "Đang cập nhật..." : "Đang lưu..."}
                        {:else}
                            {isEditing ? "Cập nhật" : "Lưu"}
                        {/if}
                    </button>
                </div>
            </form>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
</div>
