/**
 * Idempotent demo seed for local development.
 *
 * Usage:
 *   pnpm --filter @iot-deviceshield/api exec ts-node src/scripts/seed.ts
 *
 * Populates a small catalog of smart-home categories + devices.
 * Safe to run repeatedly; existing rows (matched by name) are left alone.
 */
import { AppDataSource } from '../data-source';
import { Category } from '../category/entities/category.entity';
import { Device } from '../devices/entities/device.entity';

interface SeedCategory {
  name: string;
  devices: string[];
}

const CATALOG: SeedCategory[] = [
  {
    name: 'Cameras',
    devices: ['Nest Cam', 'Wyze Cam v3', 'Arlo Pro 4', 'Ring Indoor Cam'],
  },
  {
    name: 'Speakers',
    devices: ['Amazon Echo Dot', 'Google Nest Mini', 'Sonos One'],
  },
  {
    name: 'Thermostats',
    devices: ['Nest Learning Thermostat', 'ecobee SmartThermostat'],
  },
  {
    name: 'Locks',
    devices: ['August Wi-Fi Smart Lock', 'Yale Assure Lock 2', 'Schlage Encode'],
  },
  {
    name: 'Routers',
    devices: ['ASUS RT-AX88U', 'Netgear Nighthawk', 'TP-Link Archer AX50'],
  },
];

async function main(): Promise<void> {
  const ds = await AppDataSource.initialize();
  const categoryRepo = ds.getRepository(Category);
  const deviceRepo = ds.getRepository(Device);

  let categoriesCreated = 0;
  let devicesCreated = 0;

  for (const seedCategory of CATALOG) {
    let category = await categoryRepo.findOne({ where: { name: seedCategory.name } });
    if (!category) {
      category = await categoryRepo.save(categoryRepo.create({ name: seedCategory.name }));
      categoriesCreated++;
    }
    for (const deviceName of seedCategory.devices) {
      const existing = await deviceRepo.findOne({
        where: { name: deviceName, category: { id: category.id } },
        relations: ['category'],
      });
      if (!existing) {
        await deviceRepo.save(deviceRepo.create({ name: deviceName, category }));
        devicesCreated++;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed] categories: +${categoriesCreated} new / ${CATALOG.length} total; devices: +${devicesCreated} new / ${CATALOG.reduce((n, c) => n + c.devices.length, 0)} total`,
  );

  await ds.destroy();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', err);
  process.exit(1);
});
