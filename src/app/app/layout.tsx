import { ReactNode } from "react";
import Sidebar from "./_components/sidebar";
import Topbar from "./_components/topbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r md:flex">
        <Sidebar />
      </aside>
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
