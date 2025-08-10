// // loggable.decorator.ts

// console.log('=== [Loggable] DECORATOR FILE LOADED ===');

// import { createCustomPropertyDecorator, IApplicationContext } from '@midwayjs/core';
// import { LoggerService } from '../configuration/logger.service';

// export const LOGGABLE_KEY = 'decorator:loggable_key';

// export function Loggable(): PropertyDecorator {
//     console.log('=== [Loggable] DECORATOR FILE LOADED ===');

//   return createCustomPropertyDecorator(LOGGABLE_KEY, {
//     async onObjectInit(instance: any, propertyName: string, container: IApplicationContext) {
//         console.log('=== [Loggable] DECORATOR FILE LOADED ===');

//       console.log(`=== [Loggable] onObjectInit => ${instance.constructor.name}.${String(propertyName)}`);
//       const loggerService = await container.getAsync(LoggerService);
//       instance[propertyName] = loggerService.createLogger(instance.constructor.name);
//       console.log(`=== [Loggable] assigned logger to ${instance.constructor.name}.${String(propertyName)}`);
//     },
//   });
// }
