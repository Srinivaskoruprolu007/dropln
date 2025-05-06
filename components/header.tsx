// components/header.tsx
"use client";

import Link from "next/link";

const Header = () => {
  return (
    <header className="py-4 px-6 border-b">
      <div className="container mx-auto flex justify-between items-center">
        <Link
          href="/dashboard"
          className="text-2xl font-bold text-gray-800 hover:text-gray-600"
        >
          Dropln
        </Link>
        {/* Add navigation links or user profile icon here if needed */}
        <div>
          {/* Placeholder for future elements like UserButton or Nav items */}
        </div>
      </div>
    </header>
  );
};

export default Header;
