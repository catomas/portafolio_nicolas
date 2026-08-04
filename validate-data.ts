import { siteData } from './src/data/siteData';

const categoryIds = new Set(siteData.categories.map(c => c.id));
const invalidPhotos = siteData.photos.filter(p => !categoryIds.has(p.categoryId));

console.log('Categories:', siteData.categories.map(c => c.id));
console.log('Total photos:', siteData.photos.length);
console.log('Invalid references:', invalidPhotos.length);

if (invalidPhotos.length > 0) {
  console.log('FAILED: Photos with invalid categoryId:', invalidPhotos);
  process.exit(1);
} else {
  console.log('OK: All photos reference valid categories');
}
