import { prisma } from '../../../database/prismaClient';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';

const secret = '664400310e59e8b6ee77a45293c4972e';

interface IAuthenticateUser {
  username: string;
  password: string;
}

export class AuthenticateUserUseCase {
  async execute({ username, password }: IAuthenticateUser) {
    // validate user in database
    const client = await prisma.clients.findFirst({
      where: {
        username,
      },
    });
    if (!client) {
      throw new Error('Username or password invalid!');
    }
    // validate password from user
    const passwordMatch = await compare(password, client.password);
    if (!passwordMatch) {
      throw new Error('Username or password invalid!');
    }
    // create token

    const payload = {
      username,
      clientId: client.id,
    };

    const token = sign(payload, secret, {
      subject: client.id,
      expiresIn: '1d',
    });

    return token;
  }
}
