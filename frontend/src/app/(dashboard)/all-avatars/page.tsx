'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Volume2, User, Mic, Copy, Check, ShoppingCart, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchAllAvatars, AllAvatarsItem, AllAvatarsResponse } from '@/lib/api';
import { toast } from 'sonner';

export default function AllAvatarsPage() {
  const [items, setItems] = useState<AllAvatarsItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AllAvatarsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoices, setSelectedVoices] = useState<Record<string, string>>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadAllAvatars();
  }, []);

  useEffect(() => {
    // Filter items based on search term
    if (searchTerm.trim() === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        (item.avatar_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.voice_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.avatar_id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.voice_id?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const loadAllAvatars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AllAvatarsResponse = await fetchAllAvatars();

      if (response.success) {
        setItems(response.items);
        setFilteredItems(response.items);
        toast.success(`Found ${response.total_count} avatars and voices`);
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

  const playVoicePreview = async (voiceId: string | null, voiceSample?: string | null) => {
    if (!voiceId || !voiceSample) {
      toast.info('Voice preview not available');
      return;
    }

    if (playingVoice === voiceId) {
      // Stop playing
      setPlayingVoice(null);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      return;
    }

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }

      setPlayingVoice(voiceId);
      const audio = new Audio(voiceSample);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        setPlayingVoice(null);
        setCurrentAudio(null);
      };
      
      audio.onerror = () => {
        setPlayingVoice(null);
        setCurrentAudio(null);
        toast.error('Failed to play voice preview');
      };
      
      await audio.play();
    } catch (error) {
      setPlayingVoice(null);
      setCurrentAudio(null);
      toast.error('Failed to play voice preview');
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
          <h1 className="text-3xl font-bold mb-2">All Avatars & Voices</h1>
          <p className="text-muted-foreground">
            Browse all available avatars and voices from Argil AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-32 mx-auto rounded-lg mb-4" />
                <Skeleton className="h-10 w-full" />
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
          <h1 className="text-3xl font-bold mb-2">All Avatars & Voices</h1>
          <p className="text-muted-foreground">
            Browse all available avatars and voices from Argil AI
          </p>
        </div>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Avatars</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadAllAvatars} variant="outline">
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
            <h1 className="text-3xl font-bold mb-2">All Avatars & Voices</h1>
            <p className="text-muted-foreground">
              Browse all available avatars and voices from Argil AI
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

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search avatars and voices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Results Found</CardTitle>
            <CardDescription>
              {searchTerm ? `No avatars or voices match "${searchTerm}"` : 'No avatars or voices available'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => {
            // Create a unique key that combines avatar_id, voice_id, and index
            const uniqueKey = `${item.avatar_id || 'no-avatar'}-${item.voice_id || 'no-voice'}-${index}`;
            
            return (
              <Card key={uniqueKey} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {item.avatar_name || item.voice_name || 'Unknown'}
                    </CardTitle>
                    <div className="flex gap-1">
                      {item.avatar_id && (
                        <Badge variant="secondary" className="text-xs">
                          Avatar
                        </Badge>
                      )}
                      {item.has_voice && (
                        <Badge variant="outline" className="text-xs">
                          Voice
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Avatar Section */}
                  {item.avatar_id && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Avatar Preview
                      </h4>
                      <div className="flex flex-col items-center gap-3">
                        {item.avatar_thumbnail ? (
                          <div className="relative">
                            <img 
                              src={item.avatar_thumbnail} 
                              alt={item.avatar_name || 'Avatar'}
                              className="w-40 h-40 rounded-lg object-cover border-2 border-border shadow-md"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <Avatar className="w-40 h-40 rounded-lg hidden">
                              <AvatarFallback className="text-2xl">
                                {(item.avatar_name || 'A').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ) : (
                          <Avatar className="w-40 h-40 rounded-lg">
                            <AvatarFallback className="text-2xl">
                              {(item.avatar_name || 'A').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              ID: {item.avatar_id.substring(0, 8)}...
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(item.avatar_id!, 'Avatar ID')}
                              className="h-5 w-5 p-0"
                            >
                              {copiedIds.has(item.avatar_id!) ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {item.avatar_status && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {item.avatar_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice Section */}
                  {item.has_voice && item.voice_id && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Voice Player
                      </h4>
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              ID: {item.voice_id.substring(0, 8)}...
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(item.voice_id!, 'Voice ID')}
                              className="h-5 w-5 p-0"
                            >
                              {copiedIds.has(item.voice_id!) ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {item.voice_status && (
                            <Badge variant={item.voice_status === 'IDLE' ? 'default' : 'secondary'} className="text-xs mt-1">
                              {item.voice_status}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Voice Player Controls */}
                        <div className="flex flex-col items-center gap-2">
                          <Button
                            size="sm"
                            variant={playingVoice === item.voice_id ? "secondary" : "default"}
                            onClick={() => playVoicePreview(item.voice_id, item.voice_sample)}
                            disabled={!item.voice_sample}
                            className="w-full"
                          >
                            {playingVoice === item.voice_id ? (
                              <>
                                <Pause className="h-3 w-3 mr-2" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-2" />
                                Play Sample
                              </>
                            )}
                          </Button>
                          
                          {!item.voice_sample && (
                            <p className="text-xs text-muted-foreground">
                              Voice sample not available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avatar without matched voice */}
                  {item.avatar_id && !item.has_voice && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-xs flex items-center gap-1">
                        <Mic className="h-3 w-3" />
                        Voice
                      </h4>
                      <div className="space-y-2">
                        <Select
                          value={selectedVoices[item.avatar_id] || ''}
                          onValueChange={(value) => setSelectedVoices(prev => ({ ...prev, [item.avatar_id!]: value }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {items
                              .filter((voiceItem) => voiceItem.has_voice && voiceItem.voice_id)
                              .filter((voiceItem, index, arr) => 
                                arr.findIndex(v => v.voice_id === voiceItem.voice_id) === index
                              )
                              .map((voiceItem, voiceIndex) => (
                                <SelectItem 
                                  key={`${voiceItem.voice_id}-${voiceIndex}`} 
                                  value={voiceItem.voice_id!} 
                                  className="text-xs"
                                >
                                  {voiceItem.voice_name?.split(' ')[0] || 'Unknown'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const selectedVoiceId = selectedVoices[item.avatar_id!];
                            const voiceItem = items.find((voiceItem) => voiceItem.voice_id === selectedVoiceId);
                            playVoicePreview(selectedVoiceId, voiceItem?.voice_sample);
                          }}
                          disabled={!selectedVoices[item.avatar_id!]}
                          className="w-full h-7 text-xs"
                        >
                          <Play className="h-2 w-2 mr-1" />
                          Play
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* No Avatar or Voice */}
                  {!item.avatar_id && !item.has_voice && (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No preview available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
