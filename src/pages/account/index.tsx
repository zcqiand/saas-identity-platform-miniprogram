// @entry M01.F01.I01 — 「当前用户」区渲染入口（username 快照 / email whoami，D6）
// @entry M01.F03.I01 — 租户成员列表入口（meListMyTenants 真值覆盖 + 点选切换）
import { useEffect } from "react";
import { Button, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { CLIENT_ID } from "../../config/client";
import { useAuth } from "../../corekit/use-auth";
import "./index.scss";

// 页面薄壳（T4 无测试义务）：swift AccountView 同构裁剪。无租户名富化（D6，
// 显示 tenantId）。平台管理区恒在（服务端 403 才是门，进页无权则 tenants 页
// 自身报错）；成员角色入口仅在有 currentTenantId 时渲染（成员接口按租户作用域）。
export default function Account() {
  const {
    user,
    tenants,
    currentTenantId,
    error,
    whoami,
    listTenants,
    switchTenant,
    logout,
  } = useAuth(CLIENT_ID);

  useEffect(() => {
    // swift .task 同构：进页拉 whoami + 成员关系真值覆盖（均尽力而为，不拦渲染）
    whoami().catch(() => {
      // 失败 user 保持 + 文案已落 useAuth error 态
    });
    void listTenants();
  }, [whoami, listTenants]);

  const onSwitch = async (tenantId: string) => {
    if (tenantId === currentTenantId) return;
    try {
      // 成功：useAuth 内 adoptSwitch + 重拉 whoami；失败：保旧会话可重试
      await switchTenant(tenantId);
    } catch {
      // 失败文案已落 useAuth error 态，页面不重复处理
    }
  };

  const onLogout = async () => {
    await logout();
    await Taro.reLaunch({ url: "/pages/login/index" });
  };

  return (
    <View className="account">
      <View className="account-section">
        <Text className="account-section-title">当前用户</Text>
        <Text className="account-row">用户名：{user?.username ?? "—"}</Text>
        <Text className="account-row">邮箱：{user?.email ?? "—"}</Text>
        <Text className="account-row">当前租户：{currentTenantId ?? "—"}</Text>
        <Text className="account-row">成员关系数：{tenants.length}</Text>
      </View>
      <View className="account-section">
        <Text className="account-section-title">租户成员</Text>
        {tenants.length === 0 ? (
          <Text className="account-empty">无成员关系</Text>
        ) : (
          tenants.map((membership) => {
            const isCurrent = membership.tenantId === currentTenantId;
            return (
              <View
                key={membership.tenantId}
                className="account-tenant"
                onClick={() => onSwitch(membership.tenantId)}
              >
                <Text className="account-tenant-id">{membership.tenantId}</Text>
                <Text className="account-tenant-meta">
                  角色 {membership.roleIds.join("、")} · {membership.status}
                </Text>
                {isCurrent ? <Text className="account-tenant-current">✓</Text> : null}
              </View>
            );
          })
        )}
      </View>
      <View className="account-section">
        <Text className="account-section-title">平台管理</Text>
        <View
          className="account-entry"
          onClick={() => Taro.navigateTo({ url: "/pages/tenants/index" })}
        >
          <Text className="account-entry-name">租户管理</Text>
          <Text className="account-entry-arrow">›</Text>
        </View>
        {currentTenantId ? (
          <View
            className="account-entry"
            onClick={() => Taro.navigateTo({ url: "/pages/members/index" })}
          >
            <Text className="account-entry-name">成员角色</Text>
            <Text className="account-entry-arrow">›</Text>
          </View>
        ) : null}
        {currentTenantId ? (
          <View
            className="account-entry"
            onClick={() => Taro.navigateTo({ url: "/pages/roles/index" })}
          >
            <Text className="account-entry-name">角色管理</Text>
            <Text className="account-entry-arrow">›</Text>
          </View>
        ) : null}
        {currentTenantId ? (
          <View
            className="account-entry"
            onClick={() =>
              Taro.navigateTo({ url: "/pages/tenant-applications/index" })
            }
          >
            <Text className="account-entry-name">租户应用</Text>
            <Text className="account-entry-arrow">›</Text>
          </View>
        ) : null}
      </View>
      {error ? <Text className="account-error">{error}</Text> : null}
      <Button className="account-logout" onClick={onLogout}>
        登出
      </Button>
    </View>
  );
}
