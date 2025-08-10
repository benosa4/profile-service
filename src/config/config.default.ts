//config.default.ts
import { MidwayConfig } from '@midwayjs/core';

export default {
  // use for cookie sign key, should change to your own and keep security
  // scyllaCa: readFileSync(join(__dirname, '../../scylla-ca.crt')),
  keys: '1742054069479_5347',
  koa: {
    port: 7001,
  },
  midwayLogger: {
    default: {
      level: 'debug',
      consoleLevel: 'debug',
      format: info => {
        // Универсальный цветной формат для всех окружений
        const colors = {
          info: '\x1b[32m',  // зелёный
          error: '\x1b[31m', // красный
          warn: '\x1b[33m',  // жёлтый
          reset: '\x1b[0m'   // сброс
        };
        return `${colors[info.level]}${info.timestamp} ${info.message}${colors.reset}`;
      }
    },
    transports: {
      console: {
        withColors: true // Форсируем цвета
      },
      file: {
        dir: './logs'
      }
    },
    clients: {
      coreLogger: {
        level: 'debug',
        consoleLevel: 'debug',
        transports: {
          file: {
            dir: './logs',
            level: 'info'
          },
          console: {
            level: 'debug'
          }
        }
      },
      appLogger: {
        level: 'debug',
        consoleLevel: 'debug',
        transports: {
          file: {
            dir: './logs',
            level: 'info'
          },
          console: {
            level: 'debug'
          }
        }
      }
    },
    earlyLogger: {
      level: 'debug',
      consoleLevel: 'debug'
    }
  }
} as MidwayConfig;
