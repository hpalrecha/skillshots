import { Response as ExpressResponse } from 'express';
import prisma from '../../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all topics for the current user's dashboard
// @route   GET /api/v1/dashboard
// @access  Private
export const getDashboard = async (req: AuthRequest, res: ExpressResponse) => {
  const userId = req.user!.id;

  try {
    // 1. Get the user's groups
    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((ug) => ug.groupId);

    // 2. Find all topics shared with those groups
    const topics = await prisma.topic.findMany({
      where: {
        sharedWith: {
          some: {
            groupId: {
              in: groupIds,
            },
          },
        },
      },
      include: {
        content: {
            orderBy: { order: 'asc'}
        },
        progress: {
          where: { userId },
        },
        sharedWith: {
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        }
      },
    });
    
    // 3. Get all groups to provide context to the frontend
    const allGroups = await prisma.group.findMany();

    // 4. Process topics to determine status
    const pendingTopics: any[] = [];
    const completedTopics: any[] = [];

    topics.forEach((topic) => {
      const isCompleted = topic.progress.some(
        (p) => p.status === 'Completed'
      );
      
      const formattedTopic = {
        id: topic.id,
        title: topic.title,
        category: topic.category,
        authorId: topic.authorId,
        readTime: topic.readTime,
        imageUrl: topic.imageUrl,
        content: topic.content.map(c => ({...c, type: c.type.toLowerCase()})), // Match frontend enum
        status: isCompleted ? 'Completed' : 'Pending',
        sharedWith: topic.sharedWith.map(sw => sw.group.id), // just send IDs
      };

      if (isCompleted) {
        completedTopics.push(formattedTopic);
      } else {
        pendingTopics.push(formattedTopic);
      }
    });

    res.json({
        pendingTopics,
        completedTopics,
        groups: allGroups // Send all groups so frontend can map IDs to names
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};