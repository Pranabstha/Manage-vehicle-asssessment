import { Flex, Typography } from "antd";
import { DARK_GREEN, GREEN, ORANGE } from "./colors";

export default function Navbar() {
  return (
    <div style={{ background: DARK_GREEN, padding: "20px 24px" }}>
      <Flex
        align="center"
        justify="space-between"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          background: GREEN,
          borderRadius: 999,
          padding: "14px 32px",
        }}
      >
        <Typography.Text strong style={{ color: "#fff", fontSize: 20 }}>
          Manage<span style={{ color: ORANGE }}>Vehicle</span>
        </Typography.Text>
        <Typography.Text
          style={{
            color: "#fff",
            borderBottom: `2px solid ${ORANGE}`,
            paddingBottom: 4,
          }}
        >
          Vehicles
        </Typography.Text>
      </Flex>
    </div>
  );
}
