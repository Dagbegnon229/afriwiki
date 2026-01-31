"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/connexion");
        return;
      }

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || null,
      });
      setLoading(false);
    };

    getUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const menuItems = [
    { href: "/dashboard", label: "Ma page", icon: "📄", exact: true },
    { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
    { href: "/dashboard/editer", label: "Éditer", icon: "✏️" },
    { href: "/dashboard/articles", label: "Contributions", icon: "📝" },
    { href: "/dashboard/sources", label: "Sources", icon: "🔗" },
    { href: "/dashboard/parametres", label: "Paramètres", icon: "⚙️" },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/dashboard";
  };

  if (loading) {
    return (
      <div style={styles.layout}>
        <div style={styles.main}>
          <p style={{ color: "#6b7280", textAlign: "center" }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* User info */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {user?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>
                {user?.full_name || "Utilisateur"}
              </span>
              <span style={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {menuItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={styles.footer}>
          <Link href="/" style={styles.navItem}>
            <span style={styles.navIcon}>🏠</span>
            <span>Accueil Afriwiki</span>
          </Link>
          <button onClick={handleSignOut} style={styles.signoutBtn}>
            <span style={styles.navIcon}>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    height: "100vh",
    top: 0,
    left: 0,
  },
  userSection: {
    padding: "1.25rem",
    borderBottom: "1px solid #e5e7eb",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  avatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: "1.1rem",
    flexShrink: 0,
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
  },
  userName: {
    fontWeight: 600,
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#111827",
  },
  userEmail: {
    fontSize: "0.8rem",
    color: "#6b7280",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  nav: {
    flex: 1,
    padding: "0.75rem 0",
    display: "flex",
    flexDirection: "column",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1.25rem",
    color: "#374151",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "background 0.15s",
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "3px solid transparent",
    backgroundColor: "transparent",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
  },
  navItemActive: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    fontWeight: 600,
    borderRight: "3px solid #2563eb",
  },
  navIcon: {
    fontSize: "1.1rem",
    width: "24px",
    textAlign: "center",
    flexShrink: 0,
  },
  footer: {
    padding: "0.75rem 0",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
  },
  signoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1.25rem",
    color: "#6b7280",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
    width: "100%",
    textAlign: "left",
    fontFamily: "inherit",
  },
  main: {
    flex: 1,
    marginLeft: "260px",
    padding: "2rem",
    minHeight: "100vh",
  },
};
