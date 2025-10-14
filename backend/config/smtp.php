<?php
// SMTP邮件配置文件

require_once dirname(__DIR__) . '/vendor/phpmailer/phpmailer/src/PHPMailer.php';
require_once dirname(__DIR__) . '/vendor/phpmailer/phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

class SMTPConfig {
    // 默认SMTP配置（从数据库读取）
    private static $config = null;
    
    /**
     * 获取SMTP配置
     */
    public static function getConfig() {
        if (self::$config === null) {
            // 从数据库获取SMTP配置
            try {
                require_once dirname(__DIR__) . '/config/database.php';
                $stmt = DatabaseConfig::query("SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1");
                self::$config = $stmt->fetch();
                
                // 如果没有配置，则使用默认值
                if (!self::$config) {
                    self::$config = [
                        'host' => 'smtp.example.com',
                        'port' => 587,
                        'username' => 'test@example.com',
                        'password' => 'testpassword',
                        'encryption' => 'tls'
                    ];
                }
            } catch (Exception $e) {
                // 数据库连接失败时使用默认配置
                self::$config = [
                    'host' => 'smtp.example.com',
                    'port' => 587,
                    'username' => 'test@example.com',
                    'password' => 'testpassword',
                    'encryption' => 'tls'
                ];
            }
        }
        
        return self::$config;
    }
    
    /**
     * 创建PHPMailer实例
     */
    public static function createMailer() {
        $config = self::getConfig();
        
        $mail = new PHPMailer(true);
        
        try {
            // 服务器设置
            $mail->isSMTP();
            $mail->Host = $config['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['username'];
            $mail->Password = $config['password'];
            $mail->SMTPSecure = $config['encryption'];
            $mail->Port = $config['port'];
            
            // 字符编码
            $mail->CharSet = 'UTF-8';
            
            return $mail;
        } catch (Exception $e) {
            throw new Exception('PHPMailer配置失败: ' . $e->getMessage());
        }
    }
    
    /**
     * 发送邮件
     */
    public static function sendEmail($to, $subject, $body) {
        try {
            $mail = self::createMailer();
            
            // 发件人
            $mail->setFrom(self::getConfig()['username'], '校园小程序');
            
            // 收件人
            $mail->addAddress($to);
            
            // 内容
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;
            
            return $mail->send();
        } catch (Exception $e) {
            throw new Exception('邮件发送失败: ' . $e->getMessage());
        }
    }
}