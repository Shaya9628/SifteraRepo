import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LandingContent {
  id: string;
  section: string;
  key: string;
  value: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  updated_at: string;
}

export interface LandingMedia {
  id: string;
  section: string;
  media_type: 'image' | 'video';
  file_url: string;
  file_name: string;
  alt_text: string | null;
  created_at: string;
}

export const useLandingContent = (section?: string) => {
  return useQuery({
    queryKey: ['landing-content', section],
    queryFn: async () => {
      let query = supabase
        .from('landing_page_content')
        .select('*')
        .eq('is_active', true);
      
      if (section) {
        query = query.eq('section', section);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as LandingContent[];
    },
  });
};

export const useLandingMedia = (section?: string) => {
  return useQuery({
    queryKey: ['landing-media', section],
    queryFn: async () => {
      let query = supabase
        .from('landing_page_media')
        .select('*');
      
      if (section) {
        query = query.eq('section', section);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as LandingMedia[];
    },
  });
};

export const useAllLandingContent = () => {
  return useQuery({
    queryKey: ['landing-content-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .order('section', { ascending: true })
        .order('key', { ascending: true });
      
      if (error) throw error;
      return data as LandingContent[];
    },
  });
};

export const useUpdateLandingContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ section, key, value, metadata }: { section: string; key: string; value: string; metadata?: Record<string, any> }) => {
      const { data: existingData } = await supabase
        .from('landing_page_content')
        .select('id')
        .eq('section', section)
        .eq('key', key)
        .maybeSingle();
      
      if (existingData) {
        const { error } = await supabase
          .from('landing_page_content')
          .update({ value, metadata, updated_at: new Date().toISOString() })
          .eq('id', existingData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('landing_page_content')
          .insert({ section, key, value, metadata });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-content'] });
      queryClient.invalidateQueries({ queryKey: ['landing-content-all'] });
      toast.success('Content updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update content: ' + error.message);
    },
  });
};

export const useUploadLandingMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ section, file, mediaType, altText }: { section: string; file: File; mediaType: 'image' | 'video'; altText?: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${section}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('landing-assets')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('landing-assets')
        .getPublicUrl(fileName);
      
      const { error: insertError } = await supabase
        .from('landing_page_media')
        .insert({
          section,
          media_type: mediaType,
          file_url: publicUrl,
          file_name: file.name,
          alt_text: altText,
        });
      
      if (insertError) throw insertError;
      
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-media'] });
      toast.success('Media uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload media: ' + error.message);
    },
  });
};

export const useDeleteLandingMedia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      // Extract file path from URL
      const urlParts = fileUrl.split('/landing-assets/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('landing-assets').remove([filePath]);
      }
      
      const { error } = await supabase
        .from('landing_page_media')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-media'] });
      toast.success('Media deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete media: ' + error.message);
    },
  });
};

// Helper to get content value by key
export const getContentValue = (content: LandingContent[] | undefined, key: string, defaultValue = ''): string => {
  if (!content) return defaultValue;
  const item = content.find(c => c.key === key);
  return item?.value || defaultValue;
};
