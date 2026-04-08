import { Router } from 'express';
import { AdminRoutes } from '../module/admin/admin.route';
import { AIRoutes } from '../module/ai/ai.route';
import { AuthRoutes } from '../module/auth/auth.route';
import { BlogRoutes } from '../module/blog/blog.route';
import { CategoryRoutes } from '../module/category/category.route';
import { CommentRoutes } from '../module/comment/comment.route';
import { ContactRoutes } from '../module/contact/contact.route';
import { ContentRoutes } from '../module/content/content.route';
import { InvestmentRoutes } from '../module/investment/investment.route';
import { NewsletterRoutes } from '../module/newsletter/newsletter.route';
import { PropertyRoutes } from '../module/property/property.route';
import { VoteRoutes } from '../module/vote/vote.route';
import { UploadRoutes } from './upload.route';

const router = Router();

const moduleRoutes = [
  { path: '/ai', route: AIRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/categories', route: CategoryRoutes },
  { path: '/properties', route: PropertyRoutes },
  { path: '/votes', route: VoteRoutes },
  { path: '/comments', route: CommentRoutes },
  { path: '/investments', route: InvestmentRoutes },
  { path: '/admin', route: AdminRoutes },
  { path: '/newsletters', route: NewsletterRoutes },
  { path: '/upload', route: UploadRoutes },
  { path: '/contacts', route: ContactRoutes },
  { path: '/blogs', route: BlogRoutes },
  { path: '/content', route: ContentRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const IndexRoutes: Router = router;
