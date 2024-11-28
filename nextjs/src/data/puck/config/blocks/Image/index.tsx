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
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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

  const handleRemoveImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      {!readOnly && (
        <>
          <input
            type="file"
            id={id}
            name={name}
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            ref={fileInputRef}
          />
          {value && (
            <button type="button" onClick={handleRemoveImage} style={{}}>
              Remove Image
            </button>
          )}
        </>
      )}
      {uploading && <p>Uploading...</p>}
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
      width && width.value ? `${width.value}${width.unit}` : '100%'
    const heightStyle =
      height && height.value ? `${height.value}${height.unit}` : '200px'

    const containerStyle = {
      width: widthStyle,
      height: heightStyle,
      backgroundColor: url ? 'transparent' : '#d3d3d3',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '8px',
      overflow: 'hidden',
    }

    return (
      <figure>
        <div style={containerStyle}>
          {url ? (
            <img
              src={url}
              alt={alt || 'Image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{ color: '#888', fontSize: '14px' }}>No Image</span>
          )}
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    )
  },
}
