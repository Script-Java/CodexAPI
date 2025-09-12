"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface Result {
  type: string;
  id: string;
  label: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        setResults(await res.json());
      }
    };
    load();
    return () => controller.abort();
  }, [query]);

  const handleSelect = (r: Result) => {
    let path = "";
    if (r.type === "company") path = `/app/companies/${r.id}`;
    else if (r.type === "contact") path = `/app/contacts/${r.id}`;
    else if (r.type === "deal") path = `/app/deals/${r.id}`;
    if (path) router.push(path);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-64">
      <Input
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background text-sm shadow">
          {results.map((r) => (
            <div
              key={`${r.type}-${r.id}`}
              className="cursor-pointer px-2 py-1 hover:bg-accent"
              onClick={() => handleSelect(r)}
            >
              {r.label}
              <span className="ml-1 text-muted-foreground">({r.type})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
