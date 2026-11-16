import * as dotenv from 'dotenv';
import { getSeedDataSource } from './seed-connection';
import { runBootstrapAdmin, outcomeToExitCode, sanitizeErrorCategory } from './bootstrap-admin';
import { parseBootstrapAdminConfig } from './bootstrap-admin.config';

dotenv.config({ quiet: true } as any);

async function main() {
  const result = parseBootstrapAdminConfig(process.env);
  
  if (!result.ok) {
    console.error('\n🚫 ERROR de configuración del bootstrap:');
    for (const err of result.errors) {
      console.error(`- ${err}`);
    }
    process.exitCode = 1;
    return;
  }

  const seedDataSource = getSeedDataSource();
  try {
    await seedDataSource.initialize();
    const outcome = await runBootstrapAdmin(seedDataSource, result.config);
    process.exitCode = outcomeToExitCode(outcome);
  } catch (error: any) {
    console.error(`\n🚫 ERROR fatal al inicializar el bootstrap: ${sanitizeErrorCategory(error)}`);
    process.exitCode = 1;
  } finally {
    if (seedDataSource.isInitialized) {
      await seedDataSource.destroy();
    }
  }
}

main().catch(() => {
  process.exitCode = 1;
});
