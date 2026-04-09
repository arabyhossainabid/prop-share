import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  const sessions = await prisma.session.findMany();
  console.log("Users:", users.length, users.map(u => u.email));
  console.log("Sessions:", sessions.length);
}
run().catch(console.dir).finally(() => prisma.$disconnect());
