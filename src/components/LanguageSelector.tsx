"use client";

import * as React from "react";

const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷", gtCode: "fr" },
    { code: "en", name: "English", flag: "🇬🇧", gtCode: "en" },
    { code: "ar", name: "العربية", flag: "🇸🇦", gtCode: "ar" },
    { code: "pt", name: "Português", flag: "🇵🇹", gtCode: "pt" },
    { code: "sw", name: "Kiswahili", flag: "🇹🇿", gtCode: "sw" },
    { code: "ha", name: "Hausa", flag: "🇳🇬", gtCode: "ha" },
    { code: "yo", name: "Yorùbá", flag: "🇳🇬", gtCode: "yo" },
    { code: "ig", name: "Igbo", flag: "🇳🇬", gtCode: "ig" },
    { code: "am", name: "አማርኛ", flag: "🇪🇹", gtCode: "am" },
    { code: "zu", name: "isiZulu", flag: "🇿🇦", gtCode: "zu" },
    { code: "wo", name: "Wolof", flag: "🇸🇳", gtCode: "wo" },
    { code: "ff", name: "Fulfulde", flag: "🌍", gtCode: "ff" },
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

    const handleLanguageChange = (langCode: string, gtCode: string) => {
        setCurrentLang(langCode);
        setIsOpen(false);

        // Utiliser Google Translate pour traduire la page
        if (langCode === "fr") {
            // Revenir au français (langue originale)
            // Supprimer le cookie de traduction Google
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.afriwiki.vercel.app";
            // Recharger pour revenir à l'original
            window.location.reload();
        } else {
            // Définir la langue cible pour Google Translate
            document.cookie = `googtrans=/fr/${gtCode}; path=/`;
            document.cookie = `googtrans=/fr/${gtCode}; path=/; domain=.afriwiki.vercel.app`;

            // Vérifie si le script Google Translate est déjà chargé
            if (!document.getElementById("google-translate-script")) {
                // Injecter le script Google Translate
                const script = document.createElement("script");
                script.id = "google-translate-script";
                script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                document.body.appendChild(script);

                // Définir la fonction d'initialisation
                (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit = () => {
                    new (window as unknown as { google: { translate: { TranslateElement: new (config: object, elementId: string) => void } } }).google.translate.TranslateElement(
                        { pageLanguage: "fr", includedLanguages: gtCode, autoDisplay: false },
                        "google_translate_element"
                    );
                };
            } else {
                // Script déjà chargé, juste recharger
                window.location.reload();
            }
        }
    };

    const currentLanguage = languages.find(l => l.code === currentLang);

    return (
        <div ref={dropdownRef} style={{ position: "relative" }}>
            {/* Conteneur caché pour Google Translate */}
            <div id="google_translate_element" style={{ display: "none" }} />

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
                {currentLanguage?.flag || "🌐"} {currentLanguage?.name || "Langue"} ▾
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
                        Traduire cette page
                    </div>

                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code, lang.gtCode)}
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
                        padding: "0.5rem 1rem",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
                        textAlign: "center",
                        borderTop: "1px solid var(--border-light)"
                    }}>
                        Traduction par Google Translate
                    </div>
                </div>
            )}
        </div>
    );
}
