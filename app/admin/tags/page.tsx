import prisma from '@/lib/prisma';
import TagManager from './TagManager';
import { Typography } from '@mui/material';

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Tags
      </Typography>
      <TagManager initialTags={tags} />
    </>
  );
}
