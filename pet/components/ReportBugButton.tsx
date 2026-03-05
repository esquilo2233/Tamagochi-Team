"use client";

import Link from "next/link";

export default function ReportBugButton() {
  return (
    <Link
      href="/bug-report"
      className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition duration-200 flex items-center gap-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      title="Reportar um bug"
    >
      <span>🐛</span>
      <span className="hidden sm:inline">Reportar Bug</span>
    </Link>
  );
}
