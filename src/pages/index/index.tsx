import { useEffect } from "react";
import { Text, View } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.scss";
import { CLIENT_ID } from "../../config/client";
import { sharedSessionStore } from "../../corekit/use-auth";

// 启动跳板：phase 分派（ready→account / 否则 login，brief T4 Step 3）。放页面
// 而非 App onLaunch——reLaunch 在首页加载后时机可靠，无骨架期构建锚职责
// （corekit/generated 已由登录链真实调用拉进 webpack 依赖图）。
export default function Index() {
  useEffect(() => {
    const phase = sharedSessionStore(CLIENT_ID).phase;
    void Taro.reLaunch({
      url: phase === "ready" ? "/pages/account/index" : "/pages/login/index",
    });
  }, []);
  return (
    <View className="index">
      <Text>跳转中…</Text>
    </View>
  );
}
