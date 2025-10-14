<?php
// 图片处理服务：将上传图片压缩并转为 WebP

class ImageService {
    /**
     * 将源图片压缩为 webp 并保存
     * @param string $srcPath 源文件绝对路径（临时文件）
     * @param string $destPath 保存的 webp 绝对路径（包含文件名.webp）
     * @param int $maxWidth 限制最大宽度，超出则等比缩放
     * @param int $quality webp 压缩质量（0-100）
     * @return array [width,height,path]
     * @throws Exception
     */
    public static function saveAsWebp(string $srcPath, string $destPath, int $maxWidth = 1280, int $quality = 80): array {
        if (!extension_loaded('gd')) {
            throw new Exception('GD 扩展未开启，无法处理图片');
        }

        $info = getimagesize($srcPath);
        if ($info === false) {
            throw new Exception('无法读取图片信息');
        }
        $mime = $info['mime'] ?? '';

        switch ($mime) {
            case 'image/jpeg':
            case 'image/pjpeg':
                $img = imagecreatefromjpeg($srcPath);
                break;
            case 'image/png':
                $img = imagecreatefrompng($srcPath);
                break;
            case 'image/webp':
                $img = imagecreatefromwebp($srcPath);
                break;
            case 'image/gif':
                $img = imagecreatefromgif($srcPath);
                break;
            default:
                throw new Exception('不支持的图片格式: ' . $mime);
        }

        if (!$img) {
            throw new Exception('图片资源创建失败');
        }

        $width = imagesx($img);
        $height = imagesy($img);

        // 等比缩放
        if ($width > $maxWidth) {
            $scale = $maxWidth / $width;
            $newW = (int) round($width * $scale);
            $newH = (int) round($height * $scale);
            $dst = imagecreatetruecolor($newW, $newH);

            // 处理透明
            imagealphablending($dst, false);
            imagesavealpha($dst, true);

            imagecopyresampled($dst, $img, 0, 0, 0, 0, $newW, $newH, $width, $height);
            imagedestroy($img);
            $img = $dst;
            $width = $newW;
            $height = $newH;
        }

        // 确保目标目录存在
        $dir = dirname($destPath);
        if (!is_dir($dir)) {
            if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
                throw new Exception('创建目录失败: ' . $dir);
            }
        }

        // 保存为 webp
        if (!imagewebp($img, $destPath, $quality)) {
            imagedestroy($img);
            throw new Exception('保存 WebP 失败');
        }

        imagedestroy($img);
        return ['width' => $width, 'height' => $height, 'path' => $destPath];
    }
}


