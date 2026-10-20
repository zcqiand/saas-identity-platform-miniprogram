// @entry M00.F05.I01-I04 — 租户应用页（swift TenantApplicationsAdminView 文案同构：
// 列表 + 订阅表单 + 详情面板：启用 Toggle + 到期时间选择 + 移除订阅过 showModal）。
// 页面薄壳（T9 无测试义务）：只挂 useTenantApplications 渲染表单，逻辑覆盖在
// Task 8 hook 测试。订阅 Picker 的 client 清单就地现配生成 AdminClientsApi
// （hooks defaultSeams 同款 fail-fast；use-admin-clients hook 属 Task 10，尚未落地）。
// update 接线约定（T8 Review Focus）：status 与 expireTime 永远成对传当前值，
// 不传 undefined 省略当前值——status 省略的 PATCH wire 可移植性未实证。
import { useEffect, useState } from "react";
import { Button, Picker, Switch, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import type { OAuthClient } from "../../generated";
import { AdminClientsApi } from "../../generated/apis/AdminClientsApi";
import { currentConfig } from "../../corekit/api-client";
import type { TenantApplication } from "../../corekit/use-tenant-applications";
import { useTenantApplications } from "../../corekit/use-tenant-applications";
import "./index.scss";

// status Int 映射（roles 同口径）：1=启用 否则=停用
const statusLabel = (status: number): string => (status === 1 ? "启用" : "停用");

const pad2 = (n: number): string => String(n).padStart(2, "0");
const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
// picker mode=date 回包 "YYYY-MM-DD" → 本地日界构造（避免 UTC 解析偏一天）
const parseDateInput = (s: string): Date => {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// 订阅表单 client 清单来源：现配生成 AdminClientsApi（defaultSeams 同款 fail-fast，
// 禁默认值兜底 suite-hard-rules §1）
function clientsApiOf(): AdminClientsApi {
  const config = currentConfig();
  if (!config) {
    throw new Error(
      "currentConfig() 缺失：先 bootstrap(baseURL) 再发请求（禁默认值兜底，suite-hard-rules §1）",
    );
  }
  return new AdminClientsApi(config);
}

type Mode =
  | { kind: "idle" }
  | { kind: "subscribe" }
  | { kind: "detail"; clientId: string };

export default function TenantApplications() {
  const { applications, phase, error, load, subscribe, update, remove } =
    useTenantApplications();

  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  // 订阅表单（client 清单=AdminClientsApi 现拉，进表单才拉）
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | undefined>(undefined);
  const [subscribeClientId, setSubscribeClientId] = useState("");
  // "" = 不设置到期（后端默认一年后，表单页脚有注）
  const [subscribeExpire, setSubscribeExpire] = useState("");
  // 详情到期 picker（"" = 当前无到期时间）
  const [expireInput, setExpireInput] = useState("");

  useEffect(() => {
    // account/tenants 页 .task 同构：进页拉订阅列表（失败文案已落 hook error 态）
    void load();
  }, [load]);

  // 详情行从订阅列表现查（update 的原位替换渲染即跟随）
  const detailApp =
    mode.kind === "detail"
      ? applications.find((a) => a.clientId === mode.clientId)
      : undefined;

  const clientOptions: string[] = clients.map((c) => c.clientId);

  const closeForm = () => setMode({ kind: "idle" });

  const openSubscribe = () => {
    setSubscribeClientId("");
    setSubscribeExpire("");
    setClients([]);
    setClientsError(undefined);
    setMode({ kind: "subscribe" });
    setClientsLoading(true);
    clientsApiOf()
      .adminClientsListClients()
      .then((res) => {
        setClients(res.items);
        setClientsLoading(false);
      })
      .catch((e) => {
        // 失败：清单留空 Picker 禁用，红字如实呈现（本页局部态，不动 hook error）
        setClientsError(e instanceof Error ? e.message : String(e));
        setClientsLoading(false);
      });
  };

  const openDetail = (app: TenantApplication) => {
    setExpireInput(app.expireTime ? fmtDate(app.expireTime) : "");
    setMode({ kind: "detail", clientId: app.clientId });
  };

  const canSubmitSubscribe = subscribeClientId.trim().length > 0;

  const submitSubscribe = async () => {
    if (mode.kind !== "subscribe" || submitting || !canSubmitSubscribe) return;
    setSubmitting(true);
    const ok = await subscribe(
      subscribeClientId.trim(),
      subscribeExpire ? parseDateInput(subscribeExpire) : undefined,
    );
    setSubmitting(false);
    if (ok) closeForm(); // 失败：表单保留可改，文案已落 hook error 态
  };

  const onToggleStatus = async (app: TenantApplication, value: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    // 接线约定：状态切换不改到期，到期原样带上当前值（undefined 即当前无到期）
    await update(app.clientId, value ? 1 : 0, app.expireTime);
    setSubmitting(false);
  };

  const onSaveExpire = async () => {
    if (mode.kind !== "detail" || !detailApp || submitting) return;
    setSubmitting(true);
    // 接线约定：status 原样带当前值；到期按 picker（"" = 当前无到期 → 传当前值，
    // partial-update 语义不改，故「清空到期」不可达，页脚有注）
    await update(
      detailApp.clientId,
      detailApp.status,
      expireInput ? parseDateInput(expireInput) : detailApp.expireTime,
    );
    setSubmitting(false);
  };

  const onRemove = async () => {
    if (mode.kind !== "detail" || !detailApp || submitting) return;
    const res = await Taro.showModal({
      title: `移除订阅 ${detailApp.clientId}？`,
      content: "移除后该 client 不再属于当前租户，可重新订阅",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    const ok = await remove(detailApp.clientId);
    setSubmitting(false);
    if (ok) closeForm();
  };

  return (
    <View className="tenant-apps">
      <View className="apps-header">
        <Text className="apps-title">租户应用</Text>
        <Button className="apps-new" disabled={submitting} onClick={openSubscribe}>
          订阅应用
        </Button>
      </View>

      {mode.kind === "idle" ? (
        applications.length === 0 ? (
          <Text className="apps-empty">
            {phase === "busy" ? "加载中…" : "无订阅应用"}
          </Text>
        ) : (
          <View className="apps-list">
            {applications.map((app) => (
              <View
                key={app.clientId}
                className="apps-row"
                onClick={() => openDetail(app)}
              >
                <View className="apps-row-head">
                  <Text className="apps-row-client">{app.clientId}</Text>
                  <Text
                    className={
                      app.status === 1
                        ? "apps-row-badge apps-row-badge-active"
                        : "apps-row-badge"
                    }
                  >
                    {statusLabel(app.status)}
                  </Text>
                </View>
                <Text className="apps-row-meta">
                  {app.expireTime ? `到期：${fmtDate(app.expireTime)}` : "无到期时间"}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : null}

      {mode.kind === "subscribe" ? (
        <View className="apps-form">
          <Text className="apps-form-title">订阅应用</Text>
          <View className="apps-field-group">
            <Text className="apps-field-label">Client（必选）</Text>
            {clientsLoading ? (
              <Text className="apps-empty">加载中…</Text>
            ) : (
              <Picker
                mode="selector"
                range={clientOptions}
                disabled={submitting || clientOptions.length === 0}
                onChange={(e) =>
                  setSubscribeClientId(clientOptions[Number(e.detail.value)] ?? "")
                }
              >
                <View className="apps-picker-value">
                  {subscribeClientId || "选择 client"}
                </View>
              </Picker>
            )}
            {clientsError ? <Text className="apps-error">{clientsError}</Text> : null}
          </View>
          <View className="apps-field-group">
            <Text className="apps-field-label">到期时间（可选）</Text>
            <Picker
              mode="date"
              value={subscribeExpire || fmtDate(new Date())}
              disabled={submitting}
              onChange={(e) => setSubscribeExpire(e.detail.value)}
            >
              <View className="apps-picker-value">
                {subscribeExpire || "不设置（默认一年后）"}
              </View>
            </Picker>
            {subscribeExpire ? (
              <Text
                className="apps-picker-clear"
                onClick={() => setSubscribeExpire("")}
              >
                不设置
              </Text>
            ) : null}
          </View>
          <Button
            className="apps-save"
            disabled={submitting || !canSubmitSubscribe}
            onClick={submitSubscribe}
          >
            订阅
          </Button>
          <Button className="apps-cancel" onClick={closeForm}>
            取消
          </Button>
          <Text className="apps-form-hint">
            到期时间默认一年后，可在详情页改期或停用
          </Text>
        </View>
      ) : null}

      {mode.kind === "detail" && detailApp ? (
        <View className="apps-form">
          <Text className="apps-form-title">订阅详情</Text>
          <View className="apps-readonly">
            <Text className="apps-readonly-row">clientId：{detailApp.clientId}</Text>
            <Text className="apps-readonly-row">状态：{statusLabel(detailApp.status)}</Text>
            <Text className="apps-readonly-row">创建于：{fmtDate(detailApp.createdAt)}</Text>
            <Text className="apps-readonly-row">
              到期：{detailApp.expireTime ? fmtDate(detailApp.expireTime) : "—"}
            </Text>
          </View>

          <View className="apps-status">
            <Text className="apps-status-label">启用</Text>
            <Switch
              checked={detailApp.status === 1}
              disabled={submitting}
              onChange={(e) => void onToggleStatus(detailApp, e.detail.value)}
            />
            <Text className="apps-status-value">{statusLabel(detailApp.status)}</Text>
          </View>

          <Text className="apps-section-title">到期时间</Text>
          <Picker
            mode="date"
            value={expireInput || fmtDate(new Date())}
            disabled={submitting}
            onChange={(e) => setExpireInput(e.detail.value)}
          >
            <View className="apps-picker-value">
              {expireInput || "无到期时间"}
            </View>
          </Picker>
          <Button
            className="apps-save"
            disabled={submitting}
            onClick={() => void onSaveExpire()}
          >
            保存到期时间
          </Button>
          <Text className="apps-form-hint">
            契约 partial-update：不提交 = 不改，故「清空到期」不可达（需重订）
          </Text>

          <Button
            className="apps-danger"
            disabled={submitting}
            onClick={() => void onRemove()}
          >
            移除订阅
          </Button>
          <Button className="apps-cancel" onClick={closeForm}>
            返回
          </Button>
        </View>
      ) : null}

      {error ? <Text className="apps-error">{error}</Text> : null}
    </View>
  );
}
