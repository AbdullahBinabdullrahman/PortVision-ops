-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'viewer');

-- CreateEnum
CREATE TYPE "OperatorRole" AS ENUM ('inspector', 'supervisor', 'crane_op');

-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('empty', 'loaded', 'in_transit', 'inspection');

-- CreateEnum
CREATE TYPE "SensorType" AS ENUM ('temp', 'humidity', 'tilt', 'shock');

-- CreateEnum
CREATE TYPE "HeadsetStatus" AS ENUM ('online', 'offline', 'charging');

-- CreateEnum
CREATE TYPE "ConnectivityLink" AS ENUM ('5g', 'wifi', 'offline');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('inspect', 'flag', 'note', 'dispatch');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warn', 'critical');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('insert', 'update', 'delete');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "OperatorRole" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Headset" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT,
    "deviceModel" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "batteryLevel" INTEGER NOT NULL DEFAULT 100,
    "status" "HeadsetStatus" NOT NULL DEFAULT 'offline',
    "link" "ConnectivityLink" NOT NULL DEFAULT 'offline',
    "rssi" INTEGER,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "Headset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "bleBeaconId" TEXT,
    "status" "ContainerStatus" NOT NULL DEFAULT 'empty',
    "locationLat" DECIMAL(10,7),
    "locationLng" DECIMAL(10,7),
    "cargoType" TEXT,
    "lastInspectedAt" TIMESTAMP(3),

    CONSTRAINT "Container_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "sensorType" "SensorType" NOT NULL,
    "value" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "headsetId" TEXT,
    "actionType" "ActionType" NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT,
    "action" "AuditAction" NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Headset_serialNumber_key" ON "Headset"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Container_isoCode_key" ON "Container"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Container_bleBeaconId_key" ON "Container"("bleBeaconId");

-- CreateIndex
CREATE INDEX "Container_status_idx" ON "Container"("status");

-- CreateIndex
CREATE INDEX "SensorReading_containerId_recordedAt_idx" ON "SensorReading"("containerId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "SensorReading_sensorType_recordedAt_idx" ON "SensorReading"("sensorType", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "Action_createdAt_idx" ON "Action"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Action_operatorId_createdAt_idx" ON "Action"("operatorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Alert_acknowledged_severity_createdAt_idx" ON "Alert"("acknowledged", "severity", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_tableName_performedAt_idx" ON "AuditLog"("tableName", "performedAt" DESC);

-- AddForeignKey
ALTER TABLE "Headset" ADD CONSTRAINT "Headset_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_headsetId_fkey" FOREIGN KEY ("headsetId") REFERENCES "Headset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "Container"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
