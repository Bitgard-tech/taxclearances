'use server';

import db from '@/lib/db';
import { revalidatePath, unstable_cache } from 'next/cache';
import { z } from 'zod';

const createVehicleSchema = z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
    regNumber: z.string().min(1, "Registration number is required"),
    vin: z.string().nullable().optional().transform(val => val || null),
    purchasePrice: z.coerce.number().positive("Price must be positive"),
    purchaseDate: z.coerce.date(),
    profitMargin: z.coerce.number().min(0).max(100).optional().default(15),
    images: z.array(z.string()).default([]),
});

const updateVehicleSchema = createVehicleSchema.partial().extend({
    id: z.string().uuid(),
});

const markSoldSchema = z.object({
    vehicleId: z.string().uuid(),
    soldPrice: z.coerce.number().positive(),
    soldDate: z.coerce.date(),
});

export async function createVehicle(data: z.input<typeof createVehicleSchema>) {
    const result = createVehicleSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: result.error.issues[0].message };
    }

    try {
        const { regNumber } = result.data;
        const existing = await db.vehicle.findUnique({ where: { regNumber } });
        if (existing) {
            return { success: false, message: "Registration number already exists." };
        }

        await db.vehicle.create({
            data: {
                ...result.data,
                status: 'AVAILABLE',
            },
        });

        revalidatePath('/inventory');
        revalidatePath('/');

        return { success: true, message: "Vehicle created successfully." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Create vehicle error:", error);
        if (error.code === 'P2002') {
            return { success: false, message: "Registration number already exists." };
        }
        return { success: false, message: `Failed to create vehicle: ${error.message || "Unknown error"}` };
    }
}

export async function updateVehicle(data: z.input<typeof updateVehicleSchema>) {
    const result = updateVehicleSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: result.error.issues[0].message };
    }

    try {
        const { id, ...updates } = result.data;

        // Check reg number uniqueness if it's being updated
        if (updates.regNumber) {
            const existing = await db.vehicle.findUnique({
                where: { regNumber: updates.regNumber }
            });
            if (existing && existing.id !== id) {
                return { success: false, message: "Registration number already exists." };
            }
        }

        await db.vehicle.update({
            where: { id },
            data: updates,
        });

        revalidatePath('/inventory');
        revalidatePath(`/cars/${id}`);
        return { success: true, message: "Vehicle updated successfully." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Update vehicle error:", error);
        if (error.code === 'P2002') {
            return { success: false, message: "Registration number already exists." };
        }
        return { success: false, message: "Failed to update vehicle." };
    }
}

export async function deleteVehicle(id: string) {
    try {
        await db.vehicle.delete({
            where: { id },
        });

        revalidatePath('/inventory');
        revalidatePath('/');

        return { success: true, message: "Vehicle deleted successfully." };
    } catch (error) {
        console.error("Delete vehicle error:", error);
        return { success: false, message: "Failed to delete vehicle." };
    }
}

export async function markAsSold(data: z.infer<typeof markSoldSchema>) {
    const result = markSoldSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: "Invalid data." };
    }

    try {
        await db.vehicle.update({
            where: { id: result.data.vehicleId },
            data: {
                status: 'SOLD',
                soldPrice: result.data.soldPrice,
                soldDate: result.data.soldDate,
            },
        });

        revalidatePath(`/cars/${result.data.vehicleId}`);
        revalidatePath('/inventory');
        revalidatePath('/');

        return { success: true, message: "Vehicle marked as sold." };
    } catch (error) {
        console.error("Mark sold error:", error);
        return { success: false, message: "Failed to update vehicle status." };
    }
}



const getCachedVehicles = unstable_cache(
    async () => {
        const vehicles = await db.vehicle.findMany({
            orderBy: { createdAt: 'desc' },
            include: { expenses: true }
        });
        return vehicles;
    },
    ['vehicles-list'],
    { revalidate: 30, tags: ['vehicles'] }
);

export async function getVehicles() {
    try {
        const rawVehicles = await getCachedVehicles();
        const vehicles = rawVehicles.map(vehicle => ({
            ...vehicle,
            purchasePrice: Number(vehicle.purchasePrice),
            soldPrice: vehicle.soldPrice ? Number(vehicle.soldPrice) : null,
            profitMargin: Number(vehicle.profitMargin),
            expenses: vehicle.expenses.map(expense => ({
                ...expense,
                amount: Number(expense.amount)
            }))
        }));
        return { success: true, data: vehicles };
    } catch (error) {
        console.error("Get vehicles error:", error);
        return { success: false, message: "Failed to fetch vehicles." };
    }
}

export async function getVehicleById(id: string) {
    try {
        const vehicle = await db.vehicle.findUnique({
            where: { id },
            include: { expenses: true },
        });

        if (!vehicle) return { success: false, message: "Vehicle not found." };

        const serializedVehicle = {
            ...vehicle,
            purchasePrice: Number(vehicle.purchasePrice),
            soldPrice: vehicle.soldPrice ? Number(vehicle.soldPrice) : null,
            profitMargin: Number(vehicle.profitMargin),
            expenses: vehicle.expenses.map(expense => ({
                ...expense,
                amount: Number(expense.amount)
            }))
        };

        return { success: true, data: serializedVehicle };
    } catch {
        return { success: false, message: "Failed to fetch vehicle." };
    }
}
