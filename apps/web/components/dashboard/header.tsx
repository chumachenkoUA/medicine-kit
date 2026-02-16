import { Pill } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Pill className="size-6 text-primary" />
          <span className="text-lg font-bold">Medicine Kit</span>
        </Link>

        <nav className="flex items-center justify-between gap-3">
          <Link href="/">1</Link>
          <Link href="/">2</Link>
          <Link href="/">3</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Input placeholder="Search..." className="w-44 md:w-64" />
          <Avatar className="size-9">
            <AvatarFallback>MK</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;