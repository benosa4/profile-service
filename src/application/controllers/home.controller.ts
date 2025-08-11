import { Controller, Get } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';

@Controller('/')
export class HomeController {
  @Get('/')
  async home(ctx: Context) {
    return 'Hello Midwayjs!';
  }
}
