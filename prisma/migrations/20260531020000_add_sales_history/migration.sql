-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "menuType" TEXT NOT NULL DEFAULT 'TREATMENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "inventoryItemId" TEXT,
    CONSTRAINT "MenuItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MenuItem" ("createdAt", "durationMin", "id", "isActive", "menuType", "name", "price", "sortOrder", "updatedAt")
SELECT "createdAt", "durationMin", "id", "isActive", "menuType", "name", "price", "sortOrder", "updatedAt" FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";
CREATE UNIQUE INDEX "MenuItem_inventoryItemId_key" ON "MenuItem"("inventoryItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "reservationId" TEXT,
    "soldAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "inventoryItemId" TEXT,
    "itemType" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "originalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "finalAmount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleLine_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleLine_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SaleLine_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Migrate legacy treatment history into the sales ledger.
INSERT INTO "Sale" ("id", "customerId", "soldAt", "subtotalAmount", "discountAmount", "totalAmount", "notes", "createdAt")
SELECT 'legacy_sale_' || "id", "customerId", "date", "totalAmount" + "discount", "discount", "totalAmount", "notes", "createdAt"
FROM "Treatment";

INSERT INTO "SaleLine" ("id", "saleId", "menuItemId", "itemType", "itemName", "unitPrice", "quantity", "originalAmount", "discountAmount", "finalAmount", "createdAt")
SELECT 'legacy_sale_line_' || treatmentMenuItem."id",
       'legacy_sale_' || treatmentMenuItem."treatmentId",
       treatmentMenuItem."menuItemId",
       menuItem."menuType",
       menuItem."name",
       treatmentMenuItem."price",
       1,
       treatmentMenuItem."price",
       0,
       treatmentMenuItem."price",
       treatment."createdAt"
FROM "TreatmentMenuItem" treatmentMenuItem
JOIN "Treatment" treatment ON treatment."id" = treatmentMenuItem."treatmentId"
JOIN "MenuItem" menuItem ON menuItem."id" = treatmentMenuItem."menuItemId";

-- CreateIndex
CREATE INDEX "Sale_soldAt_idx" ON "Sale"("soldAt");

-- CreateIndex
CREATE INDEX "Sale_customerId_soldAt_idx" ON "Sale"("customerId", "soldAt");

-- CreateIndex
CREATE INDEX "Sale_reservationId_idx" ON "Sale"("reservationId");

-- CreateIndex
CREATE INDEX "SaleLine_saleId_idx" ON "SaleLine"("saleId");

-- CreateIndex
CREATE INDEX "SaleLine_menuItemId_idx" ON "SaleLine"("menuItemId");

-- CreateIndex
CREATE INDEX "SaleLine_inventoryItemId_idx" ON "SaleLine"("inventoryItemId");

-- CreateIndex
CREATE INDEX "SaleLine_itemType_idx" ON "SaleLine"("itemType");
