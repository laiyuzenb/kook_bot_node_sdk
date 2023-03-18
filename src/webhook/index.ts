import express from "express";
import { inflate_body, web_hook_post_request } from "./helper";
import type { I_webhook_config } from "./types";

// https://developer.kookapp.cn/doc/webhook
function webhook_connect(config: I_webhook_config) {
  // 存储全局变量
  global.kook_sdk_webhook_config = config;

  // 使用express启动http服务
  const app = express();

  // 使用中间件解压http body
  app.use(inflate_body);

  // 处理post请求
  app.post("/", web_hook_post_request);

  app.listen(config.port);
}

export { webhook_connect };
