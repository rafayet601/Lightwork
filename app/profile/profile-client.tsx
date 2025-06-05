'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, BarChart3, Calendar, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string;
}

interface UserStats {
  workoutCount: number;
  memberSince: Date;
}

export default function ProfileClient({ user, stats }: { user: UserProfile; stats: UserStats }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSaveProfile = async () => {
    // This would actually save to the database in a real implementation
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    // Show success message
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text mb-8">
          Profile & Settings
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-1"
        >
          <Card className="border-glow bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4 text-center">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback>{getInitials(user.name || 'User')}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {stats.memberSince.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Workouts completed</span>
                  <span className="font-medium">{stats.workoutCount}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 pt-0">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/dashboard')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push('/progress')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Progress
              </Button>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Tabs Container */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-2"
        >
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-picture">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name || 'User')}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        Change Picture
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>App Settings</CardTitle>
                  <CardDescription>
                    Customize your app experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Theme Preferences</h3>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm">Light</Button>
                      <Button variant="outline" size="sm">Dark</Button>
                      <Button variant="default" size="sm">System</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Workout Settings</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rest Timer Sound</span>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-track Rest Time</span>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Data Management</h3>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">Export Workout Data</Button>
                      <Button variant="outline" size="sm">Import Workout Data</Button>
                      <Button variant="destructive" size="sm">Delete Account</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
} 