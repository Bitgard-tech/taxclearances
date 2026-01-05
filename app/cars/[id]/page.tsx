/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, Receipt, Calculator, CheckCircle, Wrench, CalendarDays } from "lucide-react";
import { getVehicleById } from "@/actions/vehicle-actions";
import { formatCurrency } from "@/utils/format";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { SellCarDialog } from "@/components/sell-car-dialog";
import { DownloadCertificateButton } from "@/components/download-certificate-button";
import { EditExpenseDialog } from "@/components/edit-expense-dialog";
import { DeleteExpenseDialog } from "@/components/delete-expense-dialog";
import { EditMarginDialog } from "@/components/edit-margin-dialog";

export const dynamic = 'force-dynamic';

export default async function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Single fetch since profit margin is now on vehicle
    const vehicleResult = await getVehicleById(id);

    if (!vehicleResult.success || !vehicleResult.data) {
        notFound();
    }

    const vehicle = vehicleResult.data;
    const companyName = "Bitgard"; // Fallback or fetch from settings if needed elsewhere

    const totalExpenses = vehicle.expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const breakEvenCost = Number(vehicle.purchasePrice) + totalExpenses;

    const profit = vehicle.status === 'SOLD' && vehicle.soldPrice
        ? Number(vehicle.soldPrice) - breakEvenCost
        : null;

    const publicExpenses = vehicle.expenses
        .filter((e: any) => e.isPublic)
        .map((e: any) => ({
            description: e.description,
            date: new Date(e.date).toLocaleDateString(),
        }));

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Mobile Optimized */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="icon" className="shrink-0 -ml-2">
                        <Link href="/inventory">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
                                {vehicle.make} {vehicle.model}
                            </h1>
                            <Badge variant={vehicle.status === 'AVAILABLE' ? 'default' : 'secondary'} className="shrink-0">
                                {vehicle.status === 'AVAILABLE' ? 'Available' : 'Sold'}
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {vehicle.regNumber} • {vehicle.year}
                        </p>
                    </div>
                </div>

                {/* Action Buttons - Full width on mobile */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {vehicle.status === 'AVAILABLE' && (
                        <SellCarDialog vehicleId={vehicle.id} />
                    )}
                    <DownloadCertificateButton
                        vehicle={{
                            make: vehicle.make,
                            model: vehicle.model,
                            year: vehicle.year,
                            regNumber: vehicle.regNumber,
                            vin: vehicle.vin,
                            expenses: publicExpenses,
                        }}
                        companyName={companyName}
                    />
                </div>
            </div>

            {/* Financial Summary Cards - 2x2 on mobile */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Purchase</CardTitle>
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 sm:pb-4">
                        <div className="text-lg sm:text-2xl font-bold">{formatCurrency(Number(vehicle.purchasePrice))}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {new Date(vehicle.purchaseDate).toLocaleDateString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Expenses</CardTitle>
                        <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 sm:pb-4">
                        <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{vehicle.expenses.length} item(s)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Cost</CardTitle>
                        <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-3 sm:pb-4">
                        <div className="text-lg sm:text-2xl font-bold">{formatCurrency(breakEvenCost)}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Break-even</p>
                    </CardContent>
                </Card>

                {vehicle.status === 'SOLD' ? (
                    <Card className={profit && profit >= 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-500/50 bg-red-500/5'}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Profit</CardTitle>
                            <CheckCircle className={`h-3 w-3 sm:h-4 sm:w-4 ${profit && profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                        </CardHeader>
                        <CardContent className="pb-3 sm:pb-4">
                            <div className={`text-lg sm:text-2xl font-bold ${profit && profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(profit || 0)}
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                                Sold: {formatCurrency(Number(vehicle.soldPrice))}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-dashed">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Target</CardTitle>
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3 sm:pb-4">
                            <div className="text-lg sm:text-2xl font-bold text-muted-foreground">
                                {formatCurrency(breakEvenCost * (1 + ((vehicle.profitMargin || 15) / 100)))}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{vehicle.profitMargin || 15}% margin</p>
                                <EditMarginDialog vehicleId={vehicle.id} currentMargin={vehicle.profitMargin || 15} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Expenses Section */}
            <Tabs defaultValue="history" className="space-y-3 sm:space-y-4">
                {/* Desktop: side by side | Mobile: stacked */}
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex h-auto">
                        <TabsTrigger value="history" className="text-xs sm:text-sm py-2">History</TabsTrigger>
                        <TabsTrigger value="summary" className="text-xs sm:text-sm py-2">Summary</TabsTrigger>
                    </TabsList>
                    <div className="w-full sm:w-auto overflow-x-auto pb-1">
                        <AddExpenseDialog vehicleId={vehicle.id} />
                    </div>
                </div>

                <TabsContent value="history">
                    <Card>
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg">All Expenses</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Complete expense history</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            {vehicle.expenses.length === 0 ? (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    <Receipt className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No expenses recorded yet.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Add repairs, fees, or other costs above.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 sm:space-y-3">
                                    {vehicle.expenses.map((expense: any) => (
                                        <div key={expense.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                                                    <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{expense.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {new Date(expense.date).toLocaleDateString()}
                                                        {expense.isPublic && (
                                                            <Badge variant="outline" className="text-[10px] py-0">Public</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <p className="font-bold text-sm">{formatCurrency(expense.amount)}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {expense.category.replace('_', ' ')}
                                                    </Badge>
                                                    <div className="flex items-center">
                                                        <EditExpenseDialog expense={{
                                                            ...expense,
                                                            amount: Number(expense.amount)
                                                        }} />
                                                        <DeleteExpenseDialog
                                                            expenseId={expense.id}
                                                            vehicleId={vehicle.id}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary">
                    <Card>
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg">By Category</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Expense breakdown</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-6 pt-0">
                            {vehicle.expenses.length === 0 ? (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    <Calculator className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No expenses to summarize.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {['REPAIR', 'BROKER_FEE', 'TRAVEL', 'DOCUMENTATION', 'OTHER'].map((category) => {
                                        const categoryExpenses = vehicle.expenses.filter((e: any) => e.category === category);
                                        const categoryTotal = categoryExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
                                        if (categoryTotal === 0) return null;

                                        const percentage = Math.round((categoryTotal / totalExpenses) * 100);

                                        return (
                                            <div key={category} className="p-3 rounded-lg border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-sm">{category.replace('_', ' ')}</p>
                                                        <p className="text-xs text-muted-foreground">{categoryExpenses.length} item(s)</p>
                                                    </div>
                                                    <p className="font-bold text-sm">{formatCurrency(categoryTotal)}</p>
                                                </div>
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">{percentage}% of total</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
