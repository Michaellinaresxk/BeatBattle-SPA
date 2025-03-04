import { Category, MainCategory } from '../types/categories';

export const mainCategories: MainCategory[] = [
  {
    id: 'music',
    name: 'Music Quiz',
    icon: '🎵',
    description:
      'Test your knowledge about different music genres, artists and songs',
    color: '#8A2BE2',
    path: '/categories/music',
  },
  {
    id: 'general-knowledge',
    name: 'General Knowledge',
    icon: '🧠',
    description:
      'Challenge yourself with questions about history, science, geography and more',
    color: '#2E8B57',
    path: '/categories/general-knowledge',
  },
];

export const CATEGORIES_BY_TYPE: Record<string, Category[]> = {
  music: [
    { id: 'rock-70', name: 'Rock - 70s', icon: '🎸', color: '#e74c3c' },
    { id: 'rock-80', name: 'Rock - 80s', icon: '🤘', color: '#3498db' },
    { id: 'rock-90', name: 'Rock - 90s', icon: '🎵', color: '#9b59b6' },
    { id: 'funk', name: 'Funk', icon: '🕺', color: '#f39c12' },
    { id: 'rap', name: 'Rap', icon: '🎤', color: '#2c3e50' },
    { id: 'ballads', name: 'Ballads', icon: '🎹', color: '#1abc9c' },
    { id: 'latin', name: 'Latin Music', icon: '💃', color: '#e67e22' },
    { id: 'pop', name: 'Pop Hits', icon: '🎧', color: '#c0392b' },
  ],
  'general-knowledge': [
    { id: 'history', name: 'History', icon: '📜', color: '#8e44ad' },
    { id: 'science', name: 'Science', icon: '🔬', color: '#2ecc71' },
    { id: 'geography', name: 'Geography', icon: '🌎', color: '#3498db' },
    { id: 'movies', name: 'Movies & TV', icon: '🎬', color: '#e74c3c' },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#f39c12' },
    { id: 'tech', name: 'Technology', icon: '💻', color: '#34495e' },
    { id: 'art', name: 'Art & Literature', icon: '🎨', color: '#16a085' },
    { id: 'trivia', name: 'General Trivia', icon: '🎯', color: '#d35400' },
  ],
};

export const CATEGORY_TYPE_TITLES: Record<string, string> = {
  music: 'Choose a Music Category',
  'general-knowledge': 'Choose a Knowledge Category',
};
