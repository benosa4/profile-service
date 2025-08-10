const { existsSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const { Bootstrap } = require('@midwayjs/bootstrap');

async function main() {
  // 1. Загружаем CA САМЫМ ПЕРВЫМ
  const caPath = resolve(join(__dirname, 'scylla-ca.crt'));
  console.log('🔍 Проверяем CA файл:', caPath);

  if (!existsSync(caPath)) {
    console.error('❌ Файл scylla-ca.crt не найден!');
    console.log('Содержимое директории:', require('fs').readdirSync(__dirname));
    process.exit(1);
  }

  const scyllaCa = readFileSync(caPath);
  console.log('🟢 CA загружен (размер:', scyllaCa.length, 'байт)');

  // 2. Создаем и настраиваем приложение
  const app = Bootstrap.configure({
    appDir: __dirname,
    imports: require('./dist/configuration'),
    globalConfig: {
      scyllaCa: scyllaCa // Регистрируем CA через глобальный конфиг
    }
  });

  // 3. Запускаем приложение
  try {
    await app.run();
    console.log('✅ Приложение успешно запущено');
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
    process.exit(1);
  }
}

main();