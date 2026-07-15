import { createApp } from "./src/app.js";
import { assertWaitlistLaunchReady, env } from "./src/config/env.js";

// 1. 检查配置
assertWaitlistLaunchReady();

// 2. 创建 Express app
const { app, dependencies } = createApp({ serveFrontend: env.isProduction });

// 3. 启动 HTTP server
const server = app.listen(env.port, env.host, () => {
  console.log(`Market Emotions API running at http://${env.host}:${env.port}`);
});

// 4. 设置 server 连接的最长时间
server.headersTimeout = 15_000;
server.requestTimeout = 20_000;
server.keepAliveTimeout = 5_000;

// 5. 程序被关闭时，先关闭服务器和数据库，再退出 Node.js 进程
async function shutdown() {
  server.close(async () => {
    await dependencies.mongo.close();
    process.exit(0);
  });
}

// 操作系统发送给 Node.js 的 请关闭 信号
process.on("SIGINT", shutdown); // Ctrl + C
process.on("SIGTERM", shutdown); // From deployment platform
