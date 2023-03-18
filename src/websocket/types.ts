/**
 * @description websocket模式配置参数
 */
export interface I_ws_config {
  token: string;
  // 所有消息的回调
  onMessage: () => void;
}

/**
 * @description ws信令code枚举
 */
export enum E_ws_code {
  /**
   * server->client 消息(包含聊天和通知消息)
   * 在正常连接状态下，收到的消息事件等
   */
  EVENT = 0,
  /**
   * server->client 客户端连接 ws 时 服务端返回握手结果
   * 当我们成功连接 websocket 后，客户端应该在 6s 内收到该包，否则认为连接超时。
   */
  HELLO = 1,
  /**
   * client->server 心跳 ping
   * 每隔 30s(随机-5，+5),将当前的最大 sn 传给服务端,客户端应该在 6s 内收到 PONG, 否则心跳超时。
   */
  PING = 2,
  /**
   * server->client 心跳 pong
   * 回应客户端发出的 ping
   */
  PONG = 3,
  /**
   * client->server resume 恢复会话
   * 当链接未断开时 客户端需传入 当前收到的最后一个 sn 序号 例:
   */
  RESUME = 4,
  /**
   * server->client reconnect要求客户端断开当前连接重新连接
   * 服务端通知客户端, 代表该连接已失效, 请重新连接。客户端收到后应该主动断开当前连接。
   * 客户端收到该信令代表因为某些原因导致当前连接已失效, 需要进行以下操作以避免消息丢失
   * 1. 重新获取 gateway 2. 清空本地的 sn 计数 3. 清空本地消息队列
   */
  RECONNECT = 5,
  /**
   * server->client resume ack
   * 服务端通知客户端 resume 动作成功，中间所有离线消息已经全部发送成功
   */
  RESUME_ACK = 6
}

/**
 * @description ws数据接口
 */
export interface I_packet {
  s: E_ws_code;
  d: {
    type: number;
  };
  sn?: number;
}

/**
 * kook sdk 缓存变量
 */
export interface I_kook_sdk_ws_cache {
  /**
   * 步骤
   */
  step: number;
  /**
   * 已处理的消息
   */
  sn: number;
  /**
   * 获取gateway次数 超过三次终止
   */
  get_gateway_count: number;
  /**
   * 会话id
   */
  session_id?: number;
  /**
   * buffer 消息暂存区
   */
  buffer: [];
  /**
   * hello定时器
   */
  hello_clock?: NodeJS.Timeout;
  /**
   * 心跳定时器
   */
  heart_beat_clock?: NodeJS.Timeout;
  /**
   * 心跳pong超时定时器
   */
  heart_beat_pong_clock?: NodeJS.Timeout;
}

/**
 * 信令[1] HELLO
 *
 * **方向：** server->client
 *
 * **说明：** 当我们成功连接websocket后，客户端应该在6s内收到该包，否则认为连接超时。
 *
 * | 状态码 | 含义 | 备注 |
 * | - | - | - |
 * | 0 | 成功 |
 * | 40100 | 缺少参数 | |
 * | 40101 | 无效的token | |
 * | 40102 | token验证失败 | |
 * | 40103 | token过期 | 需要重新连接 |
 */
export interface I_hello_packet {
  s: E_ws_code;
  d: {
    code: 0 | 40100 | 40101 | 40102 | 40103;
    session_id?: string;
  };
}
