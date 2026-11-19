import { Alert, App, Button, Card, Popconfirm, Space, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { useEffect, useState } from "react";
import type { Vehicle, VehicleWithTelemetry } from "../../shared/types/vehicle.type";
import { api } from "./api";
import type { ApiError } from "./api";
import { formatPosition, formatSpeed, formatTime } from "./format";
import VehicleDetail from "./VehicleDetail";
import VehicleForm from "./VehicleForm";

// Matches the generator's default ping interval
const REFRESH_MS = 5000;

const noData = <Typography.Text type="secondary">No data yet</Typography.Text>;

export default function VehiclesTable() {
  const [vehicles, setVehicles] = useState<VehicleWithTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const { message } = App.useApp();

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const list = await api<VehicleWithTelemetry[]>("/vehicles");
        if (!ignore) {
          setVehicles(list);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError((err as ApiError).message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, []);

  const viewing = vehicles.find((vehicle) => vehicle.id === viewingId);

  // Saves and deletes update the list straight away instead of waiting for the next refresh
  function saved(vehicle: Vehicle) {
    setFormOpen(false);
    setVehicles((list) =>
      list.some((item) => item.id === vehicle.id)
        ? list.map((item) => (item.id === vehicle.id ? { ...item, ...vehicle } : item))
        : [...list, { ...vehicle, latest_telemetry: null }],
    );
  }

  function openForm(vehicle: Vehicle | null) {
    setEditing(vehicle);
    setFormOpen(true);
  }

  async function remove(vehicle: Vehicle) {
    try {
      await api<void>(`/vehicles/${vehicle.id}`, { method: "DELETE" });
      message.success("Vehicle deleted.");
      setVehicles((list) => list.filter((item) => item.id !== vehicle.id));
    } catch (err) {
      message.error((err as ApiError).message);
    }
  }

  const columns: TableColumnsType<VehicleWithTelemetry> = [
    {
      title: "Registration",
      dataIndex: "registration",
      sorter: (a, b) => a.registration.localeCompare(b.registration),
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Speed",
      dataIndex: "latest_telemetry",
      align: "right",
      sorter: (a, b) => (a.latest_telemetry?.speed ?? -1) - (b.latest_telemetry?.speed ?? -1),
      render: (latest) => (latest ? formatSpeed(latest.speed) : noData),
    },
    {
      title: "Location",
      dataIndex: "latest_telemetry",
      render: (latest) => (latest ? formatPosition(latest.lat, latest.lon) : noData),
    },
    {
      title: "Last update",
      dataIndex: "latest_telemetry",
      render: (latest) => (latest ? formatTime(latest.ts) : noData),
    },
    {
      title: "Actions",
      render: (_, vehicle) => (
        <Space>
          <Button type="link" size="small" onClick={() => setViewingId(vehicle.id)}>
            View
          </Button>
          <Button type="link" size="small" onClick={() => openForm(vehicle)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this vehicle?"
            description="Its telemetry history is deleted too."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => remove(vehicle)}
          >
            <Button type="link" size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Vehicles"
      extra={
        <Button type="primary" onClick={() => openForm(null)}>
          Add vehicle
        </Button>
      }
    >
      {error && <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={vehicles}
        loading={loading}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
      />
      {viewing && <VehicleDetail vehicle={viewing} onClose={() => setViewingId(null)} />}
      {formOpen && (
        <VehicleForm
          vehicle={editing}
          onClose={() => setFormOpen(false)}
          onSaved={saved}
        />
      )}
    </Card>
  );
}
