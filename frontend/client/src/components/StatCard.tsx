import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: "primary" | "chart-2" | "chart-3" | "chart-5";
}

export function StatCard({ title, value, icon: Icon, trend, accentColor = "primary" }: StatCardProps) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    "chart-2": "text-chart-2 bg-chart-2/10",
    "chart-3": "text-chart-3 bg-chart-3/10",
    "chart-5": "text-chart-5 bg-chart-5/10",
  };

  return (
    <Card data-testid={`card-stat-${title}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${colorClasses[accentColor]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-value-${title}`}>
          {value}
        </div>
        {trend && (
          <p className={`text-xs ${trend.isPositive ? "text-primary" : "text-destructive"}`}>
            {trend.isPositive ? "+" : ""}{trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
