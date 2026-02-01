import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '【西外校园】邮箱验证码',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Microsoft YaHei', sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; text-align: center;">西外校园</h1>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">邮箱验证</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                您好！您正在注册西外校园账号，请使用以下验证码完成邮箱验证：
              </p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                验证码有效期为 <strong>10 分钟</strong>，请尽快完成验证。
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                如果您没有进行此操作，请忽略此邮件。
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                此邮件由系统自动发送，请勿回复
              </p>
            </div>
          </div>
        `,
      });
      this.logger.log(`Verification code sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification code to ${email}:`, error);
      return false;
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordReset(email: string, code: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '【西外校园】密码重置验证码',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Microsoft YaHei', sans-serif;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; text-align: center;">西外校园</h1>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">密码重置</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                您正在重置密码，请使用以下验证码：
              </p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <span style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                验证码有效期为 <strong>10 分钟</strong>。
              </p>
              <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
                ⚠️ 如果您没有进行此操作，您的账号可能存在安全风险，请及时修改密码。
              </p>
            </div>
          </div>
        `,
      });
      this.logger.log(`Password reset code sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset code to ${email}:`, error);
      return false;
    }
  }
}
