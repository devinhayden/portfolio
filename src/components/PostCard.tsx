import { Post } from '@/types'
import { LikeButton } from './LikeButton'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="font-semibold text-[14px] text-[#1a1a1a] leading-snug">
          {post.title}
        </h2>
        <span className="text-[12px] text-[#999] whitespace-nowrap flex-shrink-0 mt-0.5">
          {post.date}
        </span>
      </div>

      {/* Content */}
      {post.type === 'image' ? (
        <>
          <div className="w-full aspect-[4/3] bg-[#EBEBEB] rounded-lg mb-4" />
          <p className="text-[13px] text-[#555] leading-relaxed mb-4">
            {post.description}
          </p>
        </>
      ) : (
        <div className="border border-[#E5E5E5] rounded-lg p-4 mb-4">
          <p className="text-[13px] text-[#555] leading-relaxed">
            {post.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] text-[#555] border border-[#DADADA] rounded px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
        <LikeButton />
      </div>
    </div>
  )
}
