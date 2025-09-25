"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

const navItems = [
  { href: "/", label: "Random Picker" },
  { href: "/add", label: "Add Question" },
  { href: "/problems", label: "All Problems" },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, loading } = useUser();

  const handleLogout = async () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn("Logout gave error:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <nav className="border-b border-primary/20 bg-card/80 backdrop-blur-sm glow-primary">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-primary bg-clip-text flex justify-center items-center gap-x-1"
          >
            <Image src="dsa-solver.png" height={40} width={40} alt="logo" />
            DSA Tracker
          </Link>

          {/* Navigation + Dashboard + Logout */}
          <div className="flex items-center gap-4">
            {/* Nav Items */}
            <div className="flex gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "default" : "ghost"}
                  asChild
                  className={pathname === item.href ? "glow-accent" : ""}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>

            {/* Dashboard (with avatar) */}
            <Button
              variant={pathname === "/dashboard" ? "default" : "ghost"}
              asChild
              className={`flex items-center gap-2 px-3 ${
                pathname === "/dashboard" ? "glow-accent" : ""
              }`}
            >
              <Link href="/dashboard">
                {!loading && user ? (
                  <>
                    <Avatar className="h-7 w-7 border border-primary/30 shadow-sm">
                      <AvatarImage src={user.pictureUrl} alt={user.name} />
                      <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      {user.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Avatar className="h-7 w-7 border border-primary/30 shadow-sm">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline font-medium">
                      Dashboard
                    </span>
                  </>
                )}
              </Link>
            </Button>

            {/* Logout */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 border-red-400 hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
