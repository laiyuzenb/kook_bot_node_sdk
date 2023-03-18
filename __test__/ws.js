const dotenv = require("dotenv");
const { ws_connect, get_kook_api } = require("../dist");

dotenv.config();

const token = process.env.WS_TOKEN;
const KOOK_API = get_kook_api(token);

ws_connect({
  token,
  onMessage: (data) => {
    console.log("data:", data);
    // 群发消息
    //   if (data.d.channel_type === "GROUP") {
    //     const { target_id, msg_id } = data.d;
    //     const params = {
    //       target_id,
    //       content: "我在",
    //       quote: msg_id,
    //     };
    //     KOOK_API.message
    //       .create(params)
    //       .then((res) => {
    //         console.log("res:", res.data.data);
    //       })
    //       .catch((error) => {
    //         console.log(error);
    //       });
    //   }
  },
});
