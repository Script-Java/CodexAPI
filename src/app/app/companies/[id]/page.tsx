import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export default async function CompanyDetailPage({ params }: Params) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: { contacts: true, deals: true },
  });
  if (!company) {
    return <div className="p-4">Company not found</div>;
  }
  return (
    <div className="p-4 space-y-8">
      <section>
        <h2 className="text-xl font-semibold">Summary</h2>
        <div>Name: {company.name}</div>
        {company.domain && <div>Domain: {company.domain}</div>}
        {company.phone && <div>Phone: {company.phone}</div>}
        {company.website && <div>Website: {company.website}</div>}
      </section>
      <section>
        <h2 className="text-xl font-semibold">Contacts</h2>
        <ul className="list-disc ml-6">
          {company.contacts.map((c) => (
            <li key={c.id}>
              {c.firstName} {c.lastName}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Deals</h2>
        <ul className="list-disc ml-6">
          {company.deals.map((d) => (
            <li key={d.id}>{d.title}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Notes</h2>
        <p>No notes yet.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Files</h2>
        <p>No files yet.</p>
      </section>
    </div>
  );
}

