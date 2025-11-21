import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-base-100">
            <Header />
            <main className="grow container mx-auto px-4 py-8 flex flex-col items-center gap-8">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
