# KOOK Node SDK 文档

## TODO

- [x] webhook 模式
- [x] websocket 模式：获取 gateway - 连接 ws - 处理 hello 包 - 心跳 - 消息 buffer 处理
- [ ] websocket hello 指数倒退重试
- [ ] websocket pong 超时处理
- [ ] HTTP API 对象封装

## 快速开始

### 注意事项

在 webhook 模式中 使用了 global.kook_sdk_webhooks_config 变量
在 ws 模式中 使用了 global.kook_sdk_ws_config 与 global.kook_sdk_ws_cache 变量
千万不要覆盖了这两个变量 不然会导致运行时处理错误

### webhook 与 websocket 区别

#### Webhook

通过 Webhook 进行消息订阅可以让你的应用或机器人能够及时响应用户的消息，在用户量较多的情况下，可以提供更好的并发性能控制。你需要的只是告诉我们该向哪里（URL）发送消息。当消息发生时，KOOK 开放平台会以 HTTP POST 请求的方式将消息内容推送到你设置的回调地址。

#### Websocket

客户端可以与 KOOK 进行实时通信

### webhook 模式 使用

连接步骤

1. 引入 sdk webhook_connect 函数
2. 调用 webhook_connect 传入你的机器人配置参数
3. 在开发者平台机器人界面 Callback Url 中填入你的 ip 地址 例如 http://1.1.1.1:{webhook_connect传入的端口 删掉括号}
4. 点击重试 如果右下角提示操作成功 既为成功

```js
// 第一步引入sdk方法
const { webhook_connect, get_kook_api } = require("@kookapp/sdk");

/**
 * KOOK_API 包含了所有开发者平台的接口调用
 * 用户无需关系接口地址和请求方式 只需关注参数即可
 * 例如 /api/v3/message/create 发送频道消息
 * 将接口地址去除/api/v3后 映射为了对象路径 KOOK_API.message.create({})
 */
const KOOK_API = get_kook_api("机器人token");

// 消息处理函数
function handleMessage(data) {
  console.log("消息数据", data);
  // 收到1条频道消息后  回复他 我在
  if (data.d.channel_type === "GROUP") {
    const { target_id, msg_id } = data.d;

    const params = {
      target_id,
      content: "我在",
      quote: msg_id,
    };

    KOOK_API.message
      .create(params)
      .then((res) => {
        console.log(res);
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

// 2. 调用webhook连接方法
webhook_connect({
  verify_token: "你的机器人 verify token 用于校验是否是发给自己的消息",
  encrypt_key: "你的机器人 encrypt token 用于解密消息",
  port: 2333, // 本地服务端口号
  // 收到消息时的回调函数
  onMessage: handleMessage,
});
```

### Websocket 模式 使用

```js
const { ws_connect, get_kook_api } = require("@kookapp/sdk");

const bot_token = "你的机器人token";

const KOOK_API = get_kook_api(bot_token);

function handleMessage(data) {
  // do something
  // 例如使用 KOOK_API 调用接口
}

ws_connect({
  token: bot_token,
  onMessage: handleMessage,
});
```

### 如何调试

```js
// 安装依赖
pnpm install
// 编译sdk
pnpm run dev
// 将机器人相关配置写入.dev文件后
// 运行脚本 二选一
pnpm run debug:ws
pnpm run debug:webhook
```
