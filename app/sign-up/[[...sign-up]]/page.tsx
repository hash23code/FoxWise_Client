import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🦊 FoxWise Client</h1>
          <p className="text-white/80">Créer votre compte</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-orange-600 hover:bg-orange-700',
              card: 'shadow-2xl',
            }
          }}
        />
      </div>
    </div>
  )
}
