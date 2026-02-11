import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const prisma = new PrismaClient();

async function seedUsers() {
  const created = [] as any[];
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const upserted = await prisma.users.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
      },
    });
    created.push(upserted);
  }
  return created;
}

async function seedCustomers() {
  const created = [] as any[];
  for (const c of customers) {
    const upserted = await prisma.customers.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        email: c.email,
        image_url: c.image_url,
      },
    });
    created.push(upserted);
  }
  return created;
}

async function seedInvoices() {
  const created = [] as any[];
  for (const inv of invoices) {
    const inserted = await prisma.invoices.create({
      data: {
        customer_id: inv.customer_id,
        amount: inv.amount,
        status: inv.status,
        date: new Date(inv.date),
      },
    });
    created.push(inserted);
  }
  return created;
}

async function seedRevenue() {
  const created = [] as any[];
  for (const r of revenue) {
    const upserted = await prisma.revenue.upsert({
      where: { month: r.month },
      update: {},
      create: { month: r.month, revenue: r.revenue },
    });
    created.push(upserted);
  }
  return created;
}

export async function GET() {
  try {
    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
