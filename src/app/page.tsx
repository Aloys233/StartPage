import { AuthMenu } from '@/features/home/components/AuthMenu'
import { SearchBar } from '@/features/home/components/SearchBar'
import { SecondaryPage } from '@/features/home/components/SecondaryPage'
import { ShortcutsSection } from '@/features/home/components/ShortcutsSection'
import { SyncStatusBar } from '@/features/home/components/SyncStatusBar'
import { TimeClock } from '@/features/home/components/TimeClock'
import { Background } from '@/components/Background'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-white/30">
      {/* 动态高清壁纸与渐变遮罩 (复刻 home 项目底层渲染与平滑交叉淡入) */}
      <Background />

      {/* 主界面内容：同层级处于壁纸上方，无任何阻断 backdrop-filter 的滤镜或隔离层 */}
      <main
        id="home-main-layer"
        className="relative z-10 flex min-h-screen flex-col items-center px-6 pt-[8vh]"
      >
        {/* 右上角常驻账户入口，与二级抽屉 authSlot 保持同一位置，展开时无缝接管 */}
        <div className="absolute top-6 right-6 z-20">
          <AuthMenu />
        </div>

        <TimeClock />
        <SearchBar />
        <ShortcutsSection />
      </main>

      {/* 二级桌面抽屉组件 */}
      <SecondaryPage />

      {/* 同步状态条：只挂一次（ShortcutsSection 在首页与抽屉各有一份实例） */}
      <SyncStatusBar />
    </div>
  )
}
