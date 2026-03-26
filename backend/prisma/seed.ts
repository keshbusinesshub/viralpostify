import { PrismaClient, Role, Plan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash('admin123456', 12);

  await prisma.user.upsert({
    where: { email: 'admin@viralpostify.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@viralpostify.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      plan: Plan.AGENCY,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
