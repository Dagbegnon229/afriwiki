"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
                .from("notifications")
                .update({ is_read: true })
                .in("id", unreadIds);

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "modification_approved": return "✅";
            case "modification_rejected": return "❌";
            case "profile_update": return "✏️";
            case "new_view": return "👁️";
            default: return "🔔";
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div style={{ padding: "2rem" }}>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔔 Notifications</h1>
                <p style={{ color: "var(--text-secondary)" }}>Chargement...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.5rem" }}>
                    🔔 Notifications
                    {unreadCount > 0 && (
                        <span style={{
                            marginLeft: "0.75rem",
                            padding: "0.2rem 0.6rem",
                            background: "var(--link-color)",
                            borderRadius: "999px",
                            fontSize: "0.85rem",
                            color: "white"
                        }}>
                            {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                        </span>
                    )}
                </h1>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        style={{
                            padding: "0.5rem 1rem",
                            background: "var(--background-secondary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                        }}
                    >
                        Tout marquer comme lu
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{
                    padding: "3rem",
                    textAlign: "center",
                    background: "var(--background-secondary)",
                    borderRadius: "8px",
                }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔕</div>
                    <p style={{ color: "var(--text-secondary)" }}>Aucune notification pour l'instant</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                            style={{
                                padding: "1rem",
                                background: notif.is_read ? "var(--background)" : "var(--background-secondary)",
                                border: `1px solid ${notif.is_read ? "var(--border-light)" : "var(--link-color)"}`,
                                borderRadius: "8px",
                                cursor: notif.is_read ? "default" : "pointer",
                                opacity: notif.is_read ? 0.7 : 1,
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                                <span style={{ fontSize: "1.5rem" }}>{getTypeIcon(notif.type)}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                        <strong style={{ fontSize: "1rem" }}>{notif.title}</strong>
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                            {new Date(notif.created_at).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                    <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0", fontSize: "0.95rem" }}>
                                        {notif.message}
                                    </p>
                                    {notif.link && (
                                        <Link
                                            href={notif.link}
                                            style={{
                                                color: "var(--link-color)",
                                                fontSize: "0.9rem",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.25rem"
                                            }}
                                        >
                                            Voir l'article →
                                        </Link>
                                    )}
                                </div>
                                {!notif.is_read && (
                                    <div style={{
                                        width: "10px",
                                        height: "10px",
                                        background: "var(--link-color)",
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                    }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
