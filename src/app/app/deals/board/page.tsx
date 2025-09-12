'use client';

import { useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { formatDistanceToNow } from 'date-fns';

interface Stage {
  id: string;
  name: string;
}

interface Pipeline {
  id: string;
  stages: Stage[];
}

interface Deal {
  id: string;
  title: string;
  valueCents: number;
  company?: { name: string } | null;
  contact?: { firstName: string; lastName: string } | null;
  owner?: { name: string | null; email: string } | null;
  stageId: string;
  createdAt: string;
}

export default function DealsBoardPage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const fetchPipeline = async () => {
      const res = await fetch('/api/pipelines');
      if (res.ok) setPipeline(await res.json());
    };
    fetchPipeline();
  }, []);

  useEffect(() => {
    if (!pipeline) return;
    const fetchDeals = async () => {
      const res = await fetch(`/api/deals?pipelineId=${pipeline.id}`);
      if (res.ok) setDeals(await res.json());
    };
    fetchDeals();
  }, [pipeline]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const stageId = result.destination.droppableId;
    setDeals((prev) =>
      prev.map((d) => (d.id === result.draggableId ? { ...d, stageId } : d))
    );
    await fetch(`/api/deals/${result.draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageId }),
    });
  };

  const stageDeals = (stageId: string) =>
    deals.filter((d) => d.stageId === stageId);

  return (
    <div className="p-4">
      {pipeline && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto">
            {pipeline.stages.map((stage) => (
              <Droppable droppableId={stage.id} key={stage.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-100 rounded p-2 min-w-[250px]"
                  >
                    <h3 className="font-semibold mb-2">{stage.name}</h3>
                    {stageDeals(stage.id).map((deal, index) => (
                      <Draggable
                        draggableId={deal.id}
                        index={index}
                        key={deal.id}
                      >
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className="bg-white rounded shadow p-2 mb-2"
                          >
                            <div className="font-medium">{deal.title}</div>
                            <div className="text-sm text-gray-500">
                              ${(deal.valueCents / 100).toFixed(2)}
                            </div>
                            <div className="text-sm">
                              {deal.company?.name ||
                                `${deal.contact?.firstName ?? ''} ${
                                  deal.contact?.lastName ?? ''
                                }`}
                            </div>
                            <div className="text-xs text-gray-400">
                              {(deal.owner?.name || deal.owner?.email) +
                                ' • ' +
                                formatDistanceToNow(new Date(deal.createdAt), {
                                  addSuffix: true,
                                })}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
