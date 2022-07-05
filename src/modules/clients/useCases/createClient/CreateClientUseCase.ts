import { prisma } from '../../../../database/prismaClient';
import { hash } from 'bcrypt';

interface ICreateClient {
  username: string;
  password: string;
}

export class CreateClientUseCase {
  async execute({ username, password }: ICreateClient) {
    // validated user already exists
    // const clientExists = await prisma.clients.findFirst({
    //   where: {
    //     username,
    //   },
    // });
    // if (clientExists) {
    //   throw new Error('Client already exists');
    //   // return new Error('Client already exists');
    // }
    // // hash password
    // const hashPassword = await hash(password, 10);
    // // create client
    // const client = await prisma.clients.create({
    //   data: {
    //     username,
    //     password: hashPassword,
    //   },
    // });
    // return client;
  }
}
