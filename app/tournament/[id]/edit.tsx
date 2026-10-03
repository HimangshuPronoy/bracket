import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { Screen, Text, TextField, Button, Card } from '../../../src/components/ui';
import { useTheme } from '../../../src/theme/tokens';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { useTournament, useUpdateTournament } from '../../../src/hooks/useTournaments';

export default function EditTournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spacing, colors, radii } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  
  const { data: tournament, isLoading } = useTournament(id);
  const updateMutation = useUpdateTournament();

  const [name, setName] = useState('');
  const [game, setGame] = useState('');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [startsAt, setStartsAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fee, setFee] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');

  // Populate data when tournament is loaded
  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setGame(tournament.game);
      setLocation(tournament.location || '');
      setIsOnline(tournament.is_online);
      setStartsAt(tournament.starts_at ? new Date(tournament.starts_at) : new Date());
      setFee(tournament.registration_fee.toString());
      setPrizePool(tournament.prize_pool || '');
      setBannerUrl(tournament.banner_url || '');
      setThumbnailUrl(tournament.thumbnail_url || '');
      setVideoUrl(tournament.video_url || '');
      setDescription(tournament.description_md || '');
    }
  }, [tournament]);
  
  const handleUpdate = async () => {
    if (!name || !game || !startsAt) {
      Alert.alert('Error', 'Name, game, and start date are required.');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to edit a tournament.');
      return;
    }

    try {
      if (!startsAt || isNaN(startsAt.getTime())) {
         Alert.alert('Error', 'Invalid start date.');
         return;
      }

      let finalBannerUrl = bannerUrl || null;
      let finalThumbnailUrl = thumbnailUrl || null;

      if (thumbnailUri) {
        const ext = thumbnailUri.split('.').pop() ?? 'jpg';
        const filename = `${user.id}/${Date.now()}_thumb.${ext}`;
        
        const base64 = await FileSystem.readAsStringAsync(thumbnailUri, { encoding: FileSystem.EncodingType.Base64 });

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('tournament-banners')
          .upload(filename, decode(base64), {
            contentType: `image/${ext}`,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('tournament-banners')
            .getPublicUrl(uploadData.path);
          finalThumbnailUrl = publicUrlData.publicUrl;
        }
      }

      // Upload banner image if a new one was selected from device
      if (bannerUri) {
        const ext = bannerUri.split('.').pop() ?? 'jpg';
        const filename = `${user.id}/${Date.now()}_banner.${ext}`;
        
        const base64 = await FileSystem.readAsStringAsync(bannerUri, { encoding: FileSystem.EncodingType.Base64 });

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('tournament-banners')
          .upload(filename, decode(base64), {
            contentType: `image/${ext}`,
          });

        if (uploadErr) {
          throw new Error(`Failed to upload banner: ${uploadErr.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('tournament-banners')
          .getPublicUrl(uploadData.path);
          
        finalBannerUrl = publicUrlData.publicUrl;
      }

      await updateMutation.mutateAsync({
        id: tournament!.id,
        updates: {
          name,
          game,
          is_online: isOnline,
          location: isOnline ? null : location,
          starts_at: startsAt.toISOString(),
          registration_fee: fee ? parseFloat(fee) : 0,
          prize_pool: prizePool || null,
          banner_url: finalBannerUrl,
          thumbnail_url: finalThumbnailUrl,
          video_url: videoUrl || null,
          description_md: description || null,
        }
      });

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (isLoading || !tournament) {
    return (
      <Screen backgroundColor="backgroundGrouped" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  // Ensure only the organizer can edit
  if (user?.id !== tournament.organizer_id) {
    return (
      <Screen backgroundColor="backgroundGrouped" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text>You don't have permission to edit this tournament.</Text>
        <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="backgroundGrouped">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View style={{ padding: spacing.m, gap: spacing.l }}>
             {/* Header */}
             <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backCircle, { backgroundColor: colors.tintBg }]}>
                   <Text variant="headline" style={{ color: colors.label, lineHeight: 24, paddingBottom: 1 }}>‹</Text>
                </Pressable>
                <Text variant="headline">Edit Tournament</Text>
                <View style={{ width: 38 }} />
             </View>

             <View style={{ gap: spacing.m }}>
               <TextField label="Tournament Name" placeholder="e.g. Neo City Clash" value={name} onChangeText={setName} />
               <TextField label="Game" placeholder="e.g. Super Fighter V" value={game} onChangeText={setGame} />
               
               <Card style={{ padding: spacing.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => setIsOnline(!isOnline)}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                    <SymbolView name={isOnline ? "globe" : "mappin.and.ellipse"} tintColor={colors.accent} size={24} />
                    <Text variant="headline">{isOnline ? 'Online Tournament' : 'In-Person Event'}</Text>
                 </View>
                 <View style={[styles.radio, { borderColor: isOnline ? colors.accent : colors.separator }]}>
                    {isOnline && <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />}
                 </View>
               </Card>
               
               {!isOnline && (
                 <TextField label="Location" placeholder="e.g. Arcade Bar, NY" value={location} onChangeText={setLocation} />
               )}

               <View style={{ gap: spacing.xs }}>
                 <Text variant="footnote" color="secondaryLabel" style={{ marginLeft: spacing.xs }}>Start Date & Time</Text>
                 {Platform.OS === 'ios' ? (
                   <View style={{ alignSelf: 'flex-start', marginVertical: spacing.xs }}>
                     <DateTimePicker
                       value={startsAt}
                       mode="datetime"
                       display="default"
                       themeVariant="dark"
                       onChange={(e, date) => date && setStartsAt(date)}
                     />
                   </View>
                 ) : (
                   <>
                     <Button 
                       label={startsAt.toLocaleString()} 
                       variant="secondary" 
                       onPress={() => setShowDatePicker(true)} 
                     />
                     {showDatePicker && (
                       <DateTimePicker
                         value={startsAt}
                         mode="datetime"
                         display="default"
                         onChange={(e, date) => {
                           setShowDatePicker(false);
                           if (date) setStartsAt(date);
                         }}
                       />
                     )}
                   </>
                 )}
               </View>
               
               <View style={{ flexDirection: 'row', gap: spacing.m }}>
                 <View style={{ flex: 1 }}>
                   <TextField label="Entry Fee ($)" placeholder="0.00" keyboardType="numeric" value={fee} onChangeText={setFee} />
                 </View>
                 <View style={{ flex: 1 }}>
                   <TextField label="Prize Pool" placeholder="e.g. $5,000" value={prizePool} onChangeText={setPrizePool} />
                 </View>
               </View>

               <View style={{ gap: spacing.xs, marginBottom: spacing.m }}>
                 <Text variant="footnote" color="secondaryLabel" style={{ marginLeft: spacing.xs }}>Thumbnail Image (Square)</Text>
                 <View style={{ flexDirection: 'row', gap: spacing.m, alignItems: 'center' }}>
                   <Button 
                     label="Choose Photo" 
                     variant="secondary"
                     style={{ flex: 1 }}
                     onPress={async () => {
                       const result = await ImagePicker.launchImageLibraryAsync({
                         mediaTypes: ['images'],
                         allowsEditing: true,
                         aspect: [1, 1],
                         quality: 0.8,
                       });
                       if (!result.canceled) {
                         setThumbnailUri(result.assets[0].uri);
                         setThumbnailUrl('');
                       }
                     }} 
                   />
                   <Text variant="subheadline" color="secondaryLabel">or</Text>
                   <View style={{ flex: 1.5 }}>
                     <TextField 
                       placeholder="https://..." 
                       value={thumbnailUrl} 
                       onChangeText={(text) => {
                         setThumbnailUrl(text);
                         setThumbnailUri(null);
                       }} 
                       autoCapitalize="none" 
                       keyboardType="url" 
                       style={{ marginBottom: 0 }}
                     />
                   </View>
                 </View>
                 {(thumbnailUri || thumbnailUrl) ? (
                   <Card style={{ height: 100, width: 100, overflow: 'hidden', marginTop: spacing.s, borderWidth: 0 }}>
                     <View style={{ width: '100%', height: '100%', backgroundColor: colors.separator }}>
                       <Image source={{ uri: thumbnailUri || thumbnailUrl }} style={{ width: '100%', height: '100%' }} />
                     </View>
                   </Card>
                 ) : null}
               </View>

               <View style={{ gap: spacing.xs, marginBottom: spacing.m }}>
                 <Text variant="footnote" color="secondaryLabel" style={{ marginLeft: spacing.xs }}>Banner Image (Upload or URL)</Text>
                 <View style={{ flexDirection: 'row', gap: spacing.m, alignItems: 'center' }}>
                   <Button 
                     label="Choose Photo" 
                     variant="secondary"
                     style={{ flex: 1 }}
                     onPress={async () => {
                       const result = await ImagePicker.launchImageLibraryAsync({
                         mediaTypes: ['images'],
                         allowsEditing: true,
                         aspect: [16, 9],
                         quality: 0.8,
                       });
                       if (!result.canceled) {
                         setBannerUri(result.assets[0].uri);
                         setBannerUrl('');
                       }
                     }} 
                   />
                   <Text variant="subheadline" color="secondaryLabel">or</Text>
                   <View style={{ flex: 1.5 }}>
                     <TextField 
                       placeholder="https://..." 
                       value={bannerUrl} 
                       onChangeText={(text) => {
                         setBannerUrl(text);
                         setBannerUri(null);
                       }} 
                       autoCapitalize="none" 
                       keyboardType="url" 
                       style={{ marginBottom: 0 }}
                     />
                   </View>
                 </View>
                 {(bannerUri || bannerUrl) ? (
                   <Card style={{ height: 160, overflow: 'hidden', marginTop: spacing.s, borderWidth: 0 }}>
                     <View style={{ width: '100%', height: '100%', backgroundColor: colors.separator }}>
                       <Image source={{ uri: bannerUri || bannerUrl }} style={{ width: '100%', height: '100%' }} />
                     </View>
                   </Card>
                 ) : null}
               </View>

               <TextField label="Video URL (YouTube/Twitch)" placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChangeText={setVideoUrl} autoCapitalize="none" keyboardType="url" />
               <TextField label="Description" placeholder="Markdown supported..." value={description} onChangeText={setDescription} multiline />
             </View>

             <Button label="Save Changes" onPress={handleUpdate} loading={updateMutation.isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  backCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
});
