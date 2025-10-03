<?php
// 课程模型

require_once dirname(__DIR__) . '/../config/database.php';

class Course {
    /**
     * 根据用户ID获取课表
     */
    public static function getScheduleByUserId($uid) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM courses WHERE uid = ? ORDER BY week_day, start_time",
            [$uid]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 根据用户ID获取成绩
     */
    public static function getGradesByUserId($uid) {
        $stmt = DatabaseConfig::query(
            "SELECT * FROM grades WHERE uid = ? ORDER BY semester DESC, course_name",
            [$uid]
        );
        return $stmt->fetchAll();
    }
    
    /**
     * 批量插入课表数据
     */
    public static function batchInsertCourses($uid, $courses) {
        // 先删除原有课表数据
        DatabaseConfig::delete("DELETE FROM courses WHERE uid = ?", [$uid]);
        
        // 插入新课表数据
        foreach ($courses as $course) {
            $sql = "INSERT INTO courses (uid, course_name, course_code, teacher, classroom, week_day, start_time, end_time, semester) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            DatabaseConfig::insert($sql, [
                $uid,
                $course['course_name'],
                $course['course_code'] ?? '',
                $course['teacher'] ?? '',
                $course['classroom'] ?? '',
                $course['week_day'] ?? 0,
                $course['start_time'] ?? '00:00:00',
                $course['end_time'] ?? '00:00:00',
                $course['semester'] ?? ''
            ]);
        }
    }
    
    /**
     * 批量插入成绩数据
     */
    public static function batchInsertGrades($uid, $grades) {
        // 先删除原有成绩数据
        DatabaseConfig::delete("DELETE FROM grades WHERE uid = ?", [$uid]);
        
        // 插入新成绩数据
        foreach ($grades as $grade) {
            // 字段映射：中文字段名 -> 英文字段名
            $courseName = $grade['课程名称'] ?? $grade['course_name'] ?? '';
            $courseCode = $grade['课程代码'] ?? $grade['course_code'] ?? '';
            $credit = $grade['学分'] ?? $grade['credit'] ?? 0;
            
            // 成绩字段可能有多个名称
            $gradeValue = $grade['最终'] ?? $grade['总评成绩'] ?? $grade['成绩'] ?? $grade['grade'] ?? '';
            $semester = $grade['semester'] ?? $grade['学期'] ?? '';
            
            // 跳过空课程名
            if (empty($courseName)) {
                continue;
            }
            
            $sql = "INSERT INTO grades (uid, course_name, course_code, credit, grade, semester) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            DatabaseConfig::insert($sql, [
                $uid,
                $courseName,
                $courseCode,
                $credit,
                $gradeValue,
                $semester
            ]);
        }
    }
}