"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  folder?: string;
  maxSizeMB?: number;
  aspectRatio?: "square" | "landscape" | "portrait";
}

export const ImageUpload = ({
  currentImageUrl,
  onImageUploaded,
  folder = "photos",
  maxSizeMB = 2,
  aspectRatio = "square",
}: ImageUploadProps) => {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [dragOver, setDragOver] = useState(false);

  const aspectRatioStyles = {
    square: { width: "150px", height: "150px" },
    landscape: { width: "200px", height: "150px" },
    portrait: { width: "150px", height: "200px" },
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validation du type
    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image (JPG, PNG, GIF, WebP)");
      return;
    }

    // Validation de la taille
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`L'image ne doit pas dépasser ${maxSizeMB} Mo`);
      return;
    }

    // Prévisualisation locale
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload
    setUploading(true);

    try {
      // Récupérer l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Vous devez être connecté pour uploader une image");
        setUploading(false);
        return;
      }

      // Générer un nom de fichier unique
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("afriwiki")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setError(`Erreur d'upload: ${uploadError.message}`);
        setPreviewUrl(currentImageUrl || null);
        setUploading(false);
        return;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from("afriwiki")
        .getPublicUrl(filePath);

      // Callback avec la nouvelle URL
      onImageUploaded(publicUrl);
      setPreviewUrl(publicUrl);

      // Nettoyer l'URL locale
      URL.revokeObjectURL(localPreview);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Une erreur est survenue lors de l'upload");
      setPreviewUrl(currentImageUrl || null);
    }

    setUploading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Zone de drop / Preview */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          ...aspectRatioStyles[aspectRatio],
          border: dragOver ? "2px dashed #3b82f6" : "2px dashed #d1d5db",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: uploading ? "wait" : "pointer",
          backgroundColor: dragOver ? "#eff6ff" : "#f9fafb",
          backgroundImage: previewUrl ? `url(${previewUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "all 0.2s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 0.5rem",
                }}
              />
              <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Upload...</span>
            </div>
          </div>
        )}

        {!previewUrl && !uploading && (
          <div style={{ textAlign: "center", color: "#6b7280", padding: "1rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              Cliquez ou glissez une image
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
              JPG, PNG, WebP • Max {maxSizeMB} Mo
            </p>
          </div>
        )}
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />

      {/* Actions */}
      {previewUrl && !uploading && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handleClick}
            style={{
              flex: 1,
              padding: "0.5rem",
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Changer
          </button>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              padding: "0.5rem 0.75rem",
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "#dc2626",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div
          style={{
            padding: "0.5rem 0.75rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: "4px",
            color: "#dc2626",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Style pour l'animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
