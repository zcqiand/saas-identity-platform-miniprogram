import { View, Text } from "@tarojs/components";
// weapp 构建链实证锚：显式把 corekit 与 shared 契约生成物拉进 webpack 依赖图
// （骨架单页零业务不变；刀 2 接 API 层后由真实调用替换）。
import "../../corekit/api-client";
import "../../generated";
import "./index.scss";

// 骨架期单页占位：无业务、无数据获取（API 面等 shared 契约生成物，suite-hard-rules §4）。
export default function Index() {
  return (
    <View className="index">
      <Text>saas-identity-platform-miniprogram</Text>
    </View>
  );
}
