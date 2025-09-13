import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Settings</h1>
      <ul className="list-disc pl-4">
        <li>
          <Link href="/app/settings/organization">Organization</Link>
        </li>
        <li>
          <Link href="/app/settings/audit">Audit Logs</Link>
        </li>
      </ul>
    </div>
  );
}
