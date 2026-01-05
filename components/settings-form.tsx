"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Save, Loader2 } from "lucide-react";
import { updateDealerProfile } from "@/actions/settings-actions";
import { toast } from "sonner";

type SettingsFormProps = {
    profile: {
        id: string;
        companyName: string;
        address: string;
        phone: string;
        email: string;
    } | null;
};

type FormData = {
    companyName: string;
    address: string;
    phone: string;
    email: string;
};

export function SettingsForm({ profile }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<FormData | null>(null);

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const data = {
            companyName: formData.get("companyName") as string,
            address: formData.get("address") as string,
            phone: formData.get("phone") as string,
            email: formData.get("email") as string,
        };

        setPendingData(data);
        setConfirmOpen(true);
    }

    async function handleConfirm() {
        if (!pendingData) return;

        setLoading(true);
        setConfirmOpen(false);

        const result = await updateDealerProfile(pendingData);

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }

        setLoading(false);
        setPendingData(null);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Dealer Profile
                </CardTitle>
                <CardDescription>
                    These details will appear on your official tax reports and invoices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                            id="companyName"
                            name="companyName"
                            defaultValue={profile?.companyName || "Bitgard"}
                            placeholder="Your Dealership Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            name="address"
                            defaultValue={profile?.address || ""}
                            placeholder="123 Dealer Street, Colombo"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                defaultValue={profile?.phone || ""}
                                placeholder="+94 77 123 4567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={profile?.email || ""}
                                placeholder="info@example.com"
                            />
                        </div>
                    </div>



                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </form>

                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Update Dealer Profile?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to update the dealership details? This will immediately affect all new generated reports.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirm}>Confirm Save</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
