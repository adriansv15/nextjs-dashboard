import { z } from 'zod';

export const CustomerFormSchema = z.object({
  id: z.string(),
  name: z.string({
    invalid_type_error: 'Please enter a name'
  }),
  email: z.string().email({
    message: "This is not a valid email address",
  }),
  imageURL: z.string().url({
    message: "This is not a valid URL"
  }),
});

export const CreateCustomer = CustomerFormSchema.omit({ id: true, imageURL: true });
export const UpdateCustomer = CustomerFormSchema.omit({id: true, imageURL:true});

export type CustomerFormSchemaType = z.infer<typeof CustomerFormSchema>;
export type CreateCustomerType = z.infer<typeof CreateCustomer>;
export type UpdateCustomerType = z.infer<typeof UpdateCustomer>;
