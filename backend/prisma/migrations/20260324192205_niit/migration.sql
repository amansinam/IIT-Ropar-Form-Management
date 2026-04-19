/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'HOD', 'Caretaker', 'Dean', 'Faculty');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'VERIFIER_CREATED', 'VERIFIER_UPDATED', 'VERIFIER_DELETED', 'FORM_CREATED', 'FORM_UPDATED', 'FORM_DELETED', 'FORM_STATUS_TOGGLED', 'VERIFIER_LEVEL_ADDED', 'VERIFIER_LEVEL_REMOVED', 'VERIFIER_LEVEL_REORDERED', 'SUBMISSION_CREATED', 'SUBMISSION_UPDATED', 'SUBMISSION_DELETED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'VERIFICATION_REMARKED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('User', 'Verifier', 'System');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "role";

-- CreateTable
CREATE TABLE "Verifier" (
    "id" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "department" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "formStatus" BOOLEAN NOT NULL DEFAULT true,
    "formFields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormVerifierLevel" (
    "id" UUID NOT NULL,
    "formId" INTEGER NOT NULL,
    "verifierId" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormVerifierLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmissions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "formId" INTEGER NOT NULL,
    "formData" JSONB NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "overallStatus" "SubmissionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAction" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "verifierId" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "status" "SubmissionStatus" NOT NULL,
    "remark" TEXT,
    "actionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "action" "LogAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorUserId" UUID,
    "actorVerifierId" UUID,
    "formId" INTEGER,
    "submissionId" UUID,
    "diff" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verifier_email_key" ON "Verifier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FormVerifierLevel_formId_level_key" ON "FormVerifierLevel"("formId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "FormVerifierLevel_formId_verifierId_key" ON "FormVerifierLevel"("formId", "verifierId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationAction_submissionId_level_key" ON "VerificationAction"("submissionId", "level");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_actorVerifierId_idx" ON "AuditLog"("actorVerifierId");

-- CreateIndex
CREATE INDEX "AuditLog_formId_idx" ON "AuditLog"("formId");

-- CreateIndex
CREATE INDEX "AuditLog_submissionId_idx" ON "AuditLog"("submissionId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "FormVerifierLevel" ADD CONSTRAINT "FormVerifierLevel_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormVerifierLevel" ADD CONSTRAINT "FormVerifierLevel_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "Verifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmissions" ADD CONSTRAINT "FormSubmissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmissions" ADD CONSTRAINT "FormSubmissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAction" ADD CONSTRAINT "VerificationAction_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAction" ADD CONSTRAINT "VerificationAction_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "Verifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorVerifierId_fkey" FOREIGN KEY ("actorVerifierId") REFERENCES "Verifier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
