-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "breadcrumbs" TEXT,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "contentScore" DOUBLE PRECISION,
ADD COLUMN     "faqSchema" TEXT,
ADD COLUMN     "lastModified" TIMESTAMP(3),
ADD COLUMN     "metaKeywords" TEXT,
ADD COLUMN     "noFollow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noIndex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ogDescription" TEXT,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "ogTitle" TEXT,
ADD COLUMN     "ogType" TEXT DEFAULT 'article',
ADD COLUMN     "ogUrl" TEXT,
ADD COLUMN     "readabilityScore" DOUBLE PRECISION,
ADD COLUMN     "readingTime" INTEGER,
ADD COLUMN     "reviewSchema" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "schemaType" TEXT DEFAULT 'Article',
ADD COLUMN     "twitterCard" TEXT DEFAULT 'summary_large_image',
ADD COLUMN     "twitterCreator" TEXT,
ADD COLUMN     "twitterDescription" TEXT,
ADD COLUMN     "twitterImage" TEXT,
ADD COLUMN     "twitterSite" TEXT,
ADD COLUMN     "twitterTitle" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "seo_analysis" (
    "id" TEXT NOT NULL,
    "googleRanking" INTEGER,
    "bingRanking" INTEGER,
    "organicClicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clickThroughRate" DOUBLE PRECISION,
    "averagePosition" DOUBLE PRECISION,
    "pageSpeedScore" INTEGER,
    "loadingTime" DOUBLE PRECISION,
    "hasStructuredData" BOOLEAN NOT NULL DEFAULT false,
    "mobileFriendly" BOOLEAN NOT NULL DEFAULT false,
    "httpsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wordCount" INTEGER,
    "headingStructure" TEXT,
    "internalLinks" INTEGER NOT NULL DEFAULT 0,
    "externalLinks" INTEGER NOT NULL DEFAULT 0,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT NOT NULL,

    CONSTRAINT "seo_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_keywords" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "density" DOUBLE PRECISION,
    "ranking" INTEGER,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "seo_keywords_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "seo_analysis" ADD CONSTRAINT "seo_analysis_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_keywords" ADD CONSTRAINT "seo_keywords_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
