'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  dueAt?: string | null;
  completedAt?: string | null;
}

type Filter = 'today' | 'week' | 'overdue' | 'mine' | 'team';

export default function TasksTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('today');
  const router = useRouter();

  const fetchTasks = async () => {
    const params = new URLSearchParams({ type: 'TASK' });
    switch (filter) {
      case 'today':
        params.set('owner', 'mine');
        params.set('due', 'today');
        break;
      case 'week':
        params.set('owner', 'mine');
        params.set('due', 'week');
        break;
      case 'overdue':
        params.set('owner', 'mine');
        params.set('due', 'overdue');
        break;
      case 'mine':
        params.set('owner', 'mine');
        break;
      case 'team':
        params.set('owner', 'team');
        break;
    }
    const res = await fetch('/api/activities?' + params.toString());
    if (res.ok) {
      setTasks(await res.json());
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const toggleComplete = async (task: Task) => {
    await fetch(`/api/activities/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completedAt: task.completedAt ? null : new Date().toISOString(),
      }),
    });
    await fetchTasks();
    router.refresh();
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'mine', label: 'Mine' },
    { key: 'team', label: 'Team' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => {
          const isOverdue =
            t.dueAt && new Date(t.dueAt) < new Date() && !t.completedAt;
          return (
            <li
              key={t.id}
              className="flex items-center justify-between border rounded p-2"
            >
              <div>
                <div
                  className={cn(
                    t.completedAt ? 'line-through text-muted-foreground' : ''
                  )}
                >
                  {t.title}
                </div>
                {t.dueAt && (
                  <div
                    className={cn(
                      'text-xs',
                      isOverdue && !t.completedAt
                        ? 'text-red-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    {format(new Date(t.dueAt), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
              <input
                type="checkbox"
                checked={!!t.completedAt}
                onChange={() => toggleComplete(t)}
              />
            </li>
          );
        })}
        {tasks.length === 0 && (
          <li className="text-sm text-muted-foreground">No tasks.</li>
        )}
      </ul>
    </div>
  );
}

