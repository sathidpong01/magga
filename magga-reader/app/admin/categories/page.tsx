import prisma from '@/lib/prisma';
import CategoryManager from './CategoryManager';
import { Typography } from '@mui/material';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Categories
      </Typography>
      <CategoryManager initialCategories={categories} />
    </>
  );
}
