import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuthQuery } from "@/hooks/use-auth-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

interface AnalyticsSummary {
  totalJobs: number;
  jobsThisMonth: number;
  monthRevenue: number;
  averageInvoice: number;
}

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface RecentJob {
  id: number;
  createdAt: string;
  customerName: string;
  invoiceNumber: string;
  vehicleType: string;
  vehicleWeight: number;
  total: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accentColor: string;
}

function KpiCard({ title, value, icon, accentColor }: KpiCardProps) {
  return (
    <Card className="card-elevated">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: accentColor + "20" }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: summary, isLoading: summaryLoading } =
    useAuthQuery<AnalyticsSummary>(["/api/analytics/summary"]);

  const { data: revenueData = [], isLoading: revenueLoading } =
    useAuthQuery<RevenueDataPoint[]>(["/api/analytics/revenue"]);

  const { data: recentJobs = [], isLoading: jobsLoading } =
    useAuthQuery<RecentJob[]>(["/api/jobs/recent?limit=5"]);

  const displayName = user?.displayName || user?.email || "there";

  const kpiCards: KpiCardProps[] = [
    {
      title: "Total Jobs",
      value: summaryLoading ? "—" : String(summary?.totalJobs ?? 0),
      icon: <FileText className="h-5 w-5" />,
      accentColor: "#0077B6",
    },
    {
      title: "Jobs This Month",
      value: summaryLoading ? "—" : String(summary?.jobsThisMonth ?? 0),
      icon: <TrendingUp className="h-5 w-5" />,
      accentColor: "#FF9F1C",
    },
    {
      title: "Revenue This Month",
      value: summaryLoading
        ? "—"
        : formatCurrency(summary?.monthRevenue ?? 0),
      icon: <DollarSign className="h-5 w-5" />,
      accentColor: "#0077B6",
    },
    {
      title: "Avg Invoice",
      value: summaryLoading
        ? "—"
        : formatCurrency(summary?.averageInvoice ?? 0),
      icon: <DollarSign className="h-5 w-5" />,
      accentColor: "#FF9F1C",
    },
  ];

  const chartData = revenueData.map((d) => ({
    month: formatMonth(d.month),
    revenue: d.revenue,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back,{" "}
              <span style={{ color: "#0077B6" }}>{displayName}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Here's your business at a glance
            </p>
          </div>
          <Button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 font-semibold"
            style={{ backgroundColor: "#0077B6" }}
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KpiCard key={card.title} {...card} />
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: "#0077B6" }} />
              Revenue Trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last 12 months</p>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Loading chart...
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                No revenue data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Revenue",
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#0077B6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" style={{ color: "#0077B6" }} />
                Recent Jobs
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/jobs")}
                className="text-sm font-medium flex items-center gap-1"
                style={{ color: "#0077B6" }}
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Loading recent jobs...
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No jobs yet. Create your first invoice!
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Date
                        </th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Customer
                        </th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Invoice #
                        </th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Vehicle
                        </th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                          View
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="table-row-brand cursor-pointer"
                          onClick={() => setLocation(`/jobs/${job.id}`)}
                        >
                          <td className="py-3 px-3 text-foreground">
                            {formatDate(job.createdAt)}
                          </td>
                          <td className="py-3 px-3 font-medium text-foreground">
                            {job.customerName}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {job.invoiceNumber}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {job.vehicleType}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              className="inline-flex items-center gap-1 text-xs font-medium"
                              style={{ color: "#0077B6" }}
                            >
                              View
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {recentJobs.map((job) => (
                    <button
                      key={job.id}
                      className="w-full text-left p-4 rounded-lg border border-border hover:bg-muted transition-colors"
                      onClick={() => setLocation(`/jobs/${job.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {job.customerName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {job.invoiceNumber} · {job.vehicleType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "#0077B6" }}
                          >
                            {formatCurrency(parseFloat(job.total || "0"))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(job.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
