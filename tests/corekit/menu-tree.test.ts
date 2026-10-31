/**
 * buildMenuTree 纯函数 5 条（knife4 Task 4 Step 1）：镜像 swift MenuTree.swift
 * 口径（live 探针实证 2026-10-01 @5101）——零值 UUID=根桶、parentId 挂父、
 * (sortOrder 升序, title 升序) 双键排序、孤儿挂根、空入空出。
 *
 * 纯组树基建不挂业务功能 ID（fn.ts 纪律：工程设施的测试不挂 ID）——I01
 * 「含层级结构」的消费面断言打在 use-menus.test.ts 的 load 用例上（tree 落地）。
 */
import { describe, expect, it } from "vitest";

import type { SysMenu } from "../../src/generated";
import { SysMenuType } from "../../src/generated/models/SysMenuType";
import { MENU_ROOT_PARENT_ID, buildMenuTree } from "../../src/corekit/menu-tree";

const D0 = new Date("2026-01-01T00:00:00Z");

function menu(over: Partial<SysMenu> = {}): SysMenu {
  return {
    id: "m1",
    clientId: "saas-console",
    parentId: MENU_ROOT_PARENT_ID,
    title: "菜单一",
    type: SysMenuType.Directory,
    sortOrder: 1,
    status: 1,
    createdAt: D0,
    ...over,
  };
}

describe("buildMenuTree（零值 UUID=根，镜像 swift MenuTree.swift）", () => {
  it("零值 UUID parentId 挂根", () => {
    const root = menu({ id: "root1", parentId: MENU_ROOT_PARENT_ID });
    const tree = buildMenuTree([root]);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.menu.id).toBe("root1");
    expect(tree[0]!.children).toEqual([]);
  });

  it("子按 parentId 挂到对应父节点的 children", () => {
    const parent = menu({ id: "p1", title: "系统管理" });
    const child = menu({
      id: "c1",
      parentId: "p1",
      title: "用户管理",
      type: SysMenuType.Menu,
    });
    const grandchild = menu({
      id: "g1",
      parentId: "c1",
      title: "详情",
      type: SysMenuType.Button,
    });
    const tree = buildMenuTree([parent, child, grandchild]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.menu.id).toBe("p1");
    expect(tree[0]!.children.map((n) => n.menu.id)).toEqual(["c1"]);
    expect(tree[0]!.children[0]!.children.map((n) => n.menu.id)).toEqual(["g1"]);
  });

  it("兄弟按 sortOrder 升序，同序 tie-break 按 title 升序", () => {
    const parent = menu({ id: "p1" });
    const b = menu({ id: "b", parentId: "p1", title: "bbb", sortOrder: 2 });
    const c = menu({ id: "c", parentId: "p1", title: "ccc", sortOrder: 2 });
    const a = menu({ id: "a", parentId: "p1", title: "aaa", sortOrder: 3 });
    const tree = buildMenuTree([parent, b, c, a]);
    // sortOrder 2 的 bbb/ccc 先于 sortOrder 3 的 aaa；同序内 title 升序 bbb < ccc
    expect(tree[0]!.children.map((n) => n.menu.id)).toEqual(["b", "c", "a"]);
  });

  it("孤儿（parentId 指向集合中不存在的 id）挂根，不让数据无声消失", () => {
    const root = menu({ id: "root1", sortOrder: 1 });
    const orphan = menu({
      id: "orphan",
      parentId: "ghost-parent",
      title: "孤儿",
      sortOrder: 2,
    });
    const tree = buildMenuTree([root, orphan]);
    expect(tree.map((n) => n.menu.id)).toEqual(["root1", "orphan"]);
    expect(tree[1]!.children).toEqual([]);
  });

  it("空列表返回空数组", () => {
    expect(buildMenuTree([])).toEqual([]);
  });
});
