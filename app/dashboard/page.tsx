"use client";

import DashboardComponent from "@/components/DashboardComponent";
import { Suspense } from "react";

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardComponent />
    </Suspense>
  );
}
