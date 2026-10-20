// @entry M04.F01.I01-I06 + M04.F02.I01 — 应用维护页（swift ApplicationsView
// 文案同构：列表 + 新建表单 + 详情面板：只读段 + 启用 Toggle（启用直通、停用
// 过 showModal）+ 编辑段 + 删除过 showModal）。页面薄壳（T11 无测试义务）：
// 只挂 useAdminClients 渲染表单，逻辑覆盖在 Task 10 hook 测试。平台 admin 面
// 无租户门（Account 入口恒在，无权由服务端 403 兜，错误落页内红字）。
// 逗号串字段（redirectUris/grantTypes/scopes）原样透传展示编辑（DB 形态直出，
// 不发明数组转换层）；grantTypes 默认 authorization_code 是页面层 UI 默认选中
// （新建表单初值，非 env、非 hook 兜底）。
import { useEffect, useState } from "react";
import { Button, Input, Switch, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { OAuthClient } from "../../generated";
import { useAdminClients } from "../../corekit/use-admin-clients";
import "./index.scss";

// status Int 映射（roles/tenant-applications 同口径）：1=启用 否则=停用
const statusLabel = (status: number): string => (status === 1 ? "启用" : "停用");

type Mode =
  | { kind: "idle" }
  | { kind: "create" }
  | { kind: "detail"; clientId: string };

export default function AdminClients() {
  const { clients, phase, error, load, create, update, remove, setStatus } =
    useAdminClients();

  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  // 新建表单（grantTypes 页面层默认 authorization_code）
  const [newClientId, setNewClientId] = useState("");
  const [newName, setNewName] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newRedirectUris, setNewRedirectUris] = useState("");
  const [newGrantTypes, setNewGrantTypes] = useState("authorization_code");
  const [newScopes, setNewScopes] = useState("");
  // 编辑表单（进详情以现状为起点：partial 提交，未动字段保持原值）
  const [editName, setEditName] = useState("");
  const [editRedirectUris, setEditRedirectUris] = useState("");
  const [editGrantTypes, setEditGrantTypes] = useState("");
  const [editScopes, setEditScopes] = useState("");

  useEffect(() => {
    // account/tenants 页 .task 同构：进页拉应用列表（失败文案已落 hook error 态）
    void load();
  }, [load]);

  // 详情行从应用列表现查（update/setStatus/remove 的原位替换/移除渲染即跟随；
  // 取不到=已被删除，详情段不渲染）
  const detailClient =
    mode.kind === "detail"
      ? clients.find((c) => c.clientId === mode.clientId)
      : undefined;

  const closeForm = () => setMode({ kind: "idle" });

  const openCreate = () => {
    setNewClientId("");
    setNewName("");
    setNewSecret("");
    setNewRedirectUris("");
    setNewGrantTypes("authorization_code");
    setNewScopes("");
    setMode({ kind: "create" });
  };

  const openDetail = (client: OAuthClient) => {
    setEditName(client.clientName);
    setEditRedirectUris(client.redirectUris);
    setEditGrantTypes(client.grantTypes);
    setEditScopes(client.scopes ?? "");
    setMode({ kind: "detail", clientId: client.clientId });
  };

  const canSubmitCreate = [
    newClientId,
    newName,
    newSecret,
    newRedirectUris,
    newGrantTypes,
  ].every((s) => s.trim().length > 0);

  const submitCreate = async () => {
    if (mode.kind !== "create" || submitting || !canSubmitCreate) return;
    setSubmitting(true);
    const ok = await create({
      clientId: newClientId.trim(),
      clientName: newName.trim(),
      clientSecret: newSecret,
      grantTypes: newGrantTypes.trim(),
      redirectUris: newRedirectUris.trim(),
      scopes: newScopes.trim() ? newScopes.trim() : undefined,
    });
    setSubmitting(false);
    if (ok) closeForm(); // 失败：表单保留可改，文案已落 hook error 态
  };

  const onSaveEdit = async () => {
    if (mode.kind !== "detail" || !detailClient || submitting) return;
    setSubmitting(true);
    const ok = await update(detailClient.clientId, {
      clientName: editName,
      grantTypes: editGrantTypes,
      redirectUris: editRedirectUris,
      scopes: editScopes,
    });
    setSubmitting(false);
    if (ok) closeForm();
  };

  const onToggleStatus = async (client: OAuthClient, value: boolean) => {
    if (submitting) return;
    if (!value) {
      // 停用是危险向：过 modal 确认（启用直通无损）；取消则不动，Toggle 随
      // 现状回弹（checked 恒取列表行真值）
      const res = await Taro.showModal({
        title: `停用 ${client.clientId}？`,
        content: "该应用的所有授权与刷新请求将立即被后端拒绝；重新启用即恢复",
        confirmText: "停用",
      });
      if (!res.confirm) return;
    }
    setSubmitting(true);
    await setStatus(client.clientId, value ? 1 : 0);
    setSubmitting(false);
  };

  const onDelete = async () => {
    if (mode.kind !== "detail" || !detailClient || submitting) return;
    const res = await Taro.showModal({
      title: `删除 ${detailClient.clientId}？`,
      content: "删除（吊销其全部 token，不可逆）",
      confirmText: "删除",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    const ok = await remove(detailClient.clientId);
    setSubmitting(false);
    if (ok) closeForm(); // 成功：行已原位移除，回列表
  };

  return (
    <View className="admin-clients">
      <View className="ac-header">
        <Text className="ac-title">应用维护</Text>
        <Button className="ac-new" disabled={submitting} onClick={openCreate}>
          新建应用
        </Button>
      </View>

      {mode.kind === "idle" ? (
        clients.length === 0 ? (
          <Text className="ac-empty">
            {phase === "busy" ? "加载中…" : "无应用"}
          </Text>
        ) : (
          <View className="ac-list">
            {clients.map((client) => (
              <View
                key={client.clientId}
                className="ac-row"
                onClick={() => openDetail(client)}
              >
                <Text className="ac-row-name">{client.clientName}</Text>
                <Text className="ac-row-meta">
                  {client.clientId} · {statusLabel(client.status)}
                </Text>
              </View>
            ))}
            <Text className="ac-footer">
              共 {clients.length} 个 · 停用后该应用的 authorize/token 立即被拒绝
            </Text>
          </View>
        )
      ) : null}

      {mode.kind === "create" ? (
        <View className="ac-form">
          <Text className="ac-form-title">新建应用</Text>
          <View className="ac-field-group">
            <Text className="ac-field-label">clientId（唯一标识）</Text>
            <Input
              className="ac-input"
              value={newClientId}
              disabled={submitting}
              onInput={(e) => setNewClientId(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">应用名称</Text>
            <Input
              className="ac-input"
              value={newName}
              disabled={submitting}
              onInput={(e) => setNewName(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">clientSecret（必填）</Text>
            <Input
              className="ac-input"
              password
              value={newSecret}
              disabled={submitting}
              onInput={(e) => setNewSecret(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">redirectUris（逗号分隔）</Text>
            <Input
              className="ac-input"
              value={newRedirectUris}
              disabled={submitting}
              onInput={(e) => setNewRedirectUris(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">grantTypes（逗号分隔）</Text>
            <Input
              className="ac-input"
              value={newGrantTypes}
              disabled={submitting}
              onInput={(e) => setNewGrantTypes(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">scopes（逗号分隔，可空）</Text>
            <Input
              className="ac-input"
              value={newScopes}
              disabled={submitting}
              onInput={(e) => setNewScopes(e.detail.value)}
            />
          </View>
          <Button
            className="ac-save"
            disabled={submitting || !canSubmitCreate}
            onClick={() => void submitCreate()}
          >
            注册
          </Button>
          <Button className="ac-cancel" onClick={closeForm}>
            取消
          </Button>
        </View>
      ) : null}

      {mode.kind === "detail" && detailClient ? (
        <View className="ac-form">
          <Text className="ac-form-title">{detailClient.clientName}</Text>

          <Text className="ac-section-title">详情（只读）</Text>
          <View className="ac-readonly">
            <Text className="ac-readonly-row">
              clientId：{detailClient.clientId}
            </Text>
            <Text className="ac-readonly-row">
              状态：{statusLabel(detailClient.status)}
            </Text>
            <Text className="ac-readonly-row">
              access 有效期：{detailClient.accessTokenValidity}s
            </Text>
            <Text className="ac-readonly-row">
              refresh 有效期：{detailClient.refreshTokenValidity}s
            </Text>
            <Text className="ac-readonly-row">
              自动批准：{detailClient.autoApprove ? "是" : "否"}
            </Text>
          </View>

          <View className="ac-status">
            <Text className="ac-status-label">启用</Text>
            <Switch
              checked={detailClient.status === 1}
              disabled={submitting}
              onChange={(e) => void onToggleStatus(detailClient, e.detail.value)}
            />
            <Text className="ac-status-value">
              {statusLabel(detailClient.status)}
            </Text>
          </View>
          <Text className="ac-form-hint">
            status 切换立即生效，服务端不落审计
          </Text>

          <Text className="ac-section-title">编辑（逗号分隔原样提交）</Text>
          <View className="ac-field-group">
            <Text className="ac-field-label">应用名称</Text>
            <Input
              className="ac-input"
              value={editName}
              disabled={submitting}
              onInput={(e) => setEditName(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">redirectUris（逗号分隔）</Text>
            <Input
              className="ac-input"
              value={editRedirectUris}
              disabled={submitting}
              onInput={(e) => setEditRedirectUris(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">grantTypes（逗号分隔）</Text>
            <Input
              className="ac-input"
              value={editGrantTypes}
              disabled={submitting}
              onInput={(e) => setEditGrantTypes(e.detail.value)}
            />
          </View>
          <View className="ac-field-group">
            <Text className="ac-field-label">scopes（逗号分隔）</Text>
            <Input
              className="ac-input"
              value={editScopes}
              disabled={submitting}
              onInput={(e) => setEditScopes(e.detail.value)}
            />
          </View>
          <Button
            className="ac-save"
            disabled={submitting}
            onClick={() => void onSaveEdit()}
          >
            保存
          </Button>
          <Text className="ac-form-hint">
            密钥不返明文：详情无 secret 字段
          </Text>

          <Button
            className="ac-danger"
            disabled={submitting}
            onClick={() => void onDelete()}
          >
            删除应用
          </Button>
          <Button className="ac-cancel" onClick={closeForm}>
            返回
          </Button>
        </View>
      ) : null}

      {error ? <Text className="ac-error">{error}</Text> : null}
    </View>
  );
}
