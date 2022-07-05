import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.catCoderrors.create({
    data: {
      cod: 'teste1',
      Descricao: 'Descricao de teste 1',
      date_active: null,
      date_inactive: null,
    },
  });
  await console.log(result);
}

main();
