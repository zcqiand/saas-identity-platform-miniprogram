import { View, Text } from "@tarojs/components";
import "./index.scss";

// 骨架期单页占位：无业务、无数据获取（API 面等 shared 契约生成物，suite-hard-rules §4）。
export default function Index() {
  return (
    <View className="index">
      <Text>saas-identity-platform-miniprogram</Text>
    </View>
  );
}
