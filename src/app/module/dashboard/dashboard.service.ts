import { prisma } from '../../lib/prisma';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError';

const db = prisma as any;

const getUserStats = async (userId: string) => {
  const investments = await db.investment.findMany({
    where: { userId, status: 'SUCCESS' },
    include: { property: true },
  });

  const propertiesCreatedCount = await db.property.count({
    where: { authorId: userId },
  });

  const totalInvested = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0);
  const totalPropertiesInvested = new Set(investments.map((inv: any) => inv.propertyId)).size;
  
  // Simulated profit based on expected return
  const estimatedProfit = investments.reduce((sum: number, inv: any) => {
    const roi = inv.property?.expectedReturn || 0;
    return sum + (inv.amount * (roi / 100));
  }, 0);

  return {
    totalInvested,
    totalProperties: totalPropertiesInvested, // Number of unique properties invested in
    investedPropertiesCount: totalPropertiesInvested,
    propertiesCreated: propertiesCreatedCount, // Number of properties listed by user
    estimatedProfit,
    activeInvestments: investments.length,
  };
};

const getUserCharts = async (userId: string) => {
  const investments = await prisma.investment.findMany({
    where: { userId, status: 'SUCCESS' },
    include: { property: { include: { category: true } } },
  });

  // Pie chart data: Investment by Category
  const categoryMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const catName = inv.property.category.name;
    categoryMap[catName] = (categoryMap[catName] || 0) + inv.amount;
  });

  const portfolioDistribution = Object.entries(categoryMap).map(([label, value]) => ({
    label,
    value,
  }));

  // Line chart data: Investment over time (Last 6 months)
  const monthlyMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const month = inv.createdAt.toLocaleString('default', { month: 'short' });
    monthlyMap[month] = (monthlyMap[month] || 0) + inv.amount;
  });

  const investmentTrend = Object.entries(monthlyMap).map(([label, value]) => ({
    label,
    value,
  }));

  return { portfolioDistribution, investmentTrend };
};

const getAdminCharts = async () => {
  // Sales growth (last 6 months)
  const investments = await prisma.investment.findMany({
    where: { status: 'SUCCESS' },
    select: { amount: true, createdAt: true },
  });

  const salesMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const month = inv.createdAt.toLocaleString('default', { month: 'short' });
    salesMap[month] = (salesMap[month] || 0) + inv.amount;
  });

  const salesTrend = Object.entries(salesMap).map(([name, value]) => ({
    name,
    value,
  }));

  // User growth (last 6 months)
  const users = await prisma.user.findMany({
    select: { createdAt: true },
  });

  const userMap: Record<string, number> = {};
  users.forEach((u) => {
    const month = u.createdAt.toLocaleString('default', { month: 'short' });
    userMap[month] = (userMap[month] || 0) + 1;
  });

  const userGrowth = Object.entries(userMap).map(([name, count]) => ({
    name,
    count,
  }));

  return { salesTrend, userGrowth };
};

export const DashboardService = {
  getUserStats,
  getUserCharts,
  getAdminCharts,
};
