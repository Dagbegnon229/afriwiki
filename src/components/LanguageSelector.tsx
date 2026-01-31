"use client";

import * as React from "react";

const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "sw", name: "Kiswahili", flag: "🇹🇿" },
    { code: "ha", name: "Hausa", flag: "🇳🇬" },
    { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
    { code: "ig", name: "Igbo", flag: "🇳🇬" },
    { code: "am", name: "አማርኛ", flag: "🇪🇹" },
    { code: "zu", name: "isiZulu", flag: "🇿🇦" },
    { code: "wo", name: "Wolof", flag: "🇸🇳" },
    { code: "ff", name: "Fulfulde", flag: "🌍" },
];

export function LanguageSelector() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentLang, setCurrentLang] = React.useState("fr");
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Fermer le dropdown quand on clique ailleurs
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: string) => {
        setCurrentLang(langCode);
        setIsOpen(false);

        // Pour l'instant, on affiche juste un message
        // Une vraie implémentation utiliserait next-intl ou similar
        if (langCode !== "fr") {
            alert(`La traduction en ${languages.find(l => l.code === langCode)?.name} sera bientôt disponible ! Pour l'instant, le site est en français.`);
        }
    };

    const currentLanguage = languages.find(l => l.code === currentLang);

    return (
        <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lang-selector"
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.5rem",
                    color: "inherit",
                    fontSize: "0.9rem",
                }}
            >
                🌐 {languages.length} langues ▾
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "var(--background)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        zIndex: 1000,
                        minWidth: "180px",
                        maxHeight: "350px",
                        overflowY: "auto",
                    }}
                >
                    <div style={{
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid var(--border-light)",
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)"
                    }}>
                        Langue actuelle : {currentLanguage?.flag} {currentLanguage?.name}
                    </div>

                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            style={{
                                width: "100%",
                                padding: "0.75rem 1rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                background: lang.code === currentLang ? "var(--background-secondary)" : "transparent",
                                border: "none",
                                borderBottom: "1px solid var(--border-light)",
                                cursor: "pointer",
                                textAlign: "left",
                                color: "var(--text-color)",
                                transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--background-secondary)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = lang.code === currentLang ? "var(--background-secondary)" : "transparent"}
                        >
                            <span style={{ fontSize: "1.2rem" }}>{lang.flag}</span>
                            <span style={{
                                fontWeight: lang.code === currentLang ? 600 : 400,
                                color: lang.code === currentLang ? "var(--link-color)" : "inherit"
                            }}>
                                {lang.name}
                            </span>
                            {lang.code === currentLang && (
                                <span style={{ marginLeft: "auto", color: "var(--link-color)" }}>✓</span>
                            )}
                        </button>
                    ))}

                    <div style={{
                        padding: "0.75rem 1rem",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        borderTop: "1px solid var(--border-light)"
                    }}>
                        🚧 Traductions en cours de développement
                    </div>
                </div>
            )}
        </div>
    );
}
