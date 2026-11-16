import { runCatalogsSeed } from './catalogs.seed';
import { getSeedDataSource } from './seed-connection';

async function main() {
  const seedDataSource = getSeedDataSource();
  
  try {
    console.log('Conectando a base de datos de seed...');
    await seedDataSource.initialize();
    console.log('Conectado.');
    
    await runCatalogsSeed(seedDataSource);
    
    console.log('Todos los seeds han finalizado correctamente.');
  } catch (error) {
    console.error('Error durante la ejecución del seed:', error);
    process.exitCode = 1;
  } finally {
    if (seedDataSource.isInitialized) {
      await seedDataSource.destroy();
    }
  }
}

main();
