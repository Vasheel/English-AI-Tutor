import type { NextApiRequest, NextApiResponse } from 'next';

// Static list of images with metadata
// In a real project, this data would be loaded from a JSON file or database
// Each image entry includes a title, alt text, and simple tags for context checking.
const images = [
  {
    id: 'easy-01',
    path: '/images/prompts/easy/img_01.jpg',
    level: 'easy',
    title: 'A dog playing with a ball',
    alt: 'Brown-and-white dog running with a red ball on grass',
    objects: ['dog', 'ball', 'grass'],
    actions: ['play', 'run', 'carry'],
    locations: ['park', 'grass'],
  },
  {
    id: 'easy-02',
    path: '/images/prompts/easy/img_02.jpg',
    level: 'easy',
    title: 'A child reading a book',
    alt: 'Young child sitting on a bench reading a book outdoors',
    objects: ['child', 'book', 'bench'],
    actions: ['read', 'sit'],
    locations: ['park', 'bench'],
  },
  {
    id: 'easy-03',
    path: '/images/prompts/easy/img_03.jpg',
    level: 'easy',
    title: 'A girl riding a bicycle',
    alt: 'Girl wearing a helmet riding a bicycle on a path',
    objects: ['girl', 'bicycle', 'helmet'],
    actions: ['ride', 'cycle'],
    locations: ['road', 'park'],
  },
  {
    id: 'medium-01',
    path: '/images/prompts/medium/img_01.jpg',
    level: 'medium',
    title: 'A girl feeding a dog',
    alt: 'Girl giving food to a standing dog in a backyard',
    objects: ['girl', 'dog', 'food'],
    actions: ['feed', 'give'],
    locations: ['garden', 'yard'],
  },
  {
    id: 'medium-02',
    path: '/images/prompts/medium/img_02.jpg',
    level: 'medium',
    title: 'A bus at a stop with people boarding',
    alt: 'Bus stopped with people getting on and off at a station',
    objects: ['bus', 'people', 'station'],
    actions: ['board', 'wait'],
    locations: ['bus stop', 'station'],
  },
  {
    id: 'medium-03',
    path: '/images/prompts/medium/img_03.jpg',
    level: 'medium',
    title: 'Children playing football',
    alt: 'Two kids kicking a soccer ball on a field',
    objects: ['children', 'ball', 'field'],
    actions: ['kick', 'play'],
    locations: ['field', 'park'],
  },
  {
    id: 'hard-01',
    path: '/images/prompts/hard/img_01.jpg',
    level: 'hard',
    title: 'A rainy street with reflections',
    alt: 'City street wet with rain reflecting lights at night',
    objects: ['street', 'rain', 'lights'],
    actions: ['reflect', 'rain'],
    locations: ['city', 'street'],
  },
  {
    id: 'hard-02',
    path: '/images/prompts/hard/img_02.jpg',
    level: 'hard',
    title: 'Teacher pointing at a map while students raise hands',
    alt: 'Teacher at a board pointing at a world map, students raising hands',
    objects: ['teacher', 'map', 'students'],
    actions: ['point', 'raise', 'ask'],
    locations: ['classroom'],
  },
  {
    id: 'hard-03',
    path: '/images/prompts/hard/img_03.jpg',
    level: 'hard',
    title: 'A family hiking on a mountain',
    alt: 'Family walking on a mountain trail with backpacks',
    objects: ['family', 'mountain', 'backpacks'],
    actions: ['hike', 'walk'],
    locations: ['mountain', 'trail'],
  },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(images);
}