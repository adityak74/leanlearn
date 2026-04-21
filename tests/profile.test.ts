import { describe, it, expect } from 'vitest';

// Mock function to simulate profile stats logic
function calculateProfileStats(progressRecords: any[]) {
  const totalCourses = progressRecords.length;
  const avgProgress = totalCourses > 0 
    ? Math.round(progressRecords.reduce((acc, curr) => acc + curr.progressPercent, 0) / totalCourses)
    : 0;
  
  return { totalCourses, avgProgress };
}

describe('Profile Stats Logic', () => {
  it('should calculate correct stats for multiple courses', () => {
    const progressRecords = [
      { progressPercent: 100 },
      { progressPercent: 50 },
      { progressPercent: 0 }
    ];
    
    const { totalCourses, avgProgress } = calculateProfileStats(progressRecords);
    
    expect(totalCourses).toBe(3);
    expect(avgProgress).toBe(50); // (100+50+0)/3 = 50
  });

  it('should return 0 stats for no courses', () => {
    const { totalCourses, avgProgress } = calculateProfileStats([]);
    
    expect(totalCourses).toBe(0);
    expect(avgProgress).toBe(0);
  });
});
