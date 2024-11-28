import { ComponentConfig, CustomField } from '@measured/puck'
import React, { useState } from 'react'

export type ImageProps = {
  url: string
  width?: { value: number; unit: string }
  height?: { value: number; unit: string }
  alt?: string
  caption?: string
}

const FileUploadField = ({
  name,
  id,
  value,
  onChange,
  readOnly,
}: {
  field: CustomField<string>
  name: string
  id: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}) => {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      const fileUrl = data.url

      onChange(fileUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('File upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

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
  )
}

const DimensionField = ({
  value,
  onChange,
  label,
}: {
  value?: { value: number; unit: string }
  onChange: (value: { value: number; unit: string }) => void
  label: string
}) => (
  <div>
    <label>{label}</label>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        type="number"
        value={value?.value || ''}
        onChange={(e) =>
          onChange({ value: Number(e.target.value), unit: value?.unit || 'px' })
        }
        style={{ width: '70px' }}
      />
      <select
        value={value?.unit || 'px'}
        onChange={(e) =>
          onChange({ value: value?.value || 0, unit: e.target.value })
        }
      >
        <option value="px">px</option>
        <option value="%">%</option>
      </select>
    </div>
  </div>
)

export const Image: ComponentConfig<ImageProps> = {
  label: 'Image',
  fields: {
    url: {
      type: 'custom',
      render: FileUploadField,
    },
    width: {
      type: 'custom',
      label: 'Width',
      render: ({ value, onChange }) => (
        <DimensionField value={value} onChange={onChange} label="Width" />
      ),
    },
    height: {
      type: 'custom',
      label: 'Height',
      render: ({ value, onChange }) => (
        <DimensionField value={value} onChange={onChange} label="Height" />
      ),
    },
    alt: {
      type: 'text',
      label: 'Alt Text',
    },
    caption: {
      type: 'textarea',
      label: 'Caption',
    },
  },
  render: ({ url, width, height, alt, caption }) => {
    const widthStyle =
      width && width.value ? `${width.value}${width.unit}` : 'auto'
    const heightStyle =
      height && height.value ? `${height.value}${height.unit}` : 'auto'

    return (
      <figure>
        <img
          className="object-fill w-full rounded-2xl mb-4"
          style={{
            width: widthStyle,
            height: heightStyle,
          }}
          src={url}
          alt={alt || 'Image'}
        />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    )
  },
}
