import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { validateEnv } from '@/app/lib/env';
import { credentialsSchema } from '@/app/lib/schemas/auth';

// Validate environment variables at startup
validateEnv();
 
const prisma = new PrismaClient();

export { credentialsSchema };

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await prisma.users.findUnique({ where: { email } });
    // Convert Prisma user to local `User` type if necessary
    return user as unknown as User | undefined;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password)

          if(passwordsMatch) return user
        }
        
        console.log('Invalid credentials')
        return null;
      },
    }),
  ],
});