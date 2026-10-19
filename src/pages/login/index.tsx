// @entry M01.F04.I03 — 登录页本体（swift LoginView 同构：页头示 clientId +
// 账密输入 + 登录钮 + 错误文案区；成功 reLaunch 账户页）
import { useState } from "react";
import { Button, Input, Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { CLIENT_ID } from "../../config/client";
import { useAuth } from "../../corekit/use-auth";
import "./index.scss";

// 页面薄壳（T4 无测试义务）：只挂 useAuth 渲染 + 路由跳转，不承载业务逻辑。
export default function Login() {
  const { error, login } = useAuth(CLIENT_ID);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      await Taro.reLaunch({ url: "/pages/account/index" });
    } catch {
      // 失败文案已落 useAuth error 态（错误文案区渲染）；页面禁各自处理 401
    }
    setSubmitting(false);
  };

  return (
    <View className="login">
      <View className="login-header">
        <Text className="login-title">登录（{CLIENT_ID}）</Text>
      </View>
      <Input
        className="login-field"
        placeholder="用户名"
        value={username}
        onInput={(e) => setUsername(e.detail.value)}
      />
      <Input
        className="login-field"
        password
        placeholder="密码"
        value={password}
        onInput={(e) => setPassword(e.detail.value)}
      />
      <Button
        className="login-submit"
        disabled={!canSubmit || submitting}
        onClick={submit}
      >
        登录
      </Button>
      {error ? <Text className="login-error">{error}</Text> : null}
    </View>
  );
}
