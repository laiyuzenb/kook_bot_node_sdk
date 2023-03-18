const dotenv = require("dotenv");
const { webhook_connect, get_kook_api } = require("../dist");

dotenv.config();

const KOOK_API = get_kook_api(process.env.WEBHOOK_TOKEN);

webhook_connect({
  verify_token: process.env.WEBHOOK_VERIFY_TOKEN,
  encrypt_key: process.env.WEBHOOK_ENCRYPT_KEY,
  port: Number(process.env.WEBHOOK_PORT),
  onMessage: (data) => {
    console.log('data', data);

    // 群发消息
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
          console.log("res:", res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  },
});
