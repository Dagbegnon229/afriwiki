"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  Pilcrow,
  Minus,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  entrepreneurLinks?: { slug: string; name: string }[];
  minHeight?: string;
}

const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Commencez à écrire...",
  entrepreneurLinks = [],
  minHeight = "200px",
}: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-link",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: convertMarkdownToHTML(content),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = convertHTMLToMarkdown(html);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: "rich-editor-content",
        style: `min-height: ${minHeight}; outline: none;`,
      },
    },
  });

  // Mettre à jour le contenu quand il change de l'extérieur
  useEffect(() => {
    if (editor && content !== convertHTMLToMarkdown(editor.getHTML())) {
      editor.commands.setContent(convertMarkdownToHTML(content));
    }
  }, [content, editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      // Vérifier si c'est un lien AfriWiki
      const afriwikiLink = entrepreneurLinks.find(
        (e) => e.name.toLowerCase() === linkUrl.toLowerCase()
      );
      const url = afriwikiLink ? `/e/${afriwikiLink.slug}` : linkUrl;

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  }, [editor, linkUrl, entrepreneurLinks]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        padding: "0.5rem",
        background: isActive ? "var(--link-color)" : "transparent",
        color: isActive ? "white" : "var(--text-primary)",
        border: "1px solid var(--border-light)",
        borderRadius: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        border: "1px solid var(--border-color)",
        borderRadius: "4px",
        background: "var(--background)",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.25rem",
          padding: "0.5rem",
          borderBottom: "1px solid var(--border-light)",
          background: "var(--background-secondary)",
        }}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Gras (Ctrl+B)"
        >
          <Bold size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italique (Ctrl+I)"
        >
          <Italic size={16} />
        </ToolbarButton>

        <div style={{ width: "1px", background: "var(--border-light)", margin: "0 0.25rem" }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Titre de section"
        >
          <Heading2 size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Sous-titre"
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
          title="Paragraphe"
        >
          <Pilcrow size={16} />
        </ToolbarButton>

        <div style={{ width: "1px", background: "var(--border-light)", margin: "0 0.25rem" }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Liste à puces"
        >
          <List size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Liste numérotée"
        >
          <ListOrdered size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Citation"
        >
          <Quote size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Ligne horizontale"
        >
          <Minus size={16} />
        </ToolbarButton>

        <div style={{ width: "1px", background: "var(--border-light)", margin: "0 0.25rem" }} />

        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive("link")}
          title="Ajouter un lien"
        >
          <LinkIcon size={16} />
        </ToolbarButton>

        <div style={{ width: "1px", background: "var(--border-light)", margin: "0 0.25rem" }} />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Annuler (Ctrl+Z)"
        >
          <Undo size={16} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Rétablir (Ctrl+Y)"
        >
          <Redo size={16} />
        </ToolbarButton>
      </div>

      {/* Link input */}
      {showLinkInput && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.5rem",
            borderBottom: "1px solid var(--border-light)",
            background: "var(--background-secondary)",
          }}
        >
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URL ou nom d'entrepreneur AfriWiki"
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              fontSize: "0.9rem",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSetLink();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSetLink}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--link-color)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Insérer
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--border-light)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
        </div>
      )}

      {/* Suggestions d'auto-complétion pour les liens AfriWiki */}
      {showLinkInput && linkUrl.length >= 2 && (
        <div
          style={{
            padding: "0.5rem",
            borderBottom: "1px solid var(--border-light)",
            background: "#fffbe6",
            fontSize: "0.85rem",
          }}
        >
          <strong>Suggestions AfriWiki :</strong>{" "}
          {entrepreneurLinks
            .filter((e) => e.name.toLowerCase().includes(linkUrl.toLowerCase()))
            .slice(0, 5)
            .map((e) => (
              <button
                key={e.slug}
                type="button"
                onClick={() => {
                  setLinkUrl(e.name);
                }}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.25rem 0.5rem",
                  background: "var(--link-color)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                {e.name}
              </button>
            ))}
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} style={{ padding: "1rem" }} />

      {/* Aide */}
      <div
        style={{
          padding: "0.5rem 1rem",
          borderTop: "1px solid var(--border-light)",
          background: "var(--background-secondary)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}
      >
        💡 Astuce : Sélectionnez du texte pour le formater. Utilisez ## pour créer des titres de section.
      </div>
    </div>
  );
};

// Fonctions de conversion Markdown <-> HTML
function convertMarkdownToHTML(markdown: string): string {
  if (!markdown) return "<p></p>";

  let html = markdown
    // Titres
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    // Gras et italique
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Liens
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Listes à puces
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Listes numérotées
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Citations
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Ligne horizontale
    .replace(/^---$/gm, "<hr>")
    // Paragraphes (double saut de ligne)
    .split(/\n\n+/)
    .map((block) => {
      if (
        block.startsWith("<h") ||
        block.startsWith("<li") ||
        block.startsWith("<blockquote") ||
        block.startsWith("<hr")
      ) {
        return block;
      }
      return `<p>${block}</p>`;
    })
    .join("");

  // Wrapper les listes
  html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");

  return html;
}

function convertHTMLToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return "";

  let markdown = html
    // Titres
    .replace(/<h2[^>]*>([^<]+)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>([^<]+)<\/h3>/gi, "### $1\n\n")
    // Gras et italique
    .replace(/<strong><em>([^<]+)<\/em><\/strong>/gi, "***$1***")
    .replace(/<strong>([^<]+)<\/strong>/gi, "**$1**")
    .replace(/<em>([^<]+)<\/em>/gi, "*$1*")
    // Liens
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, "[$2]($1)")
    // Listes
    .replace(/<ul>/gi, "")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol>/gi, "")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<li>([^<]+)<\/li>/gi, "* $1\n")
    // Citations
    .replace(/<blockquote>([^<]+)<\/blockquote>/gi, "> $1\n\n")
    // Ligne horizontale
    .replace(/<hr\s*\/?>/gi, "---\n\n")
    // Paragraphes
    .replace(/<p>([^<]*)<\/p>/gi, "$1\n\n")
    // Nettoyage
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return markdown;
}

export default RichTextEditor;
