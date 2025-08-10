const { Bootstrap } = require('@midwayjs/bootstrap');
const { join } = require('path');
const { readFileSync, existsSync } = require('fs');

// 1. Функция загрузки CA с полной диагностикой
function loadScyllaCA() {
  const caPath = join(__dirname, 'scylla-ca.crt');
  console.log('🔍 Проверяем CA файл по пути:', caPath);

  if (!existsSync(caPath)) {
    console.error('❌ Файл scylla-ca.crt не найден!');
    console.error('Текущая директория:', __dirname);
    console.error('Полный путь:', require('path').resolve(caPath));
    process.exit(1);
  }

  try {
    const caContent = readFileSync(caPath);
    console.log('🟢 CA файл успешно загружен, размер:', caContent.length, 'байт');
    return caContent;
  } catch (e) {
    console.error('❌ Ошибка чтения CA файла:', e.message);
    process.exit(1);
  }
}

// 2. Перехватываем создание контейнера
console.log('⏳ Начинаем инициализацию Midway...');
const originalCreate = Bootstrap.create;
Bootstrap.create = function() {
  console.log('🛠 Создаем контейнер с предзагруженным CA...');
  const container = originalCreate.apply(this, arguments);
  container.registerObject('scyllaCa', loadScyllaCA());
  return container;
};

// 3. Запускаем приложение
Bootstrap.run()
  .then(() => console.log('✅ Приложение успешно запущено'))
  .catch(err => {
    console.error('❌ Ошибка запуска приложения:', err);
    process.exit(1);
  });

console.log('🚀 Bootstrap процесс запущен');