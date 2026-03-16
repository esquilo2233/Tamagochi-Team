"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

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
    { href: "/", label: "🏠 Pet", icon: "🏠" },
    { href: "/bets", label: "🎲 Bets", icon: "🎲" },
    { href: "/team-play", label: "🎮 Team Play", icon: "🎮" },
    { href: "/companion", label: "👫 Companion", icon: "👫" },
    { href: "/shop", label: "🛒 Shop", icon: "🛒" },
  ];

  if (user?.role === "admin" || user?.role === "gestor") {
    navItems.push(
      { href: "/people", label: "👥 People", icon: "👥" },
      { href: "/system-logs", label: "📋 Logs", icon: "📋" }
    );
  }

  return (
    <>
      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50 md:hidden safe-area-pb">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center px-3 py-1 text-gray-400 hover:text-white transition"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label.split(" ")[1] || item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Side Navigation (Desktop) */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 z-50 flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">🎮 Samurai</h1>
          {user && (
            <div className="mt-2 text-sm text-gray-400">
              <p>{user.name}</p>
              <p className="text-yellow-400">🪙 {user.coins}</p>
            </div>
          )}
        </div>

        <div className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content spacer */}
      <div className="md:ml-64 mb-16 md:mb-0" />
    </>
  );
}
