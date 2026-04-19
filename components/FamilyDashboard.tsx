
import React, { useState, useEffect } from 'react';
import { FamilyPhoto } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, Image as ImageIcon, X, Tag, ChevronLeft } from 'lucide-react';

const FamilyDashboard: React.FC = () => {
  const [photos, setPhotos] = useState<FamilyPhoto[]>(() => {
    const saved = localStorage.getItem('mind_family_photos');
    const defaultPhotos: FamilyPhoto[] = [
      { 
        id: '1', 
        url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800', 
        eventName: 'Family Picnic', 
        date: '2023-06-15',
        faceId: 'face_1',
        tags: [{ name: 'John (Son)', x: 30, y: 40 }, { name: 'Sarah (Daughter)', x: 60, y: 35 }]
      },
      { 
        id: '2', 
        url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=800', 
        eventName: 'Sarah\'s Graduation', 
        date: '2023-05-20',
        faceId: 'face_2',
        tags: [{ name: 'Sarah (Daughter)', x: 50, y: 30 }]
      },
      { 
        id: '3', 
        url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800', 
        eventName: 'Christmas Morning', 
        date: '2023-12-25',
        faceId: 'face_1',
        tags: [{ name: 'John (Son)', x: 45, y: 50 }]
      }
    ];
    return saved ? JSON.parse(saved) : defaultPhotos;
  });

  const [selectedPhoto, setSelectedPhoto] = useState<FamilyPhoto | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  // Group photos by faceId (simulated face recognition)
  const folders = photos.reduce((acc, photo) => {
    const faceId = photo.faceId || 'others';
    if (!acc[faceId]) acc[faceId] = [];
    acc[faceId].push(photo);
    return acc;
  }, {} as Record<string, FamilyPhoto[]>);

  const getFolderName = (faceId: string) => {
    if (faceId === 'face_1') return 'John';
    if (faceId === 'face_2') return 'Sarah';
    return 'Others';
  };

  const filteredPhotos = currentFolder ? folders[currentFolder] : photos;

  return (
    <div className="space-y-6">
      {/* Folder Navigation */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
        <button 
          onClick={() => setCurrentFolder(null)}
          className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 whitespace-nowrap transition-all border-4 ${
            currentFolder === null ? 'bg-rose-600 text-white border-slate-900 shadow-[0_4px_0_#9f1239]' : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          <ImageIcon size={20} /> All Photos
        </button>
        {Object.keys(folders).map(faceId => (
          <button 
            key={faceId}
            onClick={() => setCurrentFolder(faceId)}
            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 whitespace-nowrap transition-all border-4 ${
              currentFolder === faceId ? 'bg-rose-600 text-white border-slate-900 shadow-[0_4px_0_#9f1239]' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            <Folder size={20} /> {getFolderName(faceId)}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredPhotos.map(photo => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPhoto(photo)}
              className="card overflow-hidden cursor-pointer group border-2 border-slate-200"
            >
              <div className="aspect-square relative">
                <img src={photo.url} className="w-full h-full object-cover" alt={photo.eventName} />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-white font-black text-sm truncate">{photo.eventName}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Fullscreen View with Tags */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative max-w-4xl w-full h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={32} />
                </button>
                <div className="text-center">
                  <h2 className="text-2xl font-black text-white">{selectedPhoto.eventName}</h2>
                  <p className="text-white/60 font-bold">{selectedPhoto.date}</p>
                </div>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X size={32} />
                </button>
              </div>

              <div className="flex-grow relative flex items-center justify-center overflow-hidden rounded-[40px] border-8 border-white/10">
                <img 
                  src={selectedPhoto.url} 
                  className="max-w-full max-h-full object-contain" 
                  alt={selectedPhoto.eventName} 
                />
                
                {/* Tags */}
                {selectedPhoto.tags.map((tag, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.2 }}
                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="relative group">
                      <div className="w-4 h-4 bg-white rounded-full border-2 border-rose-600 shadow-lg animate-pulse" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-sm shadow-2xl border-2 border-rose-600">
                        {tag.name}
                        {tag.relation && <span className="block text-[10px] text-rose-600 opacity-70">({tag.relation})</span>}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-rose-600" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex justify-center gap-4">
                <button className="tactile-btn bg-white px-8 py-4 rounded-2xl font-black flex items-center gap-2">
                  <Tag size={20} /> Show All Names
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyDashboard;
