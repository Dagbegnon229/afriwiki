"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Générer un ID unique pour le visiteur (stocké en localStorage)
function getVisitorId(): string {
    if (typeof window === "undefined") return "";

    let visitorId = localStorage.getItem("afriwiki_visitor_id");
    if (!visitorId) {
        visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("afriwiki_visitor_id", visitorId);
    }
    return visitorId;
}

// Générer un ID de session (stocké en sessionStorage)
function getSessionId(): string {
    if (typeof window === "undefined") return "";

    let sessionId = sessionStorage.getItem("afriwiki_session_id");
    if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("afriwiki_session_id", sessionId);
    }
    return sessionId;
}

export function PageViewTracker() {
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        // Ne pas tracker les pages admin et dashboard
        if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
            return;
        }

        const trackPageView = async () => {
            try {
                // Extraire l'entrepreneur_id si on est sur une page /e/[slug]
                let entrepreneurId: string | null = null;
                if (pathname.startsWith("/e/")) {
                    const slug = pathname.replace("/e/", "");
                    const { data } = await supabase
                        .from("entrepreneurs")
                        .select("id")
                        .eq("slug", slug)
                        .single();
                    if (data && "id" in data) {
                        entrepreneurId = (data as { id: string }).id;
                    }
                }

                // Utiliser une requête générique pour la table page_views
                // Cette table sera créée via le script SQL ANALYTICS-EXECUTE-THIS.sql
                const pageViewData = {
                    page_path: pathname,
                    page_title: document.title,
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent,
                    visitor_id: getVisitorId(),
                    session_id: getSessionId(),
                    entrepreneur_id: entrepreneurId,
                };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (supabase as any).from("page_views").insert(pageViewData);
            } catch {
                // Silencieux en cas d'erreur (table pas encore créée ou autre)
                // Ne pas bloquer l'UX
            }
        };

        // Petit délai pour s'assurer que la page est chargée
        const timer = setTimeout(trackPageView, 500);
        return () => clearTimeout(timer);
    }, [pathname, supabase]);

    return null; // Composant invisible
}
