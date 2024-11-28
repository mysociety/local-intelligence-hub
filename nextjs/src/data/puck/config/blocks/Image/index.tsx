import React, { useState } from "react";
import { ComponentConfig, CustomField } from "@measured/puck";

export type ImageProps = {
  url: string;
  width?: string;
  height?: string;
  alt?: string; 
  caption?: string; 
};

const FileUploadField = ({
  name,
  id,
  value,
  onChange,
  readOnly,
}: {
  field: CustomField<string>;
  name: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const fileUrl = data.url; 

      onChange(fileUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {!readOnly && (
        <input
          type="file"
          id={id}
          name={name}
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      )}
      {uploading && <p>Uploading...</p>}
      {value && (
        <div>
          <a href={value} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        </div>
      )}
    </div>
  );
};

export const Image: ComponentConfig<ImageProps> = {
  label: "Image",
  fields: {
    url: {
      type: "custom",
      render: FileUploadField,
    },
    width: {
      type: "text",
      label: "Width",
    },
    height: {
      type: "text",
      label: "Height",
    },
    alt: {
      type: "text",
      label: "Alt Text",
    },
    caption: {
      type: "textarea",
      label: "Caption",
    },
  },
  render: ({ url, width, height, alt, caption }) => {
    return (
      <figure>
        <img
          className="object-fill w-full rounded-2xl mb-4"
          style={{
            width: width || "auto",
            height: height || "auto",
          }}
          src={url}
          alt={alt || "Image"} 
        />
        {caption && <figcaption>{caption}</figcaption>} 
      </figure>
    );
  },
};