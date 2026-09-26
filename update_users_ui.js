const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add permissions state to page.tsx
pageContent = pageContent.replace('const [newUserRole, setNewUserRole] = useState("AGENT");', 'const [newUserRole, setNewUserRole] = useState("AGENT");\n  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);');

// 2. Add permissions logic in handleCreateUser
const handleCreateUserOld = `    if (!newUsername || !newUserPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newUserPassword, role: newUserRole })
      });`;
const handleCreateUserNew = `    if (!newUsername || !newUserPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newUserPassword, 
          role: newUserRole,
          permissions: JSON.stringify(newUserPermissions)
        })
      });`;
pageContent = pageContent.replace(handleCreateUserOld, handleCreateUserNew);

// 3. Add edit user state
pageContent = pageContent.replace('const [newUserRole, setNewUserRole] = useState("AGENT");', 'const [editingUser, setEditingUser] = useState<any>(null);\n  const [newUserRole, setNewUserRole] = useState("AGENT");');

// 4. Update the Users table UI to include Edit button & Edit Modal
const userTableOld = `                      <td style={{ padding: '16px' }}>{u.role}</td>
                      <td style={{ padding: '16px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </td>`;
const userTableNew = `                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: u.role === 'ADMIN' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.2)', color: u.role === 'ADMIN' ? '#60a5fa' : '#9ca3af' }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '16px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button onClick={() => {
                           setEditingUser(u);
                           setNewUsername(u.username);
                           setNewUserRole(u.role);
                           try { setNewUserPermissions(JSON.parse(u.permissions || '[]')); } catch(e) { setNewUserPermissions([]); }
                           setNewUserPassword('');
                           setShowCreateUser(true);
                        }} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', marginRight: '8px' }} title="Edit Privileges"><Settings size={16} /></button>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} title="Delete User"><Trash2 size={16} /></button>
                      </td>`;
pageContent = pageContent.replace(userTableOld, userTableNew);

// 5. Update user creation/edit form to show checkboxes
const userCreateFormOld = `                    <select 
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value)}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    >
                      <option value="AGENT">Content Agent</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => setShowCreateUser(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleCreateUser} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Create User</button>
                  </div>`;
const userCreateFormNew = `                    <select 
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value)}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    >
                      <option value="AGENT">Content Agent</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                  
                  {newUserRole === 'AGENT' && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '500' }}>Assign Module Permissions:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {['screens', 'media', 'playlists', 'widgets', 'tv-accounts', 'templates', 'groups', 'reports', 'audit', 'users'].map(mod => (
                           <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                             <input 
                               type="checkbox" 
                               checked={newUserPermissions.includes(mod)}
                               onChange={(e) => {
                                 if (e.target.checked) setNewUserPermissions(prev => [...prev, mod]);
                                 else setNewUserPermissions(prev => prev.filter(p => p !== mod));
                               }}
                             />
                             <span style={{ textTransform: 'capitalize' }}>{mod.replace('-', ' ')}</span>
                           </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => { setShowCreateUser(false); setEditingUser(null); setNewUsername(''); setNewUserPassword(''); setNewUserPermissions([]); setNewUserRole('AGENT'); }} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={async () => {
                       if (editingUser) {
                          // update user
                          await fetch(\`/api/users/\${editingUser.id}\`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: newUserRole, permissions: JSON.stringify(newUserPermissions), ...(newUserPassword ? { password: newUserPassword } : {}) })
                          });
                          fetchUsers();
                          setShowCreateUser(false);
                          setEditingUser(null);
                          setNewUsername('');
                          setNewUserPassword('');
                          setNewUserRole('AGENT');
                          setNewUserPermissions([]);
                       } else {
                          handleCreateUser();
                       }
                    }} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: 'var(--brand-primary)', color: 'white', cursor: 'pointer', fontWeight: '500' }}>{editingUser ? 'Save Changes' : 'Create User'}</button>
                  </div>`;
pageContent = pageContent.replace(userCreateFormOld, userCreateFormNew);
pageContent = pageContent.replace('<h3 style={{ fontSize: \'18px\', fontWeight: \'600\' }}>New User</h3>', '<h3 style={{ fontSize: \'18px\', fontWeight: \'600\' }}>{editingUser ? "Edit User Privileges" : "New User"}</h3>');

// 6. Update user creation to reset state
pageContent = pageContent.replace('setNewUsername(\'\');\n      setNewUserPassword(\'\');\n      setNewUserRole(\'AGENT\');', 'setNewUsername(\'\');\n      setNewUserPassword(\'\');\n      setNewUserRole(\'AGENT\');\n      setNewUserPermissions([]);');

// 7. Extract current user role & permissions from session (it's already passed as props or from useSession)
// wait, page.tsx uses useSession? No, it doesn't look like it imports useSession if it's a server component wrapper or maybe it's client.
// Let's check if it uses NextAuth useSession.
// Actually, page.tsx receives props from layout? Or maybe it fetches session. Let's see if there is session logic.
fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');
console.log('Successfully updated users tab UI.');
