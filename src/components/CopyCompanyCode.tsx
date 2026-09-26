'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyCompanyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      title="Copy Company Code"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card-bg)',
        color: copied ? '#10b981' : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '11px',
        fontFamily: 'monospace',
        transition: 'all 0.2s ease',
        marginLeft: '6px',
        fontWeight: 'bold'
      }}
      onMouseOver={(e) => {
        if (!copied) {
          e.currentTarget.style.borderColor = 'var(--text-muted)';
          e.currentTarget.style.color = 'var(--foreground)';
        }
      }}
      onMouseOut={(e) => {
        if (!copied) {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {code.toUpperCase()}
    </button>
  );
}
