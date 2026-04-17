export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'Phone is required';
  if (phone.replace(/\D/g, '').length < 7) return 'Invalid phone number';
  return null;
};

export const validateStudentId = (id: string): string | null => {
  if (!id.trim()) return 'Student ID is required';
  if (id.length < 3) return 'Student ID must be at least 3 characters';
  return null;
};

export const validateCapacity = (capacity: number): string | null => {
  if (!capacity || capacity < 1) return 'Capacity must be at least 1';
  if (capacity > 10) return 'Capacity cannot exceed 10';
  return null;
};
