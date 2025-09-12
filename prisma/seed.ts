import { PrismaClient, MembershipRole, DealStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Owner User',
      email: 'owner@example.com',
    },
  })

  const organization = await prisma.organization.create({
    data: {
      name: 'Acme Inc',
      slug: 'acme',
      memberships: {
        create: {
          userId: user.id,
          role: MembershipRole.OWNER,
        },
      },
    },
  })

  const pipeline = await prisma.pipeline.create({
    data: {
      organizationId: organization.id,
      name: 'Sales',
      stages: {
        create: [
          { name: 'New', order: 1 },
          { name: 'Qualified', order: 2 },
          { name: 'Proposal', order: 3 },
          { name: 'Closed', order: 4 },
        ],
      },
    },
  })

  const [companyA, companyB] = await prisma.$transaction([
    prisma.company.create({
      data: { organizationId: organization.id, name: 'Globex' },
    }),
    prisma.company.create({
      data: { organizationId: organization.id, name: 'Initech' },
    }),
  ])

  const [contactA, contactB] = await prisma.$transaction([
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        companyId: companyA.id,
        firstName: 'Homer',
        lastName: 'Simpson',
        email: 'homer@globex.com',
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        companyId: companyB.id,
        firstName: 'Peter',
        lastName: 'Gibbons',
        email: 'peter@initech.com',
      },
    }),
  ])

  const stages = await prisma.stage.findMany({
    where: { pipelineId: pipeline.id },
    orderBy: { order: 'asc' },
  })

  await prisma.deal.create({
    data: {
      organizationId: organization.id,
      companyId: companyA.id,
      contactId: contactA.id,
      ownerId: user.id,
      pipelineId: pipeline.id,
      stageId: stages[0].id,
      title: 'Globex Contract',
      valueCents: 50000,
      currency: 'USD',
      status: DealStatus.OPEN,
    },
  })

  await prisma.deal.create({
    data: {
      organizationId: organization.id,
      companyId: companyB.id,
      contactId: contactB.id,
      ownerId: user.id,
      pipelineId: pipeline.id,
      stageId: stages[1].id,
      title: 'Initech Renewal',
      valueCents: 75000,
      currency: 'USD',
      status: DealStatus.OPEN,
    },
  })
}

main()
  .catch((e) => {
    console.error("Seed error", (e as Error).message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

