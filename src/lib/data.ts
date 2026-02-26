import { Post } from '@/types'

export const posts: Post[] = [
  {
    id: '1',
    title: 'Intuitive and secure voice AI for healthcare clinics',
    date: 'Spring 2025',
    type: 'image',
    tags: ['Voice AI', '0→1', 'Startup'],
    description:
      'Shipping a platform to allow healthcare clinics to build autonomous voice agents',
    pinned: true,
    createdAt: new Date('2025-03-01'),
  },
  {
    id: '2',
    title: 'On building with AI',
    date: 'Winter 2024',
    type: 'text',
    tags: ['Writing', 'AI'],
    description:
      'A few thoughts on what changes and what stays the same when AI enters the product development loop.',
    pinned: true,
    createdAt: new Date('2024-12-01'),
  },
  {
    id: '3',
    title: 'Design systems at scale',
    date: 'Fall 2024',
    type: 'image',
    tags: ['Design System', 'Enterprise'],
    description:
      'Building a cohesive design language across a suite of enterprise products.',
    pinned: false,
    createdAt: new Date('2024-09-01'),
  },
  {
    id: '4',
    title: 'Notes on taste',
    date: 'Summer 2024',
    type: 'text',
    tags: ['Writing', 'Design'],
    description:
      'Taste is the ability to make distinctions. It is developed slowly, through exposure and reflection.',
    pinned: false,
    createdAt: new Date('2024-06-01'),
  },
]
