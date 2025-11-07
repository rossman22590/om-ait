'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Volume2, User, Mic, Copy, Check, ShoppingCart } from 'lucide-react';
import { fetchUserAvatars } from '@/lib/api/avatars';
import { toast } from 'sonner';

interface UserAvatar {
  avatar_id: string;
  voice_id: string;
  avatar_name: string;
  voice_name: string;
  subscription_id: string;
  tier: string;
  balance: string;
  avatar_thumbnail?: string;
  voice_sample?: string;
  voice_status?: string;
}

interface AvatarResponse {
  success: boolean;
  message: string;
  avatars: UserAvatar[];
  subscription_id?: string;
}

export default function MyAvatarsPage() {
  const [avatars, setAvatars] = useState<UserAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUserAvatars();
  }, []);

  const loadUserAvatars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AvatarResponse = await fetchUserAvatars();
      
      if (response.success) {
        setAvatars(response.avatars);
        if (response.avatars.length === 0) {
          toast.info('No avatars assigned to your subscription yet');
        } else {
          toast.success(`Found ${response.avatars.length} avatar(s)`);
        }
      } else {
        setError(response.message);
        toast.error(response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load avatars';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const playVoicePreview = async (voiceId: string, voiceSample?: string) => {
    if (playingVoice === voiceId) {
      // Stop playing
      setPlayingVoice(null);
      // Stop current audio if playing
      const currentAudio = document.querySelector('audio') as HTMLAudioElement;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      return;
    }

    if (voiceSample) {
      try {
        setPlayingVoice(voiceId);
        const audio = new Audio(voiceSample);
        audio.onended = () => setPlayingVoice(null);
        audio.onerror = () => {
          setPlayingVoice(null);
          toast.error('Failed to play voice preview');
        };
        await audio.play();
      } catch (error) {
        setPlayingVoice(null);
        toast.error('Failed to play voice preview');
      }
    } else {
      toast.info('Voice preview not available');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIds(prev => new Set(prev).add(text));
      toast.success(`${label} copied to clipboard!`);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(text);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error(`Failed to copy ${label}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Avatars</h1>
          <p className="text-muted-foreground">
            Avatars and voices associated with your subscription
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Avatars</h1>
          <p className="text-muted-foreground">
            Avatars and voices associated with your subscription
          </p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Avatars</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadUserAvatars} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Avatars</h1>
            <p className="text-muted-foreground">
              Avatars and voices associated with your subscription
            </p>
          </div>
          <Button
            onClick={() => window.open('https://buy.stripe.com/eVq6oH4Qcazr8tO88m8AE06', '_blank')}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Purchase Avatar Now
          </Button>
        </div>
      </div>

      {avatars.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Avatars Found</CardTitle>
            <CardDescription>
              No avatars are currently assigned to your subscription. Contact support if you believe this is an error.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadUserAvatars} variant="outline">
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {avatars.map((avatar) => (
            <Card key={avatar.avatar_id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {avatar.avatar_name}
                  </CardTitle>
                  <Badge variant="secondary">{avatar.tier}</Badge>
                </div>
                <CardDescription>
                  Balance: ${avatar.balance}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Avatar Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Avatar Preview
                  </h4>
                  <div className="flex flex-col items-center gap-3">
                    {avatar.avatar_thumbnail ? (
                      <div className="relative">
                        <img 
                          src={avatar.avatar_thumbnail} 
                          alt={avatar.avatar_name}
                          className="w-32 h-32 rounded-lg object-cover border-2 border-border shadow-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <Avatar className="w-32 h-32 rounded-lg hidden">
                          <AvatarFallback className="text-2xl">
                            {avatar.avatar_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <Avatar className="w-32 h-32 rounded-lg">
                        <AvatarFallback className="text-2xl">
                          {avatar.avatar_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="text-center">
                      <p className="font-medium">{avatar.avatar_name}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          ID: {avatar.avatar_id.substring(0, 8)}...
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(avatar.avatar_id, 'Avatar ID')}
                          className="h-6 w-6 p-0"
                        >
                          {copiedIds.has(avatar.avatar_id) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Section */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Voice Player
                  </h4>
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="font-medium">{avatar.voice_name}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          ID: {avatar.voice_id.substring(0, 8)}...
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(avatar.voice_id, 'Voice ID')}
                          className="h-6 w-6 p-0"
                        >
                          {copiedIds.has(avatar.voice_id) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      {avatar.voice_status && (
                        <Badge variant={avatar.voice_status === 'IDLE' ? 'default' : 'secondary'} className="text-xs mt-1">
                          {avatar.voice_status}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Voice Player Controls */}
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        size="lg"
                        variant={playingVoice === avatar.voice_id ? "secondary" : "default"}
                        onClick={() => playVoicePreview(avatar.voice_id, avatar.voice_sample)}
                        disabled={!avatar.voice_sample}
                        className="w-full"
                      >
                        {playingVoice === avatar.voice_id ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Stop Playing
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Play Voice Sample
                          </>
                        )}
                      </Button>
                      
                      {!avatar.voice_sample && (
                        <p className="text-xs text-muted-foreground">
                          Voice sample not available
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Subscription: {avatar.subscription_id.substring(0, 12)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button onClick={loadUserAvatars} variant="outline">
          <Volume2 className="h-4 w-4 mr-2" />
          Refresh Avatars
        </Button>
      </div>
    </div>
  );
}
