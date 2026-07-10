export const isStudent = (user) => user && user.role === 'student';
export const isInstructor = (user) => user && user.role === 'instructor';
export const isAdmin = (user) => user && user.role === 'admin';

export const getRoleLabel = (role) => {
  switch (role) {
    case 'admin':
      return 'System Administrator';
    case 'instructor':
      return 'Educator / Instructor';
    case 'student':
      return 'Learner / Student';
    default:
      return 'Guest';
  }
};
