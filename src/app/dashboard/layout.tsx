import { BridgeSidebar } from "@/components/dashboard/sidebar";
import { BridgeTopbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bridge-layout">
      <BridgeSidebar />
      <BridgeTopbar />
      <main className="bridge-main">{children}</main>
    </div>
  );
}