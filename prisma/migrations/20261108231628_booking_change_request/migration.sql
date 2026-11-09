-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "change_request" TEXT,
ADD COLUMN     "change_requested_at" TIMESTAMPTZ(3);
