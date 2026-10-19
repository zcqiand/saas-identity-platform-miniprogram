// react-dom 无自带类型、@types/react-dom 非本仓依赖（禁新增依赖）——use-auth
// 渲染探针只用这两个面，本地声明最小缝。环境声明放独立 .d.ts（同文件内
// declare module 会因该文件自己也 import 此模块而升级成 augmentation 报 TS2665）。
declare module "react-dom/client" {
  import type { ReactNode } from "react";
  export interface Root {
    render(node: ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}
