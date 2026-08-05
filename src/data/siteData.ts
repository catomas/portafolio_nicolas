import type { SiteData } from './types';

export const siteData: SiteData = {
  hero: {
    name: 'Nicolás Restrepo',
    subtitle: 'Fotografía de Viajes',
    backgroundUrl:
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1600',
  },
  categories: [
    { id: 'landscapes', name: 'Paisajes' },
    { id: 'portraits', name: 'Retratos' },
    { id: 'urban', name: 'Urbano' },
    { id: 'travel', name: 'Viajes' },
  ],
  photos: [
    // Paisajes
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      title: 'Amanecer en los Andes',
      categoryId: 'landscapes',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      title: 'Montañas y niebla',
      categoryId: 'landscapes',
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      title: 'Valle verde al atardecer',
      categoryId: 'landscapes',
    },
    // Retratos
    {
      id: '4',
      url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
      title: 'Mirada serena',
      categoryId: 'portraits',
    },
    {
      id: '5',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      title: 'Retrato urbano',
      categoryId: 'portraits',
    },
    {
      id: '6',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
      title: 'Luz natural',
      categoryId: 'portraits',
    },
    // Urbano
    {
      id: '7',
      url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      title: 'Calles de la ciudad',
      categoryId: 'urban',
    },
    {
      id: '8',
      url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
      title: 'Arquitectura moderna',
      categoryId: 'urban',
    },
    {
      id: '9',
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
      title: 'Noche urbana',
      categoryId: 'urban',
    },
    // Viajes
    {
      id: '10',
      url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      title: 'Lago al amanecer',
      categoryId: 'travel',
    },
    {
      id: '11',
      url: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800',
      title: 'Templo en Asia',
      categoryId: 'travel',
    },
    {
      id: '12',
      url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
      title: 'Carretera infinita',
      categoryId: 'travel',
    },
  ],
  about: {
    bio: 'Fotógrafo colombiano apasionado por capturar la esencia de los lugares y las personas que los habitan. Viajo con mi cámara buscando historias visuales que conecten culturas y despierten curiosidad.',
    photographerPhotoUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600',
    socialLinks: [
      { platform: 'Instagram', url: 'https://instagram.com/nicorestrepo' },
      { platform: 'Behance', url: 'https://behance.net/nicorestrepo' },
    ],
  },
  brands: [
    {
      id: 'brand-nike',
      name: 'Nike',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',
      coverPhotoUrl:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      photos: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200',
        'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200',
      ],
    },
    {
      id: 'brand-adidas',
      name: 'Adidas',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png',
      coverPhotoUrl:
        'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800',
      photos: [
        'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=1200',
        'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=1200',
        'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200',
      ],
    },
    {
      id: 'brand-coca-cola',
      name: 'Coca-Cola',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Coca-Cola_logo.svg/200px-Coca-Cola_logo.svg.png',
      coverPhotoUrl:
        'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800',
      photos: [
        'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=1200',
        'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=1200',
        'https://images.unsplash.com/photo-1581098365948-6a5a912b7a49?w=1200',
      ],
    },
    {
      id: 'brand-apple',
      name: 'Apple',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png',
      coverPhotoUrl:
        'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800',
      photos: [
        'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=1200',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1200',
      ],
    },
  ],
  contact: {
    title: 'Contacto',
    subtitle: '¿Tienes un proyecto en mente? Hablemos.',
  },
};
