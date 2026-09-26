'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteOrganization } from './actions';

export default function DeleteOrgButton({ orgId }: { orgId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently delete this organization? This action cannot be undone and will delete all associated users, screens, and media.')) {
      setIsDeleting(true);
      try {
        await deleteOrganization(orgId);
      } catch (error) {
        console.error('Failed to delete organization:', error);
        alert('Failed to delete organization.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      style={{
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        color: 'var(--red-600, #dc2626)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDeleting ? 0.5 : 1
      }}
      title="Delete Tenant"
    >
      <Trash2 style={{ width: '18px', height: '18px' }} />
    </button>
  );
}
