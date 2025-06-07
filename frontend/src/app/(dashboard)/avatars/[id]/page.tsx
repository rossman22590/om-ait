'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, RefreshCcw, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";
import Link from 'next/link';

interface Avatar {
  id: string;
  name: string;
  thumbnailUrl: string;
  coverImageUrl: string;
  status: string;
  gestures?: { label: string; slug: string; startFrame: number }[];
}

interface Voice {
  id: string;
  name: string;
  createAt: string;
  updatedAt: string;
  status: string;
  sampleUrl: string;
}

export default function AvatarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const avatarId = params.id as string;
  
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [showAllVoices, setShowAllVoices] = useState(false);
  
  useEffect(() => {
    fetchAvatarDetails();
    fetchVoices();
  }, [avatarId]);
  
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
  
  // Get only matching voices for the current avatar
  const getMatchingVoices = (): Voice[] => {
    if (!avatar) return [];
    return voices.filter(voice => isMatchingVoice(avatar.name, voice.name));
  };
  
  // Get filtered voices based on search
  const getFilteredVoices = (): Voice[] => {
    const voicesToShow = showAllVoices ? voices : getMatchingVoices();
    
    if (!voiceSearchQuery) return voicesToShow;
    
    return voicesToShow.filter(voice => 
      voice.name.toLowerCase().includes(voiceSearchQuery.toLowerCase())
    );
  };
  
  // Check if we should display all voices
  useEffect(() => {
    if (!loadingVoices && avatar && getMatchingVoices().length === 0) {
      setShowAllVoices(true);
    } else {
      setShowAllVoices(false);
    }
  }, [loadingVoices, avatar, voices]);
  
  const fetchAvatarDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tools/avatars/${avatarId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch avatar details');
      }
      
      const data = await response.json();
      setAvatar(data);
    } catch (error) {
      console.error('Error fetching avatar details:', error);
      toast.error('Failed to load avatar details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch('/api/tools/voices');
      
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }
      
      const data = await response.json();
      setVoices(data);
      if (data.length > 0) {
        setSelectedVoice(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('Failed to load voices. Please try again.');
    } finally {
      setLoadingVoices(false);
    }
  };
  
  const playVoiceSample = (voiceId: string, sampleUrl: string) => {
    setPlayingVoice(voiceId);
    
    const audio = new Audio(sampleUrl);
    audio.addEventListener('ended', () => {
      setPlayingVoice(null);
    });
    audio.addEventListener('error', () => {
      setPlayingVoice(null);
      toast.error('Failed to play voice sample');
    });
    audio.play();
  };

  return (
    <div className="px-6 py-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{loading ? 'Loading...' : avatar?.name || 'Avatar Details'}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          {loading ? (
            <Card className="overflow-hidden">
              <Skeleton className="h-[400px] w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          ) : avatar ? (
            <Card className="overflow-hidden">
              <div className="relative aspect-square w-full h-[400px]">
                <Image
                  src={avatar.coverImageUrl || avatar.thumbnailUrl}
                  alt={avatar.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <CardContent className="p-4">
                <CardTitle className="text-2xl">{avatar.name}</CardTitle>
                <p className="text-muted-foreground mt-2">Status: {avatar.status}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="bg-muted flex items-center justify-center h-[400px]">
                <User className="h-24 w-24 text-muted-foreground" />
              </div>
              <CardContent className="p-4">
                <p className="text-muted-foreground">Avatar not found or error loading</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Voices Section */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {avatar && !showAllVoices 
                      ? `Matching Voices for ${avatar.name}` 
                      : avatar && showAllVoices 
                        ? `All Available Voices` 
                        : 'Available Voices'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {avatar && getMatchingVoices().length > 0 && showAllVoices && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAllVoices(false)}
                      >
                        Show Matches Only
                      </Button>
                    )}
                    {avatar && getMatchingVoices().length === 0 && !showAllVoices && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowAllVoices(true)}
                      >
                        Show All Voices
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchVoices} 
                      disabled={loadingVoices}
                    >
                      <RefreshCcw className="h-3 w-3 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search voices..."
                    className="pl-10"
                    value={voiceSearchQuery}
                    onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingVoices ? (
                <div className="space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : getFilteredVoices().length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {getFilteredVoices().map((voice) => (
                    <Card 
                      key={voice.id} 
                      className={`p-4 cursor-pointer transition-all ${
                        selectedVoice === voice.id 
                          ? 'border-primary' 
                          : 'border-green-500'
                      }`}
                      onClick={() => setSelectedVoice(voice.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{voice.name}</h3>
                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                              Match
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Status: {voice.status}</p>
                        </div>
                        <Button 
                          size="icon"
                          variant="ghost"
                          disabled={!voice.sampleUrl || playingVoice === voice.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (voice.sampleUrl) {
                              playVoiceSample(voice.id, voice.sampleUrl);
                            }
                          }}
                        >
                          <Play className={`h-4 w-4 ${playingVoice === voice.id ? 'text-primary animate-ping' : ''}`} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : voices.length > 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium">No voices found</h3>
                  <p className="text-muted-foreground mt-2">
                    {voiceSearchQuery 
                      ? `No voices match your search "${voiceSearchQuery}". Try a different search.`
                      : showAllVoices 
                        ? `No voices available. Try refreshing.` 
                        : `No voices match with ${avatar?.name}.`
                    }
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium">No voices available</h3>
                  <p className="text-muted-foreground mt-2">Try refreshing or check your API configuration.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
