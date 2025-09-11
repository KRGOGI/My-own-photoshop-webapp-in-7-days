import ImageUploader from '../ImageUploader';

export default function ImageUploaderExample() {
  const handleImageUpload = (file: File, imageUrl: string) => {
    console.log('Image uploaded:', file.name, imageUrl);
  };

  return <ImageUploader onImageUpload={handleImageUpload} />;
}