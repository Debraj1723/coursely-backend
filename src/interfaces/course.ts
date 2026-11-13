export interface Course {
  courseId: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  duration: string;
  totalSlots: number;
  bookedSlots: number;
  imageUrl: string;
  createdAt?: string;
  updatedAt?: string;
}