import React from 'react';
import Head from 'next/head';
import GoogleAnalytics from "@/components/analyse";
import { Github } from 'lucide-react';

const CustomHead = () => {
    const siteTitle = 'Trình tính Calo AI | Nhận diện món ăn';
    const description = 'Sử dụng AI để nhận diện hình ảnh món ăn và ước tính calo, hỗ trợ phụ huynh quản lý dinh dưỡng cho trẻ.';
    const pageImage = 'https://aicc.gptdevelopment.online/cor.webp';
    const keywords = 'AI, food recognition, calorie counting, calorie statistics， Calorie Calculator， AI Calorie Calculator， Do Calorie Calculator';

    return (
        <Head>
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={siteTitle} />
            <meta name="twitter:title" content={siteTitle} />
            <meta itemProp="name" content={siteTitle} />
            <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
            <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
            <meta name="keywords" content={keywords} />
            <meta name="application-name" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={siteTitle} />
            <meta property="og:url" content="none" />
            <meta property="og:locale" content="vi_VN" />
            <meta property="og:image" content={pageImage} />
            <meta property="og:image:secure_url" content={pageImage} />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content={siteTitle} />
            <meta name="twitter:site" content="none" />
            <meta name="twitter:image" content={pageImage} />
            <meta name="twitter:description" content={description} />
        </Head>
    );
};

export const Header = () => {
    return (
        <>
            <CustomHead />
            <GoogleAnalytics />
            <div className="navbar bg-base-100 shadow-lg">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl h-auto py-2 flex flex-col items-start gap-0">
                        <div className="flex items-center gap-2">
                            <img src="/health.svg" alt="Logo" className="h-8 w-8" />
                            <span>Trình tính Calo AI</span>
                        </div>
                        <span className="text-xs font-normal text-base-content/70 pl-10">
                            Nhận diện món ăn & gợi ý dinh dưỡng
                        </span>
                    </a>
                </div>
                <div className="flex-none">
                    <ul className="menu menu-horizontal px-1">
                        <li>
                            <a
                                href="https://github.com/hung38384/Calorie-Calculator"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-circle"
                                aria-label="Github Repository"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
};
