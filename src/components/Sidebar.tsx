"use client";

import Link from "next/link";
import { AppearanceSidebar } from "./AppearanceProvider";

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <AppearanceSidebar />

      <div className="sidebar-section">
        <div className="sidebar-title">Langues</div>
        <ul className="sidebar-list">
          <li>
            <Link href="#">Français</Link>
          </li>
          <li>
            <Link href="#">English</Link>
          </li>
          <li>
            <Link href="#">العربية</Link>
          </li>
          <li>
            <Link href="#">Kiswahili</Link>
          </li>
          <li>
            <Link href="#">Português</Link>
          </li>
          <li>
            <Link href="#">Wolof</Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};
