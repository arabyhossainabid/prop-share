import prisma from '../../lib/prisma';

const db = prisma as any;

export const BlogService = {
  async getAllBlogs(skip: number = 0, take: number = 10, featured?: boolean) {
    const where: any = {};
    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    const [blogs, total] = await Promise.all([
      db.blog.findMany({
        where,
        skip,
        take,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      }),
      db.blog.count({ where }),
    ]);

    return { blogs, total };
  },
};
