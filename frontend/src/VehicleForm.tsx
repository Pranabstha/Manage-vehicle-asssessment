import { App, Form, Input, Modal } from "antd";
import { useState } from "react";
import { MAX_NAME_LENGTH, MAX_REGISTRATION_LENGTH } from "../../shared/limits";
import type { Vehicle, VehicleInput } from "../../shared/types/vehicle.type";
import { api } from "./api";
import type { ApiError } from "./api";

interface Props {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSaved: (saved: Vehicle) => void;
}

export default function VehicleForm({ vehicle, onClose, onSaved }: Props) {
  const [form] = Form.useForm<VehicleInput>();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  async function save(input: VehicleInput) {
    setSaving(true);
    try {
      const saved = vehicle
        ? await api<Vehicle>(`/vehicles/${vehicle.id}`, { method: "PUT", body: JSON.stringify(input) })
        : await api<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(input) });
      message.success(vehicle ? "Vehicle updated." : "Vehicle added.");
      onSaved(saved);
    } catch (err) {
      const { message: text, errors } = err as ApiError;
      if (errors) {
        form.setFields(
          Object.entries(errors).map(([name, messages]) => ({
            name: name as keyof VehicleInput,
            errors: messages,
          })),
        );
      } else {
        message.error(text);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={vehicle ? "Edit vehicle" : "Add vehicle"}
      open
      okText={vehicle ? "Save" : "Add"}
      confirmLoading={saving}
      onOk={form.submit}
      onCancel={onClose}
    >
      <Form form={form} layout="vertical" initialValues={vehicle ?? undefined} onFinish={save}>
        <Form.Item
          label="Registration"
          name="registration"
          rules={[
            { required: true, whitespace: true, message: "registration is required" },
            {
              max: MAX_REGISTRATION_LENGTH,
              message: `registration must be at most ${MAX_REGISTRATION_LENGTH} characters`,
            },
          ]}
        >
          <Input placeholder="ABC-123" />
        </Form.Item>
        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, whitespace: true, message: "name is required" },
            { max: MAX_NAME_LENGTH, message: `name must be at most ${MAX_NAME_LENGTH} characters` },
          ]}
        >
          <Input placeholder="Isuzu NPR 400 - Sydney depot" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
