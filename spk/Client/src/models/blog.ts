export enum BlogPostStatus {
  Draft = 1,
  Published = 2,
  Archived = 3,
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  displayOrder: number
  postCount: number
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  postCount: number
}

export interface BlogPostListItem {
  id: string
  title: string
  slug: string
  summary: string
  coverImageUrl?: string | null
  category?: BlogCategory | null
  authorName?: string | null
  status: BlogPostStatus
  publishedAt?: string | null
  readingTime: number
  viewCount: number
  tags: BlogTag[]
}

export interface BlogPostDetail extends BlogPostListItem {
  content: string
  createdAt: string
  updatedAt?: string | null
  metaTitle: string
  metaDescription: string
  canonicalUrl: string
  relatedPosts: BlogPostListItem[]
}

export interface BlogListResponse {
  items: BlogPostListItem[]
  totalCount: number
  page: number
  pageSize: number
}

export interface UpsertBlogPost {
  title: string
  slug?: string | null
  summary: string
  content: string
  coverImageUrl?: string | null
  categoryId?: string | null
  status: BlogPostStatus
  publishedAt?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
  tags?: string[] | null
}
