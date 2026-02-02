-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_animeId_fkey";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "AnimeSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
