"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navigation() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (error) {
            console.error("Erro ao buscar usuário:", error);
        }
    };

    const navItems = [
        { href: "/", label: "Pet", icon: "🏠" },
        { href: "/bets", label: "Bets", icon: "🎲" },
        { href: "/team-play", label: "Team Play", icon: "🎮" },
        { href: "/companion", label: "Companion", icon: "👫" },
        { href: "/shop", label: "Shop", icon: "🛒" },
    ];

    const adminNavItems = [
        { href: "/people", label: "People", icon: "👥" },
        { href: "/system-logs", label: "Logs", icon: "📋" },
    ];

    const isAdmin = user?.role === "admin" || user?.role === "gestor";

    return (
        <>
            {/* Bottom Navigation (Mobile) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 to-indigo-900 border-t border-purple-700 z-50 md:hidden safe-area-pb">
                <div className="flex justify-around items-center py-2">
                    {navItems.slice(0, 5).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center px-3 py-1 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg transition"
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Side Navigation (Desktop) */}
            <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-purple-900 to-indigo-900 border-r border-purple-700 z-50 flex-col">
                <div className="p-4 border-b border-purple-700">
                    <h1 className="text-xl font-bold text-white">🎮 Samurai</h1>
                    {user && (
                        <div className="mt-2 text-sm text-purple-200">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-yellow-400">
                                🪙 {user.coins} coins
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-1 py-4 overflow-y-auto">
                    {/* Main Menu */}
                    <div className="px-2">
                        <p className="text-xs text-purple-300 uppercase font-semibold mb-2 px-2">
                            Menu
                        </p>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg transition mb-1"
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-sm font-medium">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Admin Menu */}
                    {isAdmin && (
                        <div className="px-2 mt-4 pt-4 border-t border-purple-700">
                            <p className="text-xs text-purple-300 uppercase font-semibold mb-2 px-2">
                                Admin
                            </p>
                            {adminNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg transition mb-1"
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main content spacer */}
            <div className="md:ml-64 mb-16 md:mb-0" />
        </>
    );
}
