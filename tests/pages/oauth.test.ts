// @vitest-environment jsdom
/**
 * OAuth 页面薄壳——禁用语义钉子（终审 I-1，swift OAuthView.swift:37 parity）：
 * 授权码一次性，exchangeCode 失败（码已被服务端消费）后 code 仍非 null——若
 * 第一步按钮加码禁用（code !== null），用户即永久死端。故授权按钮只
 * disabled={busy}，重签永可达；后两卡 busy / 无 code / 无 refreshToken 各拦
 * 各卡不变（swift :59/:74）。工程设施钉子不挂业务功能 ID（fn.ts 纪律）；
 * hook 逻辑覆盖在 tests/corekit/use-oauth.test.ts。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { createRoot } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const buttonProps = vi.hoisted(
  () => [] as Array<Record<string, unknown>>,
);

// 平台组件缝：View/Text 透传 children 保渲染链，Button 只捕 props——禁用语义
// 直接断言 props.disabled，不探 Taro 组件 DOM 形状。
vi.mock("@tarojs/components", async () => {
  const { Fragment, createElement } = await import("react");
  const passthrough = ({ children }: { children?: ReactNode }): ReactElement =>
    createElement(Fragment, null, children);
  return {
    View: passthrough,
    Text: passthrough,
    Button: (props: Record<string, unknown>): null => {
      buttonProps.push(props);
      return null;
    },
  };
});

/** hook 桩形状（页面薄壳只消费这些字段） */
type OAuthStateStub = {
  phase: "idle" | "busy" | "failed";
  error?: string;
  code: string | null;
  state: string | null;
  token: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tenantId: string;
  } | null;
  authorize: () => Promise<boolean>;
  exchangeCode: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
};

let hookState: OAuthStateStub;

vi.mock("../../src/corekit/use-oauth", () => ({
  useOAuth: () => hookState,
}));

import Oauth from "../../src/pages/oauth";

const token = {
  accessToken: "at1",
  refreshToken: "rt1",
  expiresIn: 3600,
  tenantId: "t1",
};

function hook(over: Partial<OAuthStateStub> = {}): OAuthStateStub {
  const noop = async () => true;
  return {
    phase: "idle",
    code: null,
    state: null,
    token: null,
    authorize: noop,
    exchangeCode: noop,
    refreshToken: noop,
    ...over,
  };
}

function renderPage(): void {
  buttonProps.length = 0;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(Oauth));
  });
  act(() => {
    root.unmount();
  });
  container.remove();
}

describe("OAuth 页面禁用语义（终审 I-1 钉子，swift OAuthView parity）", () => {
  beforeEach(() => {
    buttonProps.length = 0;
  });

  it("码已签发且非 busy——第一步授权按钮可点（swift :37 仅 busy 禁用；码一次性，重签永可达不死端）", () => {
    hookState = hook({ code: "ac-1", state: "st-1", token });
    renderPage();
    expect(buttonProps).toHaveLength(3);
    expect(buttonProps[0]!.disabled).toBe(false);
  });

  it("busy 时三卡按钮全禁用（busy 守卫保留）", () => {
    hookState = hook({ phase: "busy", code: "ac-1", token });
    renderPage();
    expect(buttonProps.map((p) => p.disabled)).toEqual([true, true, true]);
  });

  it("非 busy 且无码无 token——第一步可点、第二三步仍拦（无 code / 无 refreshToken 各拦各卡不变）", () => {
    hookState = hook();
    renderPage();
    expect(buttonProps.map((p) => p.disabled)).toEqual([false, true, true]);
  });
});
