    import React from "react";
    import type { Metadata } from "next";
    import "./globals.css";

    export const metadata: Metadata = {
    title: "EcoSnap AI",
    description: "AI-powered waste classification and recycling guide",
    };

    export default function RootLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
    }