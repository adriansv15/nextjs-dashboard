import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listInvoices() {
  const data = await prisma.invoices.findMany({
    where: { amount: 666 },
    include: { customer: { select: { name: true } } },
  });

  return data.map((row) => ({ amount: row.amount, name: row.customer.name }));
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
