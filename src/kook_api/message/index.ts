import axios, { AxiosResponse } from "axios";
import type { I_message_create_params } from "./types";

/**
 * 发送频道聊天消息
 * 注意： 强列建议过滤掉机器人发送的消息，再进行回应。否则会很容易形成两个机器人循环自言自语导致发送量过大，进而导致机器人被封禁。如果确实需要机器人联动的情况，慎重进行处理，防止形成循环。
 * @param type 消息类型, 见[type], 不传默认为 `1`, 代表文本类型。`2` 图片消息，`3` 视频消息，`4` 文件消息，`9` 代表 kmarkdown 消息, `10` 代表卡片消息。
 * @param targetId 目标频道 id
 * @param content 消息内容
 * @param quote 回复某条消息的 `msgId`
 * @param tempTargetId 用户id,如果传了，代表该消息是临时消息，该消息不会存数据库，但是会在频道内只给该用户推送临时消息。用于在频道内针对用户的操作进行单独的回应通知等。
 */
function create(
  message_create_params: I_message_create_params
): Promise<AxiosResponse> {
  return axios.post("/message/create", message_create_params);
}

const message_api = {
  create
};

export default message_api;
