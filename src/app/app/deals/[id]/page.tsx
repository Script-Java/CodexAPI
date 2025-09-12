'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ActivityType } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import CallLogDialog from './call-log-dialog';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  note?: string | null;
  createdAt: string;
}

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

interface Deal {
  id: string;
  title: string;
}

interface TimelineItem {
  id: string;
  kind: 'activity' | 'note' | 'file';
  createdAt: string;
  activity?: Activity;
  note?: Note;
  fileName?: string;
  fileUrl?: string;
}

export default function DealDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [callOpen, setCallOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [dealRes, actRes, noteRes, fileRes] = await Promise.all([
      fetch(`/api/deals/${id}`),
      fetch(`/api/activities?dealId=${id}`),
      fetch(`/api/notes?dealId=${id}`),
      fetch(`/api/files?dealId=${id}`),
    ]);
    if (dealRes.ok) setDeal(await dealRes.json());
    const activities: Activity[] = actRes.ok ? await actRes.json() : [];
    const notes: Note[] = noteRes.ok ? await noteRes.json() : [];
    const files: any[] = fileRes.ok ? await fileRes.json() : [];
    const combined: TimelineItem[] = [
      ...activities.map((a) => ({ id: a.id, kind: 'activity', createdAt: a.createdAt, activity: a })),
      ...notes.map((n) => ({ id: n.id, kind: 'note', createdAt: n.createdAt, note: n })),
      ...files.map((f) => ({
        id: f.id,
        kind: 'file',
        createdAt: f.createdAt,
        fileName: f.key.split('/').pop(),
        fileUrl: `/api/files/${f.id}`,
      })),
    ];
    setTimeline(
      combined.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logActivity = async (type: ActivityType) => {
    const title = prompt('Title')?.trim();
    if (!title) return;
    const temp: TimelineItem = {
      id: 'temp-' + Math.random(),
      kind: 'activity',
      createdAt: new Date().toISOString(),
      activity: { id: '', type, title, createdAt: new Date().toISOString(), note: null },
    };
    setTimeline((t) => [temp, ...t]);
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, dealId: id }),
    });
  };

  const sendEmail = async () => {
    const to = prompt('To')?.trim();
    if (!to) return;
    const subject = prompt('Subject')?.trim();
    if (!subject) return;
    const body = prompt('Body')?.trim();
    if (!body) return;
    const temp: TimelineItem = {
      id: 'temp-' + Math.random(),
      kind: 'activity',
      createdAt: new Date().toISOString(),
      activity: {
        id: '',
        type: ActivityType.EMAIL,
        title: subject,
        note: body,
        createdAt: new Date().toISOString(),
      },
    };
    setTimeline((t) => [temp, ...t]);
    await fetch('/api/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, dealId: id }),
    });
    await fetchData();
  };

  const addNote = async () => {
    const body = prompt('Note')?.trim();
    if (!body) return;
    const temp: TimelineItem = {
      id: 'temp-' + Math.random(),
      kind: 'note',
      createdAt: new Date().toISOString(),
      note: { id: '', body, createdAt: new Date().toISOString() },
    };
    setTimeline((t) => [temp, ...t]);
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, dealId: id }),
    });
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('dealId', id);
    await fetch('/api/files', { method: 'POST', body: form });
    await fetchData();
  };

  return (
    <div className="p-4 space-y-4">
      {deal && <h1 className="text-2xl font-bold mb-4">{deal.title}</h1>}
      <div className="flex gap-2">
        <button className="border px-2" onClick={() => setCallOpen(true)}>
          Log Call
        </button>
        <CallLogDialog
          dealId={id}
          open={callOpen}
          onOpenChange={setCallOpen}
          onLogged={fetchData}
        />
        <button className="border px-2" onClick={sendEmail}>
          Send Email
        </button>
        <button className="border px-2" onClick={() => logActivity(ActivityType.MEETING)}>
          Schedule Meeting
        </button>
        <button className="border px-2" onClick={() => logActivity(ActivityType.TASK)}>
          Add Task
        </button>
        <button className="border px-2" onClick={addNote}>
          Add Note
        </button>
        <input type="file" onChange={uploadFile} />
      </div>
      <ul className="space-y-2">
        {timeline.map((item) => (
          <li key={item.id} className="border rounded p-2">
            {item.kind === 'activity' && item.activity && (
              <div>
                <div className="font-medium">
                  {item.activity.type}: {item.activity.title}
                </div>
                {item.activity.note && (
                  <div className="text-sm">{item.activity.note}</div>
                )}
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </div>
            )}
            {item.kind === 'note' && item.note && (
              <div>
                <div>{item.note.body}</div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </div>
            )}
            {item.kind === 'file' && (
              <div>
                <div>
                  Uploaded file: <a className="underline" href={item.fileUrl}>{item.fileName}</a>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
