<?php
class Logger {
    private static function logPath(): string {
        // 写到 backend/debug.log
        return str_replace('\\', '/', dirname(__DIR__, 2) . '/debug.log');
    }

    public static function log(string $tag, $data = null): void {
        try {
            $record = [
                'time' => date('Y-m-d H:i:s'),
                'tag' => $tag,
                'route' => $_SERVER['REQUEST_URI'] ?? '',
                'method' => $_SERVER['REQUEST_METHOD'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            ];

            if ($data !== null) {
                // 不要记录明文密码：仅对数组/对象的敏感键遮蔽；原始字符串按原样记录
                if (is_array($data) || is_object($data)) {
                    $record['data'] = self::maskSensitive($data);
                } else {
                    $record['data'] = $data;
                }
            }

            $line = json_encode($record, JSON_UNESCAPED_UNICODE);
            @file_put_contents(self::logPath(), $line . PHP_EOL, FILE_APPEND);
        } catch (\Throwable $e) {
            // 兜底到 PHP error_log
            error_log('[LoggerFallback] ' . $tag . ' ' . $e->getMessage());
        }
    }

    private static function maskSensitive($value) {
        // 仅对数组/对象中的敏感键进行遮蔽
        if (is_array($value)) {
            $masked = [];
            foreach ($value as $k => $v) {
                if (self::isPwdKey($k)) {
                    $masked[$k] = self::maskString((string)$v);
                } else {
                    $masked[$k] = self::maskSensitive($v);
                }
            }
            return $masked;
        }
        if (is_object($value)) {
            $arr = json_decode(json_encode($value, JSON_UNESCAPED_UNICODE), true);
            return self::maskSensitive($arr);
        }
        return $value; // 其他类型不处理
    }

    private static function isPwdKey($key): bool {
        $k = strtolower((string)$key);
        return strpos($k, 'password') !== false || $k === 'pwd' || $k === 'pass' || $k === 'secret';
    }

    private static function maskString(string $str): string {
        if ($str === '') return '';
        $len = mb_strlen($str, 'UTF-8');
        if ($len <= 2) return str_repeat('*', $len);
        return mb_substr($str, 0, 1, 'UTF-8') . str_repeat('*', max(1, $len - 2)) . mb_substr($str, -1, 1, 'UTF-8');
    }
}
?>