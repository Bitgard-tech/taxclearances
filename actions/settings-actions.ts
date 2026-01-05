'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const dealerProfileSchema = z.object({
    companyName: z.string().min(1, "Company Name is required"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
});

export async function getDealerProfile() {
    try {
        let profile = await db.dealerProfile.findFirst();

        if (!profile) {
            // Create default profile if none exists
            profile = await db.dealerProfile.create({
                data: {
                    companyName: "Bitgard",
                }
            });
        }

        return { success: true, data: profile };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Failed to fetch dealer profile:", error);
        return { success: false, message: `Failed to load settings: ${error.message || "Unknown error"}` };
    }
}

export async function updateDealerProfile(data: z.infer<typeof dealerProfileSchema>) {
    const result = dealerProfileSchema.safeParse(data);

    if (!result.success) {
        return { success: false, message: "Invalid data: " + result.error.issues[0].message };
    }

    try {
        const existing = await db.dealerProfile.findFirst();

        if (existing) {
            await db.dealerProfile.update({
                where: { id: existing.id },
                data: result.data
            });
        } else {
            await db.dealerProfile.create({
                data: result.data
            });
        }

        revalidatePath('/settings');
        revalidatePath('/reports');
        revalidatePath('/', 'layout');
        revalidatePath('/', 'layout');
        return { success: true, message: "Settings updated successfully." };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Update settings error:", error);
        return { success: false, message: `Failed to update settings: ${error.message || "Unknown error"}` };
    }
}
