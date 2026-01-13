export enum Screen {
  LOGIN = 'LOGIN',
  HOME = 'HOME', // Schedule
  APPS = 'APPS',
  PROFILE = 'PROFILE',
  // Sub-apps
  GRADES = 'GRADES',
  EXAMS = 'EXAMS',
  BUS = 'BUS',
  EVALUATION = 'EVALUATION',
  AI_CHAT = 'AI_CHAT'
}

export interface User {
  name: string;
  id: string;
  major: string;
  type: string;
  avatar: string;
}

export const CURRENT_USER: User = {
  name: "张伟",
  id: "2021004562",
  major: "计算机科学与技术",
  type: "本科生",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqiTrZxgSI2BN0Ns_MdpV4ygiAi7m8iOt-gHjd4c4Dclne5M3M0aDLHatFRRV_L4kdk6_lli-84YhtDPFlXYbRjDfo2CW6vb4WHVVq7ODHXd3WQGgShYyiph2WJvbyHGQDk_U6IfZ7A9mtRHllcRWZNoQh-Cs_W8S6aUwpT2f3-tA73meCxKn1yCnUcTg9yH-FlnJb9Cw3CvdpJ6ftaIBdOBbteuG6cRNM5k0h92KvmwK55aOWSCW5JDOPnw_JU1tIWZVEex4s4pA"
};