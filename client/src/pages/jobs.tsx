import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Job {
  id: number;
  createdAt: string;
  customerName: string;
  invoiceNumber: string;
  vehicleType: string;
  vehicleWeight: number;
  total: string;
}

const PAGE_SIZE = 15;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JobsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate + "T23:59:59") : null;

    return jobs.filter((job) => {
      if (q) {
        const matchesCustomer = job.customerName.toLowerCase().includes(q);
        const matchesInvoice = job.invoiceNumber.toLowerCase().includes(q);
        const matchesVehicle = job.vehicleType.toLowerCase().includes(q);
        if (!matchesCustomer && !matchesInvoice && !matchesVehicle) return false;
      }

      if (from || to) {
        const jobDate = new Date(job.createdAt);
        if (from && jobDate < from) return false;
        if (to && jobDate > to) return false;
      }

      return true;
    });
  }, [jobs, search, fromDate, toDate]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setPage(1);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" style={{ color: "#0077B6" }} />
            Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} job{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by customer, invoice #, or vehicle..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>

              {/* Date range */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={handleFromDateChange}
                  className="w-36"
                  aria-label="From date"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={handleToDateChange}
                  className="w-36"
                  aria-label="To date"
                />
                {(fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setPage(1);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs table / cards */}
        <Card className="card-elevated">
          {isLoading ? (
            <CardContent className="py-16 text-center text-muted-foreground text-sm">
              Loading jobs...
            </CardContent>
          ) : filtered.length === 0 ? (
            <CardContent className="py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-base font-medium text-foreground">
                No jobs found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || fromDate || toDate
                  ? "Try adjusting your search or date filters."
                  : "Create your first invoice to get started."}
              </p>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Weight (lbs)</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((job) => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setLocation(`/jobs/${job.id}`)}
                      >
                        <TableCell className="text-muted-foreground">
                          {formatDate(job.createdAt)}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          {job.customerName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.vehicleType}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.vehicleWeight.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <ChevronRight
                            className="h-4 w-4 text-muted-foreground ml-auto"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {paginated.map((job) => (
                  <button
                    key={job.id}
                    className="w-full text-left p-4 hover:bg-muted transition-colors flex items-center justify-between"
                    onClick={() => setLocation(`/jobs/${job.id}`)}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {job.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {job.invoiceNumber} · {job.vehicleType}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(job.createdAt)} ·{" "}
                        {job.vehicleWeight.toLocaleString()} lbs
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                  </button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 1
              )
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("...");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={safePage === item ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(item as number)}
                    className="min-w-[36px]"
                    style={
                      safePage === item
                        ? { backgroundColor: "#0077B6" }
                        : undefined
                    }
                  >
                    {item}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
