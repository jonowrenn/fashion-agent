-- CreateTable
CREATE TABLE "ProductPreviewCache" (
    "url" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "imageUrl" TEXT,
    "ok" BOOLEAN NOT NULL,
    "status" INTEGER,
    "error" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
