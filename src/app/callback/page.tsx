import { SignInCallback } from '@/features/home/components/SignInCallback'

export const metadata = {
  title: 'Logging in...',
}

export default function CallbackPage() {
  return (
    <div className="bg-[#050510] min-h-screen">
      <SignInCallback />
    </div>
  )
}
