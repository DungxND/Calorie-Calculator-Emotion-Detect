<script lang="ts">
    import {
        ArrowRight,
        Activity,
        Brain,
        ShieldCheck,
        Utensils,
        Heart,
        CheckCircle,
        Star,
        Users,
        TrendingUp,
        Award,
        ChevronDown,
    } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";
    import { onMount } from "svelte";

    // --- Types ---
    interface Feature {
        icon: any;
        title: string;
        description: string;
        color: string;
        bgColor: string;
    }

    interface Stat {
        value: string;
        label: string;
        icon: any;
    }

    interface Testimonial {
        name: string;
        role: string;
        content: string;
        rating: number;
        avatar: string;
    }

    interface FAQ {
        question: string;
        answer: string;
    }

    // --- Data ---
    const features: Feature[] = [
        {
            icon: Utensils,
            title: "AI Meal Analysis",
            description:
                "Identify dishes from images instantly. Estimate calories and analyze detailed nutritional composition using Gemini Vision AI.",
            color: "text-primary",
            bgColor: "bg-primary/10",
        },
        {
            icon: Activity,
            title: "Growth Tracking",
            description:
                "Calculate energy needs using the Schofield formula. Visualize weight & height progression with interactive charts.",
            color: "text-secondary",
            bgColor: "bg-secondary/10",
        },
        {
            icon: Brain,
            title: "Smart Health Advice",
            description:
                "AI analyzes digestive symptoms and emotional states to provide tailored, actionable health advice for parents.",
            color: "text-accent",
            bgColor: "bg-accent/10",
        },
    ];

    const stats: Stat[] = [
        { value: "10K+", label: "Active Parents", icon: Users },
        { value: "50K+", label: "Meals Analyzed", icon: Utensils },
        { value: "95%", label: "Satisfaction Rate", icon: TrendingUp },
        { value: "#1", label: "Rated App", icon: Award },
    ];

    const testimonials: Testimonial[] = [
        {
            name: "Sarah Martinez",
            role: "Mother of two",
            content:
                "Calorize has been a game-changer! Tracking my picky eater's nutrition is finally stress-free. The AI suggestions are incredibly helpful.",
            rating: 5,
            avatar: "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
        },
        {
            name: "David Chen",
            role: "New parent",
            content:
                "As a first-time parent, this app gives me confidence. The growth tracking features help me ensure my baby is developing healthily.",
            rating: 5,
            avatar: "https://img.daisyui.com/images/stock/photo-1494790108377-be9c29b29330.webp",
        },
        {
            name: "Emily Johnson",
            role: "Mother of three",
            content:
                "Managing nutrition for three kids was overwhelming until I found Calorize. Now I can track everything in one place effortlessly.",
            rating: 5,
            avatar: "https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp",
        },
    ];

    const faqs: FAQ[] = [
        {
            question: "How accurate is the AI meal analysis?",
            answer: "Our AI uses advanced image recognition trained on thousands of meals. While accuracy is high (90%+), results are estimates and should be used as guidance alongside professional medical advice.",
        },
        {
            question: "Is my child's data secure?",
            answer: "Absolutely. We use bank-level encryption and never share personal data. All information is stored securely and you have full control to delete your data anytime.",
        },
        {
            question: "Do I need to pay to use Calorize?",
            answer: "Calorize is free to use with core features. We offer a premium plan with advanced analytics and personalized nutrition plans, but the free version provides excellent value.",
        },
        {
            question: "Can I track multiple children?",
            answer: "Yes! You can create unlimited child profiles and track their nutrition, growth, and health individually with separate dashboards for each.",
        },
        {
            question: "Does it work offline?",
            answer: "The app works offline for viewing saved data. However, AI analysis and real-time advice require an internet connection.",
        },
    ];

    // --- State ---
    let currentTestimonial = $state(0);
    let visibleSections = $state(new Set<string>());
    let typewriterText = $state("");
    const fullText = "Health with AI";
    let textIndex = 0;

    // --- Lifecycle ---
    onMount(() => {
        // Typewriter effect
        const typeInterval = setInterval(() => {
            if (textIndex < fullText.length) {
                typewriterText += fullText.charAt(textIndex);
                textIndex++;
            } else {
                clearInterval(typeInterval);
            }
        }, 100);

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener("click", (e) => {
                e.preventDefault();
                const href = anchor.getAttribute("href");
                if (href) {
                    const target = document.querySelector(href);
                    target?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            });
        });

        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        visibleSections.add(entry.target.id);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
        );

        document.querySelectorAll("[data-animate]").forEach((el) => {
            observer.observe(el);
        });

        // Auto-rotate testimonials
        const interval = setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        }, 5000);

        return () => {
            clearInterval(interval);
            clearInterval(typeInterval);
            observer.disconnect();
        };
    });

    // --- Helpers ---
    function scrollToFeatures() {
        document
            .getElementById("features")
            ?.scrollIntoView({ behavior: "smooth" });
    }
</script>

<svelte:head>
    <style>
        @media (prefers-reduced-motion: no-preference) {
            html {
                scroll-behavior: smooth;
            }
        }
    </style>
</svelte:head>

<div class="bg-base-100 min-h-screen overflow-hidden">
    <!-- Hero Section -->
    <section class="hero min-h-[90vh] bg-base-200 relative overflow-hidden">
        <!-- Animated Background -->
        <div
            class="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"
            style="mask-image: linear-gradient(180deg, white, transparent)"
        ></div>

        <!-- Warm/Food Theme Decorative Blobs -->
        <div
            class="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
        ></div>
        <div
            class="absolute top-1/2 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 1.5s"
        ></div>
        <div
            class="absolute -bottom-20 left-1/3 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse"
            style="animation-delay: 0.5s"
        ></div>

        <div class="hero-content text-center z-10 px-4 relative">
            <div
                class="max-w-5xl"
                in:fly={{ y: 30, duration: 800, delay: 200 }}
            >
                <!-- Badge -->
                <div
                    class="inline-flex items-center gap-2 badge badge-soft badge-primary badge-lg mb-8 px-6 py-4 text-sm font-bold uppercase tracking-wide shadow-sm border-none"
                >
                    <Star class="w-4 h-4 fill-current" aria-hidden="true" />
                    Smart Nutrition for Healthy Kids
                </div>

                <!-- Main Headline -->
                <h1
                    class="text-5xl sm:text-6xl lg:text-8xl font-black mb-8 leading-tight tracking-tight"
                >
                    Nurture Your Child's <br class="hidden sm:block" />
                    <span
                        class="bg-clip-text text-transparent bg-linear-to-r from-primary via-secondary to-accent relative"
                    >
                        {typewriterText}
                        <span
                            class="animate-blink absolute -right-4 md:-right-8 top-0 text-primary"
                            >|</span
                        >
                    </span>
                </h1>

                <!-- Subheadline -->
                <p
                    class="text-xl sm:text-2xl text-base-content/80 max-w-2xl mx-auto mb-8 leading-relaxed"
                >
                    The smart assistant for nutrition tracking and growth
                    monitoring. Powered by advanced AI to give you confidence in
                    every meal.
                </p>

                <!-- CTA Buttons -->
                <div
                    class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                >
                    <a
                        href="/dashboard"
                        class="btn btn-primary btn-lg shadow-xl hover:shadow-primary/50 transition-all duration-300 group gap-2 w-full sm:w-auto"
                    >
                        Get Started Free
                        <ArrowRight
                            class="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            aria-hidden="true"
                        />
                    </a>
                    <button
                        type="button"
                        onclick={scrollToFeatures}
                        class="btn btn-ghost btn-lg gap-2 w-full sm:w-auto"
                    >
                        Learn More
                        <ChevronDown class="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                <!-- Social Proof -->
                <div
                    class="flex flex-wrap justify-center items-center gap-6 text-sm text-base-content/60"
                >
                    <div class="flex items-center gap-2">
                        <div class="rating rating-sm">
                            {#each Array(5) as _, i}
                                <Star
                                    class="w-4 h-4 fill-warning text-warning"
                                    aria-hidden="true"
                                />
                            {/each}
                        </div>
                        <span>4.9/5 from 2,000+ reviews</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <CheckCircle
                            class="w-4 h-4 text-success"
                            aria-hidden="true"
                        />
                        <span>Trusted by 10,000+ parents</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 px-4 bg-base-200/50" id="stats" data-animate>
        <div class="container mx-auto">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                {#each stats as stat, i}
                    {@const StatIcon = stat.icon}
                    <div
                        class="text-center"
                        in:fly={{ y: 20, duration: 600, delay: 200 + i * 100 }}
                        style={visibleSections.has("stats")
                            ? ""
                            : "opacity: 0;"}
                    >
                        <div
                            class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3"
                        >
                            <StatIcon class="w-6 h-6" aria-hidden="true" />
                        </div>
                        <div class="text-3xl sm:text-4xl font-bold mb-1">
                            {stat.value}
                        </div>
                        <div class="text-sm text-base-content/60">
                            {stat.label}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 px-4 container mx-auto" data-animate>
        <div class="text-center mb-16">
            <h2 class="text-4xl sm:text-5xl font-bold mb-4">
                Everything You Need in One Place
            </h2>
            <p
                class="text-lg sm:text-xl text-base-content/60 max-w-2xl mx-auto"
            >
                Combining cutting-edge AI technology with evidence-based
                nutrition science to support your child's growth journey.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {#each features as feature, i}
                {@const FeatureIcon = feature.icon}
                <div
                    class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-200"
                    in:fly={{ y: 30, duration: 600, delay: i * 150 }}
                    style={visibleSections.has("features") ? "" : "opacity: 0;"}
                >
                    <div class="card-body items-center text-center p-8">
                        <div
                            class="w-20 h-20 rounded-2xl {feature.bgColor} flex items-center justify-center mb-6 {feature.color} transform hover:scale-110 transition-transform duration-300"
                        >
                            <FeatureIcon class="w-10 h-10" aria-hidden="true" />
                        </div>
                        <h3 class="card-title text-2xl mb-3">
                            {feature.title}
                        </h3>
                        <p class="text-base-content/70 leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Trust Section -->
    <section
        class="bg-base-100 py-24 px-4 relative overflow-hidden"
        id="trust"
        data-animate
    >
        <!-- Decorative elements -->
        <div
            class="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        ></div>
        <div
            class="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"
        ></div>

        <div class="container mx-auto relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 class="text-4xl sm:text-5xl font-bold mb-8">
                        Why Parents Choose Us
                    </h2>
                    <div class="space-y-6">
                        {#each [{ icon: ShieldCheck, color: "success", title: "Absolute Privacy", desc: "Your child's health data is encrypted and securely protected. We respect your family's privacy above all else." }, { icon: Heart, color: "error", title: "Parenting Companion", desc: "More than just a tool—we're a companion helping you feel confident and assured in your child's growth journey." }, { icon: CheckCircle, color: "info", title: "Easy to Use", desc: "Designed for busy parents. Intuitive interface, quick actions, and clear insights at a glance." }] as item}
                            {@const ItemIcon = item.icon}
                            <div class="flex gap-4">
                                <div
                                    class="mt-1 bg-{item.color}/20 p-3 rounded-xl text-{item.color} shrink-0"
                                >
                                    <ItemIcon
                                        class="w-7 h-7"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div>
                                    <h3 class="font-bold text-xl mb-2">
                                        {item.title}
                                    </h3>
                                    <p
                                        class="text-base-content/70 leading-relaxed"
                                    >
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Testimonial Card -->
                <div class="relative">
                    <div
                        class="card bg-base-100 shadow-2xl border border-base-200"
                    >
                        <div class="card-body p-8">
                            {#key currentTestimonial}
                                <div in:fade={{ duration: 300 }}>
                                    <div class="flex items-center gap-4 mb-6">
                                        <div class="avatar">
                                            <div
                                                class="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                                            >
                                                <img
                                                    src={testimonials[
                                                        currentTestimonial
                                                    ].avatar}
                                                    alt={testimonials[
                                                        currentTestimonial
                                                    ].name}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-lg">
                                                {testimonials[
                                                    currentTestimonial
                                                ].name}
                                            </h3>
                                            <p
                                                class="text-sm text-base-content/60"
                                            >
                                                {testimonials[
                                                    currentTestimonial
                                                ].role}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="flex gap-1 mb-4">
                                        {#each Array(testimonials[currentTestimonial].rating) as _}
                                            <Star
                                                class="w-5 h-5 fill-warning text-warning"
                                                aria-hidden="true"
                                            />
                                        {/each}
                                    </div>

                                    <p
                                        class="text-base-content/80 italic leading-relaxed text-lg"
                                    >
                                        "{testimonials[currentTestimonial]
                                            .content}"
                                    </p>
                                </div>
                            {/key}

                            <!-- Testimonial Indicators -->
                            <div class="flex justify-center gap-2 mt-6">
                                {#each testimonials as _, i}
                                    <button
                                        type="button"
                                        class="w-2 h-2 rounded-full transition-all duration-300 {i ===
                                        currentTestimonial
                                            ? 'bg-primary w-8'
                                            : 'bg-base-300'}"
                                        onclick={() => (currentTestimonial = i)}
                                        aria-label={`View testimonial ${i + 1}`}
                                    ></button>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-24 px-4 container mx-auto" id="faq" data-animate>
        <div class="text-center mb-16">
            <h2 class="text-4xl sm:text-5xl font-bold mb-4">
                Frequently Asked Questions
            </h2>
            <p class="text-lg text-base-content/60 max-w-2xl mx-auto">
                Got questions? We've got answers. Find everything you need to
                know about Calorize.
            </p>
        </div>

        <div class="max-w-3xl mx-auto space-y-3">
            {#each faqs as faq, i}
                <div
                    class="collapse collapse-plus bg-base-200 border border-base-300 rounded-xl"
                    in:fly={{ y: 20, duration: 500, delay: i * 50 }}
                    style={visibleSections.has("faq") ? "" : "opacity: 0;"}
                >
                    <input type="radio" name="faq-accordion" />
                    <div class="collapse-title text-lg font-semibold">
                        {faq.question}
                    </div>
                    <div class="collapse-content">
                        <p class="text-base-content/70 leading-relaxed pt-2">
                            {faq.answer}
                        </p>
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-32 px-4 text-center relative overflow-hidden">
        <div
            class="absolute inset-0 bg-linear-to-b from-base-100 via-primary/5 to-base-200 -z-10"
        ></div>

        <div class="container mx-auto relative z-10">
            <h2 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                Ready to Start Your Journey?
            </h2>
            <p
                class="text-xl sm:text-2xl mb-10 max-w-2xl mx-auto text-base-content/80"
            >
                Join thousands of parents who trust Calorize for their
                children's health and nutrition monitoring.
            </p>
            <div
                class="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
                <a
                    href="/register"
                    class="btn btn-secondary btn-lg shadow-xl hover:scale-105 transition-transform gap-2 w-full sm:w-auto"
                >
                    Sign Up for Free
                    <ArrowRight class="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                    href="/login"
                    class="btn btn-outline btn-lg w-full sm:w-auto"
                >
                    Already have an account?
                </a>
            </div>

            <!-- Trust Badges -->
            <div
                class="flex flex-wrap justify-center items-center gap-8 mt-12 text-sm text-base-content/60"
            >
                <div class="flex items-center gap-2">
                    <ShieldCheck class="w-5 h-5" aria-hidden="true" />
                    <span>HIPAA Compliant</span>
                </div>
                <div class="flex items-center gap-2">
                    <CheckCircle class="w-5 h-5" aria-hidden="true" />
                    <span>256-bit Encryption</span>
                </div>
                <div class="flex items-center gap-2">
                    <Heart class="w-5 h-5" aria-hidden="true" />
                    <span>Made with ❤️ for Parents</span>
                </div>
            </div>
        </div>
    </section>
</div>
