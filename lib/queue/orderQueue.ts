import { Queue } from "bullmq";

export const orderQueue = new Queue("orders");
