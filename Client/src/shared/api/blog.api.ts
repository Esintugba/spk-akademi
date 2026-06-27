import type { BlogCategory, BlogListResponse, BlogPostDetail, BlogTag, UpsertBlogPost } from '../../models'
import { request } from './client'

export const blogApi = {
  getPosts: (params?: { search?: string; categorySlug?: string; tagSlug?: string; page?: number; pageSize?: number }) =>
    request.get<BlogListResponse>('/api/blog', { params, skipAuth: true }),
  searchPosts: (q: string, params?: { page?: number; pageSize?: number }) =>
    request.get<BlogListResponse>('/api/blog/search', { params: { q, ...params }, skipAuth: true }),
  getPost: (slug: string) => request.get<BlogPostDetail>(`/api/blog/${slug}`, { skipAuth: true }),
  getCategories: () => request.get<BlogCategory[]>('/api/blog/categories', { skipAuth: true }),
  getTags: () => request.get<BlogTag[]>('/api/blog/tags', { skipAuth: true }),
}

export const adminBlogApi = {
  getPosts: (params?: { search?: string; categorySlug?: string; tagSlug?: string; page?: number; pageSize?: number }) =>
    request.get<BlogListResponse>('/api/admin/blog', { params }),
  getPost: (id: string) => request.get<BlogPostDetail>(`/api/admin/blog/${id}`),
  create: (payload: UpsertBlogPost) => request.post<BlogPostDetail>('/api/admin/blog', payload),
  update: (id: string, payload: UpsertBlogPost) => request.put<BlogPostDetail>(`/api/admin/blog/${id}`, payload),
  delete: (id: string) => request.delete<void>(`/api/admin/blog/${id}`),
}
