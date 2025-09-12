import { Button } from "@/components/ui/button";
import { sample } from "@/lib/sample";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-blue-500">Hello {sample()}</h1>
      <Button className="mt-4">Click me</Button>
    </main>
  );
}
