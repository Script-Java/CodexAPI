'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MembershipRole } from '@prisma/client';

interface Member {
  id: string;
  role: MembershipRole;
  user: { email: string };
}

export default function OrganizationSettingsPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>(MembershipRole.REP);

  const fetchData = async () => {
    const orgRes = await fetch('/api/organization');
    if (orgRes.ok) {
      const org = await orgRes.json();
      setName(org.name || '');
      setSlug(org.slug || '');
    }
    const memRes = await fetch('/api/memberships');
    if (memRes.ok) {
      const ms = await memRes.json();
      setMembers(ms);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveOrg = async () => {
    await fetch('/api/organization', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });
    fetchData();
  };

  const deleteOrg = async () => {
    await fetch('/api/organization', { method: 'DELETE' });
  };

  const invite = async () => {
    await fetch('/api/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    setInviteEmail('');
    fetchData();
  };

  const changeRole = async (id: string, role: MembershipRole) => {
    await fetch(`/api/memberships/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    fetchData();
  };

  const removeMember = async (id: string) => {
    await fetch(`/api/memberships/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="p-4 space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Organization</h2>
        <div className="flex gap-2 max-w-xl">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug" />
          <Button onClick={saveOrg}>Save</Button>
        </div>
        <Button variant="destructive" onClick={deleteOrg} className="mt-2">
          Delete Organization
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="flex gap-2 max-w-xl">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email"
          />
          <select
            className="border rounded px-2 py-1"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MembershipRole)}
          >
            <option value={MembershipRole.REP}>REP</option>
            <option value={MembershipRole.ADMIN}>ADMIN</option>
            <option value={MembershipRole.OWNER}>OWNER</option>
          </select>
          <Button onClick={invite}>Invite</Button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td className="p-2">{m.user.email}</td>
                <td className="p-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value as MembershipRole)}
                  >
                    <option value={MembershipRole.REP}>REP</option>
                    <option value={MembershipRole.ADMIN}>ADMIN</option>
                    <option value={MembershipRole.OWNER}>OWNER</option>
                  </select>
                </td>
                <td className="p-2 text-right">
                  <Button variant="ghost" onClick={() => removeMember(m.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
