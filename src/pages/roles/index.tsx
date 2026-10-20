// @entry M00.F03.I01-I05 — 角色管理页（swift RolesAdminView 文案同构：列表 + Client
// 过滤 + 新建表单 + 详情面板：启用 Toggle + 编辑资料 + 菜单授权勾选 + 删除确认）。
// 页面薄壳（T7 无测试义务）：只挂 useRoles 渲染表单，逻辑覆盖在 Task 6 hook 测试。
// 删除/清空授权过 showModal 确认；Client 过滤在前端做（列表全量拉取，页脚有注）。
import { useEffect, useState } from "react";
import { Button, Input, Picker, Switch, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { CLIENT_ID } from "../../config/client";
import type { SysRole } from "../../corekit/use-roles";
import { useRoles } from "../../corekit/use-roles";
import { useAuth } from "../../corekit/use-auth";
import "./index.scss";

// status Int 映射（brief verbatim）：1=启用 否则=停用
const statusLabel = (status: number): string => (status === 1 ? "启用" : "停用");

type Mode = { kind: "idle" } | { kind: "create" } | { kind: "detail"; roleId: string };

export default function Roles() {
  const {
    roles,
    grants,
    menuList,
    phase,
    error,
    load,
    create,
    update,
    setStatus,
    remove,
    loadGrants,
    saveGrants,
    clearGrants,
  } = useRoles();
  const { currentTenantId } = useAuth(CLIENT_ID);

  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  // Client 过滤（"" = 全部）
  const [filterClientId, setFilterClientId] = useState("");
  // 新建表单（client 清单=列表已出现 clientId 去重集 + 允许手输，已知取舍）
  const [createClientId, setCreateClientId] = useState("");
  const [createRoleCode, setCreateRoleCode] = useState("");
  const [createRoleName, setCreateRoleName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  // 编辑资料表单
  const [editRoleName, setEditRoleName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // 菜单授权勾选集合（grants 回显同步）
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);

  useEffect(() => {
    // account/tenants/members 页 .task 同构：进页拉角色列表（失败文案已落 hook error 态）
    void load();
  }, [load]);

  // 详情行从 roles 列表现查（setStatus/update 的原位替换渲染即跟随）
  const detailRole =
    mode.kind === "detail" ? roles.find((r) => r.id === mode.roleId) : undefined;

  // grants 回显 → 勾选集合（loadGrants/saveGrants/clearGrants 成功均更新 grants）
  useEffect(() => {
    if (grants) setSelectedMenuIds(grants.menuIds);
  }, [grants]);

  // 列表已出现 clientId 去重集（过滤 Picker + 新建 Picker 共用）
  const clientOptions: string[] = Array.from(new Set(roles.map((r) => r.clientId)));
  const filterRange = ["全部", ...clientOptions];
  const filteredRoles = filterClientId
    ? roles.filter((r) => r.clientId === filterClientId)
    : roles;

  const closeForm = () => setMode({ kind: "idle" });

  const openCreate = () => {
    setCreateClientId("");
    setCreateRoleCode("");
    setCreateRoleName("");
    setCreateDescription("");
    setMode({ kind: "create" });
  };

  const openDetail = (role: SysRole) => {
    setEditRoleName(role.roleName);
    setEditDescription(role.description ?? "");
    setSelectedMenuIds([]); // 等 grants 回显再同步，避免上一角色的勾选残留
    setMode({ kind: "detail", roleId: role.id });
    // 授权面板进详情即拉：grants（已授权回显）+ 该角色自身 client 的菜单清单
    void loadGrants(role.id, role.clientId);
  };

  const canSubmitCreate =
    createClientId.trim().length > 0 &&
    createRoleCode.trim().length > 0 &&
    createRoleName.trim().length > 0;
  const canSubmitEdit = editRoleName.trim().length > 0;

  const submitCreate = async () => {
    if (submitting || !canSubmitCreate) return;
    setSubmitting(true);
    const ok = await create(
      createClientId.trim(),
      createRoleCode.trim(),
      createRoleName.trim(),
      createDescription.trim() || undefined,
    );
    setSubmitting(false);
    if (ok) closeForm(); // 失败：表单保留可改，文案已落 hook error 态
  };

  const submitEdit = async () => {
    if (mode.kind !== "detail" || !detailRole || submitting) return;
    setSubmitting(true);
    // roleName/描述整体提交（描述清空 = 提交空串清除；roleCode 不可改，不在表单）
    await update(detailRole.id, editRoleName.trim(), editDescription.trim());
    setSubmitting(false);
  };

  const onToggleStatus = async (role: SysRole, value: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    // Int 口径：1=启用 0=停用（hook 同 PATCH 更新体）
    await setStatus(role.id, value ? 1 : 0);
    setSubmitting(false);
  };

  const onSaveGrants = async () => {
    if (mode.kind !== "detail" || submitting) return;
    setSubmitting(true);
    await saveGrants(mode.roleId, selectedMenuIds);
    setSubmitting(false);
  };

  const onClearGrants = async () => {
    if (mode.kind !== "detail" || submitting) return;
    const res = await Taro.showModal({
      title: `清空角色授权：${detailRole?.roleCode ?? ""}？`,
      content: "清空后该角色失去所有菜单访问，可重新勾选保存恢复",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    await clearGrants(mode.roleId);
    setSubmitting(false);
  };

  const onDelete = async () => {
    if (!detailRole || submitting) return;
    const res = await Taro.showModal({
      title: `删除 ${detailRole.roleCode}？`,
      content: "删除后引用该角色的成员绑定由后端规则裁决",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    const ok = await remove(detailRole.id);
    setSubmitting(false);
    if (ok) closeForm();
  };

  const toggleMenu = (menuId: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId],
    );
  };

  return (
    <View className="roles">
      <View className="roles-header">
        <Text className="roles-title">角色管理</Text>
        <Button className="roles-new" disabled={submitting} onClick={openCreate}>
          新建角色
        </Button>
      </View>

      {mode.kind === "idle" ? (
        <>
          <View className="roles-filter">
            <Text className="roles-filter-label">Client</Text>
            <Picker
              mode="selector"
              range={filterRange}
              disabled={submitting}
              onChange={(e) =>
                setFilterClientId(
                  Number(e.detail.value) === 0
                    ? ""
                    : (clientOptions[Number(e.detail.value) - 1] ?? ""),
                )
              }
            >
              <View className="roles-picker-value">{filterClientId || "全部"}</View>
            </Picker>
          </View>
          {filteredRoles.length === 0 ? (
            <Text className="roles-empty">{phase === "busy" ? "加载中…" : "无角色"}</Text>
          ) : (
            <View className="roles-list">
              {filteredRoles.map((role) => (
                <View
                  key={role.id}
                  className="roles-row"
                  onClick={() => openDetail(role)}
                >
                  <View className="roles-row-head">
                    <Text className="roles-row-code">{role.roleCode}</Text>
                    {role.isPreset ? (
                      <Text className="roles-row-preset">预设</Text>
                    ) : null}
                  </View>
                  <Text className="roles-row-meta">
                    {role.roleName} · {role.clientId} · {statusLabel(role.status)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}

      {mode.kind === "create" ? (
        <View className="roles-form">
          <Text className="roles-form-title">新建角色</Text>
          <View className="roles-field-group">
            <Text className="roles-field-label">Client（必选）</Text>
            <Picker
              mode="selector"
              range={clientOptions}
              disabled={submitting || clientOptions.length === 0}
              onChange={(e) =>
                setCreateClientId(clientOptions[Number(e.detail.value)] ?? "")
              }
            >
              <View className="roles-picker-value">
                {createClientId || "选择 client"}
              </View>
            </Picker>
            <Input
              className="roles-field"
              placeholder="选择或输入 client"
              value={createClientId}
              onInput={(e) => setCreateClientId(e.detail.value)}
            />
          </View>
          <Input
            className="roles-field"
            placeholder="roleCode（唯一标识）"
            value={createRoleCode}
            onInput={(e) => setCreateRoleCode(e.detail.value)}
          />
          <Input
            className="roles-field"
            placeholder="roleName（显示名）"
            value={createRoleName}
            onInput={(e) => setCreateRoleName(e.detail.value)}
          />
          <Input
            className="roles-field"
            placeholder="描述（选填）"
            value={createDescription}
            onInput={(e) => setCreateDescription(e.detail.value)}
          />
          <Button
            className="roles-save"
            disabled={submitting || !canSubmitCreate}
            onClick={submitCreate}
          >
            创建
          </Button>
          <Button className="roles-cancel" onClick={closeForm}>
            取消
          </Button>
        </View>
      ) : null}

      {mode.kind === "detail" && detailRole ? (
        <View className="roles-form">
          <Text className="roles-form-title">角色详情：{detailRole.roleCode}</Text>
          <View className="roles-readonly">
            <Text className="roles-readonly-row">roleCode：{detailRole.roleCode}</Text>
            <Text className="roles-readonly-row">roleName：{detailRole.roleName}</Text>
            <Text className="roles-readonly-row">Client：{detailRole.clientId}</Text>
            <Text className="roles-readonly-row">
              预设：{detailRole.isPreset ? "是" : "否"}
            </Text>
          </View>

          <View className="roles-status">
            <Text className="roles-status-label">启用</Text>
            <Switch
              checked={detailRole.status === 1}
              disabled={submitting}
              onChange={(e) => void onToggleStatus(detailRole, e.detail.value)}
            />
            <Text className="roles-status-value">{statusLabel(detailRole.status)}</Text>
          </View>

          <Text className="roles-section-title">编辑资料</Text>
          <Input
            className="roles-field"
            placeholder="roleName"
            value={editRoleName}
            onInput={(e) => setEditRoleName(e.detail.value)}
          />
          <Input
            className="roles-field"
            placeholder="描述"
            value={editDescription}
            onInput={(e) => setEditDescription(e.detail.value)}
          />
          <Button
            className="roles-save"
            disabled={submitting || !canSubmitEdit}
            onClick={submitEdit}
          >
            保存
          </Button>
          <Text className="roles-form-hint">roleCode 不可改（契约口径）</Text>

          <Text className="roles-section-title">菜单授权</Text>
          {menuList.length === 0 ? (
            <Text className="roles-empty">
              {phase === "busy" ? "加载中…" : "该 client 无菜单可授"}
            </Text>
          ) : (
            <View className="roles-menu-list">
              {menuList.map((menu) => {
                const checked = selectedMenuIds.includes(menu.id);
                return (
                  <View
                    key={menu.id}
                    className="roles-menu"
                    onClick={() => toggleMenu(menu.id)}
                  >
                    <Text className="roles-menu-check">{checked ? "✓" : "○"}</Text>
                    <Text className="roles-menu-title">{menu.title}</Text>
                    <Text className="roles-menu-path">{menu.path ?? menu.id}</Text>
                  </View>
                );
              })}
            </View>
          )}
          <Text className="roles-form-hint">
            勾选 = 授予该菜单；保存为全量替换（未勾选的会被移除）
          </Text>
          <Button
            className="roles-save"
            disabled={submitting}
            onClick={() => void onSaveGrants()}
          >
            保存授权
          </Button>
          <Button
            className="roles-danger"
            disabled={submitting}
            onClick={() => void onClearGrants()}
          >
            清空授权
          </Button>

          <Button
            className="roles-danger"
            disabled={submitting}
            onClick={() => void onDelete()}
          >
            删除角色
          </Button>
          <Button className="roles-cancel" onClick={closeForm}>
            返回
          </Button>
        </View>
      ) : null}

      {error ? <Text className="roles-error">{error}</Text> : null}
      <Text className="roles-footer">
        租户：{currentTenantId ?? "—"} · 过滤在前端做（列表全量拉取）
      </Text>
    </View>
  );
}
