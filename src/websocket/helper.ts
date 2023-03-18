import WebSocket from "ws";
import { get, set, cloneDeep } from "lodash";
import { inflate, InputType } from "zlib";
import { get_kook_api } from "../kook_api";
import { logger } from "../utils";
import {
  I_kook_sdk_ws_cache,
  I_packet,
  I_hello_packet,
  E_ws_code
} from "./types";

export function init_ws_config(config) {
  // 存储配置数据
  global.kook_sdk_ws_config = config;

  // 初始化 sdk cache 变量
  const kook_sdk_ws_cache: I_kook_sdk_ws_cache = {
    step: 0,
    sn: 0,
    get_gateway_count: 0,
    hello_clock: undefined,
    session_id: undefined,
    buffer: [],
    heart_beat_clock: undefined
  };

  global.kook_sdk_ws_cache = kook_sdk_ws_cache;
}

/**
 * @description 连接ws步骤
 * 常规连接流程如下：
 * 1. 获取 Gateway
 * 2. 连接 Gateway。如果连接失败，回退到第 1 步
 * 3. 收到 hello 包，如果成功，开始接收事件。如果失败，回退至第 1 步
 * 4. 在连接中，每隔 30 秒发一次心跳 ping 包，如果 6 秒内，没有收到心跳 pong 包，则超时。进入到指数回退，重试。
 * 5. 先发两次心跳 ping(间隔为 2,4),判断连接是否成功。如果成功，则连接恢复。
 * 6. 如果不成功，再回退到第 2 步，尝试两次 resume(间隔为 8,16)。如果成功，会按正常往下走，但有一个 resume 过程（同步中间的离线消息），resume 完了，会收到一个 resumeOK 包。
 * 7. 如果失败，再回到第 1 步，尝试无数次获取 Gateway(指数倒退，最大间隔为 60),直到成功为止。
 * 8. 任何时候，收到 reconnect 包，应该将当前消息队列，sn等全部清空，然后回到第 1 步，否则可能会有消息错乱等各种问题
 */
export async function next_step() {
  const last_step = get(global, "kook_sdk_ws_cache.step", 0);

  const last_step_type = typeof last_step;

  if (last_step_type !== "number") {
    logger.log("last_step_type 不是数字", last_step_type);

    return;
  }

  // 自动下一步
  const step = last_step + 1;

  set_step(step);

  switch (step) {
    case 1:
      // 获取 Gateway
      get_gateway();

      break;
    case 2:
      // 连接 Gateway。如果连接失败，回退到第 1 步
      connect_gateway();

      break;
    case 3:
      // 收到 hello 包，如果成功，开始接收事件。如果失败，回退至第 1 步
      // 本步骤在第二步的on message中处理
      break;
    case 4:
      // 在连接中，每隔 30 秒发一次心跳 ping 包，如果 6 秒内，没有收到心跳 pong 包，则超时。进入到指数回退，重试。
      handle_heart_beat();

      break;
    default:
      logger.log("next_step default step 值为 ", step);

      break;
  }
}

/**
 * 1. 获取gateway地址及存储
 */
async function get_gateway() {
  logger.log("获取gateway地址 ");

  const KOOK_API = get_kook_api(global.kook_sdk_ws_config.token);

  KOOK_API.gateway
    .index()
    .then((gateway_res) => {
      const ws_url = get(gateway_res, "data.data.url", "");

      if (ws_url) {
        global.kook_sdk_ws_cache.ws_url = ws_url;

        // 失败次数清0
        set(global, "kook_sdk_ws_cache.get_gateway_count", 0);

        next_step();
      } else {
        get_gateway_fail();
      }
    })
    .catch(() => {
      get_gateway_fail();
    });
}

/**
 * 2. 连接 Gateway。如果连接失败，回退到第 1 步
 */
function connect_gateway() {
  // 防止启动多个ws 先关闭
  close_socket();

  if (global.kook_sdk_ws_cache.session_id) {
    global.kook_sdk_ws_cache.ws_url = `${global.kook_sdk_ws_cache.ws_url}&resume=1&sessionId=${global.kook_sdk_ws_cache.session_id}&sn=${global.kook_sdk_ws_cache.sn}`;
  }

  const socket = new WebSocket(global.kook_sdk_ws_cache.ws_url);

  global.kook_sdk_ws_cache.socket = socket;

  global.kook_sdk_ws_cache.socket_id = Date.now();

  next_step();

  logger.log("socket开始监听消息");

  global.kook_sdk_ws_cache.socket.on("message", async function (data) {
    const result_data = await decrypt_ws_data(data);

    handle_data_process(result_data);
  });

  global.kook_sdk_ws_cache.socket.on("error", (error) => {
    logger.log("socket 错误", error);
  });
}

/**
 * 4. 在连接中，每隔 30 秒发一次心跳 ping 包，如果 6 秒内，没有收到心跳 pong 包，则超时。进入到指数回退，重试。
 * 心跳定时器
 */
function handle_heart_beat() {
  const clock = get(global, "kook_sdk_ws_cache.heart_beat_clock", undefined);

  if (clock) {
    clearInterval(global.kook_sdk_ws_cache.heart_beat_clock);
  }

  logger.log("开始间隔30秒发送心跳");

  global.kook_sdk_ws_cache.heart_beat_clock = setInterval(() => {
    ping();
  }, 30 * 1000);
}

/**
 * @description 发送心跳ping消息
 */
function ping() {
  if (global.kook_sdk_ws_cache?.socketsocket?.readyState === WebSocket.OPEN) {
    const data = JSON.stringify({
      s: E_ws_code.PING,
      sn: global.kook_sdk_ws_cache.sn
    });

    logger.log("心跳ping", data);

    global.kook_sdk_ws_cache.socket.send(data);
  }
}

/**
 * @description 根据消息数据的信令 做不同处理
 * @param {*} packet
 */
function handle_data_process(packet) {
  switch (packet.s) {
    // 3. 收到 hello 包
    case E_ws_code.HELLO:
      handle_hello(packet);

      break;
    case E_ws_code.EVENT:
      handle_event(packet);

      break;
    case E_ws_code.PING:
      logger.warn("收到1条ping消息 但这个包应该是 客户端 => 服务端");

      break;
    case E_ws_code.PONG:
      handle_pong(packet);

      break;
    case E_ws_code.RECONNECT:
      handle_reconnect(packet);

      break;
    case E_ws_code.RESUME_ACK:
      break;
    default:
      logger.log("handle_data_process default", packet);

      break;
  }
}

/**
 * @description 设置步骤
 * @param {*} step
 */
function set_step(step) {
  set(global, "kook_sdk_ws_cache.step", step);
}

/**
 * 关闭socket 和 socket缓存
 */
function close_socket() {
  const close = get(global, "kook_sdk_ws_cache.socket.close");

  global.kook_sdk_ws_cache.socket && global.kook_sdk_ws_cache.socket.close();

  if (close) {
    global.kook_sdk_ws_cache.socket.close();

    global.kook_sdk_ws_cache.socket = null;
  }
}

/**
 * @description 解密消息数据
 * @param {(Buffer | string)} data
 * @returns {*}
 */
async function decrypt_ws_data(data: Buffer | string) {
  let packet: I_packet;

  if (Buffer.isBuffer(data)) {
    packet = JSON.parse((await inflatePromise(data)).toString());
  } else {
    packet = JSON.parse(data as string);
  }

  return packet;
}

/**
 * @description 解压数据
 * @param {InputType} data
 * @returns {*}  {Promise<Buffer>}
 */
function inflatePromise(data: InputType): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    inflate(data, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

/**
 * @description 3. 收到 hello 包，如果成功，开始接收事件。如果失败，回退至第 1 步
 * 成功连接 websocket 后，客户端应该在 6s 内收到该包，否则认为连接超时
 */
function handle_hello(packet: I_hello_packet) {
  logger.log("收到1条hello消息", packet);

  const { session_id } = global.kook_sdk_ws_cache;

  clear_hello_clock();

  switch (packet.d.code) {
    // 在正常连接状态下，收到的消息事件
    case 0:
      logger.log("heelo消息正确");

      if (session_id !== packet.d.session_id) {
        global.kook_sdk_ws_cache.buffer = [];

        global.kook_sdk_ws_cache.sn = 0;
      }

      global.kook_sdk_ws_cache.session_id = packet.d.session_id;

      next_step();

      break;
    // hello 错误
    case 40100:
    case 40101:
    case 40102:
    case 40103:
      logger.warn(
        `hello消息错误 错误码为：${packet.d.code}, 回到第一步 重新获取gateway`
      );

      // hello接收失败 回到第一步
      close_socket();

      set_step(0);

      next_step();

      break;
    default:
      logger.warn(`Receive ${packet.d.code}, Ignored`);

      break;
  }
}

function handle_event(packet) {
  logger.log("收到1条事件消息", packet);

  // 表示该消息已处理
  const sn = get(global, "kook_sdk_ws_cache.sn", 0);

  // 判断消息顺序是否正确
  if (sn + 1 === packet.sn) {
    // 消息正确则调用消息回调
    global.kook_sdk_ws_cache.sn = sn + 1;

    global?.kook_sdk_ws_config?.onMessage &&
      global.kook_sdk_ws_config.onMessage(cloneDeep(packet));

    // buffer消息排序
    global.kook_sdk_ws_cache.buffer.sort((a, b) => a.sn - b.sn);

    // 收到了一条已处理过的 sn 的消息, 抛弃不处理
    // 遍历消息buffer缓存 当buffer内 sn 小于 最新消息的 sn+1 时（消息顺序不对） 删除
    while (
      global.kook_sdk_ws_cache.buffer.length > 0 &&
      global.kook_sdk_ws_cache.buffer[0].sn < sn + 1
    ) {
      global.kook_sdk_ws_cache.buffer.shift();
    }

    // 将过滤后的 消息 按顺序 调用消息回调
    while (
      global.kook_sdk_ws_cache.buffer.length > 0 &&
      global.kook_sdk_ws_cache.buffer[0].sn === sn + 1
    ) {
      const packet = global.kook_sdk_ws_cache.buffer.shift();

      global?.kook_sdk_ws_config?.onMessage &&
        global.kook_sdk_ws_config.onMessage(cloneDeep(packet));

      while (
        global.kook_sdk_ws_cache.buffer.length > 0 &&
        global.kook_sdk_ws_cache.buffer[0].sn < sn + 1
      ) {
        global.kook_sdk_ws_cache.buffer.shift();
      }
    }

    return;
  }

  // 收到消息的 sn 出现乱序, 需要先存入暂存区 (buffer)
  global.kook_sdk_ws_cache.buffer.push(packet);
}

function handle_pong(packet) {
  logger.log("收到1条pong", packet);
}

function handle_reconnect(packet) {
  logger.log("handle_reconnect", packet);
}

/**
 * @description 获取gateway地址失败处理
 */
function get_gateway_fail() {
  const last_count = get(global, "kook_sdk_ws_cache.get_gateway_count", 0);
  const last_count_type = typeof last_count;

  if (last_count_type !== "number") {
    logger.error("last_count_type 不是数字");

    return;
  }

  const count = last_count + 1;

  if (count > 2) {
    logger.error("获取gateway地址连续2次失败");

    return;
  }

  logger.log(`获取gateway地址失败 开始第 ${count} 次重试`);

  // 重新回到第 0 步
  set_step(0);

  next_step();
}

/**
 * @description 关闭hello定时器
 */
function clear_hello_clock() {
  const hello_clock = global.kook_sdk_ws_cache.hello_clock;

  if (hello_clock) {
    clearTimeout(hello_clock);

    global.kook_sdk_ws_cache.hello_clock = undefined;
  }
}
