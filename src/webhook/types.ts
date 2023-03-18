export enum s_code {
  EVENT = 0,
  HELLO = 1,
  PING = 2,
  PONG = 3,
  RECONNECT = 5,
  RESUME_ACK = 6
}

interface I_message_data {
  s: s_code;
  sn: number;
  d: {
    /**
     * @description 频道类型
     */
    channel_type: "string";
    type: number;
    /**
     * @description 频道id
     */
    target_id: string;
    /**
     * @description 发送人id
     */
    author_id: string;
    /**
     * @description 消息内容
     */
    content: string;
    /**
     * @description 消息id
     */
    msg_id: string;
    /**
     * @description 消息时间戳
     */
    msg_timestamp: string;
  };
}

export interface I_webhook_config {
  encrypt_key: string;
  verify_token: string;
  port: number;
  // 所有消息的回调
  onMessage: (data: I_message_data) => void;
}
