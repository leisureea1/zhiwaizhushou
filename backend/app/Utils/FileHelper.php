<?php
class FileHelper {
    /**
     * 仅当路径位于 public/uploads 目录下时执行 unlink
     * @param string $absPath 绝对路径
     * @return bool 删除是否成功
     */
    public static function safeUnlinkWithinUploads($absPath) {
        if (!is_string($absPath) || $absPath === '') return false;

        $uploadsDir = realpath(ROOT_PATH . '/public/uploads');
        $realPath = realpath($absPath);

        if (!$uploadsDir || !$realPath) return false;
        if (strpos($realPath, $uploadsDir) !== 0) return false;
        if (!is_file($realPath)) return false;

        // 已严格校验路径位于 uploads 目录，安全删除
        return @unlink($realPath); // nosemgrep: validated realpath inside uploads dir
    }
}
