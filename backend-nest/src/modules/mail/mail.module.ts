import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('app.mail.host'),
          port: configService.get<number>('app.mail.port'),
          secure: configService.get<boolean>('app.mail.secure'),
          auth: {
            user: configService.get<string>('app.mail.user'),
            pass: configService.get<string>('app.mail.password'),
          },
        },
        defaults: {
          from: `"${configService.get<string>('app.mail.fromName')}" <${configService.get<string>('app.mail.from')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
