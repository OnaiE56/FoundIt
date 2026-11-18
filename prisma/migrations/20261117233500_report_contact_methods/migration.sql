ALTER TABLE "ItemReport" ADD COLUMN "contactMethod" TEXT;
ALTER TABLE "ItemReport" ADD COLUMN "contactValue" TEXT;

UPDATE "ItemReport"
SET "contactMethod" = 'EMAIL',
    "contactValue" = (SELECT "email" FROM "User" WHERE "User"."id" = "ItemReport"."userId")
WHERE "shareContact" = true;

ALTER TABLE "ItemReport" DROP COLUMN "shareContact";
