'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Grid, ImageIcon } from 'lucide-react';

interface PhotoGalleryProps {
  userId: string;
}

export default function PhotoGallery({ userId }: PhotoGalleryProps) {
  const [previewPhotos, setPreviewPhotos] = useState<any[]>([]); // Top 9 photos
  const [allPhotos, setAllPhotos] = useState<any[]>([]); // All photos (fetched on demand)
  const [loading, setLoading] = useState(true);
  
  // States for Modals
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null); // Single photo fullscreen
  const [showAllGallery, setShowAllGallery] = useState(false); // "View All" grid modal

  const supabase = createClient();

  // 1. Initial Fetch (Only gets 9 photos for the sidebar)
  useEffect(() => {
    const fetchPreview = async () => {
      const { data } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(9);
      
      if (data) setPreviewPhotos(data);
      setLoading(false);
    };
    fetchPreview();
  }, [userId]);

  // 2. Secondary Fetch (Gets ALL photos when user clicks "View All")
  useEffect(() => {
    if (showAllGallery && allPhotos.length === 0) {
      const fetchAll = async () => {
        const { data } = await supabase
          .from('user_photos')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }); // No limit here
        
        if (data) setAllPhotos(data);
      };
      fetchAll();
    }
  }, [showAllGallery, userId, allPhotos.length]);

  if (loading || previewPhotos.length === 0) return null;

  return (
    <>
      {/* --- SIDEBAR WIDGET (Recent 9) --- */}
      <div className="bg-[#1E293B]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-400"/> Photos
          </h3>
          {/* The View All Button */}
          <button 
            onClick={() => setShowAllGallery(true)}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 px-2 py-1 hover:bg-blue-500/10 rounded-md"
          >
            <Grid size={14} /> View All
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {previewPhotos.map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedPhoto(photo.photo_url)}
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gray-800"
            >
              <img 
                src={photo.photo_url} 
                alt="Recent Upload" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL 1: "VIEW ALL" GALLERY (The Grid) --- */}
      {showAllGallery && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#0f172a] w-full max-w-4xl h-[85vh] rounded-2xl border border-gray-700 flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                  <h2 className="text-xl font-bold text-white pl-2">All Photos</h2>
                  <button 
                    onClick={() => setShowAllGallery(false)} 
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition"
                  >
                    <X size={20} />
                  </button>
              </div>
              
              {/* Scrollable Grid Area */}
              <div className="flex-1 overflow-y-auto p-6">
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {/* Use allPhotos if loaded, otherwise fallback to previewPhotos while loading */}
                    {(allPhotos.length > 0 ? allPhotos : previewPhotos).map((photo) => (
                      <div 
                        key={photo.id} 
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                        className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 transition-all shadow-lg"
                      >
                        <img 
                          src={photo.photo_url} 
                          alt="Gallery Item" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                    ))}
                 </div>
                 {/* Loading Indicator inside modal */}
                 {allPhotos.length === 0 && (
                   <p className="text-center text-gray-500 mt-10">Loading all photos...</p>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL 2: FULLSCREEN SINGLE PHOTO VIEW --- */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
          >
            <X size={28} />
          </button>
          
          <img 
            src={selectedPhoto} 
            alt="Fullscreen View" 
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
