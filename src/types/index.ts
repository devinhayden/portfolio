export interface Post {
  id: string
  title: string
  date: string
  type: 'image' | 'text'
  tags: string[]
  description: string
  imageUrl?: string
  pinned: boolean
  createdAt: Date
}

export type Tab = 'pinned' | 'recent' | 'about'
