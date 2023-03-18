/*
 * @Author: {lyz}
 * @Date: 2022-12-20 17:13:41
 * @LastEditors: {lyz}
 * @LastEditTime: 2023-03-18 22:18:17
 * @Description: 日志方法 后续加入埋点
 */

const logger = {
  log: (...args) => {
    console.log(...args);
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  }
};

export { logger };
