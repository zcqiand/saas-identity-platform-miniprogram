// @entry M04.F04 — 菜单管理页（knife4 T5，swift MenusAdminView 同构）：client
// Picker + 菜单树 + 新建/编辑/删除/同级排序。页面薄壳（无测试义务）：只挂
// useMenus + useAdminClients 渲染，逻辑覆盖在 Task 4 hook 测试；禁直调生成物。
//
// 平台适配（swift → 小程序）：
// - 树渲染选型：递归组件直渲染 MenuNode.children（不拍平）——零值 UUID=根、
//   sortOrder 排序语义在缩进层级里视觉可读，组件 10 行内收口
// - 编辑/新建视图选型：同页表单区（照 admin-clients 页 mode 形态最稳）——
//   NavigationLink/sheet 不适用；编辑行从 vm.menus 现查（单一真源，镜像
//   swift `current`），原位替换渲染即跟随
// - 兄弟排序：swift 长按 contextMenu 适配为行内 上移/下移 按钮；根级不渲染
//   （契约 reorder 以父菜单 id 寻址，根段无父路径 id）——reorder 第二参传
//   **父菜单 id**（URL /menus/{parentMenuId}/reorder），非被排序节点自身
// - 保存缝纪律（T4 评审盯防项）：父菜单变更唯一走 move；字段走 update 且
//   请求体**绝不传 parentId**（生成物虽有该字段，页面层禁用）；一次保存
//   两步并存时先 move 后 update，任一失败即停
import { Fragment, useEffect, useState } from "react";
import { Button, Input, Picker, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { SysMenuType } from "../../generated";
import { useAdminClients } from "../../corekit/use-admin-clients";
import type { MenuNode, SysMenu } from "../../corekit/use-menus";
import { MENU_ROOT_PARENT_ID, useMenus } from "../../corekit/use-menus";
import "./index.scss";

// status Int 映射（admin-clients/roles 同口径）：1=启用 否则=停用
const statusLabel = (status: number): string => (status === 1 ? "启用" : "停用");

// 父菜单 Picker 选中值口径："" = 根（零值 UUID），否则 directory id
const parentKeyOf = (menu: SysMenu): string =>
  menu.parentId === MENU_ROOT_PARENT_ID ? "" : menu.parentId;

// 兄弟段比较键：照 buildMenuTree 同款 (sortOrder, title) 双键（码点序）
const compareMenu = (a: SysMenu, b: SysMenu): number =>
  a.sortOrder - b.sortOrder || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);

type Mode = { kind: "idle" } | { kind: "create" } | { kind: "edit"; menuId: string };

// 新建表单类型 Picker 选项（默认 menu）
const TYPE_OPTIONS: Array<{ label: string; value: SysMenuType }> = [
  { label: "目录 directory", value: SysMenuType.Directory },
  { label: "菜单 menu", value: SysMenuType.Menu },
  { label: "按钮 button", value: SysMenuType.Button },
];

// 树渲染：递归组件直渲染 MenuNode（叶子 children 空数组自然收口）
function MenuTreeRows(props: {
  nodes: MenuNode[];
  depth: number;
  busy: boolean;
  onOpen: (menu: SysMenu) => void;
  onMove: (menu: SysMenu, delta: number) => void;
}) {
  const { nodes, depth, busy, onOpen, onMove } = props;
  // 深度优先（修复轮 1，I-2）：单层 map——每个 node 渲染行后紧接渲染该 node
  // 的 children 递归块（同 map 体内），保证父子邻接（根 [A,B]、A 有子 A1 时
  // 输出 A, A1, B，随 swift OutlineGroup）
  return (
    <>
      {nodes.map((node) => {
        const menu = node.menu;
        const isRoot = menu.parentId === MENU_ROOT_PARENT_ID;
        return (
          <Fragment key={menu.id}>
            <View className="menus-row" style={{ paddingLeft: `${depth * 32}px` }}>
              <View className="menus-row-main" onClick={() => onOpen(menu)}>
                <View className="menus-row-text">
                  <Text className="menus-row-title">{menu.title}</Text>
                  <Text className="menus-row-meta">
                    {menu.type} · {menu.path ?? "—"}
                  </Text>
                </View>
                <Text className={menu.status === 1 ? "menus-badge menus-badge-on" : "menus-badge"}>
                  {statusLabel(menu.status)}
                </Text>
              </View>
              {isRoot ? null : (
                <View className="menus-row-actions">
                  <Button
                    className="menus-move"
                    disabled={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(menu, -1);
                    }}
                  >
                    上移
                  </Button>
                  <Button
                    className="menus-move"
                    disabled={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(menu, +1);
                    }}
                  >
                    下移
                  </Button>
                </View>
              )}
            </View>
            {node.children.length === 0 ? null : (
              <MenuTreeRows
                nodes={node.children}
                depth={depth + 1}
                busy={busy}
                onOpen={onOpen}
                onMove={onMove}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export default function Menus() {
  const { clientId, menus, tree, phase, error, load, create, update, move, reorder, remove } =
    useMenus();
  const { clients, load: loadClients } = useAdminClients();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);

  // 新建表单（类型默认 menu、父菜单默认根、排序值默认 "1"）
  const [newTitle, setNewTitle] = useState("");
  const [newTypeIndex, setNewTypeIndex] = useState(1);
  const [newPath, setNewPath] = useState("");
  const [newParentKey, setNewParentKey] = useState("");
  const [newSortOrderText, setNewSortOrderText] = useState("1");

  // 编辑表单（进编辑以现状为起点：move/update 双缝提交）
  const [editTitle, setEditTitle] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editStatus, setEditStatus] = useState(1);
  const [editParentKey, setEditParentKey] = useState("");

  useEffect(() => {
    // swift .task 同构：进页拉 client 列表（Picker 数据源；失败落 hook error 态）
    void loadClients();
  }, [loadClients]);

  const busy = submitting || phase === "busy";

  // 编辑行从 menus 现查（单一真源：move/update 原位替换渲染即跟随；取不到
  // = 已被删除，编辑段不渲染）
  const editing =
    mode.kind === "edit" ? menus.find((m) => m.id === mode.menuId) : undefined;

  // 新建父菜单选项：根 + 全部 directory（照 swift MenuCreateView.parentOptions）
  const createParentOptions = menus.filter((m) => m.type === SysMenuType.Directory);
  // 编辑父菜单选项：根 + 除自身外全部 directory（防自环；后代过滤不在此层）
  const editParentOptions = editing
    ? menus.filter((m) => m.type === SysMenuType.Directory && m.id !== editing.id)
    : [];

  const onSelectClient = (index: number) => {
    const cid = clients[index]?.clientId;
    if (!cid || cid === selectedClientId) return;
    setSelectedClientId(cid);
    setMode({ kind: "idle" });
    void load(cid);
  };

  // 兄弟段 = 同 parentId 按 (sortOrder,title) 排序；swap 相邻两 id 调 reorder
  // （第二参传父菜单 id——契约以父菜单 id 寻址，根级不提供此操作）
  const onMove = (menu: SysMenu, delta: number) => {
    if (!clientId || busy) return;
    const segment = menus
      .filter((m) => m.parentId === menu.parentId)
      .sort(compareMenu);
    const index = segment.findIndex((m) => m.id === menu.id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= segment.length) return;
    const ids = segment.map((m) => m.id);
    const swapped = ids[index];
    ids[index] = ids[target];
    ids[target] = swapped;
    void reorder(clientId, menu.parentId, ids);
  };

  const openCreate = () => {
    setNewTitle("");
    setNewTypeIndex(1);
    setNewPath("");
    setNewParentKey("");
    setNewSortOrderText("1");
    setMode({ kind: "create" });
  };

  const openEdit = (menu: SysMenu) => {
    setEditTitle(menu.title);
    setEditPath(menu.path ?? "");
    setEditStatus(menu.status);
    setEditParentKey(parentKeyOf(menu));
    setMode({ kind: "edit", menuId: menu.id });
  };

  const canSubmitCreate = newTitle.trim().length > 0;

  const submitCreate = async () => {
    if (mode.kind !== "create" || !clientId || busy || !canSubmitCreate) return;
    setSubmitting(true);
    const parsedSortOrder = Number.parseInt(newSortOrderText, 10);
    const ok = await create(clientId, {
      // 根 = 省键（照 swift 传 nil；服务端落零值 UUID）
      parentId: newParentKey === "" ? undefined : newParentKey,
      title: newTitle.trim(),
      type: TYPE_OPTIONS[newTypeIndex].value,
      path: newPath.trim() ? newPath.trim() : undefined,
      sortOrder: Number.isNaN(parsedSortOrder) ? undefined : parsedSortOrder,
    });
    setSubmitting(false);
    if (ok) setMode({ kind: "idle" }); // 失败：表单保留可改，文案已落 hook error 态
  };

  // 保存缝纪律：父菜单变更先 move（唯一结构缝）；字段走 update 且请求体
  // 绝不传 parentId；两步并存先 move 后 update，任一失败即停（ok 短路）
  const onSaveEdit = async () => {
    if (mode.kind !== "edit" || !editing || !clientId || busy) return;
    setSubmitting(true);
    let ok = true;
    if (editParentKey !== parentKeyOf(editing)) {
      ok = await move(clientId, editing.id, editParentKey === "" ? null : editParentKey);
    }
    if (ok) {
      ok = await update(clientId, editing.id, {
        title: editTitle,
        path: editPath.trim() ? editPath.trim() : undefined,
        status: editStatus,
      });
    }
    setSubmitting(false);
    if (ok) setMode({ kind: "idle" });
  };

  const onDelete = async () => {
    if (mode.kind !== "edit" || !editing || !clientId || busy) return;
    const res = await Taro.showModal({
      title: `删除 ${editing.title}？`,
      content: "子菜单将失去父级（渲染时挂根），不可恢复",
      confirmText: "删除",
    });
    if (!res.confirm) return;
    setSubmitting(true);
    const ok = await remove(clientId, editing.id);
    setSubmitting(false);
    if (ok) setMode({ kind: "idle" }); // 成功：行已原位移除，回列表
  };

  return (
    <View className="menus">
      <View className="menus-header">
        <Text className="menus-title">菜单管理</Text>
        <Button className="menus-new" disabled={!selectedClientId || busy} onClick={openCreate}>
          新建菜单
        </Button>
      </View>

      {mode.kind === "idle" ? (
        <>
          <Text className="menus-section-header">菜单（client 维度）</Text>
          <View className="menus-picker-row">
            <Text className="menus-picker-label">Client</Text>
            <Picker
              mode="selector"
              range={clients.map((c) => c.clientId)}
              disabled={busy || clients.length === 0}
              onChange={(e) => onSelectClient(Number(e.detail.value))}
            >
              <View className="menus-picker-value">
                {selectedClientId || "选择 client"}
              </View>
            </Picker>
          </View>

          {selectedClientId ? (
            <>
              {menus.length === 0 ? (
                <Text className="menus-empty">
                  {phase === "busy" ? "加载中…" : "该 client 无菜单"}
                </Text>
              ) : (
                <View className="menus-tree">
                  <MenuTreeRows
                    nodes={tree}
                    depth={0}
                    busy={busy}
                    onOpen={openEdit}
                    onMove={onMove}
                  />
                </View>
              )}
              <Text className="menus-footer">
                共 {menus.length} 条 · 树由前端组（零值 UUID=根，sortOrder 排序）· 兄弟排序：行内
                上移/下移（根级不提供——契约 reorder 以父菜单 id 寻址）
              </Text>
            </>
          ) : null}
        </>
      ) : null}

      {mode.kind === "create" ? (
        <View className="menus-form">
          <Text className="menus-form-title">新建菜单</Text>
          <View className="menus-field-group">
            <Text className="menus-field-label">标题（必填）</Text>
            <Input
              className="menus-input"
              value={newTitle}
              disabled={busy}
              onInput={(e) => setNewTitle(e.detail.value)}
            />
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">类型</Text>
            <Picker
              mode="selector"
              range={TYPE_OPTIONS.map((t) => t.label)}
              disabled={busy}
              onChange={(e) => setNewTypeIndex(Number(e.detail.value))}
            >
              <View className="menus-picker-value">
                {TYPE_OPTIONS[newTypeIndex].label}
              </View>
            </Picker>
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">路径（可空）</Text>
            <Input
              className="menus-input"
              value={newPath}
              disabled={busy}
              onInput={(e) => setNewPath(e.detail.value)}
            />
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">父菜单</Text>
            <Picker
              mode="selector"
              range={["根", ...createParentOptions.map((m) => m.title)]}
              disabled={busy}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setNewParentKey(index === 0 ? "" : (createParentOptions[index - 1]?.id ?? ""));
              }}
            >
              <View className="menus-picker-value">
                {newParentKey === ""
                  ? "根"
                  : (createParentOptions.find((m) => m.id === newParentKey)?.title ?? "根")}
              </View>
            </Picker>
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">排序值</Text>
            <Input
              className="menus-input"
              value={newSortOrderText}
              disabled={busy}
              onInput={(e) => setNewSortOrderText(e.detail.value)}
            />
          </View>
          <Text className="menus-form-hint">
            父菜单选「根」= 平铺列表的零值 UUID；创建后原位追加进树
          </Text>
          <Button
            className="menus-save"
            disabled={busy || !canSubmitCreate}
            onClick={() => void submitCreate()}
          >
            创建
          </Button>
          <Button className="menus-cancel" onClick={() => setMode({ kind: "idle" })}>
            取消
          </Button>
        </View>
      ) : null}

      {mode.kind === "edit" && editing ? (
        <View className="menus-form">
          <Text className="menus-form-title">{editing.title}</Text>

          <Text className="menus-section-title">详情（只读）</Text>
          <View className="menus-readonly">
            <Text className="menus-readonly-row">id：{editing.id}</Text>
            <Text className="menus-readonly-row">clientId：{editing.clientId}</Text>
            <Text className="menus-readonly-row">type：{editing.type}</Text>
          </View>

          <Text className="menus-section-title">编辑</Text>
          <View className="menus-field-group">
            <Text className="menus-field-label">标题</Text>
            <Input
              className="menus-input"
              value={editTitle}
              disabled={busy}
              onInput={(e) => setEditTitle(e.detail.value)}
            />
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">路径（可空）</Text>
            <Input
              className="menus-input"
              value={editPath}
              disabled={busy}
              onInput={(e) => setEditPath(e.detail.value)}
            />
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">状态</Text>
            <Picker
              mode="selector"
              range={["启用", "停用"]}
              disabled={busy}
              onChange={(e) => setEditStatus(Number(e.detail.value) === 0 ? 0 : 1)}
            >
              <View className="menus-picker-value">{statusLabel(editStatus)}</View>
            </Picker>
          </View>
          <View className="menus-field-group">
            <Text className="menus-field-label">父菜单</Text>
            <Picker
              mode="selector"
              range={["根", ...editParentOptions.map((m) => m.title)]}
              disabled={busy}
              onChange={(e) => {
                const index = Number(e.detail.value);
                setEditParentKey(index === 0 ? "" : (editParentOptions[index - 1]?.id ?? ""));
              }}
            >
              <View className="menus-picker-value">
                {editParentKey === ""
                  ? "根"
                  : (editParentOptions.find((m) => m.id === editParentKey)?.title ?? "根")}
              </View>
            </Picker>
          </View>
          <Text className="menus-form-hint">
            父节点变更走 move 缝（PATCH parent）；其余字段走 update（PATCH partial）
          </Text>
          <Button className="menus-save" disabled={busy} onClick={() => void onSaveEdit()}>
            保存
          </Button>

          <Text className="menus-section-title">危险区</Text>
          <Button className="menus-danger" disabled={busy} onClick={() => void onDelete()}>
            删除菜单
          </Button>
          <Text className="menus-form-hint">删除是危险操作，不可恢复</Text>

          <Button className="menus-cancel" onClick={() => setMode({ kind: "idle" })}>
            返回
          </Button>
        </View>
      ) : null}

      {error ? <Text className="menus-error">{error}</Text> : null}
    </View>
  );
}
