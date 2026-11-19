import { App as AntApp, ConfigProvider } from "antd";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ORANGE } from "./colors";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: ORANGE, colorLink: ORANGE } }}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
