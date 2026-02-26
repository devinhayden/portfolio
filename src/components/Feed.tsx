'use client'

import { useState } from 'react'
import { posts } from '@/lib/data'
import { Tab } from '@/types'
import { PostCard } from './PostCard'

const TABS: Tab[] = ['pinned', 'recent', 'about']

export function Feed() {
  const [activeTab, setActiveTab] = useState<Tab>('pinned')

  const visiblePosts =
    activeTab === 'pinned'
      ? posts.filter((p) => p.pinned)
      : activeTab === 'recent'
        ? [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        : []

  return (
    <div className="mt-20">
      {/* Tab bar */}
      <div className="flex items-center mb-8">
        <div className="flex items-center gap-1 mr-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[13px] rounded-full capitalize transition-all duration-150 ${
                activeTab === tab
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#888] hover:text-[#1a1a1a]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1 h-px bg-[#E5E5E5]" />
      </div>

      {/* Posts */}
      <div className="flex flex-col gap-4">
        {activeTab === 'about' ? (
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
            <p className="text-[13px] text-[#888]">About section coming soon.</p>
          </div>
        ) : (
          visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}
