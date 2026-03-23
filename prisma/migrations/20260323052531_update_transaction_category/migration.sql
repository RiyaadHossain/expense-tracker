/*
  Warnings:

  - You are about to drop the column `type` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `amountBase` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `amountOriginal` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `currencyBase` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `currencyOriginal` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('SALARY', 'FREELANCE', 'SIDE_HUSTLE', 'GIFT', 'OTHERS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('FOOD', 'GROCERIES', 'TRANSPORT', 'SHOPPING', 'TECH_ACCESORIES', 'HOBBY', 'OTHERS', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "ParseStatus" ADD VALUE 'PARSED';

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amountBase",
DROP COLUMN "amountOriginal",
DROP COLUMN "currencyBase",
DROP COLUMN "currencyOriginal",
ADD COLUMN     "amount" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BDT';

-- DropEnum
DROP TYPE "CategoryType";
