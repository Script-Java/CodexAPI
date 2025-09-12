'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ActivityType } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

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
}

export default function DealDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const [dealRes, actRes, noteRes] = await Promise.all([
        fetch(`/api/deals/${id}`),
        fetch(`/api/activities?dealId=${id}`),
        fetch(`/api/notes?dealId=${id}`),
      ]);
      if (dealRes.ok) setDeal(await dealRes.json());
      const activities: Activity[] = actRes.ok ? await actRes.json() : [];
      const notes: Note[] = noteRes.ok ? await noteRes.json() : [];
      const combined: TimelineItem[] = [
        ...activities.map((a) => ({ id: a.id, kind: 'activity', createdAt: a.createdAt, activity: a })),
        ...notes.map((n) => ({ id: n.id, kind: 'note', createdAt: n.createdAt, note: n })),
      ];
      setTimeline(
        combined.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    };
    fetchData();
  }, [id]);

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

  const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const temp: TimelineItem = {
      id: 'temp-' + Math.random(),
      kind: 'file',
      createdAt: new Date().toISOString(),
      fileName: file.name,
    };
    setTimeline((t) => [temp, ...t]);
  };

  return (
    <div className="p-4 space-y-4">
      {deal && <h1 className="text-2xl font-bold mb-4">{deal.title}</h1>}
      <div className="flex gap-2">
        <button className="border px-2" onClick={() => logActivity(ActivityType.CALL)}>
          Log Call
        </button>
        <button className="border px-2" onClick={() => logActivity(ActivityType.EMAIL)}>
          Log Email
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
                <div>Uploaded file: {item.fileName}</div>
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
