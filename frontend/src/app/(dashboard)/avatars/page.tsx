'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RefreshCcw, Search, User, Video, X } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Avatar {
  avatar_id: string;
  name: string;
  thumbnailUrl: string;
}

interface Voice {
  id: string;
  name: string;
  status: string;
  sampleUrl?: string;
}

export default function AvatarsPage() {
  const router = useRouter();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    fetchAvatars();
    fetchVoices();
    
    // Check if user has seen the welcome modal before
    const hasSeenWelcomeModal = localStorage.getItem('hasSeenAvatarWelcomeModal');
    if (!hasSeenWelcomeModal) {
      setShowWelcomeModal(true);
    }
  }, []);
  
  // Handle closing the welcome modal
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenAvatarWelcomeModal', 'true');
  };
  
  // Filter avatars based on search query
  const filteredAvatars = avatars.filter(avatar => 
    avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Extract first name from a full name string
  const getFirstName = (fullName: string): string => {
    return fullName.split(' ')[0].toLowerCase();
  };
  
  // Get name variations for matching
  const getNameVariations = (name: string): string[] => {
    const lowerName = name.toLowerCase();
    const variations = [lowerName];
    
    // Common name variations
    const nameMap: Record<string, string[]> = {
      'sofia': ['sophie', 'sofi', 'sophia'],
      'sophie': ['sofia', 'sofi', 'sophia'],
      'sophia': ['sofia', 'sophie', 'sofi'],
      'alex': ['alexander', 'alexandra', 'alexis', 'alejandro', 'alessandra'],
      'alexander': ['alex', 'alessandro'],
      'alexandra': ['alex', 'alexis', 'alexa'],
      'mike': ['michael', 'mick', 'mickey'],
      'michael': ['mike', 'mick', 'mickey'],
      'bob': ['robert', 'rob', 'bobby'],
      'robert': ['rob', 'bob', 'bobby'],
      'jen': ['jennifer', 'jenny'],
      'jennifer': ['jen', 'jenny'],
      'liz': ['elizabeth', 'eliza', 'beth', 'lisa'],
      'elizabeth': ['liz', 'eliza', 'beth', 'lisa'],
      'steve': ['stephen', 'steven'],
      'stephen': ['steve', 'steven'],
      'steven': ['steve', 'stephen'],
      'kate': ['katherine', 'katie', 'catherine', 'kathy'],
      'katherine': ['kate', 'katie', 'kathy'],
      'catherine': ['kate', 'katie', 'kathy'],
      'dave': ['david', 'davey'],
      'david': ['dave', 'davey']
    };
    
    // Add variations if they exist
    if (nameMap[lowerName]) {
      variations.push(...nameMap[lowerName]);
    }
    
    return variations;
  };
  
  // Check if voice and avatar names match based on first name
  const isMatchingVoice = (avatarName: string, voiceName: string): boolean => {
    const avatarFirstName = getFirstName(avatarName);
    const voiceFirstName = getFirstName(voiceName);
    
    // Get possible variations of both names
    const avatarVariations = getNameVariations(avatarFirstName);
    const voiceVariations = getNameVariations(voiceFirstName);
    
    // Check if any variation matches
    for (const avatarVar of avatarVariations) {
      // Direct match
      if (voiceFirstName === avatarVar) return true;
      
      // Check if voice variations match avatar name
      for (const voiceVar of voiceVariations) {
        if (avatarVar === voiceVar) return true;
      }
    }
    
    // Also check for substring inclusion (for less common names)
    return voiceFirstName.includes(avatarFirstName) || 
           avatarFirstName.includes(voiceFirstName) ||
           // Similar sounding names might start with the same 3-4 letters
           (avatarFirstName.length >= 3 && voiceFirstName.length >= 3 && 
            (avatarFirstName.substring(0, 3) === voiceFirstName.substring(0, 3)));
  };
  
  // Find matching voices for an avatar based on first name
  const getMatchingVoices = (avatarName: string): Voice[] => {
    return voices.filter(voice => isMatchingVoice(avatarName, voice.name));
  };
  
  const fetchAvatars = async () => {
    setLoading(true);
    try {
      // Fetch avatars from our new API endpoint
      const avatarsResponse = await fetch('/api/tools/avatars');
      
      if (!avatarsResponse.ok) {
        throw new Error('Failed to fetch avatars');
      }
      
      const avatarsData = await avatarsResponse.json();
      setAvatars(avatarsData);
    } catch (error) {
      console.error('Error fetching avatars:', error);
      toast.error('Failed to load avatars. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchVoices = async () => {
    setLoadingVoices(true);
    try {
      const voicesResponse = await fetch('/api/tools/voices');
      
      if (!voicesResponse.ok) {
        throw new Error('Failed to fetch voices');
      }
      
      const voicesData = await voicesResponse.json();
      setVoices(voicesData);
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('Failed to load voices. Please try again.');
    } finally {
      setLoadingVoices(false);
    }
  };

  return (
    <div className="px-6 py-4">
      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Welcome to Machine Avatars
            </DialogTitle>
            <DialogDescription>
              Explore our gallery of AI-powered video avatars that can speak and act with realistic expressions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Video Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    These avatars can be used to create lifelike videos with synchronized speech and natural movements.
                    <span className="block mt-2 font-medium">Videos are limited to 305 characters of text per video.</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Voice Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Each avatar has matching voices that sound natural with their appearance. Use the same avatar and voice combination for consistency across multiple videos.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Create Your Digital Twin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm mb-2">
                      Get your own personalized AI avatar trained on your likeness for just <span className="font-bold">$80</span>.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your digital twin can be used in unlimited videos with any compatible voice.
                    </p>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => window.open('https://pixio.myapps.ai', '_blank')}>
                    Order Custom Avatar
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-amber-700">Content Restrictions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700">
                  <strong>AI videos cannot be used for:</strong>
                </p>
                <ul className="text-sm text-amber-700 list-disc pl-5 mt-1 space-y-1">
                  <li>Financial or investment advice</li>
                  <li>Medical diagnosis or treatment recommendations</li>
                  <li>Legal advice or representation</li>
                  <li>Impersonation of real individuals without consent</li>
                  <li>Deceptive, harmful, or explicit content</li>
                  <li>Political campaigning or election interference</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2">
                  Videos should be used responsibly and in compliance with applicable laws and regulations.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Powered by Pixio AI</p>
            <Button onClick={handleCloseWelcomeModal}>Get Started</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Machine Avatars</h1>
          <p className="text-muted-foreground">
            Browse avatars and find matching voices
          </p>
        </div>
        <Button variant="outline" onClick={fetchAvatars} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search avatars..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-[200px] w-full" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : filteredAvatars.length > 0 ? (
          filteredAvatars.map((avatar) => (
            <Card 
              key={avatar.avatar_id} 
              className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
              onClick={() => router.push(`/avatars/${avatar.avatar_id}`)}
            >
              <CardHeader className="p-0">
                {avatar.thumbnailUrl ? (
                  <div className="relative aspect-video w-full h-[200px]">
                    <Image
                      src={avatar.thumbnailUrl}
                      alt={avatar.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-muted flex items-center justify-center h-[200px]">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg">{avatar.name}</CardTitle>
                <CardDescription>ID: {avatar.avatar_id}</CardDescription>
                
                {/* Matching Voices */}
                {!loadingVoices && getMatchingVoices(avatar.name).length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium">Matching Voices:</p>
                    <div className="flex flex-wrap gap-1">
                      {getMatchingVoices(avatar.name).slice(0, 3).map(voice => (
                        <span 
                          key={voice.id} 
                          className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full"
                        >
                          {voice.name}
                        </span>
                      ))}
                      {getMatchingVoices(avatar.name).length > 3 && (
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          +{getMatchingVoices(avatar.name).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : searchQuery && avatars.length > 0 ? (
          <div className="col-span-full text-center py-10">
            <h3 className="text-lg font-medium">No avatars match your search</h3>
            <p className="text-muted-foreground mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="col-span-full text-center py-10">
            <h3 className="text-lg font-medium">No avatars available</h3>
            <p className="text-muted-foreground mt-2">Try refreshing or check your API configuration.</p>
          </div>
        )}
      </div>
    </div>
  );
}
