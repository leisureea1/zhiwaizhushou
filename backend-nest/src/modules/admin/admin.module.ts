import { Module, Global } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService, SystemLogService } from './services';

@Global()
@Module({
  controllers: [AdminController],
  providers: [AdminService, SystemLogService],
  exports: [AdminService, SystemLogService],
})
export class AdminModule {}
