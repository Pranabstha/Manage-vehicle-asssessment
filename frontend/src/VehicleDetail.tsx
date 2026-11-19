import { App, DatePicker, Descriptions, Drawer, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import type { VehicleWithTelemetry } from "../../shared/types/vehicle.type";
import type { VehicleTelemetry, VehicleTelemetryPage } from "../../shared/types/vehicle_telemetry.type";
import { api } from "./api";
import type { ApiError } from "./api";
import { formatPosition, formatSpeed, formatTime } from "./format";

function lastHours(hours: number): [Dayjs, Dayjs] {
  return [dayjs().subtract(hours, "hour"), dayjs()];
}

const presets = [
  { label: "Last hour", value: () => lastHours(1) },
  { label: "Last 6 hours", value: () => lastHours(6) },
  { label: "Last 24 hours", value: () => lastHours(24) },
];

const PAGE_SIZE = 10;
const LIVE_WINDOW_MS = 60_000;

const columns: TableColumnsType<VehicleTelemetry> = [
  { title: "Time", dataIndex: "ts", render: formatTime },
  { title: "Speed", dataIndex: "speed", align: "right", render: formatSpeed },
  { title: "Location", render: (_, row) => formatPosition(row.lat, row.lon) },
];

interface Props {
  vehicle: VehicleWithTelemetry;
  onClose: () => void;
}

export default function VehicleDetail({ vehicle, onClose }: Props) {
  const [range, setRange] = useState(() => lastHours(1));
  // A range that ended at "now" when picked slides forward as new pings arrive
  const [live, setLive] = useState(true);
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<VehicleTelemetryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();
  const latest = vehicle.latest_telemetry;
  const [seenTs, setSeenTs] = useState(latest?.ts);

  if (latest?.ts !== seenTs) {
    setSeenTs(latest?.ts);
    if (live) {
      const now = dayjs();
      setRange([now.subtract(range[1].diff(range[0])), now]);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const [from, to] = range;
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const result = await api<VehicleTelemetryPage>(
          `/vehicles/${vehicle.id}/telemetry?from=${from.toISOString()}&to=${to.toISOString()}&limit=${PAGE_SIZE}&offset=${offset}`,
        );
        if (!ignore) setHistory(result);
      } catch (err) {
        if (!ignore) message.error((err as ApiError).message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [vehicle.id, range, page, message]);

  const details = [
    { label: "Name", children: vehicle.name },
    { label: "Added", children: formatTime(vehicle.created_at) },
  ];
  if (latest) {
    details.push(
      { label: "Speed", children: formatSpeed(latest.speed) },
      { label: "Location", children: formatPosition(latest.lat, latest.lon) },
      { label: "Last update", children: formatTime(latest.ts) },
    );
  }

  return (
    <Drawer title={vehicle.registration} open onClose={onClose} size={900}>
      <Descriptions size="small" column={2} items={details} />
      {!latest && <Typography.Text type="secondary">No telemetry received yet.</Typography.Text>}
      <Typography.Title level={5} style={{ marginTop: 24 }}>
        Telemetry history
      </Typography.Title>
      <DatePicker.RangePicker
        showTime
        allowClear={false}
        value={range}
        presets={presets}
        onChange={(value) => {
          if (value?.[0] && value[1]) {
            setRange([value[0], value[1]]);
            setLive(Math.abs(dayjs().diff(value[1])) < LIVE_WINDOW_MS);
            setPage(1);
            setLoading(true);
          }
        }}
        style={{ marginBottom: 16 }}
      />
      <Table
        rowKey="ts"
        size="small"
        columns={columns}
        dataSource={history?.items}
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: history?.total,
          showSizeChanger: false,
          showTotal: (total) => `${total.toLocaleString()} pings`,
          onChange: (next) => {
            setPage(next);
            setLoading(true);
          },
        }}
      />
    </Drawer>
  );
}
