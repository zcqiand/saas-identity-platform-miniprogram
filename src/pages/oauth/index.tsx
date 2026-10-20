// @entry M04.F03 — OAuth 授权码流页（knife4 T3，swift OAuthView 同构）：三步
// authorize → token（authorization_code）→ refresh（轮换）。页面薄壳：只挂
// useOAuth 渲染三卡片，逻辑覆盖在 Task 2 hook 测试，禁用语义钉在
// tests/pages/oauth.test.ts（终审 I-1）；禁直调生成物。
import { Button, Text, View } from "@tarojs/components";
import { CLIENT_ID } from "../../config/client";
import { useOAuth } from "../../corekit/use-oauth";
import "./index.scss";

// 平台适配：swift 的 Form/Section 三段纵向排；NavigationLink/sheet 不适用。
// disabled 逻辑照 swift OAuthView：第一步仅 busy（OAuthView.swift:37——授权码
// 一次性，exchange 失败后 code 仍非 null，加码禁用即死端，终审 I-1）；无 code
// / 无 refreshToken 各拦后两卡（:59/:74）。禁用语义钉在 tests/pages/oauth.test.ts。
export default function Oauth() {
  const { phase, error, code, state, token, authorize, exchangeCode, refreshToken } =
    useOAuth(CLIENT_ID);

  const busy = phase === "busy";

  return (
    <View className="oauth">
      <View className="oauth-card">
        <Text className="oauth-card-title">第一步 · authorize</Text>
        <Button
          className="oauth-btn"
          disabled={busy}
          onClick={() => {
            void authorize();
          }}
        >
          签发授权码
        </Button>
        {code ? (
          <View className="oauth-rows">
            <View className="oauth-row">
              <Text className="oauth-label">授权码</Text>
              <Text className="oauth-value">{code}</Text>
            </View>
            <View className="oauth-row">
              <Text className="oauth-label">state（回传一致）</Text>
              <Text className="oauth-value">{state ?? "—"}</Text>
            </View>
          </View>
        ) : (
          <Text className="oauth-empty">尚未签发</Text>
        )}
        <Text className="oauth-footer">
          state 自生成并要求后端回传一致（CSRF）；scope 恒传 openid
        </Text>
      </View>

      <View className="oauth-card">
        <Text className="oauth-card-title">第二步 · token（authorization_code）</Text>
        <Button
          className="oauth-btn"
          disabled={busy || !code}
          onClick={() => {
            void exchangeCode();
          }}
        >
          换 token
        </Button>
        {token ? (
          <View className="oauth-rows">
            <View className="oauth-row">
              <Text className="oauth-label">accessToken</Text>
              <Text className="oauth-value">{token.accessToken}</Text>
            </View>
            <View className="oauth-row">
              <Text className="oauth-label">refreshToken</Text>
              <Text className="oauth-value">{token.refreshToken}</Text>
            </View>
            <View className="oauth-row">
              <Text className="oauth-label">expiresIn</Text>
              <Text className="oauth-value">{token.expiresIn}</Text>
            </View>
            <View className="oauth-row">
              <Text className="oauth-label">tenantId</Text>
              <Text className="oauth-value">{token.tenantId}</Text>
            </View>
          </View>
        ) : (
          <Text className="oauth-empty">尚未入账</Text>
        )}
        <Text className="oauth-footer">免 clientSecret（saas-console 公共 client）</Text>
      </View>

      <View className="oauth-card">
        <Text className="oauth-card-title">第三步 · refresh（轮换）</Text>
        <Button
          className="oauth-btn"
          disabled={busy || !token?.refreshToken}
          onClick={() => {
            void refreshToken();
          }}
        >
          刷新 token
        </Button>
        <Text className="oauth-footer">refresh_token grant 返回全新 token 对并入账</Text>
      </View>

      {error ? <Text className="oauth-error">{error}</Text> : null}
    </View>
  );
}
