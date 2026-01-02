import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import prisma from '../prisma';
import { BINANCE_TESTNET_URL } from '../constant';

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker('orders', async job => {
    try {
        const {orderId} = job.data;
        const orderDetails = await prisma.orderCommand.findFirst({
            where : {
                id : orderId
            }
        });

        if(!orderDetails) throw new Error("Order Detials Not Found");

        if(orderDetails.status !== "PENDING") return;

        const userCredentials = await prisma.exchangeCredential.findFirst({
            where : {
                userId : orderDetails.userId
            }
        });

        if(!userCredentials) throw new Error("User Credentials Not Found");

        const exchangePayload = {
            symbol: orderDetails.symbol,
            side: orderDetails.side,
            type: orderDetails.type,
            quantity: orderDetails.quantity,
            price: orderDetails.price,
        };

        const placeOrderUrl = `${BINANCE_TESTNET_URL}/v3/order`;
        console.log("Place Order URL", placeOrderUrl);
        const result = await axios.post(placeOrderUrl, exchangePayload);

        console.log("This is our result",result);

    } catch (error) {
        throw error;
    }
  },
  { connection },
);