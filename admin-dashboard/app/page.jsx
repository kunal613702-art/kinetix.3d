"use client";

import dynamic from "next/dynamic";

const AdminDashboard = dynamic(
  () => import("@/components/dashboard/admin-dashboard").then((mod) => mod.AdminDashboard),
  { ssr: false }
);

export default function Page() {
  return <AdminDashboard />;
}
