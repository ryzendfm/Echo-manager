import InvoiceList from "@/components/invoices/InvoiceList";

export default function AdminInvoices() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
                <p className="text-muted-foreground">
                    Manage invoices and financial records.
                </p>
            </div>
            <InvoiceList />
        </div>
    );
}
