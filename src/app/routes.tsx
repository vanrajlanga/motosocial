import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { KeywordManagement } from "./pages/KeywordManagement";
import { ContentCalendar } from "./pages/ContentCalendar";
import { AIAssistant } from "./pages/AIAssistant";
import { ContentManager } from "./pages/ContentManager";
import { Settings } from "./pages/Settings";
import { SystemStatus } from "./pages/SystemStatus";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "keywords", Component: KeywordManagement },
      { path: "calendar", Component: ContentCalendar },
      { path: "ai-assistant", Component: AIAssistant },
      { path: "content-manager", Component: ContentManager },
      { path: "settings", Component: Settings },
      { path: "system-status", Component: SystemStatus },
    ],
  },
]);