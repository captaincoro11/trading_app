import { Queue } from "bullmq";
import connection from "./connection";

export const orderQueue = new Queue("orders", {
  connection,
});
