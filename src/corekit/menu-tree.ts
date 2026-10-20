import type { SysMenu } from "../generated";

/**
 * buildMenuTree——菜单组树纯函数（knife4 Task 4，M04.F04 菜单管理切片），
 * 镜像 swift `MenuTree.swift`（REQ-2026-008 T-1，live 探针实证 2026-10-01
 * @5101 口径）：
 * - CRUD 平铺列表根节点 parentId = 零值 UUID（…0000），与 /me/menus 的 null
 *   是两套口径（后者不在本切片，见 swift MenuTree.swift 头注）
 * - 兄弟按 sortOrder 升序；同序 tie-break 按 title 升序（确定性渲染）
 * - 孤儿（父不在集合内）挂根，不让数据无声消失（服务端孤儿只在并发删除时
 *   瞬时出现）
 * - 空列表返回空数组
 *
 * 纯函数无副作用：每次调用重派生（hook 侧 useMemo 按 menus 缓存即可）。
 * 环路 parentId（a→b→a）与 swift 同构处理——桶里能取到就递归，但不在任何
 * 根的闭环节点不出现（不额外做环检测，镜像 swift 行为）。
 */

/** 零值 UUID：CRUD 平铺列表的根 parent 哨兵。 */
export const MENU_ROOT_PARENT_ID = "00000000-0000-0000-0000-000000000000";

/** 树节点：menu + 有序 children（叶子 children 为空数组）。 */
export interface MenuNode {
  menu: SysMenu;
  children: MenuNode[];
}

/** 组树：零值 UUID = 根；兄弟 sortOrder 升序，tie-break title；孤儿挂根。 */
export function buildMenuTree(menus: SysMenu[]): MenuNode[] {
  // 父 id 存在性用 Set（孤儿判定 O(1)，语义 = swift byId[parentId] == nil）
  const ids = new Set(menus.map((m) => m.id));

  const childrenByParent = new Map<string, SysMenu[]>();
  const roots: SysMenu[] = [];
  for (const menu of menus) {
    if (menu.parentId === MENU_ROOT_PARENT_ID || !ids.has(menu.parentId)) {
      roots.push(menu);
    } else {
      const bucket = childrenByParent.get(menu.parentId);
      if (bucket) {
        bucket.push(menu);
      } else {
        childrenByParent.set(menu.parentId, [menu]);
      }
    }
  }

  // (sortOrder, title) 双键排序：sortOrder 升序，同序 title 升序。
  // 码点序比较（不走 localeCompare——locale 相关性会破坏跨端确定性）
  const compare = (a: SysMenu, b: SysMenu): number =>
    a.sortOrder - b.sortOrder || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0);

  const node = (menu: SysMenu): MenuNode => ({
    menu,
    children: (childrenByParent.get(menu.id) ?? []).sort(compare).map(node),
  });

  return roots.sort(compare).map(node);
}
