'use server';

import db from '@/lib/db';
import { ExpenseCategory } from '@prisma/client';

export interface ReportItem {
    id: string;
    date: Date | null;
    regNumber: string;
    model: string;
    purchasePrice: number;
    soldPrice: number;
    expenses: Partial<Record<ExpenseCategory, number>>;
    totalExpenses: number;
    totalCost: number;
    profit: number;
    month?: number;
}

export interface AnnualReportData {
    items: ReportItem[];
    monthlyBreakdown: {
        month: number;
        monthName: string;
        vehiclesSold: number;
        revenue: number;
        costs: number;
        profit: number;
    }[];
}

const toCurrency = (amount: number) => Number(amount.toFixed(2));

export async function getAnnualTaxReport(year: number) {
    const startDate = new Date(Date.UTC(year, 0, 1)); // Jan 1 UTC
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59)); // Dec 31 UTC

    try {
        const vehicles = await db.vehicle.findMany({
            where: {
                status: 'SOLD',
                soldDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                expenses: true,
            },
            orderBy: {
                soldDate: 'asc',
            },
        });

        const items: ReportItem[] = vehicles.map(vehicle => {
            const expensesByCategory: Partial<Record<ExpenseCategory, number>> = {};
            let totalExpenses = 0;

            vehicle.expenses.forEach(expense => {
                const amount = Number(expense.amount);
                expensesByCategory[expense.category] = toCurrency((expensesByCategory[expense.category] || 0) + amount);
                totalExpenses += amount;
            });
            totalExpenses = toCurrency(totalExpenses);

            const purchasePrice = Number(vehicle.purchasePrice);
            const soldPrice = Number(vehicle.soldPrice || 0);
            const totalCost = toCurrency(purchasePrice + totalExpenses);
            const profit = toCurrency(soldPrice - totalCost);
            const month = vehicle.soldDate ? vehicle.soldDate.getMonth() + 1 : 0;

            return {
                id: vehicle.id,
                date: vehicle.soldDate,
                regNumber: vehicle.regNumber,
                model: `${vehicle.make} ${vehicle.model}`,
                purchasePrice,
                soldPrice,
                expenses: expensesByCategory,
                totalExpenses,
                totalCost,
                profit,
                month,
            };
        });

        // Calculate monthly breakdown
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const monthlyBreakdown = monthNames.map((monthName, index) => {
            const monthItems = items.filter(item => item.month === index + 1);
            return {
                month: index + 1,
                monthName,
                vehiclesSold: monthItems.length,
                revenue: toCurrency(monthItems.reduce((sum, item) => sum + item.soldPrice, 0)),
                costs: toCurrency(monthItems.reduce((sum, item) => sum + item.totalCost, 0)),
                profit: toCurrency(monthItems.reduce((sum, item) => sum + item.profit, 0)),
            };
        });

        return { success: true, data: { items, monthlyBreakdown } };
    } catch (error) {
        console.error("Report error:", error);
        return { success: false, message: "Failed to generate report." };
    }
}

// Keep monthly for backward compatibility
export async function getMonthlyTaxReport(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month, 1);
    const endDate = new Date(nextMonth.getTime() - 1);

    try {
        const vehicles = await db.vehicle.findMany({
            where: {
                status: 'SOLD',
                soldDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                expenses: true,
            },
            orderBy: {
                soldDate: 'asc',
            },
        });

        const report: ReportItem[] = vehicles.map(vehicle => {
            const expensesByCategory: Partial<Record<ExpenseCategory, number>> = {};
            let totalExpenses = 0;

            vehicle.expenses.forEach(expense => {
                const amount = Number(expense.amount);
                expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + amount;
                totalExpenses += amount;
            });

            const purchasePrice = Number(vehicle.purchasePrice);
            const soldPrice = Number(vehicle.soldPrice || 0);
            const totalCost = purchasePrice + totalExpenses;
            const profit = soldPrice - totalCost;

            return {
                id: vehicle.id,
                date: vehicle.soldDate,
                regNumber: vehicle.regNumber,
                model: `${vehicle.make} ${vehicle.model}`,
                purchasePrice,
                soldPrice,
                expenses: expensesByCategory,
                totalExpenses,
                totalCost,
                profit,
            };
        });

        return { success: true, data: report };
    } catch (error) {
        console.error("Report error:", error);
        return { success: false, message: "Failed to generate report." };
    }
}
