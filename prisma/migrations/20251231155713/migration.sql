-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'SUCCESS', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('MARKET', 'LIMIT', 'STOP');

-- CreateEnum
CREATE TYPE "Cryptos" AS ENUM ('BTC', 'ETH', 'SOL', 'USDT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CREATED', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeCredential" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCommand" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "clientOrderId" TEXT NOT NULL,
    "exchangeOrderId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30),
    "stopPrice" DECIMAL(65,30),
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "symbol" "Cryptos" NOT NULL,
    "side" "OrderSide" NOT NULL,
    "type" "OrderType" NOT NULL,

    CONSTRAINT "OrderCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "eventType" "EventType" NOT NULL,
    "price" DECIMAL(65,30),
    "quantity" DECIMAL(65,30),
    "filledQuantity" DECIMAL(65,30),
    "commission" DECIMAL(65,30),
    "exchangeTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "exchange" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "triggerPrice" DECIMAL(65,30) NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredAt" TIMESTAMP(3),

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeCredential_userId_exchange_key" ON "ExchangeCredential"("userId", "exchange");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCommand_clientOrderId_key" ON "OrderCommand"("clientOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCommand_exchangeOrderId_key" ON "OrderCommand"("exchangeOrderId");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");

-- CreateIndex
CREATE INDEX "OrderEvent_eventType_idx" ON "OrderEvent"("eventType");

-- CreateIndex
CREATE INDEX "OrderEvent_exchangeTime_idx" ON "OrderEvent"("exchangeTime");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_status_idx" ON "PriceAlert"("userId", "status");

-- CreateIndex
CREATE INDEX "PriceAlert_symbol_idx" ON "PriceAlert"("symbol");

-- AddForeignKey
ALTER TABLE "ExchangeCredential" ADD CONSTRAINT "ExchangeCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCommand" ADD CONSTRAINT "OrderCommand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "OrderCommand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
