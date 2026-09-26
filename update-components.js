const fs = require('fs');

// 1. Update VisualEditorModal.tsx
let vContent = fs.readFileSync('src/components/VisualEditorModal.tsx', 'utf8');

const fontOptions = `    { key: 'fontFamily', label: 'Font Family', type: 'select', options: [
      { value: 'Inter, sans-serif', label: 'Inter' },
      { value: 'Roboto, sans-serif', label: 'Roboto' },
      { value: 'Outfit, sans-serif', label: 'Outfit' },
      { value: 'Arial, sans-serif', label: 'Arial' },
      { value: 'Courier New, monospace', label: 'Monospace' }
    ]},`;

vContent = vContent.replace(/{ key: 'color', label: 'Text Color', type: 'color' },/g, `{ key: 'color', label: 'Text Color', type: 'color' },\n${fontOptions}`);
vContent = vContent.replace(/{ key: 'theme', label: 'Widget Theme', type: 'select', options: \[/g, `${fontOptions}\n    { key: 'theme', label: 'Widget Theme', type: 'select', options: [`);

const urlLogicVisual = `    if (field.type === 'url' && mediaAssets) {
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
    }`;

const vContentParts = vContent.split("    if (field.type === 'url' && mediaAssets) {");
if (vContentParts.length === 2) {
    const endIndex = vContentParts[1].indexOf("    if (field.type === 'textarea') {");
    vContent = vContentParts[0] + urlLogicVisual + "\n" + vContentParts[1].substring(endIndex);
}

fs.writeFileSync('src/components/VisualEditorModal.tsx', vContent, 'utf8');

// 2. Update CreativeCanvasEditor.tsx
let cContent = fs.readFileSync('src/components/CreativeCanvasEditor.tsx', 'utf8');

cContent = cContent.replace(
    "export function CreativeCanvasEditor({ widget, onClose, onSave }: CreativeCanvasEditorProps) {",
    "export function CreativeCanvasEditor({ widget, onClose, onSave, mediaAssets, folders }: CreativeCanvasEditorProps & { mediaAssets?: any[], folders?: any[] }) {"
);

const urlLogicCanvas = `                if (field.type === 'url') {
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

                if (field.type === 'textarea') {`;

cContent = cContent.replace("                if (field.type === 'textarea') {", urlLogicCanvas);

fs.writeFileSync('src/components/CreativeCanvasEditor.tsx', cContent, 'utf8');


// 3. Update WidgetEditorModal.tsx
let wContent = fs.readFileSync('src/components/WidgetEditorModal.tsx', 'utf8');

wContent = wContent.replace(
    "export function WidgetEditorModal({ widget, onClose, onSave }: WidgetEditorModalProps) {",
    "export function WidgetEditorModal({ widget, onClose, onSave, mediaAssets, folders }: WidgetEditorModalProps & { mediaAssets?: any[], folders?: any[] }) {"
);

const urlLogicWidget = `              if (field.type === 'url') {
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

              if (field.type === 'textarea') {`;

wContent = wContent.replace("              if (field.type === 'textarea') {", urlLogicWidget);

fs.writeFileSync('src/components/WidgetEditorModal.tsx', wContent, 'utf8');

console.log('Success!');
