import React from "react";
import { DashboardHeader } from '@/components/dashboard/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/30">
            <DashboardHeader />
            <main className="mx-auto w-full max-w-300 px-4 py-6 md:px-6">
                {children}
            </main>
        </div>
    );
}