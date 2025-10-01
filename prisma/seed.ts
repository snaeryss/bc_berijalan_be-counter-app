import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const password = 'mudahkan_skripsi';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin1 = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'TIM001',
      email: 'team_it@gmail.com',
      name: 'TIM IT COUNTER-APP',
      password: hashedPassword,
      isActive: true,
    },
  });

  console.log({ admin1 });
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });