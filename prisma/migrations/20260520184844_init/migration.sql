-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "lastfmUrl" TEXT,
    "mbid" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "artUrl" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "seedAlbumId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumRecommendation" (
    "id" TEXT NOT NULL,
    "seedAlbumId" TEXT NOT NULL,
    "recommendedId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Album_lastfmUrl_key" ON "Album"("lastfmUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Album_mbid_key" ON "Album"("mbid");

-- CreateIndex
CREATE INDEX "Album_title_artist_idx" ON "Album"("title", "artist");

-- CreateIndex
CREATE INDEX "Search_userId_createdAt_idx" ON "Search"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AlbumRecommendation_seedAlbumId_position_idx" ON "AlbumRecommendation"("seedAlbumId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumRecommendation_seedAlbumId_recommendedId_key" ON "AlbumRecommendation"("seedAlbumId", "recommendedId");

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_seedAlbumId_fkey" FOREIGN KEY ("seedAlbumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumRecommendation" ADD CONSTRAINT "AlbumRecommendation_seedAlbumId_fkey" FOREIGN KEY ("seedAlbumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumRecommendation" ADD CONSTRAINT "AlbumRecommendation_recommendedId_fkey" FOREIGN KEY ("recommendedId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;
