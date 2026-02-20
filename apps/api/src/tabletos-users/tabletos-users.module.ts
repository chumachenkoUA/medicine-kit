import { Module } from '@nestjs/common';
import { TabletosUsersService } from './tabletos-users.service';
import { TabletosUsersController } from './tabletos-users.controller';

@Module({
  controllers: [TabletosUsersController],
  providers: [TabletosUsersService],
})
export class TabletosUsersModule {}
