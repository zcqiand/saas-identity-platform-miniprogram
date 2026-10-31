// @entry M00.F02.I01-I08 — 成员角色页（swift MembersView 文案同构：列表 +
// 新建/邀请表单 + 编辑资料 + 状态切换 + 移出确认 + 角色分配全量覆盖视图）。
// 页面薄壳（T5 无测试义务）：只挂 useMembers 渲染表单，逻辑覆盖在 Task 4
// hook 测试。移出成员过 showModal 确认；恢复/挂起直调（状态切换非不可逆）。
import { useEffect, useState } from "react";
import { Button, Input, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { CLIENT_ID } from "../../config/client";
import type {
  SysRole,
  TenantMemberStatus,
  TenantMemberUserView,
} from "../../corekit/use-members";
import { useMembers } from "../../corekit/use-members";
import { useAuth } from "../../corekit/use-auth";
import "./index.scss";

// status 标签映射（brief verbatim）
const STATUS_LABEL: Record<TenantMemberStatus, string> = {
  active: "活跃",
  invited: "已邀请",
  suspended: "已挂起",
  disabled: "已禁用",
};

type Mode =
  | { kind: "idle" }
  | { kind: "create" }
  | { kind: "invite" }
  | { kind: "edit"; member: TenantMemberUserView }
  | { kind: "roles"; member: TenantMemberUserView };

export default function Members() {
  const {
    members,
    roles,
    phase,
    error,
    load,
    create,
    update,
    changeStatus,
    remove,
    invite,
    assignRoles,
  } = useMembers();
  const { currentTenantId } = useAuth(CLIENT_ID);

  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  // 新建表单
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createMobile, setCreateMobile] = useState("");
  // 邀请表单
  const [inviteEmail, setInviteEmail] = useState("");
  // 编辑资料表单（mobile 字段列表行不带，留空即不提交）
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  // 角色分配视图（勾选集合 = 最终角色集）
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  useEffect(() => {
    // account/tenants 页 .task 同构：进页拉成员+角色（失败文案已落 hook error 态）
    void load();
  }, [load]);

  const closeForm = () => setMode({ kind: "idle" });

  const openCreate = () => {
    setUsername("");
    setPassword("");
    setCreateEmail("");
    setCreateMobile("");
    setMode({ kind: "create" });
  };

  const openInvite = () => {
    setInviteEmail("");
    setMode({ kind: "invite" });
  };

  const openEdit = (member: TenantMemberUserView) => {
    setEditEmail(member.email ?? "");
    setEditMobile("");
    setMode({ kind: "edit", member });
  };

  const openRoles = (member: TenantMemberUserView) => {
    setSelectedRoleIds(member.roleIds);
    setMode({ kind: "roles", member });
  };

  const canSubmitCreate =
    username.trim().length > 0 && createEmail.trim().length > 0 && password.length >= 6;
  const canSubmitInvite = inviteEmail.trim().length > 0;

  const submitCreate = async () => {
    if (submitting || !canSubmitCreate) return;
    setSubmitting(true);
    const ok = await create(
      username.trim(),
      password,
      createEmail.trim(),
      createMobile.trim() || undefined,
    );
    setSubmitting(false);
    if (ok) closeForm(); // 失败：表单保留可改，文案已落 hook error 态
  };

  const submitInvite = async () => {
    if (submitting || !canSubmitInvite) return;
    setSubmitting(true);
    const ok = await invite(inviteEmail.trim());
    setSubmitting(false);
    if (ok) closeForm();
  };

  const submitEdit = async () => {
    if (mode.kind !== "edit" || submitting) return;
    setSubmitting(true);
    // 留空的字段不提交（undefined 不进 PATCH 请求体，hook partial 语义）
    const ok = await update(
      mode.member.id,
      editEmail.trim() || undefined,
      editMobile.trim() || undefined,
    );
    setSubmitting(false);
    if (ok) closeForm();
  };

  const onToggleStatus = async (member: TenantMemberUserView) => {
    if (submitting) return;
    // active/invited → 挂起；suspended/disabled → 恢复（按当前状态二选一，直调）
    const target: TenantMemberStatus =
      member.status === "active" || member.status === "invited" ? "suspended" : "active";
    setSubmitting(true);
    await changeStatus(member.id, target);
    setSubmitting(false);
  };

  const onRemove = async (member: TenantMemberUserView) => {
    if (submitting) return;
    const res = await Taro.showModal({
      title: `移出 ${member.username}？`,
      content: "仅解除该租户的成员关系，全局账号保留",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    await remove(member.id);
    setSubmitting(false);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const submitRoles = async () => {
    if (mode.kind !== "roles" || submitting) return;
    setSubmitting(true);
    const ok = await assignRoles(selectedRoleIds, mode.member.id);
    setSubmitting(false);
    if (ok) closeForm();
  };

  const onOpenActions = async (member: TenantMemberUserView) => {
    if (submitting) return;
    const canSuspend = member.status === "active" || member.status === "invited";
    try {
      const res = await Taro.showActionSheet({
        itemList: [
          "查看/编辑资料",
          canSuspend ? "挂起" : "恢复",
          "移出当前租户",
          "角色分配",
        ],
      });
      if (res.tapIndex === 0) openEdit(member);
      else if (res.tapIndex === 1) void onToggleStatus(member);
      else if (res.tapIndex === 2) void onRemove(member);
      else if (res.tapIndex === 3) openRoles(member);
    } catch {
      // 取消 action sheet：不动作
    }
  };

  const onPlus = async () => {
    if (submitting) return;
    try {
      const res = await Taro.showActionSheet({
        itemList: ["新建成员", "邀请成员"],
      });
      if (res.tapIndex === 0) openCreate();
      else if (res.tapIndex === 1) openInvite();
    } catch {
      // 取消 action sheet：不动作
    }
  };

  return (
    <View className="members">
      <View className="members-header">
        <Text className="members-title">成员角色</Text>
        <Button className="members-plus" disabled={submitting} onClick={onPlus}>
          +
        </Button>
      </View>

      {mode.kind === "idle" ? (
        members.length === 0 ? (
          <Text className="members-empty">{phase === "busy" ? "加载中…" : "无成员"}</Text>
        ) : (
          <View className="members-list">
            {members.map((m) => (
              <View
                key={m.id}
                className="members-row"
                onClick={() => void onOpenActions(m)}
              >
                <Text className="members-row-name">{m.username}</Text>
                <Text className="members-row-meta">
                  角色 {m.roleIds.length} 个 · {STATUS_LABEL[m.status]}
                </Text>
              </View>
            ))}
          </View>
        )
      ) : null}

      {mode.kind === "create" ? (
        <View className="members-form">
          <Text className="members-form-title">新建成员</Text>
          <Input
            className="members-field"
            placeholder="用户名"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
          <Input
            className="members-field"
            password
            placeholder="密码（至少 6 位）"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
          <Input
            className="members-field"
            placeholder="邮箱（必填）"
            value={createEmail}
            onInput={(e) => setCreateEmail(e.detail.value)}
          />
          <Input
            className="members-field"
            placeholder="手机号（选填）"
            value={createMobile}
            onInput={(e) => setCreateMobile(e.detail.value)}
          />
          <Button
            className="members-save"
            disabled={submitting || !canSubmitCreate}
            onClick={submitCreate}
          >
            保存
          </Button>
          <Button className="members-cancel" onClick={closeForm}>
            取消
          </Button>
        </View>
      ) : null}

      {mode.kind === "invite" ? (
        <View className="members-form">
          <Text className="members-form-title">邀请成员</Text>
          <Input
            className="members-field"
            placeholder="邮箱（必填）"
            value={inviteEmail}
            onInput={(e) => setInviteEmail(e.detail.value)}
          />
          <Button
            className="members-save"
            disabled={submitting || !canSubmitInvite}
            onClick={submitInvite}
          >
            发送邀请
          </Button>
          <Button className="members-cancel" onClick={closeForm}>
            取消
          </Button>
        </View>
      ) : null}

      {mode.kind === "edit" ? (
        <View className="members-form">
          <Text className="members-form-title">
            查看/编辑资料：{mode.member.username}
          </Text>
          <Input
            className="members-field"
            placeholder="邮箱"
            value={editEmail}
            onInput={(e) => setEditEmail(e.detail.value)}
          />
          <Input
            className="members-field"
            placeholder="手机号"
            value={editMobile}
            onInput={(e) => setEditMobile(e.detail.value)}
          />
          <Text className="members-form-hint">留空的字段不提交</Text>
          <Button className="members-save" disabled={submitting} onClick={submitEdit}>
            保存
          </Button>
          <Button className="members-cancel" onClick={closeForm}>
            取消
          </Button>
        </View>
      ) : null}

      {mode.kind === "roles" ? (
        <View className="members-form">
          <Text className="members-form-title">角色分配：{mode.member.username}</Text>
          {roles.length === 0 ? (
            <Text className="members-empty">
              {phase === "busy" ? "加载中…" : "无角色"}
            </Text>
          ) : (
            roles.map((role: SysRole) => {
              const checked = selectedRoleIds.includes(role.id);
              return (
                <View
                  key={role.id}
                  className="members-role"
                  onClick={() => toggleRole(role.id)}
                >
                  <Text className="members-role-check">{checked ? "✓" : "○"}</Text>
                  <Text className="members-role-name">{role.roleName}</Text>
                  <Text className="members-role-code">{role.roleCode}</Text>
                </View>
              );
            })
          )}
          <Text className="members-form-hint">
            保存为全量覆盖：提交的勾选集合就是该成员的最终角色集
          </Text>
          <Button className="members-save" disabled={submitting} onClick={submitRoles}>
            保存
          </Button>
          <Button className="members-cancel" onClick={closeForm}>
            取消
          </Button>
        </View>
      ) : null}

      {error ? <Text className="members-error">{error}</Text> : null}
      <Text className="members-footer">租户：{currentTenantId ?? "—"}</Text>
    </View>
  );
}
