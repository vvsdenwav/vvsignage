import sys

# 1. Update VisualEditorModal.tsx (Schemas and field.type === 'url')
with open('src/components/VisualEditorModal.tsx', 'r', encoding='utf-8') as f:
    v_content = f.read()

font_options = """    { key: 'fontFamily', label: 'Font Family', type: 'select', options: [
      { value: 'Inter, sans-serif', label: 'Inter' },
      { value: 'Roboto, sans-serif', label: 'Roboto' },
      { value: 'Outfit, sans-serif', label: 'Outfit' },
      { value: 'Arial, sans-serif', label: 'Arial' },
      { value: 'Courier New, monospace', label: 'Monospace' }
    ]},"""

v_content = v_content.replace("{ key: 'color', label: 'Text Color', type: 'color' },", "{ key: 'color', label: 'Text Color', type: 'color' },\n" + font_options)
v_content = v_content.replace("{ key: 'theme', label: 'Widget Theme', type: 'select', options: [", font_options + "\n    { key: 'theme', label: 'Widget Theme', type: 'select', options: [")

url_logic_visual = """    if (field.type === 'url' && mediaAssets) {
      return (
        <div key={field.key} className="form-group">
          <label className="form-label">{field.label}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={val ?? ''}
              onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
              className="input-field"
              placeholder={field.placeholder || "https://..."}
            />
            <select
              className="input-field"
              value=""
              onChange={(e) => updateDraftPayload(widget.id, { [field.key]: e.target.value })}
            >
              <option value="" disabled>Or select from Media Library...</option>
              {folders ? folders.map((folder: any) => (
                <optgroup key={folder.id} label={folder.name}>
                  {mediaAssets.filter((m: any) => m.folderId === folder.id).map((media: any) => (
                    <option key={media.id} value={media.url}>
                      {media.name} ({media.type})
                    </option>
                  ))}
                </optgroup>
              )) : null}
              <optgroup label={folders && folders.length > 0 ? "Root folder" : "Media Assets"}>
                {mediaAssets.filter((m: any) => !m.folderId).map((media: any) => (
                  <option key={media.id} value={media.url}>
                    {media.name} ({media.type})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      );
    }"""

v_content_parts = v_content.split("    if (field.type === 'url' && mediaAssets) {")
if len(v_content_parts) == 2:
    end_index = v_content_parts[1].find("    if (field.type === 'textarea') {")
    v_content = v_content_parts[0] + url_logic_visual + "\n" + v_content_parts[1][end_index:]

with open('src/components/VisualEditorModal.tsx', 'w', encoding='utf-8') as f:
    f.write(v_content)


# 2. Update CreativeCanvasEditor.tsx
with open('src/components/CreativeCanvasEditor.tsx', 'r', encoding='utf-8') as f:
    c_content = f.read()

c_content = c_content.replace(
    "export function CreativeCanvasEditor({ widget, onClose, onSave }: CreativeCanvasEditorProps) {",
    "export function CreativeCanvasEditor({ widget, onClose, onSave, mediaAssets, folders }: CreativeCanvasEditorProps & { mediaAssets?: any[], folders?: any[] }) {"
)

url_logic_canvas = """                if (field.type === 'url') {
                  return (
                    <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ color: '#ccc', fontSize: '13px' }}>{field.label}</label>
                      <input
                        type="text"
                        value={val || ''}
                        onChange={(e) => updateElementPayload(selectedElement.id, field.key, e.target.value)}
                        placeholder={field.placeholder || "https://..."}
                        style={{ background: '#222', border: '1px solid #444', color: 'white', padding: '8px 12px', borderRadius: '6px' }}
                      />
                      {mediaAssets && (
                        <select
                          value=""
                          onChange={(e) => updateElementPayload(selectedElement.id, field.key, e.target.value)}
                          style={{ background: '#222', border: '1px solid #444', color: 'white', padding: '8px 12px', borderRadius: '6px' }}
                        >
                          <option value="" disabled>Or select from Media Library...</option>
                          {folders ? folders.map((folder: any) => (
                            <optgroup key={folder.id} label={folder.name}>
                              {mediaAssets.filter((m: any) => m.folderId === folder.id).map((media: any) => (
                                <option key={media.id} value={media.url}>
                                  {media.name} ({media.type})
                                </option>
                              ))}
                            </optgroup>
                          )) : null}
                          <optgroup label={folders && folders.length > 0 ? "Root folder" : "Media Assets"}>
                            {mediaAssets.filter((m: any) => !m.folderId).map((media: any) => (
                              <option key={media.id} value={media.url}>
                                {media.name} ({media.type})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      )}
                    </div>
                  );
                }

                if (field.type === 'textarea') {"""

c_content = c_content.replace("                if (field.type === 'textarea') {", url_logic_canvas)

with open('src/components/CreativeCanvasEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(c_content)


# 3. Update WidgetEditorModal.tsx
with open('src/components/WidgetEditorModal.tsx', 'r', encoding='utf-8') as f:
    w_content = f.read()

w_content = w_content.replace(
    "export function WidgetEditorModal({ widget, onClose, onSave }: WidgetEditorModalProps) {",
    "export function WidgetEditorModal({ widget, onClose, onSave, mediaAssets, folders }: WidgetEditorModalProps & { mediaAssets?: any[], folders?: any[] }) {"
)

url_logic_widget = """              if (field.type === 'url') {
                return (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{field.label}</label>
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => setPayload({ ...payload, [field.key]: e.target.value })}
                      placeholder={field.placeholder || "https://..."}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
                    />
                    {mediaAssets && (
                      <select
                        value=""
                        onChange={(e) => setPayload({ ...payload, [field.key]: e.target.value })}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
                      >
                        <option value="" disabled>Or select from Media Library...</option>
                        {folders ? folders.map((folder: any) => (
                          <optgroup key={folder.id} label={folder.name}>
                            {mediaAssets.filter((m: any) => m.folderId === folder.id).map((media: any) => (
                              <option key={media.id} value={media.url}>
                                {media.name} ({media.type})
                              </option>
                            ))}
                          </optgroup>
                        )) : null}
                        <optgroup label={folders && folders.length > 0 ? "Root folder" : "Media Assets"}>
                          {mediaAssets.filter((m: any) => !m.folderId).map((media: any) => (
                            <option key={media.id} value={media.url}>
                              {media.name} ({media.type})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    )}
                  </div>
                );
              }

              if (field.type === 'textarea') {"""

w_content = w_content.replace("              if (field.type === 'textarea') {", url_logic_widget)

with open('src/components/WidgetEditorModal.tsx', 'w', encoding='utf-8') as f:
    f.write(w_content)

print('Success')
