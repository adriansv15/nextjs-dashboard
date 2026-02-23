'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { signIn } from '@/auth'
import { AuthError } from 'next-auth';
import { FormSchema, CreateInvoice, UpdateInvoice } from '@/app/lib/schemas/invoice';
import { CustomerFormSchema, CreateCustomer, UpdateCustomer } from '@/app/lib/schemas/customer';

const prisma = new PrismaClient();

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
  })

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create invoice'
    }
  }

  const { customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0]
  
  try {
    await prisma.invoices.create({
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status,
        date: new Date(date),
      },
    });
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to create invoice.'
    };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices')
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create invoice'
    }
  }
  
  const { customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100;
 
  try {
    await prisma.invoices.update({
      where: { id },
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status,
      },
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice.'
    };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await prisma.invoices.delete({ where: { id } });
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function createCustomer(prevState: CustomerState, formData: FormData) {
  const validatedFields = CreateCustomer.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
  })

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create customer.'
    }
  }

  const { name, email } = validatedFields.data
  
  try {
    await prisma.customers.create({
      data: {
        name,
        email,
        image_url: '/customers/amy-burns.png'
      },
    });
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to create customer.'
    };
  }
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers')
}

export async function updateCustomer(id: string, prevState: CustomerState, formData: FormData) {
  const validatedFields = UpdateCustomer.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  })

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to update customer.'
    }
  }
  
  const { name, email } = validatedFields.data
 
  try {
    await prisma.customers.update({
      where: { id },
      data: {
        name,
        email,
      },
    });
  } catch (error) {
    return {
      message: 'Database Error: Failed to update customer.'
    };
  }
 
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  const deleteInvoices = prisma.invoices.deleteMany({ 
    where: { 
      customer_id: id,
    }
  })
  const deleteCustomerAccount =  prisma.customers.delete({ where: { id } });
  
  const transaction = await prisma.$transaction([deleteInvoices, deleteCustomerAccount])
  revalidatePath('/dashboard/customers');
}