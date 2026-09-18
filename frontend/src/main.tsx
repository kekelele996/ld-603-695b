import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { routes } from "./router/routes";
import { useAuthStore } from "./stores/AuthStore";
import { useDataStore } from "./stores/DataStore";
import { UserRoleText } from "./constants/UserRole";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { TasksPage } from "./pages/TasksPage";
import { HazardsPage } from "./pages/HazardsPage";
import { ReportsPage } from "./pages/ReportsPage";
import "./styles.css";

const PAGE_VIEWS: Record<string, React.ComponentType> = {
  "/dashboard": DashboardPage,
  "/devices": DevicesPage,
  "/tasks": TasksPage,
  "/hazards": HazardsPage,
  "/reports": ReportsPage
};

function UserSwitcher() {
  const { users, current, switchUser, loadUsers } = useAuthStore();
  const refreshAll = useDataStore((state) => state.refreshAll);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div className="user-switcher">
      <label>
        登录身份
        <select
          value={current.id}
          onChange={async (event) => {
            switchUser(Number(event.target.value));
            await refreshAll();
          }}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} · {UserRoleText[user.role as keyof typeof UserRoleText] ?? user.role}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function App() {
  const [active, setActive] = useState<string>(routes[0]?.route ?? "/dashboard");
  const { bootstrap, ready } = useDataStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const View = PAGE_VIEWS[active] ?? DashboardPage;

  return (
    <div className="shell">
      <aside>
        <div className="brand">消防设施巡检维保平台</div>
        <nav>
          {routes.map((route) => (
            <button key={route.route}
                    className={active === route.route ? "active" : ""}
                    onClick={() => setActive(route.route)}>
              {route.name}
            </button>
          ))}
        </nav>
        <UserSwitcher />
      </aside>
      {ready ? <View /> : (
        <main className="page">
          <div className="panel wide loading-panel">正在加载本地台账数据…</div>
        </main>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
