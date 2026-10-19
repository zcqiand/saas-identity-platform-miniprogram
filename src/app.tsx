import { PropsWithChildren } from "react";
import Taro from "@tarojs/taro";
import "./app.scss";
import { bootstrap, setOnUnauthorized } from "./corekit/api-client";
import { createTaroTokenStore } from "./corekit/token-store";
import { sharedSessionStore } from "./corekit/use-auth";
import { CLIENT_ID } from "./config/client";
import { apiBaseUrl } from "./config/app-config";

/**
 * App 层接线（knife2 T4）：
 * - 冷启动 Bearer 重注：Taro 侧 Configuration 是静态 Bearer 快照（swift APIGlue
 *   每调用读 Keychain 的等价物），重启不重注则存量会话首个请求必 401；token 缺席
 *   走 D5 仅 baseURL 路径（登录页 sessionsLogin 恰要在无 token 时发）。
 * - 401 桥层回调：清会话（adoptLogout）+ 回登录页——swift「401 → expire →
 *   根路由切登录」同语义。只做这一件事，异常不吞、不做路由以外副作用。
 */
function bootstrapFromStorage(): void {
  try {
    bootstrap(apiBaseUrl(), createTaroTokenStore().getToken());
  } catch {
    // env 缺失不在 App 层炸（整页白屏）：交给 SessionStore needsSetup 派生 +
    // 登录页 defaultSeams fail-fast 文案（T1 needsSetup 语义），非默认值兜底
  }
}
bootstrapFromStorage();

setOnUnauthorized(() => {
  sharedSessionStore(CLIENT_ID).adoptLogout();
  // 已在登录页不重入 reLaunch（自刷新会清掉用户输入；密码错 401 也走这里）
  const pages = Taro.getCurrentPages();
  const current = pages[pages.length - 1];
  if (current?.path?.includes("pages/login/index")) return;
  void Taro.reLaunch({ url: "/pages/login/index" });
});

function App({ children }: PropsWithChildren) {
  return children;
}

export default App;
