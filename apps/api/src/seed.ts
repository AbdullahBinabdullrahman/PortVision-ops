import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Ahmed", "Fatima", "Omar", "Aisha", "Hassan", "Zainab", "Khalid", "Layla",
  "Yusuf", "Maryam", "Ibrahim", "Noor", "Said", "Hala",
];
const LAST_NAMES = [
  "Al-Sayed", "Hussein", "Mahmoud", "Khan", "Rahman", "Farooq", "Aziz", "Karim",
  "Bashir", "Nasser",
];
const CARGO_TYPES = [
  "Electronics", "Textiles", "Machinery", "Automotive Parts", "Food Products",
  "Chemicals", "Furniture", "Steel", "Plastics", "Pharmaceuticals",
];
const STATUSES = ["empty", "loaded", "in_transit", "inspection"] as const;
const SENSOR_TYPES = ["temp", "humidity", "tilt", "shock"] as const;

// Approx coordinates around Jebel Ali Port
const PORT_CENTER = { lat: 25.0167, lng: 55.0833 };

function rand<T>(arr: readonly T[]): T {
  const v = arr[Math.floor(Math.random() * arr.length)];
  if (v === undefined) throw new Error("rand: empty array");
  return v;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomReadingValue(type: (typeof SENSOR_TYPES)[number]) {
  switch (type) {
    case "temp":
      return { kind: "temp" as const, celsius: Number(randomBetween(5, 35).toFixed(1)) };
    case "humidity":
      return { kind: "humidity" as const, percent: Number(randomBetween(30, 80).toFixed(1)) };
    case "tilt":
      return { kind: "tilt" as const, degrees: Number(randomBetween(0, 10).toFixed(1)) };
    case "shock":
      return { kind: "shock" as const, g: Number(randomBetween(0, 2).toFixed(2)) };
  }
}

async function main(): Promise<void> {
  console.log("🌱 Seeding PortVision dev data...");

  // Wipe dependent rows before parents to satisfy FK constraints.
  await prisma.alert.deleteMany({});
  await prisma.action.deleteMany({});
  await prisma.sensorReading.deleteMany({});
  await prisma.headset.deleteMany({});
  await prisma.container.deleteMany({});
  await prisma.operator.deleteMany({});

  // Admin user
  const passwordHash = await bcrypt.hash("portvision", 10);
  await prisma.user.upsert({
    where: { email: "admin@portvision.local" },
    update: {},
    create: {
      email: "admin@portvision.local",
      passwordHash,
      role: "admin",
    },
  });

  // Operators
  const operatorRoles = ["inspector", "supervisor", "crane_op"] as const;
  const operators = await Promise.all(
    Array.from({ length: 8 }).map((_, i) =>
      prisma.operator.create({
        data: {
          name: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`,
          role: operatorRoles[i % operatorRoles.length] ?? "inspector",
          language: i % 3 === 0 ? "ar" : "en",
          active: true,
        },
      })
    )
  );

  // Headsets
  const headsetModels = ["Magic Leap 2", "Meta Quest Pro", "HoloLens 2"];
  const headsets = await Promise.all(
    Array.from({ length: 6 }).map((_, i) =>
      prisma.headset.create({
        data: {
          deviceModel: headsetModels[i % headsetModels.length] ?? "Magic Leap 2",
          serialNumber: `PV-${String(1000 + i).padStart(5, "0")}`,
          batteryLevel: 100,
          status: "offline",
          link: "offline",
          operatorId: operators[i % operators.length]?.id ?? null,
        },
      })
    )
  );

  // Containers
  const containers = await Promise.all(
    Array.from({ length: 30 }).map((_, i) =>
      prisma.container.create({
        data: {
          isoCode: `MSCU${String(1000000 + i).padStart(7, "0")}`,
          bleBeaconId: `BLE-${i.toString(16).padStart(8, "0")}`,
          status: STATUSES[i % STATUSES.length] ?? "empty",
          locationLat: new Prisma.Decimal(
            (PORT_CENTER.lat + (Math.random() - 0.5) * 0.01).toFixed(7)
          ),
          locationLng: new Prisma.Decimal(
            (PORT_CENTER.lng + (Math.random() - 0.5) * 0.01).toFixed(7)
          ),
          cargoType: rand(CARGO_TYPES),
          lastInspectedAt: i % 4 === 0 ? new Date(Date.now() - i * 3600_000) : null,
        },
      })
    )
  );

  // Historical sensor readings (last 24h, ~200 total)
  const readings: Prisma.SensorReadingCreateManyInput[] = [];
  for (let i = 0; i < 250; i++) {
    const c = rand(containers);
    const t = rand(SENSOR_TYPES);
    readings.push({
      containerId: c.id,
      sensorType: t,
      value: randomReadingValue(t),
      recordedAt: new Date(Date.now() - Math.floor(Math.random() * 86400_000)),
    });
  }
  await prisma.sensorReading.createMany({ data: readings });

  // A few starter alerts
  const alertSeeds = [
    { severity: "warn" as const, message: "Temperature 38.4°C exceeds warn threshold" },
    { severity: "critical" as const, message: "Tilt 32.1° exceeds critical threshold" },
    { severity: "info" as const, message: "Container marked for inspection by supervisor" },
  ];
  for (let i = 0; i < alertSeeds.length; i++) {
    const c = containers[i];
    const seed = alertSeeds[i];
    if (!c || !seed) continue;
    await prisma.alert.create({
      data: {
        containerId: c.id,
        severity: seed.severity,
        message: seed.message,
      },
    });
  }

  console.log(
    `✅ Seeded: 1 admin, ${operators.length} operators, ${headsets.length} headsets, ${containers.length} containers, ${readings.length} readings, ${alertSeeds.length} alerts`
  );
  console.log("   Login: admin@portvision.local / portvision");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
