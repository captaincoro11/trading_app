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

        const {symbol , side , type , quantity , price , clientOrderId} = parsedOrderData;

        if(type === "LIMIT" && !price) return NextResponse.json({
          message : "Price is needed for limit orders"
        }, {
          status : 400
        });

        if(type === "MARKET" && price) return NextResponse.json({
          message : "Price is not needed for market orders"
        } , {
          status : 400
        });

        const userEmail = req.headers.get("x-user-email");

        if(!userEmail) return NextResponse.json({
          message : "User Not Authenticated"
        },{
          status : 400
        });

        const userDetails = await prisma.user.findFirst({
          where : {
            email : userEmail
          }
        });

        if(!userDetails) return NextResponse.json({
          message : "User Not Found"
        } , {
          status : 404
        });

        if(userDetails.status === "BLOCKED") return NextResponse.json({
          message : "User is blocked"
        } , {
          status : 403
        });
        console.log("userEmail" , userDetails.email);
        const userExchangeDetails = await prisma.exchangeCredential.findFirst({
          where : {
            userId : userDetails.id
          }
        });
        console.log("userId" , userDetails.id);
        console.log("userDetails ", userExchangeDetails);``
        if(!userExchangeDetails) return NextResponse.json({
          message : "User Exchange Details Not Present"
        } , {
          status : 404
        });

        const orderDetails = await prisma.orderCommand.create({
          data :{
            userId : userDetails.id,
            exchange : userExchangeDetails.exchange, 
            clientOrderId : clientOrderId,
            quantity : quantity,
            exchangeOrderId : "3",
            price : price , 
            symbol : symbol,
            side : side ,
            type : type
          }
        });

        await orderQueue.add(
        "orders",
        {
          orderId: orderDetails.id,
        },
        {
          jobId: `${userDetails.id}-${clientOrderId}`, // idempotency
          attempts: 5,
          backoff: { type: "exponential", delay: 2000 },
        }
      );

      return NextResponse.json({
        message : "Your order has been placed successfully",
        orderId : orderDetails.id
      } , {
        status : 201
      });


    } catch(err) {
         console.error("Place order failed:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
    }
}