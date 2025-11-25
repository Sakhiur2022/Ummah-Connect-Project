import { ProfileAnimatedBackground } from '@/components/background/profile-animated-background'
import Header from '@/components/ui/header'
import React from 'react'

const page = () => {
  return (
   <>
    <Header />
    <ProfileAnimatedBackground/>
    <div className="flex items-center justify-center h-screen">

      <h1 className="text-4xl font-bold">Chatbot Page Coming Soon!</h1>
    </div>
   </>
  )
}

export default page