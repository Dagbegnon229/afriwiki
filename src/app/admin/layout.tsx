"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isAdminEmail } from "@/lib/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ne pas vérifier les permissions sur la page de connexion
  const isLoginPage = pathname === "/admin/connexion";

  useEffect(() => {
    // Si on est sur la page de connexion, pas besoin de vérifier
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/connexion");
        return;
      }

      if (!isAdminEmail(user.email)) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [router, supabase, isLoginPage]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/connexion");
  };

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
    { href: "/admin/une", label: "À la une", icon: "⭐" },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "👥" },
    { href: "/admin/articles", label: "Articles", icon: "📝" },
    { href: "/admin/profils", label: "Profils", icon: "✅" },
    { href: "/admin/sources", label: "Sources", icon: "📎" },
    { href: "/admin/kyc", label: "KYC", icon: "🔐" },
    { href: "/admin/moderation", label: "Modération", icon: "🚨" },
    { href: "/admin/parametres", label: "Paramètres", icon: "⚙️" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/admin";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1f2937" }}>
        <p style={{ color: "#9ca3af" }}>Vérification des permissions...</p>
      </div>
    );
  }

  // Afficher la page de connexion sans la sidebar ni vérification admin
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#111827" }}>
      {/* Sidebar */}
      <aside style={{
        width: "260px",
        background: "#1f2937",
        borderRight: "1px solid #374151",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        top: 0,
        left: 0,
      }}>
        {/* Header */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #374151" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🛡️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#f9fafb", fontSize: "1.1rem" }}>AfriWiki Admin</div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Panneau d&apos;administration</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          {menuItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  color: active ? "#60a5fa" : "#d1d5db",
                  textDecoration: "none",
                  fontSize: "0.95rem",
                  background: active ? "rgba(96, 165, 250, 0.1)" : "transparent",
                  borderLeft: active ? "3px solid #60a5fa" : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "1rem", borderTop: "1px solid #374151" }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              color: "#9ca3af",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            <span>🌍</span>
            <span>Retour au site</span>
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              color: "#ef4444",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              width: "100%",
              textAlign: "left",
            }}
          >
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: "260px",
        padding: "2rem",
        background: "#111827",
        minHeight: "100vh",
        color: "#f9fafb",
      }}>
        {children}
      </main>
    </div>
  );
}
