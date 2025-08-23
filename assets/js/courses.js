'use strict';

// === COURSE DATA ===
const COURSE_DATA = {
  courses: [
    {
      id: 1,
      title: "Introduction LearnPress - LMS Complete Guide",
      category: "Business",
      level: "Beginner",
      price: 0,
      students: 274,
      lessons: 12,
      rating: 4,
      date: "2025-08-01",
      description: "Learn the fundamentals of LearnPress LMS and how to create engaging online courses",
      image: {
      card: "assets/img/business",
      details: "assets/img/business-details"
    },
      instructor: "John Doe",
      tags: ["lms", "wordpress", "education"]
    },
    {
      id: 2,
      title: "Health Foundations - Complete Wellness Guide",
      category: "Health",
      level: "Beginner",
      price: 49.00,
      students: 510,
      lessons: 15,
      rating: 5,
      date: "2025-07-15",
      description: "Master the basics of health and wellness with practical tips and strategies",
      image: {
      card: "assets/img/health",
      details: "assets/img/health-details"
    },
      instructor: "Dr. Sarah Wilson",
      tags: ["health", "wellness", "nutrition"]
    },
    {
      id: 3,
      title: "Nutrition Basics - Healthy Living Made Simple",
      category: "Health",
      level: "Intermediate",
      price: 19.99,
      students: 120,
      lessons: 8,
      rating: 3,
      date: "2025-05-03",
      description: "Understand nutrition principles and create healthy meal plans",
      image: {
      card: "assets/img/health",
      details: "assets/img/health-details"
    },
      instructor: "Maria Garcia",
      tags: ["nutrition", "diet", "health"]
    },
    {
      id: 4,
      title: "Network Mastery - Advanced IT Skills",
      category: "IT",
      level: "Advanced",
      price: 99.00,
      students: 800,
      lessons: 32,
      rating: 4,
      date: "2025-03-18",
      description: "Master advanced networking concepts and become an IT professional",
      image: {
      card: "assets/img/it",
      details: "assets/img/it-details"
    },
      instructor: "Michael Chen",
      tags: ["networking", "it", "technology"]
    },
    {
      id: 5,
      title: "Digital Marketing Fundamentals",
      category: "Marketing",
      level: "Beginner",
      price: 0,
      students: 60,
      lessons: 5,
      rating: 2,
      date: "2024-12-01",
      description: "Learn the basics of digital marketing and online advertising",
      image: {
      card: "assets/img/marketing",
      details: "assets/img/marketing-details"
    },
      instructor: "Alex Johnson",
      tags: ["marketing", "digital", "advertising"]
    },
    {
      id: 6,
      title: "Mobile Photography Masterclass",
      category: "Photography",
      level: "All Levels",
      price: 39.00,
      students: 1200,
      lessons: 20,
      rating: 5,
      date: "2025-08-05",
      description: "Create stunning photos with just your smartphone",
      image: {
      card: "assets/img/photography",
      details: "assets/img/photography-details"
    },
      instructor: "Lisa Park",
      tags: ["photography", "mobile", "creativity"]
    },
    {
      id: 7,
      title: "Color Theory for Designers",
      category: "Design",
      level: "Beginner",
      price: 9.00,
      students: 20,
      lessons: 4,
      rating: 1,
      date: "2024-10-11",
      description: "Understand color principles and create harmonious designs",
      image: {
      card: "assets/img/design",
      details: "assets/img/design-details"
    },
      instructor: "David Kim",
      tags: ["design", "color", "theory"]
    },
    {
      id: 8,
      title: "JavaScript Essentials - Modern Development",
      category: "Developer",
      level: "Intermediate",
      price: 29.00,
      students: 340,
      lessons: 14,
      rating: 4,
      date: "2025-01-22",
      description: "Master JavaScript fundamentals and modern ES6+ features",
      image: {
      card: "assets/img/developer",
      details: "assets/img/developer-details"
    },
      instructor: "Emma Watson",
      tags: ["javascript", "programming", "web-development"]
    }
  ],

  categories: {
    "Business": { count: 1, color: "warning" },
    "Health": { count: 2, color: "success" },
    "IT": { count: 1, color: "primary" },
    "Marketing": { count: 1, color: "warning" },
    "Photography": { count: 1, color: "danger" },
    "Design": { count: 1, color: "secondary" },
    "Developer": { count: 1, color: "dark" }
  }
};
