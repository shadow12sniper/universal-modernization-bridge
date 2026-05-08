import { ConnectorCards } from "@/components/dashboard/connector-cards";

export default function ConnectorsPage() {
  return (
    <div>
      <div className="bridge-section">
        <h2 className="bridge-section__title">Enterprise Modules</h2>
        <ConnectorCards />
      </div>
    </div>
  );
}