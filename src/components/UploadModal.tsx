import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { storage, db } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { useStore } from '../store';
import { Photo, UploadProgress } from '../types';
import { validateVideo, generateVideoThumbnail, getVideoDuration, formatFileSize } from '../lib/mediaUtils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'complete'
  });
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, addPhoto } = useStore();
  const [isVideo, setIsVideo] = useState(false);

  const resetForm = useCallback(() => {
    setFile(null);
    setPreview('');
    setCaption('');
    setFilter('');
    setError(null);
    setIsVideo(false);
    setUploadProgress({ progress: 0, status: 'complete' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Reset form when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    const isVideoFile = selectedFile.type.startsWith('video/');
    setIsVideo(isVideoFile);

    if (isVideoFile) {
      const validation = validateVideo(selectedFile);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      try {
        const thumbnail = await generateVideoThumbnail(selectedFile);
        setPreview(thumbnail);
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        setError('Failed to generate video thumbnail');
        return;
      }
    } else {
      setPreview(URL.createObjectURL(selectedFile));
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    try {
      setUploadProgress({ progress: 0, status: 'uploading' });
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const storageRef = ref(storage, `${isVideo ? 'videos' : 'photos'}/${user.id}/${fileName}`);
      
      let thumbnailUrl: string | undefined;
      let duration: number | undefined;

      if (isVideo) {
        setUploadProgress({ progress: 0, status: 'processing' });
        try {
          thumbnailUrl = await generateVideoThumbnail(file);
          duration = await getVideoDuration(file);
        } catch (error) {
          console.error('Error processing video:', error);
        }
      }

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress({ progress, status: 'uploading' });
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadProgress({ progress: 0, status: 'error', error: error.message });
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          const mediaObject: any = {
            type: isVideo ? 'video' : 'image',
            url: downloadURL,
            size: file.size
          };

          if (isVideo) {
            if (thumbnailUrl) mediaObject.thumbnailUrl = thumbnailUrl;
            if (duration) mediaObject.duration = duration;
          }

          const photoData: Omit<Photo, 'id'> = {
            media: mediaObject,
            caption,
            likes: 0,
            comments: [],
            userId: user.id,
            filter: isVideo ? '' : filter,
            createdAt: new Date().toISOString(),
          };

          const docRef = await addDoc(collection(db, 'photos'), photoData);
          addPhoto({ id: docRef.id, ...photoData });
          
          setUploadProgress({ progress: 100, status: 'complete' });
          resetForm();
          onClose();
        }
      );
    } catch (error: any) {
      console.error('Error uploading media:', error);
      setUploadProgress({ progress: 0, status: 'error', error: error.message });
    }
  };

  const filters = [
    { name: '', label: 'Normal' },
    { name: 'filter-mono', label: 'Mono' },
    { name: 'filter-warm', label: 'Warm' },
    { name: 'filter-cool', label: 'Cool' },
    { name: 'filter-vintage', label: 'Vintage' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload {isVideo ? 'Video' : 'Photo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-600"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="flex space-x-2">
                <ImageIcon className="h-12 w-12 text-gray-400" />
                <Video className="h-12 w-12 text-gray-400" />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Click to upload photo or video
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports JPG, PNG, GIF • MP4, WebM, MOV up to 100MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isVideo ? (
              <video
                src={URL.createObjectURL(file!)}
                poster={preview}
                controls
                className="w-full rounded-lg"
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className={`w-full h-64 object-cover rounded-lg ${filter}`}
              />
            )}

            {!isVideo && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {filters.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setFilter(f.name)}
                    className={`px-4 py-2 rounded ${
                      filter === f.name
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
            />

            {file && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </div>
            )}

            {uploadProgress.status !== 'complete' && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadProgress.status === 'uploading' || !file}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {uploadProgress.status === 'uploading' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading... {Math.round(uploadProgress.progress)}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}