import { SearchIsland } from '@/features/home/islands/SearchIsland'
import { SecondaryPageIsland } from '@/features/home/islands/SecondaryPageIsland'
import { ShortcutsIsland } from '@/features/home/islands/ShortcutsIsland'
import { TimeIsland } from '@/features/home/islands/TimeIsland'
import { Background } from '@/components/Background'

export default function HomePage() {
  const initialTimestamp = Date.now()

  return (
    <div className="relative min-h-screen overflow-hidden selection:bg-white/30">
      {/* 动态高清壁纸与渐变遮罩 (复刻 home 项目底层渲染与平滑交叉淡入) */}
      <Background />

      {/* 主界面内容：同层级处于壁纸上方，无任何阻断 backdrop-filter 的滤镜或隔离层 */}
      <main
        id="home-main-layer"
        className="relative z-10 flex min-h-screen flex-col items-center px-6 pt-[8vh]"
      >
        <TimeIsland initialTimestamp={initialTimestamp} />
        <SearchIsland />
        <ShortcutsIsland />
      </main>

      {/* 二级桌面抽屉组件 */}
      <SecondaryPageIsland />
    </div>
  )
}
