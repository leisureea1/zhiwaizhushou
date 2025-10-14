import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function PrivacyPage() {
  const goBack = () => {
    try {
      const pages = (Taro as any).getCurrentPages ? (Taro as any).getCurrentPages() : []
      if (pages && pages.length > 1) {
        Taro.navigateBack({ delta: 1 })
      } else {
        Taro.switchTab({ url: '/pages/profile/index' })
      }
    } catch (_) {
      Taro.switchTab({ url: '/pages/profile/index' })
    }
  }
  return (
    <View className='privacy-page'>
      {/* 状态栏占位，避免内容顶到屏幕最上方 */}
      <View className='status-bar-placeholder'></View>
      <View className='header'>
        <Text className='back' onClick={goBack}>返回</Text>
        <Text className='title'>隐私政策</Text>
        <Text className='meta'>更新日期： 2025 年 10 月 11 日</Text>
        <Text className='meta'>生效日期： 2025 年 10 月 11 日</Text>
      </View>

      <View className='para'>
        <Text>
          感谢您使用本小程序（以下简称“本小程序”）。我们非常重视您的个人信息与隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息，以及您如何行使相关权利。请您在使用本小程序前，仔细阅读并充分理解本隐私政策的全部内容。
        </Text>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>一、我们收集的信息</Text>
        <View className='ol'>
          <View className='li'>
            <Text className='li-title'>1. 基础账号信息</Text>
            <View className='ul'>
              <View className='li'><Text>• 当您通过微信授权登录时，我们将获取您的 微信昵称、头像、openid 等基础信息，用于身份识别和展示。</Text></View>
              <View className='li'><Text>• 若您拒绝授权，将无法登录使用与账号绑定的个性化功能（如课表推送、收藏记录等）。</Text></View>
            </View>
          </View>
          <View className='li'>
            <Text className='li-title'>2. 课程与通知信息</Text>
            <View className='ul'>
              <View className='li'><Text>• 为提供课表推送、课程提醒服务，本小程序会根据您的账号信息访问学校教务系统接口，仅在您授权的前提下获取课程数据。</Text></View>
              <View className='li'><Text>• 所有课程数据仅用于展示与推送，不会向任何第三方泄露。</Text></View>
            </View>
          </View>
          <View className='li'>
            <Text className='li-title'>3. 位置信息（可选）</Text>
            <View className='ul'>
              <View className='li'><Text>• 若您使用校内地图或定位功能，我们将在您授权后获取地理位置，用于显示当前位置、导航至目标建筑等。</Text></View>
              <View className='li'><Text>• 位置信息仅在本地用于地图展示，不会被上传或永久存储。</Text></View>
            </View>
          </View>
          <View className='li'>
            <Text className='li-title'>4. 图片与文件信息</Text>
            <View className='ul'>
              <View className='li'><Text>• 在发布失物招领或跳蚤市场信息时，您可以上传图片或文字内容。相关内容仅用于展示，不会被用于其他用途。</Text></View>
            </View>
          </View>
          <View className='li'>
            <Text className='li-title'>5. 设备与日志信息</Text>
            <View className='ul'>
              <View className='li'><Text>• 为保障系统安全与稳定，我们可能会自动收集设备型号、操作系统版本、IP 地址、访问时间、错误日志等。</Text></View>
            </View>
          </View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>二、我们如何使用您的信息</Text>
        <View className='ol'>
          <View className='li'><Text>1. 提供、维护与优化小程序服务功能（课表推送、地图、失物招领、公告等）；</Text></View>
          <View className='li'><Text>2. 验证用户身份，防止恶意注册或虚假信息发布；</Text></View>
          <View className='li'><Text>3. 实现课程提醒、校园导航等具体服务；</Text></View>
          <View className='li'><Text>4. 进行系统维护、功能调试与数据分析，提升使用体验；</Text></View>
          <View className='li'><Text>5. 在您同意的情况下，发送服务通知或更新提示。</Text></View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>三、信息的存储与保护</Text>
        <View className='ol'>
          <View className='li'><Text>1. 所有个人信息均存储于中国境内服务器。</Text></View>
          <View className='li'><Text>2. 我们采用符合行业标准的安全措施（包括 HTTPS 加密传输、访问控制、防火墙等）来保护您的数据安全。</Text></View>
          <View className='li'><Text>3. 除法律法规另有规定外，我们仅在实现服务目的所需的最短期限内保留您的信息。</Text></View>
          <View className='li'><Text>4. 当您注销账号或删除数据后，我们将立即删除或匿名化处理相关信息。</Text></View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>四、信息的共享与披露</Text>
        <View className='ol'>
          <View className='li'><Text>我们不会将您的个人信息出售、出租或泄露给任何第三方，除以下情况外：</Text></View>
          <View className='li'><Text>1. 获得您的明确授权或同意；</Text></View>
          <View className='li'><Text>2. 根据法律法规、司法机关或监管部门的要求提供；</Text></View>
          <View className='li'><Text>3. 为实现核心功能所必须（例如使用微信开放平台接口获取头像与昵称）；</Text></View>
          <View className='li'><Text>4. 为保证服务质量，与受信任的技术服务商（如云服务器提供商）在必要范围内共享。</Text></View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>五、您的权利</Text>
        <View className='ol'>
          <View className='li'><Text>1. 访问与更正权：您可在小程序个人中心查看、修改部分个人资料。</Text></View>
          <View className='li'><Text>2. 撤回授权权利：您可在微信中关闭相关授权（如位置信息、相册访问等）。</Text></View>
          <View className='li'><Text>3. 删除信息权：您可通过联系开发者请求删除发布内容或相关数据。</Text></View>
          <View className='li'><Text>4. 注销账号权：您可联系开发者申请注销账号，注销后所有个人数据将被清除或匿名化。</Text></View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>六、未成年人保护</Text>
        <View className='ol'>
          <View className='li'><Text>若您为未满 18 周岁的用户，请在监护人陪同下阅读并使用本小程序。</Text></View>
          <View className='li'><Text>我们不会主动收集未满 14 周岁儿童的个人信息。如发现此类信息被误收集，我们将及时删除。</Text></View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>七、隐私政策的更新</Text>
        <View className='ol'>
          <View className='li'><Text>我们可能会根据业务或法律要求更新本隐私政策。</Text></View>
          <View className='li'><Text>更新后的版本将在本小程序内显著位置公示，并即时生效。若涉及重大变更，我们将通过弹窗、公告等方式提示您。</Text></View>
        </View>
      </View>

      <View className='divider'>⸻</View>

      <View className='section'>
        <Text className='h2'>八、联系我们</Text>
        <View className='ol'>
          <View className='li'><Text>如您对本隐私政策或个人信息保护有任何疑问、意见或投诉，请通过以下方式与我们联系：</Text></View>
          <View className='li'><Text>联系微信：Leisureea</Text></View>
        </View>
      </View>
    </View>
  )
}
