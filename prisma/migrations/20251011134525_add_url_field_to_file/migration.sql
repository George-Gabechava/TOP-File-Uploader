/*
  Warnings:

  - Made the column `parentId` on table `Folder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "parentId" SET NOT NULL,
ALTER COLUMN "parentId" SET DEFAULT '';
