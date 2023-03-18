import { createDecipheriv } from "crypto";
import zlib from "zlib";
import { get } from "lodash";
import { logger } from "../utils";

// 在 encrpytKey 后面补 \0 至长度等于 32 位，得到 key
function zero_padding(key: string) {
  const keyByte = Buffer.from(key, "utf-8");

  if (keyByte.length < 32) {
    const result = Buffer.alloc(32);

    Buffer.from(key, "utf-8").copy(result);

    return result;
  }

  return keyByte;
}

// 解压body中间件
function inflate_body(req, res, next) {
  const data = [];

  req.on("data", function (chunk) {
    data.push(Buffer.from(chunk));
  });

  req.on("end", function () {
    const buffer = Buffer.concat(data);

    zlib.inflate(buffer, function (err, result) {
      if (!err) {
        req.body = JSON.parse(result.toString());

        next();
      } else {
        logger.error(err);
      }
    });
  });
}

// 解密消息数据
const decrypt_data = (encrypt_data) => {
  // 1.将密文用 base64 解码
  const encrypted = Buffer.from(encrypt_data, "base64");
  // 2.截取前16位得到 iv,
  const iv = encrypted.subarray(0, 16);
  // 3. 截取16位之后的数据为新的密文 用 base64 解码新的密文, 得到待解密数据
  const encryptedData = Buffer.from(
    encrypted.subarray(16, encrypted.length).toString(),
    "base64"
  );
  // 4. 在 encrpytKey 后面补 \0 至长度等于 32 位，得到 key
  const key = zero_padding(global.kook_sdk_webhook_config.encrypt_key);
  // 5. 利用上面的 iv, key, 待解密数据，采用 aes-256-cbc 解密数据
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  // 6. 将数据转为buffer 再转为JSON
  const decrypt = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
  const data = JSON.parse(decrypt.toString());

  // 校验请求的verify_token 与机器人的是否一致 防止收到伪造的消息
  if (data.d.verify_token !== global.kook_sdk_webhook_config.verify_token) {
    throw Error("verify_token不一致");
  }

  return data;
};

// webhook的post请求
function web_hook_post_request(req, res) {
  const { encrypt } = req.body;

  if (!encrypt) {
    logger.error("encrypt不存在");

    return;
  }

  let data = {};

  try {
    data = decrypt_data(encrypt);
  } catch (error) {
    return;
  }

  const { channel_type, challenge } = get(data, "d", {
    channel_type: "",
    challenge: ""
  });

  // 过滤Challenge请求 调用 onMessage 回调
  if (channel_type !== "WEBHOOK_CHALLENGE") {
    global?.kook_sdk_webhook_config?.onMessage?.(data);
  }

  // 无论你是否配置消息加密，你都应该返回以下响应
  res.send({
    challenge
  });
}

export { inflate_body, web_hook_post_request };
