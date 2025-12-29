import { prisma } from './prisma';

/**
 * Gets the root CA user ID for any user
 * For CA users, returns their own ID
 * For MANAGER/STAFF users, traverses up the reporting hierarchy to find the CA
 */
export async function getRootCAId(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, reportsToId: true },
    });

    if (!user) {
      return null;
    }

    // If user is CA, return their ID
    if (user.role === 'CA') {
      return user.id;
    }

    // If user has no reportsTo, they're orphaned (shouldn't happen, but handle it)
    if (!user.reportsToId) {
      return null;
    }

    // Recursively find the CA by following the reportsTo chain
    let currentUserId = user.reportsToId;
    const visited = new Set<string>([userId]); // Prevent infinite loops

    while (currentUserId && !visited.has(currentUserId)) {
      visited.add(currentUserId);

      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { id: true, role: true, reportsToId: true },
      });

      if (!currentUser) {
        return null;
      }

      if (currentUser.role === 'CA') {
        return currentUser.id;
      }

      currentUserId = currentUser.reportsToId || '';
    }

    return null; // No CA found in the chain
  } catch (error) {
    console.error('Error getting root CA ID:', error);
    return null;
  }
}

/**
 * Gets all user IDs that belong to a CA's organization (CA + all their team members)
 */
export async function getCAOrganizationUserIds(caId: string): Promise<string[]> {
  try {
    // Get all users who report directly or indirectly to this CA
    const getAllTeamMembers = async (managerId: string, collected: Set<string> = new Set()): Promise<string[]> => {
      if (collected.has(managerId)) {
        return Array.from(collected);
      }
      collected.add(managerId);

      const teamMembers = await prisma.user.findMany({
        where: { reportsToId: managerId },
        select: { id: true },
      });

      for (const member of teamMembers) {
        await getAllTeamMembers(member.id, collected);
      }

      return Array.from(collected);
    };

    const teamIds = await getAllTeamMembers(caId);
    return teamIds;
  } catch (error) {
    console.error('Error getting CA organization user IDs:', error);
    return [caId]; // Return at least the CA's ID
  }
}

