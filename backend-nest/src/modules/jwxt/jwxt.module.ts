import { Module } from '@nestjs/common';
import { JwxtController } from './jwxt.controller';
import { JwxtClientService } from '@/services/jwxt-client.service';

@Module({
  controllers: [JwxtController],
  providers: [JwxtClientService],
  exports: [JwxtClientService],
})
export class JwxtModule {}
