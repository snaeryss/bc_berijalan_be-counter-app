-- AlterTable
ALTER TABLE "public"."Admin" ALTER COLUMN "password" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."Queue" ADD COLUMN     "deletedAt" TIMESTAMP(3);
