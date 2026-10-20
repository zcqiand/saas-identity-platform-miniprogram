export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/login/index",
    "pages/account/index",
    "pages/tenants/index",
    "pages/members/index",
    "pages/roles/index",
    "pages/tenant-applications/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#ffffff",
    navigationBarTitleText: "saas-identity-platform-miniprogram",
    navigationBarTextStyle: "black",
  },
});
