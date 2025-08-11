import { Controller, Get, Query } from '@midwayjs/decorator';

@Controller('/api')
export class ApiController {
  @Get('/get_user')
  async getUser(@Query('uid') uid: number) {
    return { message: 'OK' };
  }
}
