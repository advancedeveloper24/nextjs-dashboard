"use server";

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Form from "../ui/invoices/create-form";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
//1. Extract the data from - formData
//2. Validate the types with Zod
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});
////////////////////////////////////// Create New Invoice //////////////////////////////////////////////////////
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  await sql`
  INSERT INTO invoices ( customer_id, amount, status, date )
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  revalidatePath("/dashbaord/invoices");
  redirect("/dashboard/invoices");
}
//////////////////////////////////////////Update Invoice//////////////////////////////////////////////////
//1. Extract the data from - formData
//2. Validate the types with Zod
//3. Convert the amount to cents
//4. Pass the variables to SQL query
//5. Call - revalidatePath - to clear the client cache and make a new server request
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  // Extract the data from - formData
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;

  await sql`
  UPDATE invoices
  SET customer_id =j ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
