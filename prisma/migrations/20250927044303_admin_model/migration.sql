-- CreateEnum
CREATE TYPE "public"."EQueueStatus" AS ENUM ('CLAIMED', 'CALLED', 'SERVED', 'SKIPPED', 'RELEASED', 'RESET');

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(500) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Counter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "currentQueue" INTEGER NOT NULL DEFAULT 0,
    "maxQueue" INTEGER NOT NULL DEFAULT 99,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Queue" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "public"."EQueueStatus" NOT NULL DEFAULT 'CLAIMED',
    "counterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "public"."Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Counter_name_key" ON "public"."Counter"("name");

-- AddForeignKey
ALTER TABLE "public"."Queue" ADD CONSTRAINT "Queue_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "public"."Counter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
