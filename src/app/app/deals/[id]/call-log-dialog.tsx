'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ActivityType } from '@prisma/client';

const schema = z.object({
  outcome: z.string().trim().min(1),
  duration: z.string().trim().optional(),
  followUp: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  dealId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: () => void;
}

export default function CallLogDialog({
  dealId,
  open,
  onOpenChange,
  onLogged,
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { outcome: '', duration: '', followUp: '' },
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealId,
        type: ActivityType.CALL,
        title: values.outcome,
        note: values.duration ? `Duration: ${values.duration}` : undefined,
      }),
    });
    if (values.followUp) {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          type: ActivityType.TASK,
          title: 'Follow up call',
          dueAt: new Date(values.followUp).toISOString(),
        }),
      });
    }
    setSaving(false);
    onOpenChange(false);
    form.reset();
    onLogged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Input id="outcome" {...form.register('outcome')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="5m"
              {...form.register('duration')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="followUp">Next Follow-up</Label>
            <Input id="followUp" type="date" {...form.register('followUp')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

