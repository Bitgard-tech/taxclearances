
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Wrench, CalendarDays, Car } from "lucide-react";
import db from "@/lib/db";
import { formatCurrency } from "@/utils/format";

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [vehicle, dealerProfile] = await Promise.all([
        db.vehicle.findUnique({
            where: { id },
            include: {
                expenses: {
                    where: { isPublic: true },
                    orderBy: { date: 'desc' },
                },
            },
        }),
        db.dealerProfile.findFirst()
    ]);

    if (!vehicle) {
        notFound();
    }

    const companyName = dealerProfile?.companyName || "Bitgard";

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
            <div className="container max-w-2xl mx-auto py-12 px-4">
                {/* Verification Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Verified by {companyName}</h1>
                    <p className="text-muted-foreground">This vehicle record has been verified and authenticated.</p>
                </div>

                {/* Verification Badge */}
                <Card className="mb-6 border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardContent className="flex items-center gap-4 pt-6">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                        <div>
                            <p className="font-semibold text-lg text-emerald-700 dark:text-emerald-400">Authentic Record</p>
                            <p className="text-sm text-muted-foreground">
                                All information displayed is verified and maintained by {companyName}.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Vehicle Details */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="h-5 w-5" />
                            Vehicle Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Make</p>
                                <p className="font-medium">{vehicle.make}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Model</p>
                                <p className="font-medium">{vehicle.model}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Year</p>
                                <p className="font-medium">{vehicle.year}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Registration</p>
                                <p className="font-medium font-mono">{vehicle.regNumber}</p>
                            </div>
                            {vehicle.vin && (
                                <div className="col-span-2">
                                    <p className="text-sm text-muted-foreground">VIN</p>
                                    <p className="font-medium font-mono">{vehicle.vin}</p>
                                </div>
                            )}
                        </div>
                        <div className="pt-2">
                            <Badge variant={vehicle.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                                {vehicle.status === 'AVAILABLE' ? 'Available for Sale' : 'Sold'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Verified Repairs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Verified Maintenance & Repairs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {vehicle.expenses.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No public maintenance records available.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {vehicle.expenses.map((expense) => (
                                    <div key={expense.id} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <Wrench className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{expense.description}</p>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(Number(expense.amount))}</p>
                                            <Badge variant="outline" className="text-xs mt-1">
                                                {expense.category.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-muted-foreground">
                    <p>This certificate was generated by {companyName}</p>
                    <p>Verification Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
