import prisma from '@/lib/prisma';
import CategoryManager from './CategoryManager';
import AuthorManager from './AuthorManager';
import { Typography, Box, Divider } from '@mui/material';

export default async function CategoriesPage() {
  const [categories, authors] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.author.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Categories
      </Typography>
      <CategoryManager initialCategories={categories} />
      
      <Box sx={{ my: 4 }}>
        <Divider />
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Authors
      </Typography>
      <AuthorManager initialAuthors={authors} />
    </>
  );
}
