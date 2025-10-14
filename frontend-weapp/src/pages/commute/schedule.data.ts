// 固定通勤车班次数据（可按需补全），周一=1, 周日=7
export type RouteKey = 'yt-ca' | 'ca-yt' | 'zh-ca' | 'ca-zh'

export const ROUTES: Array<{ key: RouteKey; label: string }> = [
  { key: 'yt-ca', label: '雁塔校区 - 长安校区' },
  { key: 'ca-yt', label: '长安校区 - 雁塔校区' },
  { key: 'zh-ca', label: '振华校区 - 长安校区' },
  { key: 'ca-zh', label: '长安校区 - 振华校区' }
]

export interface Trip { depart: string; arrive: string; note?: string }
export type DayNumber = 1|2|3|4|5|6|7
export type RouteSchedule = { [day in DayNumber]: Trip[] }

// 示例数据：先填一部分样例，后续按学校最终时刻表补齐
export const FIXED_SCHEDULE: Record<RouteKey, RouteSchedule> = {
  'yt-ca': {
    1: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ],
    2: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ],
    3: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ],
    4: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ],
    5: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ],
    6: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ],
    7: [ { depart: '07:00', arrive: '07:40' }, { depart: '09:00', arrive: '09:40' }, { depart: '13:00', arrive: '13:40' } ]
  },
  'ca-yt': {
    1: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ],
    2: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ],
    3: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ],
    4: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ],
    5: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ],
    6: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ],
    7: [ { depart: '12:15', arrive: '12:50' }, { depart: '16:10', arrive: '16:50' }, { depart: '17:10', arrive: '17:50' }, { depart: '18:15', arrive: '18:50' } ]
  },
  'zh-ca': {
    1: [ { depart: '06:30', arrive: '07:40' } ],
    2: [ { depart: '06:30', arrive: '07:40' } ],
    3: [ { depart: '06:30', arrive: '07:40' } ],
    4: [ { depart: '06:30', arrive: '07:40' } ],
    5: [ { depart: '06:30', arrive: '07:40' } ],
    6: [ { depart: '06:30', arrive: '07:40' } ],
    7: [ { depart: '06:30', arrive: '07:40' } ]
  },
  'ca-zh': {
    1: [ { depart: '17:05', arrive: '18:20' } ],
    2: [ { depart: '17:05', arrive: '18:20' } ],
    3: [ { depart: '17:05', arrive: '18:20' } ],
    4: [ { depart: '17:05', arrive: '18:20' } ],
    5: [ { depart: '17:05', arrive: '18:20' } ],
    6: [ { depart: '17:05', arrive: '18:20' } ],
    7: [ { depart: '17:05', arrive: '18:20' } ]
  }
}

// 注意：以上时间为示例/占位，请根据最终时刻表补全与校准。
