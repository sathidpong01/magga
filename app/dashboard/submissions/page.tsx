import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Typography, Grid, Paper, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LinkButton from '@/app/components/LinkButton';
import { MangaSubmission } from '@prisma/client';

export default async function MySubmissionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/dashboard/submissions');
  }

  const submissions = await prisma.mangaSubmission.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: 'desc' },
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">My Submissions</Typography>
        <LinkButton 
          variant="contained" 
          startIcon={<AddIcon />}
          href="/submit"
          sx={{ bgcolor: '#fbbf24', color: '#000', '&:hover': { bgcolor: '#f59e0b' } }}
        >
          New Submission
        </LinkButton>
      </Box>

      {submissions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#171717', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>You haven't submitted any manga yet.</Typography>
          <LinkButton 
            variant="outlined" 
            href="/submit"
          >
            Submit your first manga
          </LinkButton>
        </Paper>
      ) : (
        <Grid container spacing={2}>


          {submissions.map((submission: MangaSubmission) => (
            <Grid item xs={12} key={submission.id}>
              <Paper sx={{ p: 2, bgcolor: '#171717', display: 'flex', gap: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ width: 80, height: 120, bgcolor: '#333', borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={submission.coverImage} alt={submission.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6">{submission.title}</Typography>
                    <Chip 
                      label={submission.status} 
                      color={
                        submission.status === 'APPROVED' ? 'success' : 
                        submission.status === 'REJECTED' ? 'error' : 
                        submission.status === 'UNDER_REVIEW' ? 'warning' : 'default'
                      } 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                  </Typography>
                  {submission.rejectionReason && (
                    <Paper sx={{ p: 1.5, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
                      <Typography color="error" variant="body2">
                        <strong>Rejection Reason:</strong> {submission.rejectionReason}
                      </Typography>
                    </Paper>
                  )}
                  {submission.status === 'APPROVED' && submission.approvedMangaId && (
                    <LinkButton 
                      size="small" 
                      href={`/${submission.slug || '#'}`}
                      sx={{ mt: 1 }}
                    >
                      View Published Manga
                    </LinkButton>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
