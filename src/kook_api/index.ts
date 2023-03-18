import axios from "axios";
import message from "./message";
import gateway from "./gateway";
import { logger } from "../utils";

/**
 * @description 获取kook_api对象
 * @param {string} token
 */
function get_kook_api(token: string) {
  if (!token) {
    logger.error("请传入 token");

    return;
  }

  // 设置axios默认配置
  axios.defaults.baseURL = "https://www.kookapp.cn/api/v3";

  axios.defaults.headers.common = {
    Authorization: `Bot ${token}`
  };

  return {
    message,
    gateway
  };
}

export { get_kook_api };
