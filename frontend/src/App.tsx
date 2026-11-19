import { Layout } from "antd";
import Navbar from "./Navbar";
import VehiclesTable from "./VehiclesTable";

export default function App() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Navbar />
      <Layout.Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <VehiclesTable />
        </div>
      </Layout.Content>
    </Layout>
  );
}
