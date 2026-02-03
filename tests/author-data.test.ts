import { describe, it, expect } from 'vitest';
import {
  AUTHORS,
  getAuthorById,
  getAuthorForPost,
  estimateReadingTime,
} from '@/lib/author-data';
import type { BlogPost } from '@/lib/blog-data';
import { BLOG_POSTS } from '@/lib/blog-data';

/**
 * 作者数据模型单元测试
 *
 * 验证 AuthorProfile 数据完整性、helper 函数正确性。
 */

describe('Author Data', () => {
  describe('AUTHORS 数据完整性', () => {
    it('应该至少有 2 个作者', () => {
      expect(AUTHORS.length).toBeGreaterThanOrEqual(2);
    });

    it('所有作者必须有完整的必填字段', () => {
      for (const author of AUTHORS) {
        expect(author.id).toBeDefined();
        expect(author.id.length).toBeGreaterThan(0);
        expect(author.name.en).toBeDefined();
        expect(author.name.zh).toBeDefined();
        expect(author.role.en).toBeDefined();
        expect(author.role.zh).toBeDefined();
        expect(author.bio.en).toBeDefined();
        expect(author.bio.zh).toBeDefined();
        expect(author.credentials).toBeDefined();
        expect(author.credentials.length).toBeGreaterThan(0);
        expect(author.avatar).toBeDefined();
      }
    });

    it('作者 ID 应该唯一', () => {
      const ids = AUTHORS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('应该包含 jay 作者', () => {
      const jay = AUTHORS.find((a) => a.id === 'jay');
      expect(jay).toBeDefined();
      expect(jay!.name.en).toBe('Jay Li');
    });

    it('应该包含 better-bags-team 作者', () => {
      const team = AUTHORS.find((a) => a.id === 'better-bags-team');
      expect(team).toBeDefined();
      expect(team!.name.en).toBe('Better Bags Team');
    });
  });

  describe('getAuthorById', () => {
    it('传入有效 ID 应返回对应作者', () => {
      const jay = getAuthorById('jay');
      expect(jay).toBeDefined();
      expect(jay!.id).toBe('jay');
    });

    it('传入无效 ID 应返回 undefined', () => {
      const result = getAuthorById('nonexistent');
      expect(result).toBeUndefined();
    });

    it('传入空字符串应返回 undefined', () => {
      const result = getAuthorById('');
      expect(result).toBeUndefined();
    });
  });

  describe('getAuthorForPost', () => {
    it('带 authorId 的文章应返回对应作者', () => {
      const post: BlogPost = {
        id: 'test',
        slug: 'test',
        title: { en: 'Test', zh: 'Test' },
        excerpt: { en: 'Test', zh: 'Test' },
        date: '2024-01-01',
        thumbnail: '/test.jpg',
        category: 'Test',
        authorId: 'jay',
      };
      const author = getAuthorForPost(post);
      expect(author.id).toBe('jay');
    });

    it('没有 authorId 的文章应 fallback 到 better-bags-team', () => {
      const post: BlogPost = {
        id: 'test',
        slug: 'test',
        title: { en: 'Test', zh: 'Test' },
        excerpt: { en: 'Test', zh: 'Test' },
        date: '2024-01-01',
        thumbnail: '/test.jpg',
        category: 'Test',
      };
      const author = getAuthorForPost(post);
      expect(author.id).toBe('better-bags-team');
    });

    it('无效 authorId 的文章应 fallback 到 better-bags-team', () => {
      const post: BlogPost = {
        id: 'test',
        slug: 'test',
        title: { en: 'Test', zh: 'Test' },
        excerpt: { en: 'Test', zh: 'Test' },
        date: '2024-01-01',
        thumbnail: '/test.jpg',
        category: 'Test',
        authorId: 'nonexistent',
      };
      const author = getAuthorForPost(post);
      expect(author.id).toBe('better-bags-team');
    });

    it('BLOG_POSTS 中 quality-control-process 应映射到 jay', () => {
      const post = BLOG_POSTS.find((p) => p.slug === 'quality-control-process');
      expect(post).toBeDefined();
      const author = getAuthorForPost(post!);
      expect(author.id).toBe('jay');
    });

    it('BLOG_POSTS 中 oem-vs-odm-differences 应映射到 jay', () => {
      const post = BLOG_POSTS.find((p) => p.slug === 'oem-vs-odm-differences');
      expect(post).toBeDefined();
      const author = getAuthorForPost(post!);
      expect(author.id).toBe('jay');
    });

    it('BLOG_POSTS 中无 authorId 的文章应 fallback 到 team', () => {
      const post = BLOG_POSTS.find((p) => p.slug === 'custom-backpack-guide-2024');
      expect(post).toBeDefined();
      const author = getAuthorForPost(post!);
      expect(author.id).toBe('better-bags-team');
    });
  });

  describe('estimateReadingTime', () => {
    it('空内容应返回 1', () => {
      expect(estimateReadingTime('')).toBe(1);
    });

    it('单词少于 200 应返回 1', () => {
      const content = 'word '.repeat(50);
      expect(estimateReadingTime(content)).toBe(1);
    });

    it('200 词应返回 1', () => {
      const content = 'word '.repeat(200);
      expect(estimateReadingTime(content)).toBe(1);
    });

    it('201 词应返回 2', () => {
      const content = 'word '.repeat(201);
      expect(estimateReadingTime(content)).toBe(2);
    });

    it('400 词应返回 2', () => {
      const content = 'word '.repeat(400);
      expect(estimateReadingTime(content)).toBe(2);
    });

    it('1000 词应返回 5', () => {
      const content = 'word '.repeat(1000);
      expect(estimateReadingTime(content)).toBe(5);
    });

    it('返回值始终为正整数', () => {
      const cases = ['', 'a', 'word '.repeat(1), 'word '.repeat(500), 'word '.repeat(2000)];
      for (const content of cases) {
        const result = estimateReadingTime(content);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });
});
