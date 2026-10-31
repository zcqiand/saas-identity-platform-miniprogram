// @entry M00.F01.I01-I05 — 租户管理页（swift TenantsAdminView 文案同构：列表 +
// 新建表单 + 行内编辑表单 + 删除过 showModal）。页面薄壳（T3 无测试义务）：
// 只挂 useAdminTenants 渲染表单，逻辑覆盖在 Task 2 hook 测试。
import { useEffect, useState } from "react";
import { Button, Input, Switch, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { Tenant } from "../../corekit/use-admin-tenants";
import { useAdminTenants } from "../../corekit/use-admin-tenants";
import "./index.scss";

// status 映射：active=启用 / suspended=停用（页脚另有提醒口径即生效）
const statusLabel = (status: Tenant["status"]): string =>
  status === "active" ? "启用" : "停用";

type Mode = { kind: "idle" } | { kind: "create" } | { kind: "edit"; tenant: Tenant };

export default function Tenants() {
  const { tenants, phase, error, load, create, update, remove } = useAdminTenants();

  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [tenantKey, setTenantKey] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    // account 页 .task 同构：进页拉租户列表（失败文案已落 hook error 态）
    void load();
  }, [load]);

  const openCreate = () => {
    setTenantKey("");
    setName("");
    setActive(true);
    setMode({ kind: "create" });
  };

  const openEdit = (tenant: Tenant) => {
    setName(tenant.name);
    setActive(tenant.status === "active");
    setMode({ kind: "edit", tenant });
  };

  const closeForm = () => setMode({ kind: "idle" });

  const canSubmitCreate = tenantKey.trim().length > 0 && name.trim().length > 0;
  const canSubmitEdit = name.trim().length > 0;

  const submitCreate = async () => {
    if (submitting || !canSubmitCreate) return;
    setSubmitting(true);
    const ok = await create({
      tenantKey: tenantKey.trim(),
      name: name.trim(),
    });
    setSubmitting(false);
    if (ok) closeForm(); // 失败：表单保留可改，文案已落 hook error 态
  };

  const submitUpdate = async () => {
    if (mode.kind !== "edit" || submitting || !canSubmitEdit) return;
    setSubmitting(true);
    const ok = await update(mode.tenant.id, {
      name: name.trim(),
      status: active ? "active" : "suspended",
    });
    setSubmitting(false);
    if (ok) closeForm();
  };

  const onDelete = async () => {
    if (mode.kind !== "edit" || submitting) return;
    const res = await Taro.showModal({
      title: `删除 ${mode.tenant.tenantKey}？`,
      content: "租户及其成员关系、应用订阅将被级联处理，不可恢复",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    const ok = await remove(mode.tenant.id);
    setSubmitting(false);
    if (ok) closeForm();
  };

  return (
    <View className="tenants">
      <View className="tenants-header">
        <Text className="tenants-title">租户管理</Text>
        <Button className="tenants-new" disabled={submitting} onClick={openCreate}>
          新建租户
        </Button>
      </View>

      {mode.kind === "idle" ? (
        tenants.length === 0 ? (
          <Text className="tenants-empty">{phase === "busy" ? "加载中…" : "无租户"}</Text>
        ) : (
          <View className="tenants-list">
            {tenants.map((t) => (
              <View key={t.id} className="tenants-row" onClick={() => openEdit(t)}>
                <Text className="tenants-row-name">{t.name}</Text>
                <Text className="tenants-row-meta">
                  {t.tenantKey} · {statusLabel(t.status)}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : (
        <View className="tenants-form">
          <Text className="tenants-form-title">
            {mode.kind === "create" ? "新建租户" : "编辑租户"}
          </Text>
          {mode.kind === "create" ? (
            <Input
              className="tenants-field"
              placeholder="tenantKey（唯一标识）"
              value={tenantKey}
              onInput={(e) => setTenantKey(e.detail.value)}
            />
          ) : null}
          <Input
            className="tenants-field"
            placeholder="租户名称"
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
          {mode.kind === "edit" ? (
            <View className="tenants-status">
              <Text className="tenants-status-label">状态</Text>
              <Switch
                checked={active}
                disabled={submitting}
                onChange={(e) => setActive(e.detail.value)}
              />
              <Text className="tenants-status-value">
                {active ? "启用（active）" : "停用（suspended）"}
              </Text>
            </View>
          ) : null}
          <Button
            className="tenants-save"
            disabled={
              submitting || (mode.kind === "create" ? !canSubmitCreate : !canSubmitEdit)
            }
            onClick={mode.kind === "create" ? submitCreate : submitUpdate}
          >
            保存
          </Button>
          <Button className="tenants-cancel" onClick={closeForm}>
            取消
          </Button>
          {mode.kind === "edit" ? (
            <Button className="tenants-delete" disabled={submitting} onClick={onDelete}>
              删除租户
            </Button>
          ) : null}
        </View>
      )}

      {error ? <Text className="tenants-error">{error}</Text> : null}
      <Text className="tenants-footer">
        共 {tenants.length} 个 · status 切换即生效（active/suspended）
      </Text>
    </View>
  );
}
