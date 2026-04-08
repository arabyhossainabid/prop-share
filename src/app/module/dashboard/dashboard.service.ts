import { prisma } from '../../lib/prisma';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError';

const getUserStats = async (userId: string) => {
  const investments = await prisma.investment.findMany({
    where: { userId, status: 'SUCCESS' },
    include: { property: true },
  });

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProperties = new Set(investments.map((inv) => inv.propertyId)).size;
  
  // Simulated profit based on expected return
  const estimatedProfit = investments.reduce((sum, inv) => {
    const roi = inv.property.expectedReturn || 0;
    return sum + (inv.amount * (roi / 100));
  }, 0);

  return {
    totalInvested,
    totalProperties,
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

  const pieChart = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Line chart data: Investment over time (Last 6 months)
  const monthlyMap: Record<string, number> = {};
  investments.forEach((inv) => {
    const month = inv.createdAt.toLocaleString('default', { month: 'short' });
    monthlyMap[month] = (monthlyMap[month] || 0) + inv.amount;
  });

  const lineChart = Object.entries(monthlyMap).map(([name, value]) => ({
    name,
    value,
  }));

  return { pieChart, lineChart };
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
