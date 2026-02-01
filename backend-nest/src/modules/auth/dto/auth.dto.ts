import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(3, { message: '用户名至少3个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @MinLength(6, { message: '密码至少6个字符' })
  password: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '邮箱验证令牌', required: false })
  @IsOptional()
  @IsString()
  emailToken?: string;

  @ApiProperty({ description: '学号', example: '20210001' })
  @IsNotEmpty({ message: '学号不能为空' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: '掌上西外密码（用于验证教务系统身份）' })
  @IsNotEmpty({ message: '掌上西外密码不能为空' })
  @IsString()
  xiwaiPassword: string;

  @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class LoginDto {
  @ApiProperty({ description: '学号', example: '20210001' })
  @IsNotEmpty({ message: '学号不能为空' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: '密码', example: 'Password123!' })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: '旧密码' })
  @IsNotEmpty({ message: '旧密码不能为空' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

export class ResetPasswordConfirmDto {
  @ApiProperty({ description: '重置令牌' })
  @IsNotEmpty({ message: '重置令牌不能为空' })
  @IsString()
  token: string;

  @ApiProperty({ description: '新密码' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;
}

export class BindJwxtDto {
  @ApiProperty({ description: '教务系统用户名（学号）' })
  @IsNotEmpty({ message: '教务系统用户名不能为空' })
  @IsString()
  jwxtUsername: string;

  @ApiProperty({ description: '教务系统密码' })
  @IsNotEmpty({ message: '教务系统密码不能为空' })
  @IsString()
  jwxtPassword: string;
}
