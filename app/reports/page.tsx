"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, FileText, Loader2 } from "lucide-react";
import { getMonthlyTaxReport, getAnnualTaxReport, ReportItem, AnnualReportData } from "@/actions/report-actions";
import { getDealerProfile } from "@/actions/settings-actions";
import { formatCurrency } from "@/utils/format";

const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function ReportsPage() {
    const [reportType, setReportType] = useState<"annual" | "monthly">("annual");
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState(currentYear.toString());

    // Data states
    const [monthlyItems, setMonthlyItems] = useState<ReportItem[]>([]);
    const [annualData, setAnnualData] = useState<AnnualReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [dealerProfile, setDealerProfile] = useState<{
        companyName: string;
        address: string;
        phone: string;
        email: string;
    } | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            const result = await getDealerProfile();
            if (result.success && result.data) {
                setDealerProfile(result.data);
            }
        }
        fetchProfile();
    }, []);

    useEffect(() => {
        async function fetchReport() {
            setLoading(true);
            if (reportType === 'monthly') {
                const result = await getMonthlyTaxReport(parseInt(month), parseInt(year));
                if (result.success && result.data) {
                    setMonthlyItems(result.data);
                }
            } else {
                const result = await getAnnualTaxReport(parseInt(year));
                if (result.success && result.data) {
                    setAnnualData(result.data);
                }
            }
            setLoading(false);
        }
        fetchReport();
    }, [reportType, month, year]);

    // Derived totals based on active report type
    const activeItems = reportType === 'monthly' ? monthlyItems : (annualData?.items || []);

    const totalProfit = activeItems.reduce((sum, item) => sum + item.profit, 0);
    const totalRevenue = activeItems.reduce((sum, item) => sum + item.soldPrice, 0);
    const totalCost = activeItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalPurchase = activeItems.reduce((sum, item) => sum + item.purchasePrice, 0);

    // Expense breakdowns
    const totalRepairs = activeItems.reduce((sum, item) => sum + (item.expenses.REPAIR || 0), 0);
    const totalBrokerTravel = activeItems.reduce((sum, item) => sum + (item.expenses.BROKER_FEE || 0) + (item.expenses.TRAVEL || 0), 0);
    const totalDocs = activeItems.reduce((sum, item) => sum + (item.expenses.DOCUMENTATION || 0), 0);

    function handlePrint() {
        window.print();
    }

    const selectedMonthLabel = months.find(m => m.value === month)?.label;
    const reportDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <>
            {/* Screen View */}
            <div className="space-y-6 print:hidden">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tax Reports</h1>
                        <p className="text-sm text-muted-foreground">Generate official tax documents</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                        <div className="flex items-center self-start sm:self-auto bg-muted/50 p-1 rounded-lg">
                            <Button
                                variant={reportType === 'annual' ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setReportType('annual')}
                                className="px-6"
                            >
                                Annual
                            </Button>
                            <Button
                                variant={reportType === 'monthly' ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setReportType('monthly')}
                                className="px-6"
                            >
                                Monthly
                            </Button>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            {reportType === 'monthly' && (
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="w-full sm:w-[120px]">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-full sm:w-[100px]">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handlePrint} className="gap-2 shrink-0">
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">Print</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">{activeItems.length} vehicles sold</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Total Costs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalCost)}</div>
                            <p className="text-xs text-muted-foreground">Purchase + Expenses</p>
                        </CardContent>
                    </Card>
                    <Card className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium">Net Profit/Loss</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-xl sm:text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(totalProfit)}
                            </div>
                            <p className="text-xs text-muted-foreground">Taxable income</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {reportType === 'annual' ? `Annual Report ${year}` : `${selectedMonthLabel} ${year} Report`}
                        </CardTitle>
                        <CardDescription>
                            {loading ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Generating report...</span> : "Detailed financial statement"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!loading && activeItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-1">No records found</h3>
                                <p>No sales recorded for this period.</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="overview" className="w-full">
                                {reportType === 'annual' && (
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="overview">Monthly Overview</TabsTrigger>
                                        <TabsTrigger value="details">Vehicle Details</TabsTrigger>
                                    </TabsList>
                                )}

                                <TabsContent value="overview" className="mt-0">
                                    {reportType === 'annual' && annualData ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Month</TableHead>
                                                    <TableHead className="text-right">Sales</TableHead>
                                                    <TableHead className="text-right">Revenue</TableHead>
                                                    <TableHead className="text-right">Costs</TableHead>
                                                    <TableHead className="text-right">Net Profit</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {annualData.monthlyBreakdown.map((m) => (
                                                    <TableRow key={m.month}>
                                                        <TableCell className="font-medium">{m.monthName}</TableCell>
                                                        <TableCell className="text-right">{m.vehiclesSold}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(m.revenue)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(m.costs)}</TableCell>
                                                        <TableCell className={`text-right font-bold ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {formatCurrency(m.profit)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="font-bold bg-muted/50">
                                                    <TableCell>TOTAL</TableCell>
                                                    <TableCell className="text-right">{activeItems.length}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
                                                    <TableCell className={`text-right ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {formatCurrency(totalProfit)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        // Monthly view essentially just shows details, so we can reuse the table logic
                                        <div className="text-sm text-muted-foreground">Switch to Vehicle Details to view transactions.</div>
                                    )}
                                </TabsContent>

                                <TabsContent value="details" className={reportType === 'monthly' ? "block" : "mt-0"}>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Vehicle</TableHead>
                                                <TableHead className="text-right hidden md:table-cell">Purchase</TableHead>
                                                <TableHead className="text-right hidden md:table-cell">Expenses</TableHead>
                                                <TableHead className="text-right">Total Cost</TableHead>
                                                <TableHead className="text-right">Sold</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{item.model}</div>
                                                        <div className="text-xs text-muted-foreground">{item.regNumber}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right hidden md:table-cell">{formatCurrency(item.purchasePrice)}</TableCell>
                                                    <TableCell className="text-right hidden md:table-cell">{formatCurrency(item.totalCost - item.purchasePrice)}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatCurrency(item.totalCost)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.soldPrice)}</TableCell>
                                                    <TableCell className={`text-right font-bold ${item.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {formatCurrency(item.profit)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* PRINT VIEW - Professional Annual/Monthly Report */}
            <div className="hidden print:block print:text-black print:bg-white" style={{ fontFamily: 'Times New Roman, serif' }}>
                <style jsx>{`
                    @media print {
                        @page {
                            size: A4;
                            margin: 20mm 15mm;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                `}</style>

                {/* Letterhead */}
                <div style={{ borderBottom: '3px double #000', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
                            {dealerProfile?.companyName || "Bitgard"}
                        </h1>
                        <p style={{ fontSize: '12px', margin: '5px 0 0 0', color: '#444' }}>Used Vehicle Dealership</p>
                        <p style={{ fontSize: '10px', margin: '3px 0 0 0', color: '#666' }}>
                            {dealerProfile?.address || "123 Dealer Street, Colombo"} | Tel: {dealerProfile?.phone || "+94 11 234 5678"} | Email: {dealerProfile?.email || "info@autotrustpro.lk"}
                        </p>
                    </div>
                </div>

                {/* Report Title */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px', border: '2px solid #000', display: 'inline-block', padding: '8px 30px', margin: 0 }}>
                        {reportType === 'annual' ? 'ANNUAL TAX REPORT' : 'MONTHLY TAX REPORT'}
                    </h2>
                    <p style={{ fontSize: '13px', marginTop: '12px', fontWeight: 500 }}>
                        {reportType === 'annual' ? `For the Year Ended 31st December ${year}` : `For the Period: ${selectedMonthLabel} ${year}`}
                    </p>
                    <p style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                        Report Generated: {reportDate}
                    </p>
                </div>

                {/* Financial Summary */}
                <div style={{ marginBottom: '25px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
                        Financial Summary {reportType === 'annual' ? `(Jan - Dec ${year})` : ''}
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '8px', width: '60%' }}>Total Revenue from Operations</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalRevenue)}</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '8px' }}>Less: Cost of Sales (Vehicle Purchases)</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>({formatCurrency(totalPurchase)})</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #000', padding: '8px' }}>Less: Direct Expenses (Repairs, Brokerage, etc.)</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>({formatCurrency(totalCost - totalPurchase)})</td>
                            </tr>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <td style={{ border: '2px solid #000', padding: '10px', fontWeight: 'bold' }}>NET PROFIT / (LOSS) BEFORE TAX</td>
                                <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>
                                    {totalProfit < 0 ? `(${formatCurrency(Math.abs(totalProfit))})` : formatCurrency(totalProfit)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Annual Specific: Monthly Breakdown Table */}
                {reportType === 'annual' && annualData && (
                    <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
                            Monthly Breakdown
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#e0e0e0' }}>
                                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left' }}>Month</th>
                                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>Units</th>
                                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Revenue</th>
                                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Costs</th>
                                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'right' }}>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {annualData.monthlyBreakdown.map((m) => (
                                    <tr key={m.month}>
                                        <td style={{ border: '1px solid #000', padding: '4px' }}>{m.monthName}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{m.vehiclesSold > 0 ? m.vehiclesSold : '-'}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{m.revenue > 0 ? Number(m.revenue).toLocaleString() : '-'}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{m.costs > 0 ? Number(m.costs).toLocaleString() : '-'}</td>
                                        <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: m.profit !== 0 ? 'bold' : 'normal' }}>
                                            {m.profit !== 0 ? (m.profit < 0 ? `(${Math.abs(m.profit).toLocaleString()})` : m.profit.toLocaleString()) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Transaction details (Shown for both, just simpler list for Annual to save space) */}
                <div style={{ marginBottom: '25px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
                        Detailed Transaction Schedule
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#e0e0e0' }}>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>#</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Date</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Vehicle</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'left' }}>Reg No.</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Purchase</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Expenses</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Total Cost</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Sold Price</th>
                                <th style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeItems.map((item, index) => (
                                <tr key={item.id}>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>{index + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{item.model}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px' }}>{item.regNumber}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{Number(item.purchasePrice).toLocaleString()}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{(item.totalCost - item.purchasePrice).toLocaleString()}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{Number(item.totalCost).toLocaleString()}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{Number(item.soldPrice).toLocaleString()}</td>
                                    <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>
                                        {item.profit < 0 ? `(${Math.abs(item.profit).toLocaleString()})` : item.profit.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            <tr style={{ backgroundColor: '#e0e0e0', fontWeight: 'bold' }}>
                                <td colSpan={4} style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>TOTAL</td>
                                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{totalPurchase.toLocaleString()}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{(totalCost - totalPurchase).toLocaleString()}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{totalCost.toLocaleString()}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>{totalRevenue.toLocaleString()}</td>
                                <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'right' }}>
                                    {totalProfit < 0 ? `(${Math.abs(totalProfit).toLocaleString()})` : totalProfit.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Declaration & Signatures */}
                <div style={{ pageBreakInside: 'avoid' }}>
                    <div style={{ marginBottom: '30px', padding: '10px', border: '1px solid #000', fontSize: '10px' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>DECLARATION:</p>
                        <p style={{ lineHeight: '1.4', textAlign: 'justify' }}>
                            I hereby declare that the particulars given in this report are true, complete, and accurate to the best of my knowledge and belief.
                            This {reportType === 'annual' ? 'annual' : 'monthly'} statement has been prepared in accordance with applicable accounting standards.
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '10px' }}>
                        <div style={{ width: '40%', textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', margin: '0 20px' }}>
                                <p style={{ fontWeight: 'bold', margin: 0 }}>Prepared By</p>
                            </div>
                            <p style={{ marginTop: '15px' }}>Date: ________________</p>
                        </div>
                        <div style={{ width: '40%', textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', margin: '0 20px' }}>
                                <p style={{ fontWeight: 'bold', margin: 0 }}>Authorized Signatory</p>
                            </div>
                            <p style={{ marginTop: '15px' }}>Date: ________________</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '30px', paddingTop: '10px', borderTop: '1px solid #ccc', textAlign: 'center', fontSize: '9px', color: '#666' }}>
                    <p>Bitgard Vehicle Management System - Generated on {reportDate}</p>
                </div>
            </div>
        </>
    );
}
