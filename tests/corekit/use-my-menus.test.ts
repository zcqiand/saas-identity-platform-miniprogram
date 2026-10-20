// @vitest-environment jsdom
/**
 * useMyMenus 4 条 + 1 条工程设施（M04.F04.I08，knife4 Task 6 Step 1）：
 * mock 只在 seams——生成 MeApi 方法面注入 fake（反目标：不 mock 传输语义之外
 * 的东西）。React 18.3 act + react-dom/client 渲染探针，形状照 use-menus.test.ts
 * （knife4 T4）/ use-admin-clients.test.ts。
 *
 * wire 形状实录（生成物 MeApi.ts 实读，非猜测）：meGetMyMenus(requestParameters
 * = {}) 返回 `{ [key: string]: Array<EffectiveMenuNode> }`；clientId 可选——
 * runtime `if (requestParameters['clientId'] != null)` 才进 query，省参传 {}
 * 即不携带 clientId 键。
 *
 * 两套口径铁律（刀 4 Review Focus 第 5 条后半）：EffectiveMenuNode.children
 * 已是嵌套树，hook 直接承接响应体，禁过 buildMenuTree（零值 UUID 根桶口径只
 * 适用于 admin 平铺列表）——第 3 条用 parentId: null 的 fake 钉死「原样承接、
 * children 未被展平/未落根桶」。
 *
 * store 注入 stub：菜单是登录用户面（鉴权由生成 API config 承接），hook 无
 * store 消费面——stub 免触 Taro storage（session-store 构造路径）。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import type { EffectiveMenuNode } from "../../src/generated/models/EffectiveMenuNode";
import { SysMenuType } from "../../src/generated/models/SysMenuType";
import { ResponseError } from "../../src/generated/runtime";
import type { MyMenusSeams } from "../../src/corekit/use-my-menus";
import { useMyMenus } from "../../src/corekit/use-my-menus";
import type { SessionStore } from "../../src/corekit/session-store";
import { fnTest } from "../fn";

const CLIENT = "saas-console";

function node(over: Partial<EffectiveMenuNode> = {}): EffectiveMenuNode {
  return {
    id: "m1",
    clientId: CLIENT,
    parentId: null,
    title: "工作台",
    type: SysMenuType.Menu,
    path: "/workbench",
    sortOrder: 1,
    children: [],
    ...over,
  };
}

/** 生成 API fake（seams 缝级 mock，不 mock 传输）。 */
function makeSeams() {
  return {
    me: {
      meGetMyMenus: vi.fn(),
    },
  };
}
type SeamsFake = ReturnType<typeof makeSeams>;

/** store 本 hook 无消费面：stub 免触 Taro storage（只补 snapshot 形状）。 */
function stubStore(): SessionStore {
  return { snapshot: () => undefined } as unknown as SessionStore;
}

function renderUseMyMenus(options?: {
  seams?: MyMenusSeams;
  store?: SessionStore;
}): { current?: ReturnType<typeof useMyMenus> } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const ref: { current?: ReturnType<typeof useMyMenus> } = {};
  function Probe() {
    ref.current = useMyMenus({ store: stubStore(), ...options });
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

describe("useMyMenus（当前用户有效菜单，knife4 T6）", () => {
  let seams: SeamsFake;

  beforeEach(() => {
    seams = makeSeams();
  });

  function mount() {
    return renderUseMyMenus({ seams: seams as unknown as MyMenusSeams });
  }

  fnTest(
    ["M04.F04.I08"],
    "load 带 clientId → seam 收到 clientId 原样 + 响应体落 nodes + 返回 true、phase 回 idle",
    async () => {
      const body = { [CLIENT]: [node()] };
      seams.me.meGetMyMenus.mockResolvedValue(body);
      const hook = mount();
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.nodes).toBeNull();

      const out = await call(() => hook.current!.load(CLIENT));
      expect(out.value).toBe(true);
      expect(seams.me.meGetMyMenus).toHaveBeenCalledTimes(1);
      expect(seams.me.meGetMyMenus).toHaveBeenCalledWith({ clientId: CLIENT });
      expect(hook.current!.nodes).toEqual(body);
      expect(hook.current!.phase).toBe("idle");
      expect(hook.current!.error).toBeUndefined();
    },
  );

  fnTest(
    ["M04.F04.I08"],
    "load 省参 → seam 收到空对象、不携带 clientId 键（生成物 runtime != null 才进 query）",
    async () => {
      seams.me.meGetMyMenus.mockResolvedValue({ [CLIENT]: [] });
      const hook = mount();

      const out = await call(() => hook.current!.load());
      expect(out.value).toBe(true);
      expect(seams.me.meGetMyMenus).toHaveBeenCalledTimes(1);
      const arg = seams.me.meGetMyMenus.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
      expect(arg).toBeDefined();
      expect("clientId" in arg!).toBe(false);
      expect(seams.me.meGetMyMenus).toHaveBeenCalledWith({});
    },
  );

  fnTest(
    ["M04.F04.I08"],
    "nodes 原样承接响应体（两套口径铁律）：parentId null 的节点不落根桶不展平，children 嵌套原样保留",
    async () => {
      const child = node({
        id: "m1-1",
        parentId: "m1",
        title: "成员管理",
        type: SysMenuType.Menu,
        sortOrder: 1,
      });
      const root1 = node({ id: "m1", title: "工作台", children: [child] });
      const root2 = node({
        id: "m2",
        title: "系统",
        type: SysMenuType.Directory,
        sortOrder: 2,
        children: [],
      });
      const body: Record<string, EffectiveMenuNode[]> = {
        [CLIENT]: [root1, root2],
      };
      seams.me.meGetMyMenus.mockResolvedValue(body);
      const hook = mount();

      const out = await call(() => hook.current!.load(CLIENT));
      expect(out.value).toBe(true);
      // 响应体深等承接（未过 buildMenuTree：根桶不吸收 parentId 非零值的节点，
      // 平铺不入树——root2 的孩子数为 0，child 仍嵌在 root1.children 里）
      expect(hook.current!.nodes).toEqual(body);
      const roots = hook.current!.nodes![CLIENT] ?? [];
      expect(roots).toHaveLength(2);
      const first = roots[0];
      const second = roots[1];
      expect(first?.children).toEqual([child]);
      expect(first?.children[0]?.children).toEqual([]);
      expect(second?.children).toEqual([]);
    },
  );

  fnTest(
    ["M04.F04.I08"],
    "load 失败（seams reject 500）→ 返回 false + error 落 errorMessage 文案 + phase failed + 旧 nodes 保留",
    async () => {
      const body = { [CLIENT]: [node()] };
      seams.me.meGetMyMenus.mockResolvedValue(body);
      const hook = mount();
      const first = await call(() => hook.current!.load(CLIENT));
      expect(first.value).toBe(true);

      seams.me.meGetMyMenus.mockRejectedValue(
        new ResponseError(new Response(null, { status: 500 })),
      );
      const out = await call(() => hook.current!.load(CLIENT));
      expect(out.value).toBe(false);
      expect(hook.current!.nodes).toEqual(body);
      expect(hook.current!.error).toBe("请求失败（HTTP 500）");
      expect(hook.current!.phase).toBe("failed");
    },
  );

  // 工程设施测试，不挂业务功能 ID（fn.ts 纪律）
  it("无缝未注时 defaultSeams 走 currentConfig()，缺失 throw（照 use-auth 形状 fail-fast）", async () => {
    const hook = renderUseMyMenus(); // 不注 seams
    const out = await call(() => hook.current!.load());
    expect(out.ok).toBe(false);
    expect((out.value as Error).message).toContain("currentConfig() 缺失");
  });
});
