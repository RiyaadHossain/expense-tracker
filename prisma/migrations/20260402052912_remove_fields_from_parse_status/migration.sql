/*
  Warnings:

  - The values [CONFIRMED] on the enum `ParseStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [API] on the enum `SourcePlatform` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `incomeSource` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `merchant` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParseStatus_new" AS ENUM ('AUTO_SAVED', 'PARSED', 'EDITED', 'MANUAL', 'FAILED');
ALTER TABLE "public"."Transaction" ALTER COLUMN "parseStatus" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "parseStatus" TYPE "ParseStatus_new" USING ("parseStatus"::text::"ParseStatus_new");
ALTER TABLE "ParseEvent" ALTER COLUMN "status" TYPE "ParseStatus_new" USING ("status"::text::"ParseStatus_new");
ALTER TYPE "ParseStatus" RENAME TO "ParseStatus_old";
ALTER TYPE "ParseStatus_new" RENAME TO "ParseStatus";
DROP TYPE "public"."ParseStatus_old";
ALTER TABLE "Transaction" ALTER COLUMN "parseStatus" SET DEFAULT 'AUTO_SAVED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SourcePlatform_new" AS ENUM ('TELEGRAM', 'WEB', 'MESSENGER', 'WHATSAPP');
ALTER TABLE "MessagingAccount" ALTER COLUMN "platform" TYPE "SourcePlatform_new" USING ("platform"::text::"SourcePlatform_new");
ALTER TABLE "Transaction" ALTER COLUMN "sourcePlatform" TYPE "SourcePlatform_new" USING ("sourcePlatform"::text::"SourcePlatform_new");
ALTER TABLE "ParseEvent" ALTER COLUMN "platform" TYPE "SourcePlatform_new" USING ("platform"::text::"SourcePlatform_new");
ALTER TYPE "SourcePlatform" RENAME TO "SourcePlatform_old";
ALTER TYPE "SourcePlatform_new" RENAME TO "SourcePlatform";
DROP TYPE "public"."SourcePlatform_old";
COMMIT;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "incomeSource",
DROP COLUMN "merchant",
ADD COLUMN     "tags" TEXT,
ALTER COLUMN "parseStatus" SET DEFAULT 'AUTO_SAVED';
