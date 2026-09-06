import { CallbackIsland } from '@/features/home/islands/CallbackIsland'

export const metadata = {
  title: 'Logging in...',
}

export default function CallbackPage() {
  return (
    <div className="bg-[#050510] min-h-screen">
      <CallbackIsland />
    </div>
  )
}
