/**
 * clientId 编译期钉死（D6，ADR-0019 业务身份字段禁兜底）——本仓全局唯一字面量点，
 * App 层 401 回调与页面 useAuth 只从这里取（swift SessionStore 配置注入同源）。
 */
export const CLIENT_ID = "saas-console";
