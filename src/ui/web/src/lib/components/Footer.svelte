<script>
    import { Github, Heart } from "lucide-svelte";
</script>

<footer
    class="footer footer-center bg-base-200 text-base-content rounded p-10 mt-auto"
>
    <nav class="grid grid-flow-col gap-4">
        <a href="/about" class="link link-hover">About us</a>
        <a href="/contact" class="link link-hover">Contact</a>
        <a href="/privacy" class="link link-hover">Privacy Policy</a>
    </nav>
    <nav>
        <div class="grid grid-flow-col gap-4">
            <a
                href="https://github.com/hung38384/Calorie-Calculator"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Github"
            >
                <Github class="w-6 h-6" />
            </a>
        </div>
    </nav>
    <aside>
        <p>
            Copyright © {new Date().getFullYear()} - All right reserved by UET-TTNM
        </p>
        <p class="flex items-center gap-1 text-sm opacity-70">
            Made with <Heart class="w-3 h-3 text-error fill-error" /> for healthy
            kids
        </p>
    </aside>
</footer>
