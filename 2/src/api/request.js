import axios from "axios";
import router from "../router";

// baseURL 统一放在这里，便于开发/生产环境切换
// 开发环境：走 Vite proxy 转发到 https://v3pz.itndedu.com
// 生产环境：如后端部署在同源服务器，可改为空字符串或对应路径
export const BASE_URL = "/v3pz";

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "terminal": "h5" },
});

request.interceptors.request.use((req) => {
  req.headers["h-token"] = localStorage.getItem("token") || "";
  return req;
});

request.interceptors.response.use(
  (res) => {
    const { code, data, message } = res.data;
    if (code == 10000) {
      return data;
    }
    if (code == -2) {
      localStorage.removeItem("token");
      router.push("/login");
      return Promise.reject(message || "token过期");
    }
    // 其他 code 统一返回后端 message，便于前端展示真实错误
    return Promise.reject(message || "code码异常: " + code);
  },
  (error) => {
    // 网络层失败（DNS解析失败、超时、CORS、服务器未启动等）
    let msg = "网络异常，请稍后重试";
    if (error.code === "ECONNABORTED" || /timeout/.test(error.message)) {
      msg = "请求超时，请检查网络";
    } else if (
      error.code === "ERR_NETWORK" ||
      error.code === "ERR_NAME_NOT_RESOLVED" ||
      /ERR_NAME_NOT_RESOLVED/.test(error.message) ||
      /Network Error/.test(error.message)
    ) {
      msg = "服务器连接失败（后端地址不可达）";
    } else if (error.response) {
      msg = "服务器错误 " + error.response.status;
    }
    console.error("请求失败:", error.message, "URL:", error.config?.url);
    return Promise.reject(msg);
  }
);

function servier(options) {
  options.method = options.method || "get";
  if (options.method.toLowerCase() === "get") {
    options.params = options.data;
  }
  return request(options);
}

export default servier;
