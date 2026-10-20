// @vitest-environment jsdom
/**
 * useMenus 9 条 + 2 条工程设施（M04.F04.I01/I02/I04/I05/I06/I07，knife4
 * Task 4 Step 1）：mock 只在 seams——生成 ClientMenusApi 方法面注入 fake（反
 * 目标：不 mock 传输语义之外的东西）。React 18.3 act + react-dom/client 渲染
 * 探针，形状照 use-admin-clients.test.ts / use-oauth.test.ts。
 *
 * wire 形状实录（生成物 ClientMenusApi.ts 实读，非猜测）：list 返回裸
 * Array<SysMenu>（jsonValue.map(SysMenuFromJSON)，无包装）、create/update/move
 * 返回 SysMenu、reorder 返回 Array<SysMenu>（hook 不消费，本地重排）、delete
 * 返回 void。
 *
 * store 注入 stub：菜单是 platform-admin 面（无租户作用域），hook 动作无
 * store 消费面——stub 免触 Taro storage（session-store 构造路径）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import type { SysMenu } from "../../src/generated";
import { SysMenuType } from "../../src/generated/models/SysMenuType";
import { ResponseError } from "../../src/generated/runtime";
import type { MenusSeams } from "../../src/corekit/use-menus";
import { useMenus } from "../../src/corekit/use-menus";
import { MENU_ROOT_PARENT_ID } from "../../src/corekit/menu-tree";
import type { SessionStore } from "../../src/corekit/session-store";
import { fnTest } from "../fn";

const D0 = new Date("2026-01-01T00:00:00Z");
const CLIENT = "saas-console";

function menu(over: Partial<SysMenu> = {}): SysMenu {
  return {
    id: "m1",
    clientId: CLIENT,
    parentId: MENU_ROOT_PARENT_ID,
    title: "菜单一",
    type: SysMenuType.Directory,
    sortOrder: 1,
    status: 1,
    createdAt: D0,
    ...over,
  };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    menus: {
      clientMenusListSysMenus: vi.fn(),
      clientMenusCreateSysMenu: vi.fn(),
      clientMenusUpdateSysMenu: vi.fn(),
      clientMenusMoveSysMenu: vi.fn(),
      clientMenusReorderSysMenus: vi.fn(),
      clientMenusDeleteSysMenu: vi.fn(),
    },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

/** store 本 hook 无消费面：stub 免触 Taro storage（只补 snapshot 形状）。 */
function stubStore(): SessionStore {
  return { snapshot: () => undefined } as unknown as SessionStore;
}

function renderUseMenus(options?: {
  seams?: MenusSeams;
  store?: SessionStore;
}): { current?: ReturnType<typeof useMenus> } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useMenus> } = {};
  function Probe() {
    ref.current = useMenus({ store: stubStore(), ...options });
    return null;
  }
  act(() => {
    root.render(createElement(Probe));
  });
  return ref;
}

/** 在 act 里跑一个动作，吞掉 rejection 供断言。 */
async function call(fn: () => Promise<unknown>): Promise<{ ok: boolean; value?: unknown }> {
  let out: { ok: boolean; value?: unknown } | undefined;
  await act(async () => {
    try {
      out = { ok: true, value: await fn() };
    } catch (e) {
      out = { ok: false, value: e };
    }
  });
  return out as { ok: boolean; value?: unknown };
}

describe("useMenus（菜单管理面，knife4 T4）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount() {
    return renderUseMenus({ seams: seams as unknown as MenusSeams });
  }

  /** 先 load 成功铺底，返回挂载好的 hook。 */
  async function loaded(items: SysMenu[]) {
    seams.menus.clientMenusListSysMenus.mockResolvedValue(items);
    const hook = mount();
    const out = await call(() => hook.current!.load(CLIENT));
    expect(out.value).toBe(true);
    seams.menus.clientMenusListSysMenus.mockClear();
    return { hook, items };
  }

  fnTest(
    ["M04.F04.I01"],
    "load 空 clientId 拒 → 返回 false + error「no client selected」+ 不发请求",
    async () => {
      const hook = mount();
      const out = await call(() => hook.current!.load(""));
      expect(out.value).toBe(false);
      expect(hook.current!.error).toBe("no client selected");
      expect(hook.current!.phase).toBe("failed");
      expect(seams.menus.clientMenusListSysMenus).not.toHaveBeenCalled();
    },
  );

  fnTest(
    ["M04.F04.I01"],
    "load 成功 → 请求带 { clientId }，wire 裸数组解包落 menus，tree 由 buildMenuTree 派生（层级 + 排序）",
    async () => {
      const parent = menu({ id: "p1", title: "系统管理", sortOrder: 1 });
      const child = menu({ id: "c1", parentId: "p1", title: "用户管理", sortOrder: 1 });
      const child2 = menu({ id: "c2", parentId: "p1", title: "角色管理", sortOrder: 2 });
      seams.menus.clientMenusListSysMenus.mockResolvedValue([child2, parent, child]);

      const hook = mount();
      expect(hook.current!.clientId).toBeNull();
      expect(hook.current!.menus).toEqual([]);

      const out = await call(() => hook.current!.load(CLIENT));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusListSysMenus).toHaveBeenCalledWith({ clientId: CLIENT });
      expect(hook.current!.clientId).toBe(CLIENT);
      // wire 裸数组原样落 state（不排序——排序是 tree 的职责）
      expect(hook.current!.menus).toEqual([child2, parent, child]);
      // tree 派生：根 + children 按 sortOrder 升序
      const tree = hook.current!.tree;
      expect(tree).toHaveLength(1);
      expect(tree[0]!.menu.id).toBe("p1");
      expect(tree[0]!.children.map((n) => n.menu.id)).toEqual(["c1", "c2"]);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
    },
  );

  fnTest(
    ["M04.F04.I02"],
    "create 成功 → 捕获体原样透传 + seam 返回的 SysMenu 原位追加且树含新节点",
    async () => {
      const parent = menu({ id: "p1", title: "系统管理" });
      const { hook } = await loaded([parent]);
      const created = menu({ id: "c9", parentId: "p1", title: "新建菜单", sortOrder: 5 });
      seams.menus.clientMenusCreateSysMenu.mockResolvedValue(created);

      const request = { parentId: "p1", title: "新建菜单", type: SysMenuType.Menu, sortOrder: 5 };
      const out = await call(() => hook.current!.create(CLIENT, request));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusCreateSysMenu).toHaveBeenCalledTimes(1);
      expect(seams.menus.clientMenusCreateSysMenu).toHaveBeenCalledWith({
        clientId: CLIENT,
        createSysMenuRequest: request,
      });
      // 原位追加，不重拉 list
      expect(seams.menus.clientMenusListSysMenus).not.toHaveBeenCalled();
      expect(hook.current!.menus).toEqual([parent, created]);
      // 树含新节点：挂在 p1 的 children 下
      expect(hook.current!.tree[0]!.children.map((n) => n.menu.id)).toContain("c9");
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F04.I04"],
    "update 成功 → 请求体只含请求字段（partial 不注入）+ 返回 SysMenu 按 id 原位替换",
    async () => {
      const rows = [
        menu({ id: "p1", title: "旧名" }),
        menu({ id: "p2", title: "另一条" }),
      ];
      const { hook } = await loaded(rows);
      const updated = menu({ id: "p1", title: "新名", status: 0 });
      seams.menus.clientMenusUpdateSysMenu.mockResolvedValue(updated);

      // partial：只传 title 一个键，hook 不补任何默认
      const request = { title: "新名" };
      const out = await call(() => hook.current!.update(CLIENT, "p1", request));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusUpdateSysMenu).toHaveBeenCalledWith({
        clientId: CLIENT,
        menuId: "p1",
        updateSysMenuRequest: request,
      });
      // 请求体只含请求字段：无多键注入
      const captured = seams.menus.clientMenusUpdateSysMenu.mock.calls[0]![0] as {
        updateSysMenuRequest: Record<string, unknown>;
      };
      expect(Object.keys(captured.updateSysMenuRequest)).toEqual(["title"]);
      expect(hook.current!.menus).toEqual([updated, rows[1]]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F04.I07"],
    "move null parentId 省键 → 请求体为空对象（无 parentId 键，移到根）",
    async () => {
      const { hook } = await loaded([menu({ id: "p1", title: "系统管理" })]);
      const moved = menu({ id: "p1", parentId: MENU_ROOT_PARENT_ID });
      seams.menus.clientMenusMoveSysMenu.mockResolvedValue(moved);

      const out = await call(() => hook.current!.move(CLIENT, "p1", null));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusMoveSysMenu).toHaveBeenCalledTimes(1);
      const captured = seams.menus.clientMenusMoveSysMenu.mock.calls[0]![0] as {
        clientMenusMoveSysMenuRequest: Record<string, unknown>;
      };
      expect(Object.prototype.hasOwnProperty.call(captured.clientMenusMoveSysMenuRequest, "parentId")).toBe(
        false,
      );
      expect(captured.clientMenusMoveSysMenuRequest).toEqual({});
    },
  );

  fnTest(
    ["M04.F04.I07"],
    "move 换父 → 返回 SysMenu（新 parentId）按 id 原位替换，树随新父子关系重派生",
    async () => {
      const oldParent = menu({ id: "p1", title: "旧父" });
      const newParent = menu({ id: "p2", title: "新父", sortOrder: 2 });
      const child = menu({ id: "c1", parentId: "p1", title: "子菜单" });
      const { hook } = await loaded([oldParent, newParent, child]);
      const moved = menu({ id: "c1", parentId: "p2", title: "子菜单" });
      seams.menus.clientMenusMoveSysMenu.mockResolvedValue(moved);

      const out = await call(() => hook.current!.move(CLIENT, "c1", "p2"));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusMoveSysMenu).toHaveBeenCalledWith({
        clientId: CLIENT,
        menuId: "c1",
        clientMenusMoveSysMenuRequest: { parentId: "p2" },
      });
      expect(hook.current!.menus).toEqual([oldParent, newParent, moved]);
      // 树重派生：c1 从 p1 下挪到 p2 下
      const tree = hook.current!.tree;
      expect(tree[0]!.children).toEqual([]);
      expect(tree[1]!.children.map((n) => n.menu.id)).toEqual(["c1"]);
    },
  );

  fnTest(
    ["M04.F04.I06"],
    "reorder 成功 → seam 收 orderedMenuIds 原样、不消费空数组响应，本地重排 sortOrder=index+1",
    async () => {
      const parent = menu({ id: "p1", title: "父" });
      const a = menu({ id: "a", parentId: "p1", title: "甲", sortOrder: 1 });
      const b = menu({ id: "b", parentId: "p1", title: "乙", sortOrder: 2 });
      const { hook } = await loaded([parent, a, b]);
      // 契约形状：服务端返回空数组（不消费）
      seams.menus.clientMenusReorderSysMenus.mockResolvedValue([]);

      const ordered = ["b", "a"];
      const out = await call(() => hook.current!.reorder(CLIENT, "p1", ordered));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusReorderSysMenus).toHaveBeenCalledWith({
        clientId: CLIENT,
        menuId: "p1",
        reorderSysMenuRequest: { orderedMenuIds: ordered },
      });
      // 本地重排：sortOrder = index + 1
      expect(hook.current!.menus.find((m) => m.id === "b")!.sortOrder).toBe(1);
      expect(hook.current!.menus.find((m) => m.id === "a")!.sortOrder).toBe(2);
      // 树序随重排翻转
      expect(hook.current!.tree[0]!.children.map((n) => n.menu.id)).toEqual(["b", "a"]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F04.I05"],
    "remove 成功 → 按 id 原位移除，孤儿子菜单自动挂根（树重派生）",
    async () => {
      const parent = menu({ id: "p1", title: "父", sortOrder: 1 });
      const child = menu({ id: "c1", parentId: "p1", title: "子", sortOrder: 2 });
      const { hook } = await loaded([parent, child]);
      seams.menus.clientMenusDeleteSysMenu.mockResolvedValue(undefined);

      const out = await call(() => hook.current!.remove(CLIENT, "p1"));
      expect(out.value).toBe(true);
      expect(seams.menus.clientMenusDeleteSysMenu).toHaveBeenCalledWith({
        clientId: CLIENT,
        menuId: "p1",
      });
      expect(hook.current!.menus).toEqual([child]);
      // 子成孤儿 → 挂根（「删除后子菜单挂根」语义）
      expect(hook.current!.tree.map((n) => n.menu.id)).toEqual(["c1"]);
      expect(hook.current!.phase).toBe("idle");
    },
  );

  fnTest(
    ["M04.F04.I01"],
    "换 client 未重载 → 动作拒（error「client 已切换，请重新加载」，不发请求）",
    async () => {
      const { hook } = await loaded([menu({ id: "p1" })]);

      const out = await call(() => hook.current!.remove("other-client", "p1"));
      expect(out.value).toBe(false);
      expect(hook.current!.error).toBe("client 已切换，请重新加载");
      expect(hook.current!.phase).toBe("failed");
      expect(seams.menus.clientMenusDeleteSysMenu).not.toHaveBeenCalled();
    },
  );

  fnTest(
    ["M04.F04.I01"],
    "load 失败（seams reject 500）→ 返回 false + error 落 errorMessage 文案 + phase failed + 旧列表保留",
    async () => {
      const { hook, items } = await loaded([menu({ id: "p1" })]);

      seams.menus.clientMenusListSysMenus.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const out = await call(() => hook.current!.load(CLIENT));
      expect(out.value).toBe(false);
      expect(hook.current!.menus).toEqual(items);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  // —— 工程设施测试，不挂业务功能 ID（fn.ts 纪律）——

  it("busy 期再入动作直接返回 false（busyRef 守卫，不发请求不覆盖错误态）", async () => {
    // deferred：首刷挂起占住 busy，收尾显式释放（never-resolve 会卡死 act 调度）
    let release: (list: SysMenu[]) => void = () => {};
    seams.menus.clientMenusListSysMenus.mockImplementation(
      () =>
        new Promise<SysMenu[]>((resolve) => {
          release = resolve;
        }),
    );
    const hook = mount();
    let first: Promise<boolean> | undefined;
    await act(async () => {
      first = hook.current!.load(CLIENT);
    });
    expect(hook.current!.phase).toBe("busy");

    const second = await call(() => hook.current!.load(CLIENT));
    expect(second.value).toBe(false);
    // 守卫发生在发请求前：第二次 load 没有真的打到 seam（seam 仍挂着首个 pending）
    expect(seams.menus.clientMenusListSysMenus).toHaveBeenCalledTimes(1);

    // 收尾：释放首个 pending，不留给 act 悬挂
    await act(async () => {
      release([]);
      await first;
    });
  });

  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 use-auth 形状 fail-fast）", async () => {
    const hook = renderUseMenus(); // 不注 seams（store 仍注 stub）
    const out = await call(() => hook.current!.load(CLIENT));
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});
