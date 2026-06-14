-- CreateTable
CREATE TABLE "RegistrationPhoto" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPhoto_registrationId_key" ON "RegistrationPhoto"("registrationId");

-- AddForeignKey
ALTER TABLE "RegistrationPhoto" ADD CONSTRAINT "RegistrationPhoto_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CompetitionPhoto" (
    "id" TEXT NOT NULL,
    "competitionRegistrationId" TEXT NOT NULL,
    "memberIndex" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionPhoto_competitionRegistrationId_memberIndex_key" ON "CompetitionPhoto"("competitionRegistrationId", "memberIndex");

-- AddForeignKey
ALTER TABLE "CompetitionPhoto" ADD CONSTRAINT "CompetitionPhoto_competitionRegistrationId_fkey" FOREIGN KEY ("competitionRegistrationId") REFERENCES "CompetitionRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
