import { OrderSide, OrderType } from "@/app/generated/prisma/enums"
import prisma from "@/lib/prisma";
import { orderQueue } from "@/lib/queue/orderQueue";
import redis from "@/lib/redis";
import { NextResponse } from "next/server";
import z from "zod";

const orderSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
  quantity: z.number().positive(),
  price: z.number().positive().optional(),
  clientOrderId: z.string().min(1),
});

export async function POST (req : Request) {
    try {
        const orderData = await req.json();
        const parsedOrderData = orderSchema.parse(orderData);

        if(!parsedOrderData) {
            return new NextResponse("Invalid input" , {status : 400});
        }

        const userEmail = req.headers.get('x-user-email');
        if(!userEmail) return new NextResponse("User Not Authneticated" , {status : 401});

        const userDetails = await prisma.user.findUnique({
            where : {
                email : userEmail
            }
        });

        if(!userDetails) return new NextResponse("User not found", { status: 404 });

        if(userDetails.status === "BLOCKED") return NextResponse.json({
            message : "User is blocked"
        } , {status : 403});

        const userExchangeDetails = await prisma.exchangeCredential.findFirst({
            where : {
                userId : userDetails?.id
            }
        });

        if(!userExchangeDetails) return NextResponse.json({
            message : "User Exchange Not Added",
        }, {status : 404});


        const { symbol, side, type, quantity, price, clientOrderId } = parsedOrderData;

        if(type === "LIMIT" && price === undefined) return NextResponse.json({
            message : "Price should be provided for limit orders"
        },{status : 403});


        if(type === "MARKET" && price !== undefined) return NextResponse.json({
            message : "Price should not be provided for market orders"
        },{status : 403});


         const idemKey = `order:idempotency:${userDetails?.id}:${clientOrderId}`;
         const existingOrderId = await redis.get(idemKey);

         if (existingOrderId) {
         const existingOrder = await prisma.orderCommand.findUnique({
            where: { id: Number(existingOrderId) },
         });

         return NextResponse.json(existingOrder, { status: 200 });
         }

         await redis.set(idemKey, "LOCKED", { EX: 60 });

          const order = await prisma.orderCommand.create({
      data: {
        userId : userDetails.id,
        clientOrderId,
        symbol : symbol,
        side,
        type,
        quantity,
        price,
        status: "PENDING",
        exchange: userExchangeDetails.exchange,
        exchangeOrderId : ""
      },
    });

    await redis.set(idemKey, String(order.id), { EX: 60 });

      await orderQueue.add(
      "place-order",
      { orderId: order.id },
      {
        jobId: `${userDetails.id}:${clientOrderId}`, // idempotency via BullMQ
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );


     return NextResponse.json(
      { orderId: order.id, status: order.status },
      { status: 201 }
    );


        

    } catch(err) {
         console.error("Place order failed:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
    }
}