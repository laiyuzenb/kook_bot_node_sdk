import { init_ws_config, next_step } from "./helper";
import { logger } from "../utils";
import { I_ws_config } from "./types";

async function ws_connect(config: I_ws_config) {
  init_ws_config(config);

  logger.log("开始连接");

  next_step();
}

export { ws_connect };
