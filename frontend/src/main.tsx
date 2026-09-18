import { useState } from "react";
import { createRoot } from "react-dom/client";

import { DEMO_USERS, ROLE_TEXT } from "./constants/users";
import { routes } from "./router/routes";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { TasksPage } from "./pages/TasksPage";
import { HazardsPage } from "./pages/HazardsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { useCurrentUserStore } from "./stores/CurrentUserStore";
import { formatRole } from "./utils/formatters";
import "./styles.css";

const PAGE_VIEWS: Record<string, () => JSX.Element> = {
  "/dashboard": DashboardPage,
  "/devices": DevicesPage,
  "/tasks": TasksPage,
  "/hazards": HazardsPage,
  "/reports": ReportsPage
};

function UserSwitcher() {
  const { user, switchUser } = useCurrentUserStore();
  return (
    <div className="user-switcher">
      <p className="switcher-label">当前演示身份（写操作按此身份鉴权）</p>
      <select value={user.id} onChange={(event) => switchUser(Number(event.target.value))}>
        {DEMO_USERS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {ROLE_TEXT[item.role]}
          </option>
        ))}
      </select>
      <p className="switcher-badge">{formatRole(user.role)}</p>
    </div>
  );
}

function App() {
  const [active, setActive] = useState<string>(routes[0]?.route ?? "/dashboard");
  const current = routes.find((route) => route.route === active) ?? routes[0];
  const View = PAGE_VIEWS[active] ?? DashboardPage;

  return (
    <div className="shell">
      <aside>
        <div className="brand">消防设施巡检维保平台</div>
        <nav>
          {routes.map((route) => (
            <button
              key={route.route}
              className={active === route.route ? "active" : ""}
              onClick={() => setActive(route.route)}
            >
              {route.name}
            </button>
          ))}
        </nav>
        <UserSwitcher />
      </aside>
      <div className="content">
        <View key={active} />
        <footer className="page-footer">
          fire-inspect · {current?.name} · 隐患闭环：异常建单 → 逾期升级 → 整改提交 → 原巡检员复验 → 关闭恢复设备
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
