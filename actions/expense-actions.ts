'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';

const expenseSchema = z.object({
    vehicleId: z.string().uuid(),
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    date: z.coerce.date(),
    category: z.nativeEnum(ExpenseCategory),
    isPublic: z.boolean().optional(),
});

export async function addExpense(data: z.infer<typeof expenseSchema>) {
    const result = expenseSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: result.error.issues[0].message };
    }

    try {
        let isPublic = result.data.isPublic;

        // Default logic: REPAIR is public by default unless specified
        if (isPublic === undefined) {
            isPublic = result.data.category === 'REPAIR';
        }

        await db.expense.create({
            data: {
                vehicleId: result.data.vehicleId,
                description: result.data.description,
                amount: result.data.amount,
                date: result.data.date,
                category: result.data.category,
                isPublic: isPublic,
            },
        });

        revalidatePath(`/cars/${result.data.vehicleId}`);
        return { success: true, message: "Expense added successfully." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Add expense error:", error);
        return { success: false, message: `Failed to add expense: ${error.message || "Unknown error"}` };
    }
}

const updateExpenseSchema = expenseSchema.omit({ vehicleId: true }).extend({
    id: z.string().uuid(),
    vehicleId: z.string().uuid(), // Keep vehicleId for revalidation
});

export async function updateExpense(data: z.infer<typeof updateExpenseSchema>) {
    const result = updateExpenseSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: result.error.issues[0].message };
    }

    try {
        let isPublic = result.data.isPublic;
        if (isPublic === undefined) {
            // Retain existing logic or default based on category if needed, 
            // but here we trust the form data or existing value passed.
            // For simplicity in update, we might want to ensure isPublic is sent from the form.
            isPublic = result.data.category === 'REPAIR';
        }

        await db.expense.update({
            where: { id: result.data.id },
            data: {
                description: result.data.description,
                amount: result.data.amount,
                date: result.data.date,
                category: result.data.category,
                isPublic: isPublic,
            },
        });

        revalidatePath(`/cars/${result.data.vehicleId}`);
        return { success: true, message: "Expense updated successfully." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Update expense error:", error);
        return { success: false, message: `Failed to update expense: ${error.message || "Unknown error"}` };
    }
}

export async function deleteExpense(id: string, vehicleId: string) {
    try {
        await db.expense.delete({
            where: { id },
        });

        revalidatePath(`/cars/${vehicleId}`);
        return { success: true, message: "Expense deleted successfully." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Delete expense error:", error);
        return { success: false, message: `Failed to delete expense: ${error.message || "Unknown error"}` };
    }
}
